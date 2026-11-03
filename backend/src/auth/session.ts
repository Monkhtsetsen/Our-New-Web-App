import { users } from "../db/schema.js";
import type { UserRole } from "../db/schema.js";

/**
 * Сесстэй холбоотой тохиргоо.
 *
 * Орчны хувьсагчийг модуль дотроос шууд уншихгүй, параметрээр дамжуулна.
 * Ингэснээр тест бүр өөрийн түлхүүртэй ажиллаж чадна.
 */
export type AuthConfig = {
  jwtSecret: string;
  /** Cookie-г зөвхөн HTTPS-ээр явуулах эсэх. Production дээр `true`. */
  cookieSecure: boolean;
};

/**
 * Хэрэглэгчийн хариуд гарч болох баганууд.
 *
 * ЭНЭ ЖАГСААЛТ НЬ ЦОРЫН ГАНЦ ЭХ СУРВАЛЖ. Бүх зам (бүртгэх, нэвтрэх,
 * профайл) үүнийг ашиглана — ингэснээр нэг газар алдаж `password_hash`
 * задрах боломжгүй болно.
 *
 * `tokenVersion` энд БАЙХГҮЙ: гадны хүнд хэрэггүй дотоод тоолуур.
 */
export const PUBLIC_USER_COLUMNS = {
  id: users.id,
  name: users.name,
  email: users.email,
  phone: users.phone,
  role: users.role,
  level: users.level,
  xp: users.xp,
  streak: users.streak,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
} as const;

/** `PUBLIC_USER_COLUMNS`-той тохирох хэлбэр. */
export type PublicUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  level: number;
  xp: number;
  streak: number;
  createdAt: Date;
  updatedAt: Date;
};
