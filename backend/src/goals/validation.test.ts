import { describe, expect, it } from "vitest";
import {
  GOAL_DESCRIPTION_MAX_LENGTH,
  GOAL_TITLE_MAX_LENGTH,
  validateGoal,
} from "./validation.js";

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
    expect(Object.keys(goal).sort()).toEqual(["description", "title"]);
  });
});
