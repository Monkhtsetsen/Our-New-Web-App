import { describe, expect, it } from "vitest";
import {
  PASSWORD_MIN_LENGTH,
  normalizeEmail,
  normalizePhone,
  needsCurrentPassword,
  parseContact,
  validateLogin,
  validateProfile,
  validateSignup,
} from "./validation.js";

const VALID = {
  name: "Эрдэнэбаяр",
  contact: "erka@example.com",
  password: "nuuts-ug-2026",
};

describe("validateSignup — зөв оролт", () => {
  it("и-мэйлээр алдаагүй өнгөрнө", () => {
    expect(validateSignup(VALID)).toEqual({});
  });

  it("утасны дугаараар алдаагүй өнгөрнө", () => {
    expect(validateSignup({ ...VALID, contact: "99112233" })).toEqual({});
  });

  it("урт нууц үгийг зөвшөөрнө", () => {
    // NIST SP 800-63B: passphrase-г хязгаарлахгүй.
    const long = "энэ бол нэлээд урт боловч санахад хялбар нууц үг юм";

    expect(
      validateSignup({ ...VALID, password: long }),
    ).toEqual({});
  });
});

describe("Нэр", () => {
  it("хоосон бол алдаа", () => {
    expect(validateSignup({ ...VALID, name: "" }).name).toBe("Нэрээ оруулна уу");
  });

  it("зөвхөн хоосон зай бол алдаа", () => {
    expect(validateSignup({ ...VALID, name: "   " }).name).toBe(
      "Нэрээ оруулна уу",
    );
  });

  it("хэт урт бол алдаа", () => {
    expect(validateSignup({ ...VALID, name: "a".repeat(101) }).name).toContain(
      "урт байж болохгүй",
    );
  });
});

describe("Холбоо барих хаяг", () => {
  it("хоосон бол алдаа", () => {
    expect(validateSignup({ ...VALID, contact: "" }).contact).toBe(
      "И-мэйл эсвэл утасны дугаараа оруулна уу",
    );
  });

  it("зөвхөн хоосон зай бол алдаа", () => {
    expect(validateSignup({ ...VALID, contact: "   " }).contact).toBe(
      "И-мэйл эсвэл утасны дугаараа оруулна уу",
    );
  });

  const BAD = [
    "abc",
    "abc@",
    "@example.com",
    "abc@@example.com",
    "abc@example",
    "abc@.com",
    "abc@example.",
    "abc@exa..mple.com",
    "ab c@example.com",
    "1234",
    "99-11-22-3",
    "12345678",
    "99112233abc",
  ];

  for (const contact of BAD) {
    it(`буруу хэлбэрийг барина: ${contact}`, () => {
      expect(validateSignup({ ...VALID, contact }).contact).toBe(
        "И-мэйл хаяг эсвэл утасны дугаар буруу байна",
      );
    });
  }

  const GOOD = [
    "a@b.co",
    "erka.dev@example.com",
    "erka+tag@example.co.uk",
    "erka_123@sub.example.com",
    "99112233",
    "+97699112233",
    "9911 2233",
    "9911-2233",
    "+1 202 555 0147",
  ];

  for (const contact of GOOD) {
    it(`зөв хэлбэрийг зөвшөөрнө: ${contact}`, () => {
      expect(validateSignup({ ...VALID, contact }).contact).toBeUndefined();
    });
  }
});

describe("parseContact", () => {
  it("и-мэйлийг таньж цэгцэлнэ", () => {
    expect(parseContact("  Erka@Example.COM ")).toEqual({
      kind: "email",
      value: "erka@example.com",
    });
  });

  it("утсыг таньж E.164 болгоно", () => {
    expect(parseContact("9911-2233")).toEqual({
      kind: "phone",
      value: "+97699112233",
    });
  });

  // @ тэмдэгтэй бол и-мэйл гэж үзнэ — "утас буруу байна" гэж будилуулахгүй.
  it("@ тэмдэгтэй буруу мөрийг утас гэж үзэхгүй", () => {
    expect(parseContact("erka@@example.com")).toBeNull();
  });

  it("аль нь ч биш бол null", () => {
    expect(parseContact("hello")).toBeNull();
  });
});

