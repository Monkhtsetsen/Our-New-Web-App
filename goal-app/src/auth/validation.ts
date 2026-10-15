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

/** Улсын код бичээгүй 8 оронтой дугаарыг Монголынх гэж үзнэ. */
export const DEFAULT_COUNTRY_CODE = "976";
export const LOCAL_PHONE_LENGTH = 8;

/** E.164 стандарт: улсын код оруулаад 8–15 орон. */
const E164_MIN_DIGITS = 8;
const E164_MAX_DIGITS = 15;

export type ContactKind = "email" | "phone";

/** Таньсан холбоо барих хаяг — хадгалахад бэлэн, цэгцэлсэн утгатай. */
export type Contact = { kind: ContactKind; value: string };

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
 * Утасны дугаарыг E.164 хэлбэрт (`+97699112233`) шилжүүлнэ.
 *
 * Хүн бүр өөр өөрөөр бичдэг — `9911-2233`, `(99) 11 22 33`, `+976 9911 2233`.
 * Эдгээрийг нэг хэлбэрт оруулахгүй бол ижил дугаараар олон бүртгэл үүсч,
 * `unique` хязгаарлалт хоосон ажиллана.
 *
 * `+` тэмдэггүй 8 оронтой дугаарыг Монголынх гэж үзнэ. Бусад улсын дугаарыг
 * `+` улсын кодтой нь бүтнээр бичнэ.
 *
 * @returns Цэгцэлсэн дугаар, эсвэл танихгүй бол `null`
 */
export function normalizePhone(raw: string): string | null {
  // Хүмүүсийн ашигладаг тусгаарлагчийг хаяна.
  const compact = raw.trim().replace(/[\s()\-.]/g, "");
  if (!/^\+?\d+$/.test(compact)) return null;

  const hasPlus = compact.startsWith("+");
  let digits = hasPlus ? compact.slice(1) : compact;

  if (!hasPlus && digits.length === LOCAL_PHONE_LENGTH) {
    // Монголын дугаар 5–9-өөр эхэлдэг. Энэ шалгалт "12345678" мэтийг барина.
    if (!/^[5-9]/.test(digits)) return null;
    digits = DEFAULT_COUNTRY_CODE + digits;
  }

  if (digits.length < E164_MIN_DIGITS || digits.length > E164_MAX_DIGITS) {
    return null;
  }
  if (digits.startsWith("0")) return null; // улсын код 0-оор эхлэхгүй

  return `+${digits}`;
}

/**
 * Оруулсан мөр и-мэйл үү, утас уу гэдгийг таана.
 *
 * `@` тэмдэг байвал и-мэйл гэж үзнэ — ингэснээр буруу бичсэн и-мэйлийг
 * "утас биш байна" гэж будилуулахгүй, зөв алдааг нь хэлнэ.
 *
 * @returns Таньсан хаяг, эсвэл аль нь ч биш бол `null`
 */
export function parseContact(raw: string): Contact | null {
  const trimmed = (raw ?? "").trim();
  if (trimmed.length === 0) return null;

  if (trimmed.includes("@")) {
    const email = normalizeEmail(trimmed);
    return looksLikeEmail(email) ? { kind: "email", value: email } : null;
  }

  const phone = normalizePhone(trimmed);
  return phone === null ? null : { kind: "phone", value: phone };
}

export type SignupInput = {
  name: string;
  /** И-мэйл эсвэл утасны дугаар — хэрэглэгч аль нэгийг нь сонгоно. */
  contact: string;
  password: string;
  passwordConfirm: string;
};

export type ValidationErrors = Partial<Record<keyof SignupInput, string>>;

/**
 * Бүртгэлийн оролтыг шалгаж, алдаануудыг талбар тус бүрээр буцаана.
 *
 * Хоосон объект буцвал оролт зөв гэсэн үг.
 */
export function validateSignup(input: SignupInput): ValidationErrors {
  const errors: ValidationErrors = {};

  const name = (input.name ?? "").trim();
  if (name.length === 0) {
    errors.name = "Нэрээ оруулна уу";
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `Нэр ${NAME_MAX_LENGTH} тэмдэгтээс урт байж болохгүй`;
  }

  const contact = (input.contact ?? "").trim();
  if (contact.length === 0) {
    errors.contact = "И-мэйл эсвэл утасны дугаараа оруулна уу";
  } else if (parseContact(contact) === null) {
    errors.contact = "И-мэйл хаяг эсвэл утасны дугаар буруу байна";
  }

  const password = input.password ?? "";
  if (password.length === 0) {
    errors.password = "Нууц үгээ оруулна уу";
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Нууц үг дор хаяж ${PASSWORD_MIN_LENGTH} тэмдэгт байх ёстой`;
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `Нууц үг ${PASSWORD_MAX_LENGTH} тэмдэгтээс урт байж болохгүй`;
  }

  // Давталтыг нууц үгийн чанараас үл хамааран шалгана: хэрэглэгч богино
  // нууц үг бичсэн ч буруу давтсан бол хоёуланг нь нэг дор хэлэх нь дээр.
  const confirm = input.passwordConfirm ?? "";
  if (confirm.length === 0) {
    errors.passwordConfirm = "Нууц үгээ давтан оруулна уу";
  } else if (confirm !== password) {
    errors.passwordConfirm = "Нууц үг таарахгүй байна";
  }

  return errors;
}
