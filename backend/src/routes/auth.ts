import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { users } from "../db/schema.js";
import {
  createDummyHash,
  hashPassword,
  verifyPassword,
} from "../auth/password.js";
import { parseContact, validateLogin, validateSignup } from "../auth/validation.js";
import { clearSessionCookie, setSessionCookie } from "../auth/cookie.js";
import { PUBLIC_USER_COLUMNS, type AuthConfig } from "../auth/session.js";
import { signToken } from "../auth/token.js";
import { rateLimit } from "../middleware/rate-limit.js";

const MINUTE = 60 * 1000;

/**
 * Хүсэлтийн хязгаар.
 *
 * Нэвтрэх нь нууц үг таах халдлагын бай тул чангахан. Бүртгүүлэх нь
 * хогийн бүртгэл үүсгэхээс сэргийлнэ — гэхдээ нэг гэр бүл, нэг дотуур
 * байрнаас хэд хэдэн хүн бүртгүүлж болох тул хэт чангалахгүй.
 */
const LOGIN_LIMIT = { windowMs: 15 * MINUTE, max: 20 };
const REGISTER_LIMIT = { windowMs: 60 * MINUTE, max: 20 };

/**
 * Нэвтрэх үед гарах ганц алдаа.
 *
 * "Ийм хаяг бүртгэлгүй" ба "нууц үг буруу" хоёрыг ЯЛГАЖ ХЭЛЭХГҮЙ.
 * Ялгавал халдагч ямар хаягууд бүртгэлтэйг жагсааж чадна — тэр нь
 * өөрөө нууц мэдээлэл (хэн энэ үйлчилгээг ашигладаг вэ).
 */
const LOGIN_FAILED = "И-мэйл/утас эсвэл нууц үг буруу байна";

