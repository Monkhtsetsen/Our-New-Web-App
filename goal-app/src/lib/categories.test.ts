import { describe, expect, it } from "vitest";
import { GOAL_CATEGORIES, isGoalCategory } from "./api";
import { CATEGORIES, CATEGORY_ORDER, DEFAULT_CATEGORY } from "./categories";

describe("isGoalCategory", () => {
  it("таван ангиллыг танина", () => {
    for (const category of GOAL_CATEGORIES) {
      expect(isGoalCategory(category), category).toBe(true);
    }
  });

  /**
   * URL-ийн утга нь хэрэглэгчийн бичсэн юу ч байж болно.
   *
   * Шалгалгүй цааш дамжуулбал backend 400 буцаана — тэр нь хуудсыг
   * бүтнээр алдаа болгоно. Энд баривал шүүлтгүй жагсаалт харуулаад
   * хэрэглэгчид мэдэгдэх боломжтой.
   */
  it("бусдыг татгалзана", () => {
    for (const value of [
      "",
      " health",
      "Health",
      "HEALTH",
      "work",
      "хувийн",
      "__proto__",
      "study,career",
    ]) {
      expect(isGoalCategory(value), JSON.stringify(value)).toBe(false);
    }
  });
});

describe("ангиллын тодорхойлолт", () => {
  /**
   * Ангилал бүр нэр, дүрс, өнгө ГУРВУУЛАА байх ёстой.
   *
   * Schema дээр шинэ ангилал нэмээд энд мартвал хуудас `undefined`
   * уншиж унана. Энэ тест тэр мартсаныг барина.
   */
  it("ангилал бүр бүрэн тодорхойлогдсон", () => {
    for (const category of GOAL_CATEGORIES) {
      const meta = CATEGORIES[category];

      expect(meta, category).toBeDefined();
      expect(meta.label.length, category).toBeGreaterThan(0);
      expect(meta.tone, category).toMatch(/^text-category-/);
      expect(typeof meta.Icon, category).toBe("function");
    }
  });

  it("дарааллын жагсаалт нь бүх ангиллыг яг нэг удаа агуулна", () => {
    expect([...CATEGORY_ORDER].sort()).toEqual([...GOAL_CATEGORIES].sort());
    expect(new Set(CATEGORY_ORDER).size).toBe(CATEGORY_ORDER.length);
  });

  /**
   * Нэр нь ангилал бүрт ӨӨР байх ёстой.
   *
   * Хоёр ангилал ижил нэртэй бол шүүлтүүр нь хэрэглэгчид хоёр ижил
   * товч болж харагдана.
   */
  it("нэрс нь хоорондоо давтагдахгүй", () => {
    const labels = GOAL_CATEGORIES.map((key) => CATEGORIES[key].label);

    expect(new Set(labels).size).toBe(labels.length);
  });

  /**
   * Өнгө нь ангилал бүрт өөр байх ёстой.
   *
   * Өнгө нь ганцаараа утга дамжуулахгүй (нэр, дүрс хоёр үүнийг
   * хийнэ), гэхдээ хоёр ангилал ижил өнгөтэй бол өнгө нь хурдан
   * ялгахад огт тус болохгүй.
   */
  it("өнгө нь хоорондоо давтагдахгүй", () => {
    const tones = GOAL_CATEGORIES.map((key) => CATEGORIES[key].tone);

    expect(new Set(tones).size).toBe(tones.length);
  });

  it("анхны ангилал нь хүчинтэй ангилал", () => {
    expect(isGoalCategory(DEFAULT_CATEGORY)).toBe(true);
  });
});
