import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { InvalidTokenError, signToken, verifyToken } from "./token.js";

const SECRET = "test-only-secret-at-least-32-characters-long";
const OTHER_SECRET = "a-completely-different-secret-also-32-chars";

const CLAIMS = { sub: "11111111-2222-3333-4444-555555555555", role: "user", tv: 0 } as const;

describe("signToken / verifyToken", () => {
  it("гаргасан token-ыг буцааж уншина", () => {
    const token = signToken({ ...CLAIMS }, SECRET);

    expect(verifyToken(token, SECRET)).toEqual(CLAIMS);
  });

  it("эрхийг хадгална", () => {
    const token = signToken({ ...CLAIMS, role: "admin" }, SECRET);

    expect(verifyToken(token, SECRET).role).toBe("admin");
  });

  it("өөр түлхүүрээр шалгавал татгалзана", () => {
    const token = signToken({ ...CLAIMS }, SECRET);

    expect(() => verifyToken(token, OTHER_SECRET)).toThrow(InvalidTokenError);
  });

  // Token-ы агуулгыг хэн ч уншиж чадна (base64, шифрлэгдээгүй) — хамгаалалт
  // нь гарын үсэг. Нэг тэмдэгт өөрчилвөл гарын үсэг таарахаа болино.
  it("агуулгыг нь өөрчилвөл татгалзана", () => {
    const token = signToken({ ...CLAIMS }, SECRET);
    const [header, , signature] = token.split(".");
    const tampered = Buffer.from(
      JSON.stringify({ ...CLAIMS, role: "admin" }),
    ).toString("base64url");

    expect(() => verifyToken(`${header}.${tampered}.${signature}`, SECRET)).toThrow(
      InvalidTokenError,
    );
  });

  /**
   * JWT-ийн хамгийн алдартай эмзэг байдал: толгой дээр `"alg": "none"`
   * гэж бичээд гарын үсгийг хасахад зарим сан "гарын үсэг шаардаагүй
   * байна" гэж үзээд хүлээн авдаг. Манай код алгоритмыг тодорхой зааж
   * өгдөг тул ийм token дамжиж ОРОХ ЁСГҮЙ.
   */
  it('alg: "none" төрлийн token-ыг хүлээж авахгүй', () => {
    const header = Buffer.from(
      JSON.stringify({ alg: "none", typ: "JWT" }),
    ).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({ ...CLAIMS, role: "admin" }),
    ).toString("base64url");

    expect(() => verifyToken(`${header}.${payload}.`, SECRET)).toThrow(
      InvalidTokenError,
    );
  });

  it("хугацаа нь дууссан token-ыг хүлээж авахгүй", () => {
    const expired = jwt.sign({ ...CLAIMS }, SECRET, {
      algorithm: "HS256",
      expiresIn: "-1s",
    });

    expect(() => verifyToken(expired, SECRET)).toThrow(InvalidTokenError);
  });

  it("дутуу талбартай token-ыг хүлээж авахгүй", () => {
    const incomplete = jwt.sign({ sub: CLAIMS.sub }, SECRET, {
      algorithm: "HS256",
    });

    expect(() => verifyToken(incomplete, SECRET)).toThrow(InvalidTokenError);
  });

  it("танихгүй эрхтэй token-ыг хүлээж авахгүй", () => {
    const strange = jwt.sign({ ...CLAIMS, role: "superadmin" }, SECRET, {
      algorithm: "HS256",
    });

    expect(() => verifyToken(strange, SECRET)).toThrow(InvalidTokenError);
  });

  it("хог мөрийг хүлээж авахгүй", () => {
    for (const bad of ["", "abc", "a.b.c", "....."]) {
      expect(() => verifyToken(bad, SECRET)).toThrow(InvalidTokenError);
    }
  });

  it("яагаад буруу болохыг ялгаж хэлэхгүй", () => {
    const expired = jwt.sign({ ...CLAIMS }, SECRET, {
      algorithm: "HS256",
      expiresIn: "-1s",
    });
    const wrongKey = signToken({ ...CLAIMS }, OTHER_SECRET);

    const messages = [expired, wrongKey].map((token) => {
      try {
        verifyToken(token, SECRET);
        return "алдаа гарсангүй";
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    });

    expect(messages[0]).toBe(messages[1]);
  });
});
