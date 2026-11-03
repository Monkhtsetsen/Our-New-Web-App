import { describe, expect, it } from "vitest";
import { safeDestination } from "./redirect";

/**
 * Open redirect-ийн тестүүд.
 *
 * Энэ бол "ажиллаж байгаа эсэх" биш, "халдлагыг зогсоож байгаа эсэх"
 * тест. Тус бүр нь жинхэнэ ашиглагддаг заль.
 */
describe("safeDestination — зөвшөөрөх", () => {
  it("сайтын доторх замыг хүлээж авна", () => {
    expect(safeDestination("/profile")).toBe("/profile");
    expect(safeDestination("/admin")).toBe("/admin");
    expect(safeDestination("/goals/123?tab=done")).toBe("/goals/123?tab=done");
  });

  it("параметр байхгүй бол профайл руу", () => {
    expect(safeDestination(null)).toBe("/profile");
    expect(safeDestination("")).toBe("/profile");
  });
});

describe("safeDestination — татгалзах", () => {
  it("бүтэн гадны хаягийг татгалзана", () => {
    expect(safeDestination("https://evil.example.com")).toBe("/profile");
    expect(safeDestination("http://evil.example.com/login")).toBe("/profile");
  });

  /**
   * "//evil.com" нь протоколгүй хаяг: хөтөч үүнийг одоогийн
   * протоколоор нь нөхөж ГАДНЫ сайт руу явдаг. Зүгээр "/"-ээр
   * эхэлж байгааг нь хараад зөвшөөрвөл халдлага амжилттай болно.
   */
  it("протоколгүй гадны хаягийг татгалзана", () => {
    expect(safeDestination("//evil.example.com")).toBe("/profile");
    expect(safeDestination("//evil.example.com/login")).toBe("/profile");
  });

  /** Зарим хөтөч урвуу ташуу зураасыг "/"-тэй адил үздэг. */
  it("урвуу ташуу зураасаар эхэлсэн хаягийг татгалзана", () => {
    expect(safeDestination("/\\evil.example.com")).toBe("/profile");
  });

  it("ташуу зураасаар эхлээгүй мөрийг татгалзана", () => {
    expect(safeDestination("evil.example.com")).toBe("/profile");
    expect(safeDestination("javascript:alert(1)")).toBe("/profile");
  });
});
