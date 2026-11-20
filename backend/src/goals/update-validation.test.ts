import { describe, expect, it } from "vitest";
import {
  GOAL_CATEGORIES,
  GOAL_DESCRIPTION_MAX_LENGTH,
  GOAL_STATUSES,
  GOAL_TITLE_MAX_LENGTH,
  isGoalStatus,
  validateGoalUpdate,
} from "./validation.js";

const TODAY = "2026-11-18";

describe("validateGoalUpdate — хөндөхгүй байх", () => {
  /**
   * ХАМГИЙН ЧУХАЛ ДҮРЭМ.
   *
   * Гарчгийг л засахад ангилал, хугацаа, төлөв нь хэвээр үлдэх ёстой.
   * Байхгүй талбарыг patch-д оруулбал `undefined` нь ӨС рүү орж
   * тэр баганыг цэвэрлэх эрсдэлтэй.
   */
  it("байхгүй талбар patch-д орохгүй", () => {
    const { errors, patch } = validateGoalUpdate({ title: "Шинэ нэр" }, TODAY);

    expect(errors).toEqual({});
    expect(patch).toEqual({ title: "Шинэ нэр" });
    expect(Object.keys(patch)).toEqual(["title"]);
  });

  it("хоосон хүсэлт хоосон patch гаргана", () => {
    const { errors, patch } = validateGoalUpdate({}, TODAY);

    expect(errors).toEqual({});
    expect(Object.keys(patch)).toHaveLength(0);
  });

  /**
   * Зорилгыг өөр хүн рүү шилжүүлэх, үүсгэсэн цагийг хуурах
   * боломжгүй байх ёстой. Эдгээр талбарыг шалгагч ОГТ УНШИХГҮЙ.
   */
  it("userId, id, createdAt-ыг үл тоомсорлоно", () => {
    const { errors, patch } = validateGoalUpdate(
      {
        title: "Шинэ нэр",
        userId: "өөр-хүний-id",
        id: "миний-сонгосон-id",
        createdAt: "2020-01-01T00:00:00.000Z",
        updatedAt: "2020-01-01T00:00:00.000Z",
      },
      TODAY,
    );

    expect(errors).toEqual({});
    expect(Object.keys(patch)).toEqual(["title"]);
  });
});

describe("validateGoalUpdate — гарчиг", () => {
  it("засна", () => {
    const { patch } = validateGoalUpdate({ title: "  Шинэ нэр  " }, TODAY);

    expect(patch.title).toBe("Шинэ нэр");
  });

  /**
   * Гарчгийг АВЧ ХАЯЖ БОЛОХГҮЙ.
   *
   * ӨС дээр `title` нь notNull. Хоосныг `null` болгож дамжуулбал
   * ӨС-ийн алдаа 500 болж буцна — хэрэглэгчид тайлбаргүй алдаа.
   */
  it("хоосон гарчгийг татгалзана", () => {
    for (const value of ["", "   ", null, 42, []]) {
      const { errors, patch } = validateGoalUpdate({ title: value }, TODAY);

      expect(errors.title, JSON.stringify(value)).toBeDefined();
      expect(patch.title, JSON.stringify(value)).toBeUndefined();
    }
  });

  it("хэт урт гарчгийг татгалзана", () => {
    const { errors } = validateGoalUpdate(
      { title: "a".repeat(GOAL_TITLE_MAX_LENGTH + 1) },
      TODAY,
    );

    expect(errors.title).toContain(String(GOAL_TITLE_MAX_LENGTH));
  });
});

describe("validateGoalUpdate — тайлбар", () => {
  it("засна", () => {
    const { patch } = validateGoalUpdate({ description: "Шинэ тайлбар" }, TODAY);

    expect(patch.description).toBe("Шинэ тайлбар");
  });

  /**
   * Тайлбарыг АВЧ ХАЯЖ БОЛНО — `nullable` багана.
   *
   * `null` ба хоосон мөр хоёулаа "авч хаях" гэсэн утга. Хоёрыг
   * ялгавал ӨС дээр "" ба NULL хоёр өөр утга болж, хожим шүүлт
   * (`IS NULL` үү, `= ''` үү) эвдэрнэ.
   */
  it("хоосон тайлбарыг null болгож хадгална", () => {
    for (const value of [null, "", "   "]) {
      const { errors, patch } = validateGoalUpdate(
        { description: value },
        TODAY,
      );

      expect(errors).toEqual({});
      // `undefined` биш `null` — "хөндөхгүй" ба "авч хаях" хоёр өөр.
      expect(patch.description, JSON.stringify(value)).toBeNull();
      expect("description" in patch).toBe(true);
    }
  });

  it("хэт урт тайлбарыг татгалзана", () => {
    const { errors } = validateGoalUpdate(
      { description: "a".repeat(GOAL_DESCRIPTION_MAX_LENGTH + 1) },
      TODAY,
    );

    expect(errors.description).toBeDefined();
  });

  it("мөр биш тайлбарыг татгалзана", () => {
    const { errors } = validateGoalUpdate({ description: 42 }, TODAY);

    expect(errors.description).toBeDefined();
  });
});