describe("normalizePhone", () => {
  it("тусгаарлагчийг хамаарахгүй — ижил дугаар нэг утга болно", () => {
    const forms = ["99112233", "9911 2233", "9911-2233", "(9911) 2233"];
    const normalized = forms.map(normalizePhone);

    expect(new Set(normalized).size, "хэлбэр бүр өөр утга өглөө").toBe(1);
    expect(normalized[0]).toBe("+97699112233");
  });

  it("улсын кодтой бичсэнийг хүндэтгэнэ", () => {
    expect(normalizePhone("+976 9911 2233")).toBe("+97699112233");
    expect(normalizePhone("+1 202 555 0147")).toBe("+12025550147");
  });

  it("Монголын дугаар 5-9-өөр эхэлнэ", () => {
    expect(normalizePhone("12345678")).toBeNull();
    expect(normalizePhone("55112233")).toBe("+97655112233");
  });

  it("хэт богино, хэт урт дугаарыг татгалзана", () => {
    expect(normalizePhone("+9761")).toBeNull();
    expect(normalizePhone("+1234567890123456")).toBeNull();
  });

  it("үсэг агуулсан бол null", () => {
    expect(normalizePhone("991122ab")).toBeNull();
  });
});

describe("Нууц үг", () => {
  it("хоосон бол алдаа", () => {
    expect(
      validateSignup({ ...VALID, password: "" }).password,
    ).toBe("Нууц үгээ оруулна уу");
  });

  it(`${PASSWORD_MIN_LENGTH} тэмдэгтээс богино бол алдаа`, () => {
    const short = "a".repeat(PASSWORD_MIN_LENGTH - 1);

    expect(
      validateSignup({ ...VALID, password: short })
        .password,
    ).toContain(`дор хаяж ${PASSWORD_MIN_LENGTH}`);
  });

  it(`яг ${PASSWORD_MIN_LENGTH} тэмдэгт бол зөвшөөрнө`, () => {
    const exact = "a".repeat(PASSWORD_MIN_LENGTH);

    expect(
      validateSignup({ ...VALID, password: exact })
        .password,
    ).toBeUndefined();
  });

  it("хэт урт бол алдаа", () => {
    const long = "a".repeat(201);

    expect(
      validateSignup({ ...VALID, password: long })
        .password,
    ).toContain("урт байж болохгүй");
  });
});

describe("normalizeEmail", () => {
  it("том үсэг, захын зайг цэгцэлнэ", () => {
    expect(normalizeEmail("  Erka@Example.COM  ")).toBe("erka@example.com");
  });

  it("ижил хаягийг нэг утга руу авчирна", () => {
    expect(normalizeEmail("ERKA@EXAMPLE.COM")).toBe(
      normalizeEmail("erka@example.com"),
    );
  });
});

describe("Олон алдаа зэрэг", () => {
  it("талбар бүрийн алдааг тусад нь буцаана", () => {
    const errors = validateSignup({
      name: "",
      contact: "abc",
      password: "123",
    });

    expect(Object.keys(errors).sort()).toEqual(["contact", "name", "password"]);
  });
});

describe("validateLogin", () => {
  it("зөв оролтод алдаа гаргахгүй", () => {
    expect(
      validateLogin({ contact: "erka@example.com", password: "ямар ч байж болно" }),
    ).toEqual({});
  });

  it("хоосон хаягийг барина", () => {
    const errors = validateLogin({ contact: "", password: "nuuts-ug" });

    expect(errors.contact).toBeDefined();
  });

  it("хоосон нууц үгийг барина", () => {
    const errors = validateLogin({ contact: "erka@example.com", password: "" });

    expect(errors.password).toBeDefined();
  });

  /**
   * Нэвтрэх үед нууц үгийн УРТЫГ шалгаж болохгүй. Шалгавал хуучин
   * дүрмээр (эсвэл өөр системээс зөөгдөж) үүссэн богино нууц үгтэй
   * хүмүүс бүртгэлдээ орох аргагүй болно.
   */
  it("богино нууц үгийг нэвтрэх үед татгалзахгүй", () => {
    const errors = validateLogin({ contact: "erka@example.com", password: "123" });

    expect(errors.password).toBeUndefined();
  });
});

