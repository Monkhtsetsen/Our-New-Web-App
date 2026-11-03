/**
 * Орчны хувьсагчийг нэг газар уншиж, шалгана.
 *
 * Апп асах үедээ л шалгах нь зориуд: буруу тохиргоотой сервер асчихаад
 * эхний хүсэлт ирэх үед унах нь хамгийн муу хувилбар. Дутуу байвал
 * шууд, ойлгомжтой алдаа өгөөд зогсоно.
 */

import { JWT_SECRET_MIN_LENGTH } from "../auth/token.js";

export type Env = {
  nodeEnv: "development" | "production" | "test";
  port: number;
  databaseUrl: string;
  /** Хөтчөөс хандахыг зөвшөөрөх эх үүсвэрүүд (frontend-ийн хаяг). */
  corsOrigins: string[];
  /** Сессийн token-д гарын үсэг зурах нууц түлхүүр. */
  jwtSecret: string;
  /** Cookie-г зөвхөн HTTPS-ээр явуулах эсэх. */
  cookieSecure: boolean;
};

class MissingEnvError extends Error {
  constructor(name: string, hint: string) {
    super(`Орчны хувьсагч "${name}" байхгүй байна. ${hint}`);
    this.name = "MissingEnvError";
  }
}

function required(name: string, hint: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    throw new MissingEnvError(name, hint);
  }
  return value.trim();
}

/**
 * "true"/"false" гэсэн мөрийг унших.
 *
 * Орчны хувьсагч үргэлж мөр байдаг тул `Boolean("false")` нь `true`
 * болдог сонгодог алдаанаас сэргийлж тодорхой шалгана.
 */
function optionalBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;

  const value = raw.trim().toLowerCase();
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;

  throw new Error(
    `Орчны хувьсагч "${name}" нь true эсвэл false байх ёстой. Одоо: "${raw}"`,
  );
}

function optionalNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`Орчны хувьсагч "${name}" нь 1–65535 хооронд бүхэл тоо байх ёстой. Одоо: "${raw}"`);
  }
  return parsed;
}

/**
 * Хувьсагчуудыг уншина.
 *
 * Модуль ачаалагдах үед биш, дуудагдах үед ажиллана — ингэснээр тест
 * бичихэд ӨС-ийн холболтын мөр шаардахгүй.
 */
export function loadEnv(): Env {
  const nodeEnv = (process.env.NODE_ENV ?? "development") as Env["nodeEnv"];

  const jwtSecret = required(
    "JWT_SECRET",
    "Урт санамсаргүй мөр үүсгэнэ үү: " +
      "node -e \"console.log(crypto.randomBytes(48).toString('base64url'))\"",
  );

  // Богино түлхүүрийг таах боломжтой. Анхны утга ӨГӨХГҮЙ — кодод бичсэн
  // "default secret" нь нийтэд ил болохоор нь хамгаалалт байхаа болино.
  if (jwtSecret.length < JWT_SECRET_MIN_LENGTH) {
    throw new Error(
      `Орчны хувьсагч "JWT_SECRET" нь дор хаяж ${JWT_SECRET_MIN_LENGTH} тэмдэгт байх ёстой.`,
    );
  }

  return {
    nodeEnv,
    port: optionalNumber("PORT", 4000),
    databaseUrl: required(
      "DATABASE_URL",
      "backend/.env.example-ээс хуулж .env файл үүсгэнэ үү.",
    ),
    // Таслалаар тусгаарлана. Анхны утга нь локал дээрх Next.js.
    corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000")
      .split(",")
      .map((o) => o.trim())
      .filter((o) => o.length > 0),
    jwtSecret,
    /**
     * Анхны утга нь NODE_ENV-ээс. Гэхдээ дарж бичиж болно — энэ нь
     * ЗААВАЛ хэрэгтэй: docker compose дээр NODE_ENV=production атлаа
     * http://localhost ажилладаг. `secure` cookie нь HTTPS-ээр л явдаг
     * тул дарж бичихгүй бол локал дээр нэвтрэх БОЛОМЖГҮЙ болно.
     *
     * Жинхэнэ сервер дээр үүнийг хэзээ ч false болгож болохгүй.
     */
    cookieSecure: optionalBoolean("COOKIE_SECURE", nodeEnv === "production"),
  };
}
