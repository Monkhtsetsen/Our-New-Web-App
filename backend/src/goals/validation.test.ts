import { describe, expect, it } from "vitest";
import {
  DEFAULT_GOAL_CATEGORY,
  GOAL_CATEGORIES,
  GOAL_DEADLINE_MAX_YEARS,
  GOAL_DESCRIPTION_MAX_LENGTH,
  GOAL_TITLE_MAX_LENGTH,
  isGoalCategory,
  validateGoal,
} from "./validation.js";

/**
 * Тестийн "өнөөдөр".
 *
 * Шалгагчид өдрийг гаднаас өгч болдог тул бодит цагаас хамаарахгүй.
 * Үгүй бол "маргааш" гэж бичсэн тест маргааш өөрөө унах байв.
 */
const TODAY = "2026-11-03";

describe("validateGoal — зөв оролт", () => {
  it("нэрийг хүлээж авна", () => {
    const { errors, goal } = validateGoal({ title: "Марафон гүйх" });

    expect(errors).toEqual({});
    expect(goal.title).toBe("Марафон гүйх");
    expect(goal.description).toBeNull();
  });

  it("илүүдэл хоосон зайг хасна", () => {
    const { goal } = validateGoal({ title: "  Марафон гүйх  " });

    expect(goal.title).toBe("Марафон гүйх");
  });

  it("тайлбарыг хүлээж авна", () => {
    const { errors, goal } = validateGoal({
      title: "Марафон гүйх",
      description: "Жилийн эцэст 42 км гүйнэ.",
    });

    expect(errors).toEqual({});
    expect(goal.description).toBe("Жилийн эцэст 42 км гүйнэ.");
  });

  /**
   * Хоосон мөрийг `null` болгоно.
   *
   * ӨС дээр "" ба NULL хоёр өөр утга. Хоёулаа "тайлбар алга" гэсэн
   * утгатай болбол хожим шүүлт хийхэд (`IS NULL` үү, `= ''` үү)
   * алдаа гарна. Нэг л хэлбэрээр хадгална.
   */
  it("хоосон тайлбарыг null болгоно", () => {
    for (const value of ["", "   "]) {
      const { goal } = validateGoal({ title: "Марафон гүйх", description: value });
      expect(goal.description).toBeNull();
    }
  });

  it("тайлбар огт илгээгээгүй бол null", () => {
    const { goal } = validateGoal({ title: "Марафон гүйх" });

    expect(goal.description).toBeNull();
  });
});

describe("validateGoal — буруу оролт", () => {
  it("нэргүй бол алдаа", () => {
    for (const value of [undefined, "", "   ", 42, null]) {
      const { errors } = validateGoal({ title: value });
      expect(errors.title).toBeDefined();
    }
  });

  it("хэт урт нэрийг татгалзана", () => {
    const { errors } = validateGoal({ title: "a".repeat(GOAL_TITLE_MAX_LENGTH + 1) });

    expect(errors.title).toContain(String(GOAL_TITLE_MAX_LENGTH));
  });

  it("яг хязгаар дээрх нэрийг зөвшөөрнө", () => {
    const { errors } = validateGoal({ title: "a".repeat(GOAL_TITLE_MAX_LENGTH) });

    expect(errors.title).toBeUndefined();
  });

  it("хэт урт тайлбарыг татгалзана", () => {
    const { errors } = validateGoal({
      title: "Марафон гүйх",
      description: "a".repeat(GOAL_DESCRIPTION_MAX_LENGTH + 1),
    });

    expect(errors.description).toBeDefined();
  });

  it("тайлбар мөр биш бол алдаа", () => {
    const { errors } = validateGoal({ title: "Марафон гүйх", description: 42 });

    expect(errors.description).toBeDefined();
  });
});

/**
 * ХАМГИЙН ЧУХАЛ ТЕСТ.
 *
 * Хэрэглэгч өөр хүний нэр дээр зорилго үүсгэх, эсвэл шууд "биелсэн"
 * төлөвтэй үүсгэх ёсгүй. Шалгагч эдгээр талбарыг ОГТ УНШИХГҮЙ байх
 * ёстой — уншвал route тэднийг ӨС рүү дамжуулах эрсдэл үүснэ.
 */
