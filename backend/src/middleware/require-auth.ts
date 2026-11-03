import type { NextFunction, Request, RequestHandler, Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { users } from "../db/schema.js";
import { SESSION_COOKIE } from "../auth/cookie.js";
import { PUBLIC_USER_COLUMNS, type AuthConfig } from "../auth/session.js";
import { InvalidTokenError, verifyToken } from "../auth/token.js";

/**
 * Нэвтэрсэн хэрэглэгчийг шаардана.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ЯАГААД TOKEN-Д БИЧСЭН МЭДЭЭЛЭЛД ИТГЭХГҮЙ ВЭ
 *
 * Token дотор `role` бичигдсэн байдаг тул ӨС рүү хандалгүй шууд
 * ашиглаж болох юм шиг санагдана. Гэвч token нь гаргасан агшны
 * гэрэл зураг — долоо хоногийн турш хөлдөж хэвээр байна:
 *
 *   - Админ эрхийг нь хассан ч token дээр "admin" гэж үлдэнэ
 *   - Бүртгэлийг нь устгасан ч token ажилласаар байна
 *   - Нууц үгээ сольсон ч хулгайлагдсан token хүчинтэй хэвээр
 *
 * Тиймээс хүсэлт бүр дээр ӨС-аас хэрэглэгчийг уншина. Энэ нь нэмэлт
 * нэг query боловч эрх нь ҮРГЭЛЖ ОДООГИЙН утгаар шалгагдана.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export function requireAuth(config: AuthConfig): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token: unknown = req.cookies?.[SESSION_COOKIE];

      if (typeof token !== "string" || token.length === 0) {
        res.status(401).json({ error: "Нэвтэрнэ үү" });
        return;
      }

      let claims;
      try {
        claims = verifyToken(token, config.jwtSecret);
      } catch (error) {
        if (error instanceof InvalidTokenError) {
          res.status(401).json({ error: "Нэвтэрнэ үү" });
          return;
        }
        throw error;
      }

      const db = getDb();
      const [found] = await db
        .select({ ...PUBLIC_USER_COLUMNS, tokenVersion: users.tokenVersion })
        .from(users)
        .where(eq(users.id, claims.sub))
        .limit(1);

      // Бүртгэл устсан байж болно.
      if (found === undefined) {
        res.status(401).json({ error: "Нэвтэрнэ үү" });
        return;
      }

      // Нууц үг солигдсон бол тоолуур зөрнө — хуучин token-ыг эндээс таслана.
      if (found.tokenVersion !== claims.tv) {
        res.status(401).json({ error: "Сесс хүчингүй болсон. Дахин нэвтэрнэ үү" });
        return;
      }

      const { tokenVersion: _tokenVersion, ...publicUser } = found;
      req.user = publicUser;

      next();
    } catch (error) {
      next(error);
    }
  };
}
