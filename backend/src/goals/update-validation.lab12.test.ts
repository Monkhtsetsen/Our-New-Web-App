/**
 * Лаб 12 — AI санал болгосон `validateGoalUpdate()`-ийг Лаб 10-ийн
 * AAA аргаар баталгаажуулах тест.
 *
 * "REVIEW #N" тестүүд нь review-гийн олдвор бүрийг барина. Copilot-ын ноорог
 * #3–#5, Claude Code-ын ноорог #4–#5 дээр унасан. Дэлгэрэнгүй: docs/lab12/README.md
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import * as dates from "./dates.js";
import {
  validateGoalUpdate,
  type CurrentGoal,
} from "./update-validation.js";

const TODAY = "2026-11-24";
const current: CurrentGoal = { deadline: "2026-12-31", status: "in_progress" };

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Лаб 12 — validateGoalUpdate: хэвийн тохиолдол", () => {
  it("зөвхөн ирсэн талбарыг шинэчилнэ", () => {
    // Arrange
    const input = { title: "  Шинэ нэр  " };

    // Act
    const { errors, update } = validateGoalUpdate(input, current, TODAY);

    // Assert
    expect(errors).toEqual({});
    expect(update).toEqual({ title: "Шинэ нэр" });
  });

  it("олон талбарыг зэрэг шинэчилнэ", () => {
    const input = {
      description: "  Өдөр бүр 30 мин  ",
      deadline: "2027-03-01",
      category: "health",
      status: "completed",
    };

    const { errors, update } = validateGoalUpdate(input, current, TODAY);

    expect(errors).toEqual({});
    expect(update).toEqual({
      description: "Өдөр бүр 30 мин",
      deadline: "2027-03-01",
      category: "health",
      status: "completed",
    });
  });

  it("тайлбар, хугацааг null-оор арилгана", () => {
    const { errors, update } = validateGoalUpdate(
      { description: null, deadline: null },
      current,
      TODAY,
    );

    expect(errors).toEqual({});
    expect(update).toEqual({ description: null, deadline: null });
  });

  it("биелсэн зорилгыг дахин нээж болно", () => {
    const { errors, update } = validateGoalUpdate(
      { status: "in_progress" },
      { deadline: null, status: "completed" },
      TODAY,
    );

    expect(errors).toEqual({});
    expect(update.status).toBe("in_progress");
  });
});

describe("Лаб 12 — validateGoalUpdate: edge / аюулгүй байдал", () => {
  it("хоосон PATCH-ийг татгалзана", () => {
    const { errors } = validateGoalUpdate({}, current, TODAY);
    expect(errors._form).toBeDefined();
  });

  it("REVIEW #1: userId/id зэрэг хориотой талбарыг авахгүй (mass assignment)", () => {
    // Arrange — халдагч өөр хүний id, үүсгэсэн огноо илгээнэ
    const input = {
      title: "Ок",
      userId: "00000000-0000-0000-0000-000000000000",
      id: "x",
      createdAt: "2000-01-01",
    };

    // Act
    const { errors, update } = validateGoalUpdate(input, current, TODAY);

    // Assert
    expect(errors).toEqual({});
    expect(Object.keys(update)).toEqual(["title"]);
  });

  it("зөвхөн хориотой талбартай хүсэлтийг хоосон гэж үзнэ", () => {
    const { errors } = validateGoalUpdate({ userId: "x" }, current, TODAY);
    expect(errors._form).toBeDefined();
  });

  it("REVIEW #2: хоосон мөр нэрийг чимээгүй алгасахгүй, алдаа өгнө", () => {
    const { errors, update } = validateGoalUpdate({ title: "" }, current, TODAY);

    expect(errors.title).toBeDefined();
    expect(update).toEqual({});
  });

  it("хэт урт нэр (201 тэмдэгт)-ийг татгалзана", () => {
    const { errors } = validateGoalUpdate(
      { title: "x".repeat(201) },
      current,
      TODAY,
    );
    expect(errors.title).toContain("200");
  });

  it("REVIEW #3: хугацаа өнгөрсөн зорилгын НЭРИЙГ засахыг хаахгүй", () => {
    // Arrange — хугацаа нь өчигдөр дууссан зорилго
    const overdue: CurrentGoal = { deadline: "2026-11-01", status: "in_progress" };

    // Act — фронт форм бүх талбарыг (хуучин хугацааг ч) илгээдэг
    const { errors, update } = validateGoalUpdate(
      { title: "Шинэ нэр", deadline: "2026-11-01" },
      overdue,
      TODAY,
    );

    // Assert
    expect(errors).toEqual({});
    expect(update).toEqual({ title: "Шинэ нэр" });
  });

  it("хугацааг ӨНГӨРСӨН өдөр рүү шинээр өөрчлөхийг татгалзана", () => {
    const { errors } = validateGoalUpdate(
      { deadline: "2026-11-01" },
      current,
      TODAY,
    );
    expect(errors.deadline).toBeDefined();
  });

  it("байхгүй өдөр (2027-02-30)-ийг татгалзана", () => {
    const { errors } = validateGoalUpdate(
      { deadline: "2027-02-30" },
      current,
      TODAY,
    );
    expect(errors.deadline).toBeDefined();
  });

  it("REVIEW #4: category=null нь 'personal' руу чимээгүй солихгүй", () => {
    const withNull = validateGoalUpdate({ category: null }, current, TODAY);
    const withEmpty = validateGoalUpdate({ category: "  " }, current, TODAY);

    expect(withNull.errors.category).toBeDefined();
    expect(withEmpty.errors.category).toBeDefined();
  });

  it("танихгүй төлөвийг татгалзана", () => {
    const { errors } = validateGoalUpdate({ status: "done" }, current, TODAY);
    expect(errors.status).toBeDefined();
  });

  it("REVIEW #5: нэг талбар буруу бол хагас засвар буцаахгүй", () => {
    const { errors, update } = validateGoalUpdate(
      { title: "Зөв нэр", status: "done" },
      current,
      TODAY,
    );

    expect(errors.status).toBeDefined();
    expect(update).toEqual({});
  });

  it("өвлөгдсөн шинж ('toString' гэх мэт)-ийг талбар гэж андуурахгүй", () => {
    const input = Object.create({ title: "prototype-аас" }) as Record<string, unknown>;
    const { errors } = validateGoalUpdate(input, current, TODAY);
    expect(errors._form).toBeDefined();
  });
});

describe("Лаб 12 — validateGoalUpdate: mock", () => {
  it("today дамжуулаагүй бол todayInAppZone()-г ашиглана", () => {
    // Arrange
    vi.spyOn(dates, "todayInAppZone").mockReturnValue("2027-06-01");

    // Act — 2027-05-01 нь mock-лсон өнөөдрөөс өмнө
    const { errors } = validateGoalUpdate({ deadline: "2027-05-01" }, current);

    // Assert
    expect(dates.todayInAppZone).toHaveBeenCalled();
    expect(errors.deadline).toBeDefined();
  });
});
