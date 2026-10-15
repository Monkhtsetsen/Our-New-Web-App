import { describe, expect, it } from "vitest";
import {
  PASSWORD_MIN_LENGTH,
  normalizeEmail,
  normalizePhone,
  parseContact,
  validateSignup,
} from "./validation";

const VALID = {
  name: "Эрдэнэбаяр",
  contact: "erka@example.com",
  password: "nuuts-ug-2026",
  passwordConfirm: "nuuts-ug-2026",
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
      validateSignup({ ...VALID, password: long, passwordConfirm: long }),
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
      validateSignup({ ...VALID, password: "", passwordConfirm: "" }).password,
    ).toBe("Нууц үгээ оруулна уу");
  });

  it(`${PASSWORD_MIN_LENGTH} тэмдэгтээс богино бол алдаа`, () => {
    const short = "a".repeat(PASSWORD_MIN_LENGTH - 1);

    expect(
      validateSignup({ ...VALID, password: short, passwordConfirm: short })
        .password,
    ).toContain(`дор хаяж ${PASSWORD_MIN_LENGTH}`);
  });

  it(`яг ${PASSWORD_MIN_LENGTH} тэмдэгт бол зөвшөөрнө`, () => {
    const exact = "a".repeat(PASSWORD_MIN_LENGTH);

    expect(
      validateSignup({ ...VALID, password: exact, passwordConfirm: exact })
        .password,
    ).toBeUndefined();
  });

  it("хэт урт бол алдаа", () => {
    const long = "a".repeat(201);

    expect(
      validateSignup({ ...VALID, password: long, passwordConfirm: long })
        .password,
    ).toContain("урт байж болохгүй");
  });
});

describe("Нууц үгийн давталт", () => {
  it("хоосон бол алдаа", () => {
    expect(
      validateSignup({ ...VALID, passwordConfirm: "" }).passwordConfirm,
    ).toBe("Нууц үгээ давтан оруулна уу");
  });

  it("таарахгүй бол алдаа", () => {
    expect(
      validateSignup({ ...VALID, passwordConfirm: "өөр-нууц-үг" })
        .passwordConfirm,
    ).toBe("Нууц үг таарахгүй байна");
  });

  // Нэг тэмдэгтийн зөрүү ч гэсэн алдаа — trim хийж "залруулахгүй".
  it("захын хоосон зайг үл тоомсорлохгүй", () => {
    expect(
      validateSignup({ ...VALID, passwordConfirm: `${VALID.password} ` })
        .passwordConfirm,
    ).toBe("Нууц үг таарахгүй байна");
  });

  it("таарвал алдаагүй", () => {
    expect(validateSignup(VALID).passwordConfirm).toBeUndefined();
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
      passwordConfirm: "456",
    });

    expect(Object.keys(errors).sort()).toEqual([
      "contact",
      "name",
      "password",
      "passwordConfirm",
    ]);
  });
});