describe("validateGoalUpdate — дуусах хугацаа", () => {
  it("засна", () => {
    const { errors, patch } = validateGoalUpdate(
      { deadline: "2027-06-15" },
      TODAY,
    );

    expect(errors).toEqual({});
    expect(patch.deadline).toBe("2027-06-15");
  });

  it("хугацааг авч хаяж болно", () => {
    for (const value of [null, "", "   "]) {
      const { errors, patch } = validateGoalUpdate({ deadline: value }, TODAY);

      expect(errors).toEqual({});
      expect(patch.deadline, JSON.stringify(value)).toBeNull();
    }
  });

  it("өнөөдрийг зөвшөөрнө", () => {
    const { errors, patch } = validateGoalUpdate({ deadline: TODAY }, TODAY);

    expect(errors).toEqual({});
    expect(patch.deadline).toBe(TODAY);
  });

  it("өнгөрсөн өдрийг татгалзана", () => {
    const { errors, patch } = validateGoalUpdate(
      { deadline: "2026-11-17" },
      TODAY,
    );

    expect(errors.deadline).toBeDefined();
    expect(patch.deadline).toBeUndefined();
  });

  it("байхгүй өдрийг татгалзана", () => {
    const { errors } = validateGoalUpdate({ deadline: "2027-02-30" }, TODAY);

    expect(errors.deadline).toBeDefined();
  });
});

describe("validateGoalUpdate — ангилал", () => {
  it("таван ангилал бүгд хүчинтэй", () => {
    for (const category of GOAL_CATEGORIES) {
      const { errors, patch } = validateGoalUpdate({ category }, TODAY);

      expect(errors, category).toEqual({});
      expect(patch.category).toBe(category);
    }
  });

  /**
   * Ангиллыг АВЧ ХАЯЖ БОЛОХГҮЙ — `notNull`, анхны утгатай багана.
   *
   * Үүсгэхэд хоосон ангилал нь "анхны утгыг ав" гэсэн утга, харин
   * ЗАСАХАД тэр нь утгагүй: тодорхой зорилгын ангиллыг "юу ч биш"
   * болгох гэсэн хүсэлт нь клиентийн алдаа.
   */
  it("хоосон ангиллыг татгалзана", () => {
    for (const value of ["", "   ", null, "helth", "HEALTH", 42]) {
      const { errors } = validateGoalUpdate({ category: value }, TODAY);

      expect(errors.category, JSON.stringify(value)).toBeDefined();
    }
  });
});

describe("validateGoalUpdate — төлөв", () => {
  it("гурван төлөв бүгд хүчинтэй", () => {
    for (const status of GOAL_STATUSES) {
      const { errors, patch } = validateGoalUpdate({ status }, TODAY);

      expect(errors, status).toEqual({});
      expect(patch.status).toBe(status);
    }
  });

  /**
   * "Биелсэн"-ээс "хийгдэж байна" руу БУЦАХ нь зөвшөөрөгдөнө.
   *
   * Андуурч тэмдэглэх нь байнга тохиолддог. Нэг чиглэлд л
   * зөвшөөрвөл хэрэглэгч алдаагаа залруулж чадахгүй.
   */
  it("биелсэнээс буцаж болно", () => {
    const { errors, patch } = validateGoalUpdate(
      { status: "in_progress" },
      TODAY,
    );

    expect(errors).toEqual({});
    expect(patch.status).toBe("in_progress");
  });

  it("танихгүй төлвийг татгалзана", () => {
    for (const value of ["done", "COMPLETED", "", null, 1]) {
      const { errors } = validateGoalUpdate({ status: value }, TODAY);

      expect(errors.status, JSON.stringify(value)).toBeDefined();
    }
  });

  it("алдааны мессеж нь боломжит төлвүүдийг нэрлэнэ", () => {
    const { errors } = validateGoalUpdate({ status: "done" }, TODAY);

    for (const status of GOAL_STATUSES) {
      expect(errors.status).toContain(status);
    }
  });
});

describe("validateGoalUpdate — бүх талбар зэрэг", () => {
  it("тав бүгдийг нэг дор засна", () => {
    const { errors, patch } = validateGoalUpdate(
      {
        title: "Хагас марафон гүйх",
        description: "Намар 21 км",
        deadline: "2027-09-01",
        category: "health",
        status: "completed",
      },
      TODAY,
    );

    expect(errors).toEqual({});
    expect(patch).toEqual({
      title: "Хагас марафон гүйх",
      description: "Намар 21 км",
      deadline: "2027-09-01",
      category: "health",
      status: "completed",
    });
  });

  /**
   * Алдаанууд бие биенээ дарж хаахгүй.
   *
   * Таван талбар буруу байхад нэгийг хэлж, зассаны дараа дахиад
   * нөгөөг хэлэх нь хэрэглэгчийг таван удаа тойруулна.
   */
  it("бүх алдааг зэрэг хэлнэ", () => {
    const { errors, patch } = validateGoalUpdate(
      {
        title: "   ",
        description: 42,
        deadline: "өчигдөр",
        category: "work",
        status: "done",
      },
      TODAY,
    );

    expect(Object.keys(errors).sort()).toEqual([
      "category",
      "deadline",
      "description",
      "status",
      "title",
    ]);
    // Алдаатай талбар нэг ч ӨС рүү орохгүй.
    expect(Object.keys(patch)).toHaveLength(0);
  });
});

describe("isGoalStatus", () => {
  it("зөв төлвийг танина", () => {
    for (const status of GOAL_STATUSES) {
      expect(isGoalStatus(status), status).toBe(true);
    }
  });

  it("бусдыг татгалзана", () => {
    for (const value of ["", " completed", "Completed", "done", "__proto__"]) {
      expect(isGoalStatus(value), JSON.stringify(value)).toBe(false);
    }
  });

  it("гурван төлөв, schema-тай ижил", () => {
    expect([...GOAL_STATUSES].sort()).toEqual([
      "abandoned",
      "completed",
      "in_progress",
    ]);
  });
});
