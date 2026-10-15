import { describe, expect, it } from "vitest";
import {
  PASSWORD_MIN_LENGTH,
  normalizeEmail,
  validateSignup,
} from "./validation";

const VALID = {
  name: "Эрдэнэбаяр",
  email: "erka@example.com",
  password: "nuuts-ug-2026",
};

describe("validateSignup — зөв оролт", () => {
  it("алдаагүй өнгөрнө", () => {
    expect(validateSignup(VALID)).toEqual({});
  });

  it("урт нууц үгийг зөвшөөрнө", () => {
    // NIST SP 800-63B: passphrase-г хязгаарлахгүй.
    const long = "энэ бол нэлээд урт боловч санахад хялбар нууц үг юм";

    expect(validateSignup({ ...VALID, password: long })).toEqual({});
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

describe("И-мэйл", () => {
  it("хоосон бол алдаа", () => {
    expect(validateSignup({ ...VALID, email: "" }).email).toBe(
      "И-мэйл хаягаа оруулна уу",
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
  ];

  for (const email of BAD) {
    it(`буруу хэлбэрийг барина: ${email || "(хоосон)"}`, () => {
      expect(validateSignup({ ...VALID, email }).email).toBe(
        "И-мэйл хаяг буруу байна",
      );
    });
  }

  const GOOD = [
    "a@b.co",
    "erka.dev@example.com",
    "erka+tag@example.co.uk",
    "erka_123@sub.example.com",
  ];

  for (const email of GOOD) {
    it(`зөв хэлбэрийг зөвшөөрнө: ${email}`, () => {
      expect(validateSignup({ ...VALID, email }).email).toBeUndefined();
    });
  }
});

describe("Нууц үг", () => {
  it("хоосон бол алдаа", () => {
    expect(validateSignup({ ...VALID, password: "" }).password).toBe(
      "Нууц үгээ оруулна уу",
    );
  });

  it(`${PASSWORD_MIN_LENGTH} тэмдэгтээс богино бол алдаа`, () => {
    const short = "a".repeat(PASSWORD_MIN_LENGTH - 1);

    expect(validateSignup({ ...VALID, password: short }).password).toContain(
      `дор хаяж ${PASSWORD_MIN_LENGTH}`,
    );
  });

  it(`яг ${PASSWORD_MIN_LENGTH} тэмдэгт бол зөвшөөрнө`, () => {
    const exact = "a".repeat(PASSWORD_MIN_LENGTH);

    expect(validateSignup({ ...VALID, password: exact }).password).toBeUndefined();
  });

  it("хэт урт бол алдаа", () => {
    expect(
      validateSignup({ ...VALID, password: "a".repeat(201) }).password,
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
    const errors = validateSignup({ name: "", email: "abc", password: "123" });

    expect(Object.keys(errors).sort()).toEqual(["email", "name", "password"]);
  });
});
