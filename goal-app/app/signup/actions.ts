"use server";

import { hashPassword } from "@/src/auth/password";
import {
  parseContact,
  validateSignup,
  type ValidationErrors,
} from "@/src/auth/validation";

export type SignupState = {
  errors?: ValidationErrors;
  formError?: string;
  /** Алдаа гарвал хэрэглэгч дахин бичихгүйн тулд оролтыг буцаана. */
  values?: { name: string; contact: string };
  success?: boolean;
};

const INVALID_CONTACT = "И-мэйл хаяг эсвэл утасны дугаар буруу байна";

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
  const rawContact = String(formData.get("contact") ?? "");
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  // Хөтөч дээрх шалгалтыг тойрч ирэх боломжтой тул энд дахин шалгана.
  const errors = validateSignup({
    name,
    contact: rawContact,
    password,
    passwordConfirm,
  });
  if (Object.keys(errors).length > 0) {
    return { errors, values: { name, contact: rawContact } };
  }

  const contact = parseContact(rawContact);
  if (contact === null) {
    // validateSignup үүнийг аль хэдийн барисан байх ёстой — давхар хамгаалалт.
    return {
      errors: { contact: INVALID_CONTACT },
      values: { name, contact: rawContact },
    };
  }

  try {
    // Динамик import: `src/db` нь модуль ачаалагдах үедээ DATABASE_URL-аар
    // холболт үүсгэдэг. Статик import хийвэл build хийх үед (орчны
    // хувьсагчгүй) унана. Энд дуудах үед нь л ачаална.
    const { db } = await import("@/src/db");
    const { users } = await import("@/src/db/schema");
    const { eq } = await import("drizzle-orm");

    const column = contact.kind === "email" ? users.email : users.phone;

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(column, contact.value))
      .limit(1);

    if (existing.length > 0) {
      return {
        errors: {
          contact:
            contact.kind === "email"
              ? "Энэ и-мэйл бүртгэлтэй байна"
              : "Энэ дугаар бүртгэлтэй байна",
        },
        values: { name, contact: rawContact },
      };
    }

    const passwordHash = await hashPassword(password);

    // level, xp, streak-ийг зааж өгөхгүй — схем дээрх анхны утга (1, 0, 0)
    // хүчинтэй байх ёстой. Хоёр газар давхардуулж бичих нь салж явах эрсдэлтэй.
    await db.insert(users).values(
      contact.kind === "email"
        ? { name, email: contact.value, passwordHash }
        : { name, phone: contact.value, passwordHash },
    );

    return { success: true };
  } catch (error) {
    // Жинхэнэ алдааг зөвхөн серверийн лог руу. Хэрэглэгчид ӨС-ийн бүтэц,
    // холболтын мөр зэргийг харуулахгүй.
    console.error("signup: бүртгэл үүсгэхэд алдаа гарлаа", error);

    return {
      formError:
        "Одоогоор бүртгэл үүсгэх боломжгүй байна. Хэсэг хүлээгээд дахин оролдоно уу.",
      values: { name, contact: rawContact },
    };
  }
}