describe("validateProfile", () => {
  const HAS_EMAIL = { email: "erka@example.com", phone: null };
  const HAS_PHONE = { email: null, phone: "+97699112233" };

  it("илгээгээгүй талбарыг хөндөхгүй", () => {
    const { errors, changes } = validateProfile({ name: "Шинэ нэр" }, HAS_EMAIL);

    expect(errors).toEqual({});
    expect(changes).toEqual({ name: "Шинэ нэр" });
  });

  it("утасны дугаарыг E.164 болгоно", () => {
    const { changes } = validateProfile({ phone: "9911-2233" }, HAS_EMAIL);

    expect(changes.phone).toBe("+97699112233");
  });

  it("и-мэйлийг жижиг үсэг болгоно", () => {
    const { changes } = validateProfile({ email: "  ERKA@Example.COM " }, HAS_PHONE);

    expect(changes.email).toBe("erka@example.com");
  });

  it("хоосон мөр нь устгах гэсэн үг", () => {
    const { errors, changes } = validateProfile({ phone: "" }, {
      email: "erka@example.com",
      phone: "+97699112233",
    });

    expect(errors).toEqual({});
    expect(changes.phone).toBeNull();
  });

  // ӨС дээрх CHECK хязгаарлалттай ижил дүрэм. Хоёулаа хоосон бол
  // бүртгэл рүү дахин хандах арга үлдэхгүй.
  it("сүүлчийн холбоо барих хаягийг устгахыг зөвшөөрөхгүй", () => {
    const { errors } = validateProfile({ email: "" }, HAS_EMAIL);

    expect(errors.email).toBeDefined();
  });

  it("и-мэйлийн талбарт утас бичихийг зөвшөөрөхгүй", () => {
    const { errors } = validateProfile({ email: "99112233" }, HAS_PHONE);

    expect(errors.email).toBeDefined();
  });

  it("богино шинэ нууц үгийг барина", () => {
    const { errors } = validateProfile({ newPassword: "123" }, HAS_EMAIL);

    expect(errors.newPassword).toContain("дор хаяж 8");
  });

  /**
   * ХАМГИЙН ЧУХАЛ ТЕСТ.
   *
   * Хэрэглэгч { "role": "admin" } гэж илгээвэл түүнийг БҮРЭН үл
   * тоомсорлох ёстой. Мөн level, xp, streak зэрэг оноог өөрөө
   * нэмэх ёсгүй.
   */
  it("role, level, xp, streak-ийг хүсэлтээс авахгүй", () => {
    const { errors, changes } = validateProfile(
      { name: "Заль", role: "admin", level: 99, xp: 100000, streak: 365, id: "өөр-id" },
      HAS_EMAIL,
    );

    expect(errors).toEqual({});
    expect(changes).toEqual({ name: "Заль" });
  });
});

describe("needsCurrentPassword", () => {
  it("зөвхөн нэр солиход шаардахгүй", () => {
    expect(needsCurrentPassword({ name: "Шинэ нэр" })).toBe(false);
  });

  it("хоосон өөрчлөлтөд шаардахгүй", () => {
    expect(needsCurrentPassword({})).toBe(false);
  });

  // Хаягийг солиод "нууц үгээ мартсан" гэж сэргээх нь бүртгэл булаах
  // сонгодог зам. Тиймээс эдгээрт заавал баталгаажуулна.
  it("и-мэйл, утас, нууц үг солиход шаардана", () => {
    expect(needsCurrentPassword({ email: "shine@example.com" })).toBe(true);
    expect(needsCurrentPassword({ phone: "+97699112233" })).toBe(true);
    expect(needsCurrentPassword({ phone: null })).toBe(true);
    expect(needsCurrentPassword({ newPassword: "shine-nuuts-ug" })).toBe(true);
  });
});
