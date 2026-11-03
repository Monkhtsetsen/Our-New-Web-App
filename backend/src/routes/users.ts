import { Router } from "express";
import { and, eq, ne, or, sql } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { users } from "../db/schema.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import {
  needsCurrentPassword,
  validateProfile,
  type ProfileErrors,
} from "../auth/validation.js";
import { setSessionCookie } from "../auth/cookie.js";
import { PUBLIC_USER_COLUMNS, type AuthConfig } from "../auth/session.js";
import { signToken } from "../auth/token.js";
import { requireAuth } from "../middleware/require-auth.js";

export function createUsersRouter(config: AuthConfig): Router {
  const router: Router = Router();

  // Энэ файл доторх БҮХ зам нэвтэрсэн байхыг шаардана.
  router.use(requireAuth(config));

  /**
   * GET /api/users/me
   *
   * Нэвтэрсэн хэрэглэгчийн мэдээлэл.
   *
   * `/api/users/:id` гэж биш, `me` гэж нэрлэсэн нь зориуд: id-гаар
   * хандуулбал өөр хүний id бичиж үзэх уруу таталт үүснэ (OWASP API1 —
   * хамгийн түгээмэл ноцтой алдаа). Энд ямар ч id хүлээн авахгүй тул
   * тэр алдаа ГАРАХ БОЛОМЖГҮЙ.
   */
  router.get("/me", (req, res) => {
    res.status(200).json({ user: req.user });
  });

  /**
   * PUT /api/users/me
   *
   * Хүлээн авах (бүгд заавал биш):
   *   { name, email, phone, newPassword, currentPassword }
   *
   * Илгээсэн талбарыг нь л өөрчилнө. `email`/`phone`-ыг хоосон мөрөөр
   * илгээвэл устгана (гэхдээ хоёулаа хоосон үлдэж болохгүй).
   *
   * Буцаах:
   *   200  { user: {...} }
   *   400  { errors: {...} }
   *   401  нэвтрээгүй, эсвэл currentPassword буруу
   *   409  и-мэйл/утас өөр хүнд бүртгэлтэй
   */
  router.put("/me", (req, res, next) => {
    (async () => {
      const current = req.user;
      if (current === undefined) {
        // requireAuth үүнийг барьсан байх ёстой — TypeScript-д батлах зорилгоор.
        res.status(401).json({ error: "Нэвтэрнэ үү" });
        return;
      }

      const body: unknown = req.body;
      if (typeof body !== "object" || body === null) {
        res.status(400).json({ errors: { name: "Хүсэлтийн бие буруу байна" } });
        return;
      }

      const input = body as Record<string, unknown>;

      // `role`, `level`, `xp`, `streak`, `id` зэргийг validateProfile
      // ОГТ УНШДАГГҮЙ. Хэрэглэгч { "role": "admin" } илгээсэн ч юу ч
      // болохгүй — доорх update зөвхөн `changes` доторхыг бичнэ.
      const { errors, changes } = validateProfile(input, {
        email: current.email,
        phone: current.phone,
      });

      if (Object.keys(errors).length > 0) {
        res.status(400).json({ errors });
        return;
      }

      if (Object.keys(changes).length === 0) {
        res.status(200).json({ user: current });
        return;
      }

      const db = getDb();

      // Нууц үг, холбоо барих хаяг солиход одоогийн нууц үгээ
      // баталгаажуулна. Хэн нэгэн компьютерийг чинь онгорхой орхисон
      // мөчид шүүрч аваад хаягийг өөрчлөхөөс сэргийлнэ.
      if (needsCurrentPassword(changes)) {
        const supplied = input.currentPassword;
        if (typeof supplied !== "string" || supplied.length === 0) {
          const profileErrors: ProfileErrors = {
            currentPassword: "Одоогийн нууц үгээ оруулна уу",
          };
          res.status(400).json({ errors: profileErrors });
          return;
        }

        const [row] = await db
          .select({ passwordHash: users.passwordHash })
          .from(users)
          .where(eq(users.id, current.id))
          .limit(1);

        if (row === undefined || !(await verifyPassword(supplied, row.passwordHash))) {
          const profileErrors: ProfileErrors = {
            currentPassword: "Одоогийн нууц үг буруу байна",
          };
          res.status(401).json({ errors: profileErrors });
          return;
        }
      }

      // И-мэйл/утас өөр хүнд бүртгэлтэй эсэхийг урьдчилж шалгана. ӨС-ийн
      // unique хязгаарлалт үүнийг барих боловч тэр нь 500 алдаа болж
      // буцах тул хэрэглэгчид ойлгомжгүй.
      const wanted = [
        changes.email != null ? eq(users.email, changes.email) : undefined,
        changes.phone != null ? eq(users.phone, changes.phone) : undefined,
      ].filter((c) => c !== undefined);

      if (wanted.length > 0) {
        const taken = await db
          .select({ email: users.email, phone: users.phone })
          .from(users)
          .where(and(ne(users.id, current.id), or(...wanted)));

        const conflicts: ProfileErrors = {};
        for (const row of taken) {
          if (changes.email != null && row.email === changes.email) {
            conflicts.email = "Энэ и-мэйл өөр бүртгэлд ашиглагдаж байна";
          }
          if (changes.phone != null && row.phone === changes.phone) {
            conflicts.phone = "Энэ дугаар өөр бүртгэлд ашиглагдаж байна";
          }
        }

        if (Object.keys(conflicts).length > 0) {
          res.status(409).json({ errors: conflicts });
          return;
        }
      }

      const patch: Record<string, unknown> = { updatedAt: new Date() };
      if (changes.name !== undefined) patch.name = changes.name;
      if (changes.email !== undefined) patch.email = changes.email;
      if (changes.phone !== undefined) patch.phone = changes.phone;

      // Нууц үг солигдвол бүх хуучин сесс хүчингүй болох ёстой —
      // хулгайлагдсан token-ыг таслах цорын ганц арга энэ.
      const passwordChanged = changes.newPassword !== undefined;
      if (passwordChanged) {
        patch.passwordHash = await hashPassword(changes.newPassword as string);
        // ӨС дээр нэмэгдүүлнэ. JavaScript талд уншаад +1 хийвэл хоёр
        // хүсэлт зэрэг ирэхэд нэг нь дарагдах эрсдэлтэй.
        patch.tokenVersion = sql`${users.tokenVersion} + 1`;
      }

      const [updated] = await db
        .update(users)
        .set(patch)
        .where(eq(users.id, current.id))
        .returning({ ...PUBLIC_USER_COLUMNS, tokenVersion: users.tokenVersion });

      if (updated === undefined) {
        res.status(401).json({ error: "Нэвтэрнэ үү" });
        return;
      }

      const { tokenVersion, ...user } = updated;

      // Өөрийнхөө сессийг хүчингүй болгочихоод "дахин нэвтэр" гэвэл
      // эвгүй тул энэ хөтөчид шинэ token өгнө.
      if (passwordChanged) {
        setSessionCookie(
          res,
          signToken({ sub: user.id, role: user.role, tv: tokenVersion }, config.jwtSecret),
          config,
        );
      }

      res.status(200).json({ user });
    })().catch(next);
  });

  return router;
}
