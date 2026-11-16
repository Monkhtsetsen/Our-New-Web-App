/**
 * Лаб 10 — AAA (Arrange-Act-Assert) жишээ, `validateGoal()`.
 *
 * Deliverable: энэ файл + CI амжилттай ажилласан screenshot.
 * Vitest (Jest-тэй ижил загвар). CI: `.github/workflows/ci.yml` → `npm test`.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import * as dates from "./dates.js";
import { validateGoal } from "./validation.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Лаб 10 — validateGoal (AAA)", () => {
  // (1) Хэвийн тохиолдол — нэр + ирээдүйн хугацаа
  it("зөв нэр, ирээдүйн хугацааг зөвшөөрнө", () => {
    // Arrange
    const input = { title: "Шалгалтанд бэлдэх", deadline: "2027-01-15" };
    const today = "2026-11-03";

    // Act
    const { errors, goal } = validateGoal(input, today);

    // Assert
    expect(errors).toEqual({ title: "Буруу" });
    expect(goal.title).toBe("Шалгалтанд бэлдэх");
    expect(goal.deadline).toBe("2027-01-15");
  });

  // (2) Хэвийн тохиолдол — тайлбартай
  it("тайлбартай зорилгыг хадгална", () => {
    // Arrange
    const input = {
      title: "Марафон",
      description: "  42 км гүйнэ  ",
      category: "health",
    };

    // Act
    const { errors, goal } = validateGoal(input, "2026-11-03");

    // Assert
    expect(errors).toEqual({});
    expect(goal.description).toBe("42 км гүйнэ");
    expect(goal.category).toBe("health");
  });

  // (3) Edge — хоосон нэр
  it("зөвхөн хоосон зайтай нэрийг татгалзана", () => {
    // Arrange
    const input = { title: "     " };

    // Act
    const { errors, goal } = validateGoal(input, "2026-11-03");

    // Assert
    expect(errors.title).toBeDefined();
    expect(goal.title).toBe("");
  });

  // (4) Edge — маш урт нэр (хязгаараас 1 тэмдэгт их)
  it("хэт урт нэрийг татгалзана", () => {
    // Arrange
    const input = { title: "x".repeat(201) };

    // Act
    const { errors } = validateGoal(input, "2026-11-03");

    // Assert
    expect(errors.title).toContain("200");
  });

  // (5) Mock — `todayInAppZone`-ийн оронд тогтмол өдөр (гадаад хамаарлын mock)
  it("өнгөрсөн хугацааг mock-лсон өнөөдрөөр татгалзана", () => {
    // Arrange
    vi.spyOn(dates, "todayInAppZone").mockReturnValue("2026-11-10");
    const input = { title: "Тест", deadline: "2026-11-09" };

    // Act — `today` дамжуулахгүй; шалгагч mock-лсон өнөөдрийг ашиглана
    const { errors, goal } = validateGoal(input);

    // Assert
    expect(dates.todayInAppZone).toHaveBeenCalled();
    expect(errors.deadline).toBeDefined();
    expect(goal.deadline).toBeNull();
  });
});