describe("validateGoal — хүсэлтээс авч болохгүй талбарууд", () => {
  it("userId, status, id-г үл тоомсорлоно", () => {
    const { errors, goal } = validateGoal({
      title: "Марафон гүйх",
      userId: "өөр-хүний-id",
      status: "completed",
      id: "миний-сонгосон-id",
      createdAt: "2020-01-01T00:00:00.000Z",
    });

    expect(errors).toEqual({});
    expect(Object.keys(goal).sort()).toEqual([
      "category",
      "deadline",
      "description",
      "title",
    ]);
  });
});

describe("validateGoal — дуусах хугацаа", () => {
  it("хугацаа нь сонголт — байхгүй бол null", () => {
    for (const value of [undefined, null, "", "   "]) {
      const { errors, goal } = validateGoal(
        { title: "Марафон гүйх", deadline: value },
        TODAY,
      );

      expect(errors).toEqual({});
      expect(goal.deadline).toBeNull();
    }
  });

  it("ирээдүйн өдрийг хүлээж авна", () => {
    const { errors, goal } = validateGoal(
      { title: "Марафон гүйх", deadline: "2027-06-15" },
      TODAY,
    );

    expect(errors).toEqual({});
    expect(goal.deadline).toBe("2027-06-15");
  });

  /**
   * Өнөөдөр нь зөвшөөрөгдөнө.
   *
   * "Өнөөдөр дуусгах" гэдэг нь бүрэн хүчинтэй зорилго. Хязгаарыг
   * `<` биш `<=` гэж бичвэл энэ тест унана.
   */
  it("өнөөдрийг зөвшөөрнө", () => {
    const { errors, goal } = validateGoal(
      { title: "Марафон гүйх", deadline: TODAY },
      TODAY,
    );

    expect(errors).toEqual({});
    expect(goal.deadline).toBe(TODAY);
  });

  it("өчигдрийг татгалзана", () => {
    const { errors, goal } = validateGoal(
      { title: "Марафон гүйх", deadline: "2026-11-02" },
      TODAY,
    );

    expect(errors.deadline).toBeDefined();
    expect(goal.deadline).toBeNull();
  });

  it("буруу хэлбэрийг татгалзана", () => {
    for (const value of ["маргааш", "2027/06/15", "15-06-2027", "2027-6-5"]) {
      const { errors } = validateGoal(
        { title: "Марафон гүйх", deadline: value },
        TODAY,
      );

      expect(errors.deadline, value).toBeDefined();
    }
  });

  /**
   * Хэлбэрээрээ зөв ч хуанлид байхгүй өдөр.
   *
   * Зөвхөн регексээр шалгавал ӨС рүү 2027-02-30 гэж орж, дараа нь
   * өөр өдөр болж хувирна.
   */
  it("байхгүй өдрийг татгалзана", () => {
    const { errors } = validateGoal(
      { title: "Марафон гүйх", deadline: "2027-02-30" },
      TODAY,
    );

    expect(errors.deadline).toBeDefined();
  });

  it("мөр биш утгыг татгалзана", () => {
    for (const value of [42, true, { year: 2027 }, ["2027-06-15"]]) {
      const { errors } = validateGoal(
        { title: "Марафон гүйх", deadline: value },
        TODAY,
      );

      expect(errors.deadline, JSON.stringify(value)).toBeDefined();
    }
  });

  it("илүүдэл хоосон зайг хасна", () => {
    const { errors, goal } = validateGoal(
      { title: "Марафон гүйх", deadline: "  2027-06-15  " },
      TODAY,
    );

    expect(errors).toEqual({});
    expect(goal.deadline).toBe("2027-06-15");
  });

  it("хэтэрхий хол хугацааг татгалзана", () => {
    const tooFar = `${2026 + GOAL_DEADLINE_MAX_YEARS + 1}-01-01`;
    const { errors } = validateGoal(
      { title: "Марафон гүйх", deadline: tooFar },
      TODAY,
    );

    expect(errors.deadline).toContain(String(GOAL_DEADLINE_MAX_YEARS));
  });

  it("хязгаар дотор байгаа хол хугацааг зөвшөөрнө", () => {
    const limit = `${2026 + GOAL_DEADLINE_MAX_YEARS}-11-03`;
    const { errors } = validateGoal(
      { title: "Марафон гүйх", deadline: limit },
      TODAY,
    );

    expect(errors.deadline).toBeUndefined();
  });

  /**
   * Нэрийн алдаа хугацааны алдааг дарж хаахгүй.
   *
   * Хоёр талбар хоёулаа буруу байхад хэрэглэгчид ХОЁУЛАНГ нь хэлэх
   * ёстой. Нэгийг нь зассаны дараа дахиад нөгөөг нь хэлэх нь
   * хэрэглэгчийг дэмий тойруулна.
   */
  it("нэр, хугацаа хоёулаа буруу бол хоёр алдаа", () => {
    const { errors } = validateGoal(
      { title: "   ", deadline: "2020-01-01" },
      TODAY,
    );

    expect(errors.title).toBeDefined();
    expect(errors.deadline).toBeDefined();
  });
});