export function createAuthRouter(config: AuthConfig): Router {
  const router: Router = Router();

  /**
   * POST /api/auth/register   (хуучин нэр: /api/auth/signup)
   *
   * Шинэ хэрэглэгч бүртгээд ШУУД нэвтрүүлнэ.
   *
   * Хүлээн авах:  { name, contact, password }
   *   contact нь и-мэйл ЭСВЭЛ утасны дугаар — аль нь болохыг өөрөө таана.
   *
   * Буцаах:
   *   201  { user: {...} }  + сессийн cookie
   *   400  { errors: { талбар: мессеж } }
   *   409  { errors: { contact: "..." } }   аль хэдийн бүртгэлтэй
   *   429  хэт олон оролдлого
   */
  async function register(req: Request, res: Response): Promise<void> {
    const body: unknown = req.body;
    if (typeof body !== "object" || body === null) {
      res.status(400).json({ errors: { contact: "Хүсэлтийн бие буруу байна" } });
      return;
    }

    // ЗӨВХӨН энэ гурав. `role` зэрэг бусад талбарыг хүсэлтээс АВАХГҮЙ:
    // эс бөгөөс хэн ч { "role": "admin" } гэж илгээж өөрийгөө админ
    // болгох байв. Эрх нь схем дээрх анхны утгаар тогтоно.
    const { name, contact, password } = body as Record<string, unknown>;

    // Хөтөч дээрх шалгалтыг тойрч шууд API руу хүсэлт илгээх боломжтой
    // тул энд дахин, бүрэн шалгана.
    const errors = validateSignup({
      name: typeof name === "string" ? name : "",
      contact: typeof contact === "string" ? contact : "",
      password: typeof password === "string" ? password : "",
    });

    if (Object.keys(errors).length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const parsed = parseContact(contact as string);
    if (parsed === null) {
      // validateSignup үүнийг барьсан байх ёстой — давхар хамгаалалт.
      res.status(400).json({
        errors: { contact: "И-мэйл хаяг эсвэл утасны дугаар буруу байна" },
      });
      return;
    }

    const db = getDb();
    const column = parsed.kind === "email" ? users.email : users.phone;

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(column, parsed.value))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({
        errors: {
          contact:
            parsed.kind === "email"
              ? "Энэ и-мэйл бүртгэлтэй байна"
              : "Энэ дугаар бүртгэлтэй байна",
        },
      });
      return;
    }

    // Дараалал чухал: эхлээд шалгалт, дараа нь hash. scrypt нь ~300мс
    // зарцуулдаг тул буруу оролт болгон дээр ажиллуулбал хэн ч дуртай
    // үедээ серверийг ачаалах боломжтой болно.
    const passwordHash = await hashPassword(password as string);

    // role, level, xp, streak-ийг зааж өгөхгүй — схем дээрх анхны утга
    // хүчинтэй байх ёстой. Хоёр газар давхардуулбал салж явах эрсдэлтэй.
    const [created] = await db
      .insert(users)
      .values(
        parsed.kind === "email"
          ? { name: name as string, email: parsed.value, passwordHash }
          : { name: name as string, phone: parsed.value, passwordHash },
      )
      .returning({
        ...PUBLIC_USER_COLUMNS,
        tokenVersion: users.tokenVersion,
      });

    if (created === undefined) {
      throw new Error("Бүртгэл үүссэн ч буцаж ирсэнгүй");
    }

    const { tokenVersion, ...user } = created;

    // Бүртгүүлсэн хүнийг дахин нэвтрүүлэх шаардлагагүй — шууд сесс нээнэ.
    setSessionCookie(
      res,
      signToken({ sub: user.id, role: user.role, tv: tokenVersion }, config.jwtSecret),
      config,
    );

    // passwordHash-ийг хариуд ХЭЗЭЭ Ч оруулахгүй.
    res.status(201).json({ user });
  }

  router.post("/register", rateLimit(REGISTER_LIMIT), (req, res, next) => {
    register(req, res).catch(next);
  });

  /**
   * Хуучин нэр. Эхний хувилбарт `/signup` гэж нэрлэсэн бөгөөд одоо
   * баг доторх тохиролцоо `/register` болсон. Хуучин нэрийг шууд
   * устгавал өмнө нь холбосон код чимээгүй эвдэрнэ — тиймээс үлдээв.
   */
  router.post("/signup", rateLimit(REGISTER_LIMIT), (req, res, next) => {
    register(req, res).catch(next);
  });

  /**
   * POST /api/auth/login
   *
   * Хүлээн авах:  { contact, password }
   *
   * Буцаах:
   *   200  { user: {...} }  + сессийн cookie
   *   400  { errors: { талбар: мессеж } }
   *   401  { error: "..." }   хаяг эсвэл нууц үг буруу
   *   429  хэт олон оролдлого
   */
  router.post("/login", rateLimit(LOGIN_LIMIT), (req, res, next) => {
    (async () => {
      const body: unknown = req.body;
      if (typeof body !== "object" || body === null) {
        res.status(400).json({ errors: { contact: "Хүсэлтийн бие буруу байна" } });
        return;
      }

      const { contact, password } = body as Record<string, unknown>;

      const errors = validateLogin({
        contact: typeof contact === "string" ? contact : "",
        password: typeof password === "string" ? password : "",
      });

      if (Object.keys(errors).length > 0) {
        res.status(400).json({ errors });
        return;
      }

      const parsed = parseContact(contact as string);
      if (parsed === null) {
        res.status(401).json({ error: LOGIN_FAILED });
        return;
      }

      const db = getDb();
      const column = parsed.kind === "email" ? users.email : users.phone;

      const [found] = await db
        .select({
          ...PUBLIC_USER_COLUMNS,
          passwordHash: users.passwordHash,
          tokenVersion: users.tokenVersion,
        })
        .from(users)
        .where(eq(column, parsed.value))
        .limit(1);

      if (found === undefined) {
        // Хэрэглэгч олдоогүй ч hash-ийг ажиллуулна — хугацааны ялгаагаар
        // ямар хаяг бүртгэлтэйг таахаас сэргийлнэ (password.ts-ийг үз).
        await verifyPassword(password as string, createDummyHash());
        res.status(401).json({ error: LOGIN_FAILED });
        return;
      }

      const ok = await verifyPassword(password as string, found.passwordHash);
      if (!ok) {
        res.status(401).json({ error: LOGIN_FAILED });
        return;
      }

      const { passwordHash: _passwordHash, tokenVersion, ...user } = found;

      setSessionCookie(
        res,
        signToken({ sub: user.id, role: user.role, tv: tokenVersion }, config.jwtSecret),
        config,
      );

      res.status(200).json({ user });
    })().catch(next);
  });

  /**
   * POST /api/auth/logout
   *
   * Cookie-г устгана. Нэвтрээгүй байсан ч 204 буцаана — "нэвтэрсэн
   * байсан уу" гэдгийг хэлэх шалтгаан алга.
   *
   * Анхаар: энэ нь ЗӨВХӨН энэ хөтчийн сессийг хаана. Token нь өөрөө
   * хугацаа дуустлаа хүчинтэй хэвээр — хэрэв хулгайлагдсан гэж
   * сэжиглэвэл нууц үгээ солино (тэгвэл tokenVersion нэмэгдэж бүх
   * token хүчингүй болно).
   */
  router.post("/logout", (_req, res) => {
    clearSessionCookie(res, config);
    res.status(204).end();
  });

  return router;
}
