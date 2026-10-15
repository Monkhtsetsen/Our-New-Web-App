/**
 * Бүртгэлийн формын оролтыг шалгана.
 *
 * Эдгээр шалгалт нь хөтөч дээрх шалгалтыг ОРЛОХГҮЙ, харин давтана. Хөтөч
 * дээрх шалгалт нь зөвхөн хэрэглэгчид эвтэйхэн байлгах зориулалттай — түүнийг
 * тойрч хүсэлт илгээх боломжтой тул эцсийн шийдвэрийг server тал гаргана.
 */

/** NIST SP 800-63B: урт нууц үгийг зөвшөөрнө, нарийн төвөгтэй дүрэм тулгахгүй. */
export const PASSWORD_MIN_LENGTH = 8;

/**
 * bcrypt 72 байтаар тасалдаг тул олон систем дээд хязгаар тавьдаг. scrypt-д
 * тийм хязгаар байхгүй ч хэт урт оролт нь хэт их тооцоолол үүсгэх тул
 * хязгаарлав.
 */
export const PASSWORD_MAX_LENGTH = 200;

export const NAME_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 254; // RFC 5321-ийн хаягийн дээд урт

export type SignupInput = {
  name: string;
  email: string;
  password: string;
};

export type ValidationErrors = Partial<Record<keyof SignupInput, string>>;

/**
 * Энгийн, хатуу бус хэлбэрийн шалгалт.
 *
 * И-мэйл хаягийг regex-ээр бүрэн зөв шалгах боломжгүй (RFC 5322 нь хэт
 * нийлмэл). Бодит баталгаа нь баталгаажуулах холбоос илгээх явдал тул энд
 * зөвхөн илэрхий алдааг л барина.
 */
function looksLikeEmail(value: string): boolean {
  if (value.length > EMAIL_MAX_LENGTH) return false;
  if (/\s/.test(value)) return false;

  const at = value.indexOf("@");
  if (at <= 0 || at !== value.lastIndexOf("@")) return false;

  const domain = value.slice(at + 1);
  if (domain.length < 3 || !domain.includes(".")) return false;
  if (domain.startsWith(".") || domain.endsWith(".")) return false;
  if (domain.includes("..")) return false;

  return true;
}

/** И-мэйлийг харьцуулахад бэлтгэнэ — davaa@X.com ба DAVAA@x.com нэг хаяг. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Бүртгэлийн оролтыг шалгаж, алдаануудыг талбар тус бүрээр буцаана.
 *
 * Хоосон объект буцвал оролт зөв гэсэн үг.
 */
export function validateSignup(input: SignupInput): ValidationErrors {
  const errors: ValidationErrors = {};

  const name = input.name?.trim() ?? "";
  if (name.length === 0) {
    errors.name = "Нэрээ оруулна уу";
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `Нэр ${NAME_MAX_LENGTH} тэмдэгтээс урт байж болохгүй`;
  }

  const email = normalizeEmail(input.email ?? "");
  if (email.length === 0) {
    errors.email = "И-мэйл хаягаа оруулна уу";
  } else if (!looksLikeEmail(email)) {
    errors.email = "И-мэйл хаяг буруу байна";
  }

  const password = input.password ?? "";
  if (password.length === 0) {
    errors.password = "Нууц үгээ оруулна уу";
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Нууц үг дор хаяж ${PASSWORD_MIN_LENGTH} тэмдэгт байх ёстой`;
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `Нууц үг ${PASSWORD_MAX_LENGTH} тэмдэгтээс урт байж болохгүй`;
  }

  return errors;
}