describe("validateGoal — ангилал", () => {
  it("сонгоогүй бол анхны ангилал", () => {
    for (const value of [undefined, null, "", "   "]) {
      const { errors, goal } = validateGoal(
        { title: "Марафон гүйх", category: value },
        TODAY,
      );

      expect(errors).toEqual({});
      expect(goal.category).toBe(DEFAULT_GOAL_CATEGORY);
    }
  });

  it("таван ангилал бүгд хүчинтэй", () => {
    for (const category of GOAL_CATEGORIES) {
      const { errors, goal } = validateGoal(
        { title: "Марафон гүйх", category },
        TODAY,
      );

      expect(errors, category).toEqual({});
      expect(goal.category).toBe(category);
    }
  });

  /**
   * Танихгүй ангиллыг ЧИМЭЭГҮЙХЭН залруулахгүй.
   *
   * "helth" гэж бичихэд "personal" дор хадгалбал хэрэглэгч эрүүл
   * мэндийн шүүлтүүрээс зорилгоо хэзээ ч олохгүй, яагаад гэдгийг ч
   * мэдэхгүй. Алдаа хэлэх нь дүлий залруулгаас дээр.
   */
  it("танихгүй ангиллыг татгалзана", () => {
    for (const value of ["helth", "HEALTH", "work", "хувийн"]) {
      const { errors } = validateGoal(
        { title: "Марафон гүйх", category: value },
        TODAY,
      );

      expect(errors.category, value).toBeDefined();
    }
  });

  it("мөр биш утгыг татгалзана", () => {
    for (const value of [42, true, ["health"], { name: "health" }]) {
      const { errors } = validateGoal(
        { title: "Марафон гүйх", category: value },
        TODAY,
      );

      expect(errors.category, JSON.stringify(value)).toBeDefined();
    }
  });

  it("алдааны мессеж нь боломжит утгуудыг нэрлэнэ", () => {
    const { errors } = validateGoal(
      { title: "Марафон гүйх", category: "work" },
      TODAY,
    );

    for (const category of GOAL_CATEGORIES) {
      expect(errors.category).toContain(category);
    }
  });
});

describe("isGoalCategory", () => {
  it("зөв ангиллыг танина", () => {
    for (const category of GOAL_CATEGORIES) {
      expect(isGoalCategory(category), category).toBe(true);
    }
  });

  it("бусдыг татгалзана", () => {
    for (const value of ["", " health", "Health", "work", "__proto__"]) {
      expect(isGoalCategory(value), JSON.stringify(value)).toBe(false);
    }
  });

  /**
   * Жагсаалт нь schema-гийн enum-тэй нэг.
   *
   * Хуулж бичсэн жагсаалт нь schema дээр ангилал нэмэхэд хоцорно.
   * Энэ тест тэр хоцрогдлыг барина.
   */
  it("таван ангилал, schema-тай ижил", () => {
    expect([...GOAL_CATEGORIES].sort()).toEqual([
      "career",
      "finance",
      "health",
      "personal",
      "study",
    ]);
  });
});
