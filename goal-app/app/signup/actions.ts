"use server";

import { hashPassword } from "@/src/auth/password";
import {
  normalizeEmail,
  validateSignup,
  type ValidationErrors,
} from "@/src/auth/validation";

export type SignupState = {
  errors?: ValidationErrors;
  formError?: string;
  values?: { name: string; email: string };
  success?: boolean;
};

/**
 * Шинэ хэрэглэгч бүртгэнэ.
 *
 * Дараалал чухал: эхлээд шалгалт, дараа нь hash, хамгийн сүүлд бичилт.
 * Шалгалтаас унах оролтод scrypt ажиллуулбал (300мс) хэн ч дуртай үедээ
 * серверийг ачаалах боломжтой болно.
 */
export async function signup(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const name = String(formData.get("name") ?? "").trim();
  const rawEmail = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const email = normalizeEmail(rawEmail);

  // Хөтөч дээрх шалгалтыг тойрч ирэх боломжтой тул энд дахин шалгана.
  const errors = validateSignup({ name, email, password });
  if (Object.keys(errors).length > 0) {
    return { errors, values: { name, email: rawEmail } };
  }

  try {
    // Динамик import: `src/db` нь модуль ачаалагдах үедээ DATABASE_URL-аар
    // холболт үүсгэдэг. Статик import хийвэл build хийх үед (орчны
    // хувьсагчгүй) унана. Энд дуудах үед нь л ачаална.
    const { db } = await import("@/src/db");
    const { users } = await import("@/src/db/schema");
    const { eq } = await import("drizzle-orm");

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return {
        errors: { email: "Энэ и-мэйл бүртгэлтэй байна" },
        values: { name, email: rawEmail },
      };
    }

    const passwordHash = await hashPassword(password);

    // level, xp, streak-ийг зааж өгөхгүй — схем дээрх анхны утга (1, 0, 0)
    // хүчинтэй байх ёстой. Хоёр газар давхардуулж бичих нь салж явах эрсдэлтэй.
    await db.insert(users).values({ name, email, passwordHash });

    return { success: true };
  } catch (error) {
    // Жинхэнэ алдааг зөвхөн серверийн лог руу. Хэрэглэгчид ӨС-ийн бүтэц,
    // холболтын мөр зэргийг харуулахгүй.
    console.error("signup: бүртгэл үүсгэхэд алдаа гарлаа", error);

    return {
      formError:
        "Одоогоор бүртгэл үүсгэх боломжгүй байна. Хэсэг хүлээгээд дахин оролдоно уу.",
      values: { name, email: rawEmail },
    };
  }
}
