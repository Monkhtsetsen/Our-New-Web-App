import { describe, expect, it } from "vitest";
import {
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  validateTask,
} from "./validation.js";

describe("validateTask — зөв оролт", () => {
  it("нэрийг хүлээж авна", () => {
    const { errors, task } = validateTask({ title: "Дасгал хийх" });

    expect(errors).toEqual({});
    expect(task.title).toBe("Дасгал хийх");
    expect(task.description).toBeNull();
    expect(task.dueDate).toBeNull();
  });

  it("илүүдэл хоосон зайг хасна", () => {
    expect(validateTask({ title: "  Дасгал хийх  " }).task.title).toBe(
      "Дасгал хийх",
    );
  });

  it("тайлбарыг хүлээж авна", () => {
    const { task } = validateTask({
      title: "Дасгал хийх",
      description: "30 минут",
    });

    expect(task.description).toBe("30 минут");
  });

  it("хоосон тайлбарыг null болгоно", () => {
    for (const value of ["", "   ", null]) {
      expect(
        validateTask({ title: "Дасгал хийх", description: value }).task
          .description,
        JSON.stringify(value),
      ).toBeNull();
    }
  });
});

describe("validateTask — хийх өдөр", () => {
  /**
   * Өдрийг АГШИН болгож хадгална.
   *
   * `tb_tasks.due_date` нь `timestamp` тул өдрийг тодорхой агшин
   * болгох шаардлагатай. Улаанбаатарын шөнө дундыг сонгосон нь
   * "өнөөдөр" хуудсын интервалд яг таарахын тулд.
   */
  it("өдрийг Улаанбаатарын шөнө дунд болгоно", () => {
    const { errors, task } = validateTask({
      title: "Дасгал хийх",
      dueDate: "2026-11-20",
    });

    expect(errors).toEqual({});
    expect(task.dueDate?.toISOString()).toBe("2026-11-19T16:00:00.000Z");
  });

  it("хугацаа нь сонголт", () => {
    for (const value of [undefined, null, "", "   "]) {
      const { errors, task } = validateTask({
        title: "Дасгал хийх",
        dueDate: value,
      });

      expect(errors, JSON.stringify(value)).toEqual({});
      expect(task.dueDate, JSON.stringify(value)).toBeNull();
    }
  });

  /**
   * ӨНГӨРСӨН ӨДРИЙГ ЗӨВШӨӨРНӨ.
   *
   * Зорилгын хугацаанаас ӨӨР дүрэм. Өчигдөр хийх байсан ажлаа
   * мартаад одоо бүртгэж байж болно; issue нь "хоцорсон" хэсгийг
   * тусад нь харуулахыг шаарддаг тул энэ нь бүрэн хүчинтэй төлөв.
   */
  it("өнгөрсөн өдрийг зөвшөөрнө", () => {
    const { errors, task } = validateTask({
      title: "Мартсан ажил",
      dueDate: "2020-01-15",
    });

    expect(errors).toEqual({});
    expect(task.dueDate?.toISOString()).toBe("2020-01-14T16:00:00.000Z");
  });

  it("буруу хэлбэрийг татгалзана", () => {
    for (const value of ["маргааш", "2026/11/20", "20-11-2026", "2026-11-2"]) {
      const { errors } = validateTask({ title: "Дасгал хийх", dueDate: value });

      expect(errors.dueDate, value).toBeDefined();
    }
  });

  it("байхгүй өдрийг татгалзана", () => {
    for (const value of ["2027-02-30", "2026-13-01", "2026-04-31"]) {
      const { errors } = validateTask({ title: "Дасгал хийх", dueDate: value });

      expect(errors.dueDate, value).toBeDefined();
    }
  });

  it("мөр биш утгыг татгалзана", () => {
    for (const value of [42, true, ["2026-11-20"], { day: 20 }]) {
      const { errors } = validateTask({ title: "Дасгал хийх", dueDate: value });

      expect(errors.dueDate, JSON.stringify(value)).toBeDefined();
    }
  });
});

describe("validateTask — буруу оролт", () => {
  it("нэргүй бол алдаа", () => {
    for (const value of [undefined, "", "   ", 42, null]) {
      expect(
        validateTask({ title: value }).errors.title,
        JSON.stringify(value),
      ).toBeDefined();
    }
  });

  it("хэт урт нэрийг татгалзана", () => {
    const { errors } = validateTask({
      title: "a".repeat(TASK_TITLE_MAX_LENGTH + 1),
    });

    expect(errors.title).toContain(String(TASK_TITLE_MAX_LENGTH));
  });

  it("яг хязгаар дээрх нэрийг зөвшөөрнө", () => {
    const { errors } = validateTask({
      title: "a".repeat(TASK_TITLE_MAX_LENGTH),
    });

    expect(errors.title).toBeUndefined();
  });

  it("хэт урт тайлбарыг татгалзана", () => {
    const { errors } = validateTask({
      title: "Дасгал хийх",
      description: "a".repeat(TASK_DESCRIPTION_MAX_LENGTH + 1),
    });

    expect(errors.description).toBeDefined();
  });

  it("нэр, өдөр хоёулаа буруу бол хоёр алдаа", () => {
    const { errors } = validateTask({ title: "  ", dueDate: "маргааш" });

    expect(errors.title).toBeDefined();
    expect(errors.dueDate).toBeDefined();
  });
});

/**
 * ХАМГИЙН ЧУХАЛ ТЕСТ.
 *
 * Хэрэглэгч өөр хүний нэр дээр даалгавар үүсгэх, шууд "биелсэн"
 * төлөвтэй үүсгэх, эсвэл өөртөө дурын XP тогтоох ёсгүй. Шалгагч
 * эдгээр талбарыг ОГТ УНШИХГҮЙ байх ёстой — уншвал route тэднийг
 * ӨС рүү дамжуулах эрсдэл үүснэ.
 */
describe("validateTask — хүсэлтээс авч болохгүй талбарууд", () => {
  it("userId, completed, xpReward, id-г үл тоомсорлоно", () => {
    const { errors, task } = validateTask({
      title: "Дасгал хийх",
      userId: "өөр-хүний-id",
      completed: true,
      xpReward: 100000,
      goalId: "өөр-хүний-зорилго",
      id: "миний-сонгосон-id",
      createdAt: "2020-01-01T00:00:00.000Z",
    });

    expect(errors).toEqual({});
    expect(Object.keys(task).sort()).toEqual([
      "description",
      "dueDate",
      "title",
    ]);
  });
});
