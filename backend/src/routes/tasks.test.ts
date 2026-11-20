import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

/**
 * `/api/tasks`-ийн тест.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ЮУ ЭНД ШАЛГАГДАЖ, ЮУ ШАЛГАГДАХГҮЙ ВЭ
 *
 * Mock нь query бүтээгчийн ХЭЛБЭРИЙГ дүүрнэ — SQL-ийг гүйцэтгэхгүй.
 * Иймээс `due_date >= start AND < end` шүүлт үнэхээр зөв даалгаврыг
 * сонгож байгаа эсэх ЭНД ШАЛГАГДАХГҮЙ: тэр нь CI-ийн docker ажилд
 * жинхэнэ PostgreSQL дээр шалгагдана (шалгалт 76-85).
 *
 * Энд шалгагдах зүйл нь ӨС-гүйгээр барих боломжтой зүйлс:
 *
 *   - нэвтрээгүй хүнийг хаана
 *   - ӨС рүү БИЧИГДЭХ утгууд: `userId` нь сесснээс, хүсэлтээс биш
 *   - хүсэлтийн `completed`, `xpReward` нь ӨС рүү ОГТ хүрэхгүй
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const MY_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_ID = "22222222-2222-2222-2222-222222222222";

/** Тестэд зориулсан түлхүүр. Жинхэнэ нууц утга БИШ. */
const TEST_SECRET = "test-only-secret-at-least-32-characters-long";

const state = vi.hoisted(() => ({
  user: null as Record<string, unknown> | null,

  /** `.values()`-д дамжсан утгууд. */
  insertValues: [] as Record<string, unknown>[],

  /** `select(...).orderBy(...)`-ийн буцаах мөрүүд, дуудсан дарааллаар. */
  selectResults: [] as unknown[][],
}));

vi.mock("../db/index.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../db/index.js")>();

  const fakeDb = {
    select: (columns: Record<string, unknown>) => ({
      from: () => ({
        where: () => ({
          // `requireAuth`-ийн хэрэглэгчийн уншилт.
          limit: () => (state.user === null ? [] : [state.user]),

          // Даалгаврын жагсаалтууд — дуудсан дарааллаар буцаана.
          orderBy: () => state.selectResults.shift() ?? [],
        }),
      }),
      // `tokenVersion` нь зөвхөн хэрэглэгчийн уншилтад байдаг —
      // хоёр өөр `select`-ийг ингэж ялгана.
      _isUserRead: "tokenVersion" in columns,
    }),

    insert: () => ({
      values: (values: Record<string, unknown>) => {
        state.insertValues.push(values);
        return {
          returning: () => [{ id: "new-task", ...values }],
        };
      },
    }),
  };

  return { ...actual, getDb: () => fakeDb };
});

const { createApp } = await import("../app.js");
const { signToken } = await import("../auth/token.js");

const app = createApp({
  corsOrigins: ["http://localhost:3000"],
  jwtSecret: TEST_SECRET,
  cookieSecure: false,
});

const token = signToken({ sub: MY_ID, role: "user", tv: 0 }, TEST_SECRET);
const cookie = `goal_session=${token}`;

beforeEach(() => {
  state.user = {
    id: MY_ID,
    name: "Tester",
    email: "tester@example.com",
    phone: null,
    role: "user",
    level: 1,
    xp: 0,
    streak: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    tokenVersion: 0,
  };
  state.insertValues = [];
  state.selectResults = [[], []];
});

