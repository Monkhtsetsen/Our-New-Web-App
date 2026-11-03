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

  return errors;
}

export type LoginInput = {
  /** И-мэйл эсвэл утасны дугаар. */
  contact: string;
  password: string;
};

export type LoginErrors = Partial<Record<keyof LoginInput, string>>;

/**
 * Нэвтрэх оролтыг шалгана.
 *
 * Бүртгэлээс ЯЛГААТАЙ нь: нууц үгийн урт, нарийн дүрмийг энд шалгахгүй.
 * Шалгах ёстой цорын ганц зүйл нь "хадгалсантай таарч байна уу" гэдэг.
 * Хэрэв "нууц үг 8 тэмдэгтээс богино байна" гэж хэлбэл хуучин дүрмээр
 * үүссэн бүртгэлийн эзэд нэвтэрч чадахгүй болно.
 */
export function validateLogin(input: LoginInput): LoginErrors {
  const errors: LoginErrors = {};

  const contact = (input.contact ?? "").trim();
  if (contact.length === 0) {
    errors.contact = "И-мэйл эсвэл утасны дугаараа оруулна уу";
  } else if (parseContact(contact) === null) {
    errors.contact = "И-мэйл хаяг эсвэл утасны дугаар буруу байна";
  }

  if ((input.password ?? "").length === 0) {
    errors.password = "Нууц үгээ оруулна уу";
  }

  return errors;
}

/** Профайл засах үед хэрэглэгчийн илгээж болох талбарууд. */
export type ProfileFields = "name" | "email" | "phone" | "newPassword";

export type ProfileErrors = Partial<
  Record<ProfileFields | "currentPassword", string>
>;

/** Цэгцэлсэн, ӨС рүү бичихэд бэлэн өөрчлөлтүүд. */
export type ProfileChanges = {
  name?: string;
  /** `null` нь "хаягийг нь устга" гэсэн үг. */
  email?: string | null;
  phone?: string | null;
  newPassword?: string;
};

/** Одоогийн төлөв — "хоёулаа хоосон үлдэх үү" гэдгийг шалгахад хэрэгтэй. */
export type CurrentContact = {
  email: string | null;
  phone: string | null;
};

/**
 * Профайлын өөрчлөлтийг шалгаж, цэгцэлнэ.
 *
 * Илгээгээгүй талбарыг хөнддөггүй — `{ name: "..." }` гэж илгээвэл
 * зөвхөн нэр солигдоно. И-мэйл, утсыг хоосон мөрөөр илгээвэл "устга"
 * гэж ойлгоно.
 *
 * `role`, `level`, `xp`, `streak`-ийг ЭНД ОГТ АВАХГҮЙ. Хэрэглэгч
 * өөрийгөө админ болгох, эсвэл оноогоо өөрөө нэмэх ёсгүй.
 */
export function validateProfile(
  input: Record<string, unknown>,
  current: CurrentContact,
): { errors: ProfileErrors; changes: ProfileChanges } {
  const errors: ProfileErrors = {};
  const changes: ProfileChanges = {};

  if (input.name !== undefined) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (name.length === 0) {
      errors.name = "Нэрээ оруулна уу";
    } else if (name.length > NAME_MAX_LENGTH) {
      errors.name = `Нэр ${NAME_MAX_LENGTH} тэмдэгтээс урт байж болохгүй`;
    } else {
      changes.name = name;
    }
  }

  if (input.email !== undefined) {
    const raw = typeof input.email === "string" ? input.email.trim() : "";
    if (raw.length === 0) {
      changes.email = null;
    } else {
      const parsed = parseContact(raw);
      if (parsed === null || parsed.kind !== "email") {
        errors.email = "И-мэйл хаяг буруу байна";
      } else {
        changes.email = parsed.value;
      }
    }
  }

  if (input.phone !== undefined) {
    const raw = typeof input.phone === "string" ? input.phone.trim() : "";
    if (raw.length === 0) {
      changes.phone = null;
    } else {
      const parsed = parseContact(raw);
      if (parsed === null || parsed.kind !== "phone") {
        errors.phone = "Утасны дугаар буруу байна";
      } else {
        changes.phone = parsed.value;
      }
    }
  }

  // ӨС дээрх CHECK хязгаарлалттай ижил дүрэм. Энд барихгүй бол хүсэлт
  // ӨС хүртэл очоод 500 алдаа болж буцна — хэрэглэгчид утгагүй хариу.
  const nextEmail = changes.email !== undefined ? changes.email : current.email;
  const nextPhone = changes.phone !== undefined ? changes.phone : current.phone;
  if (nextEmail === null && nextPhone === null) {
    const message = "И-мэйл, утасны дугаарын аль нэг нь заавал үлдэх ёстой";
    if (changes.email === null) errors.email = message;
    if (changes.phone === null) errors.phone = message;
  }

  if (input.newPassword !== undefined) {
    const next =
      typeof input.newPassword === "string" ? input.newPassword : "";
    if (next.length === 0) {
      errors.newPassword = "Шинэ нууц үгээ оруулна уу";
    } else if (next.length < PASSWORD_MIN_LENGTH) {
      errors.newPassword = `Нууц үг дор хаяж ${PASSWORD_MIN_LENGTH} тэмдэгт байх ёстой`;
    } else if (next.length > PASSWORD_MAX_LENGTH) {
      errors.newPassword = `Нууц үг ${PASSWORD_MAX_LENGTH} тэмдэгтээс урт байж болохгүй`;
    } else {
      changes.newPassword = next;
    }
  }

  return { errors, changes };
}

/**
 * Энэ өөрчлөлт одоогийн нууц үгээр баталгаажуулахыг шаардаж байна уу.
 *
 * Нэр солиход шаардахгүй — хэрэглэгчийг дэмий ядраана. Харин нууц үг,
 * холбоо барих хаягийг солиход ЗААВАЛ шаардана: эдгээр нь бүртгэлийг
 * булаан авах гол хоёр зам (хаягийг өөр рүүгээ сольчихоод "нууц үгээ
 * мартсан" гэж сэргээх).
 */
export function needsCurrentPassword(changes: ProfileChanges): boolean {
  return (
    changes.email !== undefined ||
    changes.phone !== undefined ||
    changes.newPassword !== undefined
  );
}
