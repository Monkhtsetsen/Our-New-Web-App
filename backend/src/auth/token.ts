import jwt from "jsonwebtoken";
import type { UserRole } from "../db/schema.js";

/**
 * Сессийн token (JWT) гаргах, шалгах.
 *
 * Яагаад JWT вэ: сервер нь сессийн жагсаалт санахгүй тул хэд хэдэн
 * хувилбар (instance) зэрэг ажиллахад нийтлэг хадгалах сан хэрэггүй.
 *
 * Төлбөр нь: нэг удаа гаргасан token-ыг буцааж "болиулах" боломжгүй —
 * хугацаа нь дуустал хүчинтэй. Үүнийг `tokenVersion`-оор нөхнө
 * (`db/schema.ts`-ийн тайлбарыг үз).
 */

/** Token-д хадгалагдах мэдээлэл. */
export type SessionClaims = {
  /** Хэрэглэгчийн id. JWT-ийн стандарт нэр нь `sub` (subject). */
  sub: string;
  /**
   * Эрх. Энд байгаа нь зөвхөн ХУРДАН шалгалтад зориулагдсан — эцсийн
   * шийдвэрийг ӨС дэх утгаар гаргана. Админ эрхийг нь хассаны дараа
   * гар дээрх хуучин token нь "admin" гэж бичигдсэн хэвээр байна.
   */
  role: UserRole;
  /** Сесс хүчингүй болгох тоолуур. ӨС дэх утгатай таарах ёстой. */
  tv: number;
};

/**
 * Token хэр удаан хүчинтэй байх.
 *
 * Богино байх тусам хулгайлагдсан token-ын хор уршиг бага. Гэвч refresh
 * token хийгээгүй тул хугацаа дуусмагц хэрэглэгч дахин нэвтрэх шаардлагатай
 * болно. Долоо хоног нь энэ хоёрын дунд сонгосон буулт.
 */
export const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Зөвхөн HS256. Алгоритмыг token дотроос УНШИХГҮЙ.
 *
 * JWT-ийн сонгодог эмзэг байдал нь ийм: халдагч толгой хэсгийн `alg`-ийг
 * `none` болгох, эсвэл RS256-г HS256 болгон сольж нийтийн түлхүүрийг
 * нууц түлхүүр мэт ашиглуулах. `algorithms`-ийг тодорхой зааж өгснөөр
 * энэ бүхнийг хаана.
 */
const ALGORITHM = "HS256" as const;

/**
 * Нууц түлхүүрийн доод урт.
 *
 * HS256 нь HMAC-SHA256 тул түлхүүр нь дор хаяж hash-ийн урттай (32 байт)
 * тэнцүү байх ёстой. Богино түлхүүрийг таах боломжтой.
 */
export const JWT_SECRET_MIN_LENGTH = 32;

export class InvalidTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTokenError";
  }
}

/**
 * Token гаргана.
 *
 * @param secret - `JWT_SECRET` орчны хувьсагч
 */
export function signToken(claims: SessionClaims, secret: string): string {
  return jwt.sign(claims, secret, {
    algorithm: ALGORITHM,
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

/**
 * Token-ыг шалгаж, доторх мэдээллийг буцаана.
 *
 * Гарын үсэг, хугацаа, бүтэц гурвын аль нэг нь буруу бол
 * `InvalidTokenError` шиднэ. Яагаад буруу болохыг ЯЛГАЖ ХЭЛЭХГҮЙ —
 * "хугацаа дууссан" ба "гарын үсэг буруу" хоёрыг ялгавал халдагчид
 * хэрэгтэй мэдээлэл өгнө.
 */
export function verifyToken(token: string, secret: string): SessionClaims {
  let payload: unknown;
  try {
    payload = jwt.verify(token, secret, { algorithms: [ALGORITHM] });
  } catch {
    throw new InvalidTokenError("Token хүчингүй байна");
  }

  if (typeof payload !== "object" || payload === null) {
    throw new InvalidTokenError("Token хүчингүй байна");
  }

  const { sub, role, tv } = payload as Record<string, unknown>;

  if (
    typeof sub !== "string" ||
    sub.length === 0 ||
    (role !== "admin" && role !== "user") ||
    typeof tv !== "number" ||
    !Number.isInteger(tv)
  ) {
    throw new InvalidTokenError("Token хүчингүй байна");
  }

  return { sub, role, tv };
}