describe("GET /api/tasks/today", () => {
  it("нэвтрээгүй бол 401", async () => {
    const res = await request(app).get("/api/tasks/today");

    expect(res.status).toBe(401);
  });

  it("өнөөдөр, хоцорсон хоёр жагсаалтыг буцаана", async () => {
    const res = await request(app).get("/api/tasks/today").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.today)).toBe(true);
    expect(Array.isArray(res.body.overdue)).toBe(true);
  });

  /**
   * Хариунд өдөр нь бичигдэнэ.
   *
   * Дэлгэц дээр "өнөөдөр" гэдгийг дахин тооцоолохгүй, серверийн
   * хэлснийг хэрэглэнэ — ингэснээр хоёр тал ижил өдөр харна.
   */
  it("аль өдрийн жагсаалт болохыг хэлнэ", async () => {
    const res = await request(app).get("/api/tasks/today").set("Cookie", cookie);

    expect(res.body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("хоёр жагсаалтыг тусад нь буцаана", async () => {
    state.selectResults = [
      [{ id: "a", title: "Өнөөдрийн", completed: false }],
      [{ id: "b", title: "Хоцорсон", completed: false }],
    ];

    const res = await request(app).get("/api/tasks/today").set("Cookie", cookie);

    expect(res.body.today).toHaveLength(1);
    expect(res.body.today[0].title).toBe("Өнөөдрийн");
    expect(res.body.overdue).toHaveLength(1);
    expect(res.body.overdue[0].title).toBe("Хоцорсон");
  });
});

describe("POST /api/tasks", () => {
  it("нэвтрээгүй бол 401, бичихгүй", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Дасгал хийх" });

    expect(res.status).toBe(401);
    expect(state.insertValues).toHaveLength(0);
  });

  it("даалгавар үүсгэнэ", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Cookie", cookie)
      .send({ title: "Дасгал хийх", dueDate: "2026-11-20" });

    expect(res.status).toBe(201);
    expect(state.insertValues).toHaveLength(1);
    expect(state.insertValues[0]?.title).toBe("Дасгал хийх");
  });

  /**
   * ХАМГИЙН ЧУХАЛ ТЕСТ.
   *
   * `userId` нь СЕССНЭЭС ирнэ. Хүсэлтээс авбал хэн ч өөр хүний нэр
   * дээр даалгавар үүсгэх байв.
   */
  it("userId нь сесснээс ирнэ, хүсэлтээс биш", async () => {
    await request(app)
      .post("/api/tasks")
      .set("Cookie", cookie)
      .send({ title: "Дасгал хийх", userId: OTHER_ID });

    expect(state.insertValues[0]?.userId).toBe(MY_ID);
  });

  /**
   * `completed`, `xpReward` нь ӨС рүү ОГТ хүрэхгүй.
   *
   * Хүрвэл хэрэглэгч шууд "биелсэн" даалгавар үүсгэж, өөртөө дурын
   * XP тогтоох боломжтой болно — #10 (XP) хэрэгжсэн даруйд тэр нь
   * тоглоомын тэнцвэрийг бүтнээр эвдэнэ.
   */
  it("completed, xpReward, goalId, id нь .values()-д орохгүй", async () => {
    await request(app).post("/api/tasks").set("Cookie", cookie).send({
      title: "Дасгал хийх",
      completed: true,
      xpReward: 100000,
      goalId: "өөр-хүний-зорилго",
      id: "00000000-0000-0000-0000-000000000000",
      createdAt: "2020-01-01T00:00:00.000Z",
    });

    expect(Object.keys(state.insertValues[0] ?? {}).sort()).toEqual([
      "description",
      "dueDate",
      "title",
      "userId",
    ]);
  });

  it("өдрийг Улаанбаатарын шөнө дунд болгож бичнэ", async () => {
    await request(app)
      .post("/api/tasks")
      .set("Cookie", cookie)
      .send({ title: "Дасгал хийх", dueDate: "2026-11-20" });

    const due = state.insertValues[0]?.dueDate as Date;
    expect(due).toBeInstanceOf(Date);
    expect(due.toISOString()).toBe("2026-11-19T16:00:00.000Z");
  });

  it("буруу оролт бол 400, бичихгүй", async () => {
    for (const body of [
      { title: "   " },
      { title: "Дасгал хийх", dueDate: "маргааш" },
      { title: "Дасгал хийх", dueDate: "2027-02-30" },
      { title: "Дасгал хийх", description: 42 },
    ]) {
      state.insertValues = [];

      const res = await request(app)
        .post("/api/tasks")
        .set("Cookie", cookie)
        .send(body);

      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(state.insertValues, JSON.stringify(body)).toHaveLength(0);
    }
  });
});
