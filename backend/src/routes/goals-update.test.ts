import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

/**
 * `PUT /api/goals/:id`-ийн ЭРХИЙН шийдвэрийн тест.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ЯАГААД ӨС-ИЙГ MOCK ХИЙВ
 *
 * Засах зам нь `id`-г ХҮСЭЛТЭЭС авдаг — үүсгэх, жагсаахаас тэс өөр.
 * Эзэмшигчийг шалгахаа мартвал хэн ч бусдын зорилгыг дурын утгаар
 * бичих боломжтой болно. Энэ нь кодын хамгийн эмзэг хэсэг тул
 * жинхэнэ ӨС байхгүй орчинд ч шалгагдах ёстой.
 *
 * Mock нь query бүтээгчийн ХЭЛБЭРИЙГ дүүрнэ — SQL-ийг гүйцэтгэхгүй.
 * Иймээс эндээс "SQL зөв бичигдсэн эсэх" гарахгүй; тэр нь CI-ийн
 * docker ажилд жинхэнэ PostgreSQL дээр шалгагдана. Энд шалгагдах
 * зүйл нь ШИЙДВЭР: хэнд 403, хэнд 404, хэзээ БИЧИХГҮЙ.
 *
 * Хамгийн чухал батлалт нь `updateCalls` ХООСОН байх — өөрөөр хэлбэл
 * эрхгүй хүсэлт дээр ӨС рүү бичих оролдлого ОГТ гарахгүй байх.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const MY_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_ID = "22222222-2222-2222-2222-222222222222";
const GOAL_ID = "33333333-3333-3333-3333-333333333333";

/** Тестэд зориулсан түлхүүр. Жинхэнэ нууц утга БИШ. */
const TEST_SECRET = "test-only-secret-at-least-32-characters-long";

const state = vi.hoisted(() => ({
  /** `requireAuth`-ийн ӨС-ээс унших хэрэглэгч. */
  user: null as Record<string, unknown> | null,

  /** Засах гэж байгаа зорилгын эзэмшигч. `undefined` = зорилго байхгүй. */
  owner: undefined as { userId: string } | undefined,

  /** `.set()`-д дамжсан утгууд. Хоосон байх нь "бичээгүй" гэсэн утга. */
  updateCalls: [] as Record<string, unknown>[],

  /** UPDATE-ийн буцаах мөрүүд. Хоосон = мөр олдсонгүй. */
  updateResult: [] as unknown[],
}));

vi.mock("../db/index.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../db/index.js")>();

  /**
   * Query бүтээгчийн хуурамч хувилбар.
   *
   * Хоёр өөр `select` ирнэ: `requireAuth`-ийн хэрэглэгч, route-ийн
   * эзэмшигч. Сонгосон баганаар нь ялгана — `tokenVersion` нь
   * зөвхөн хэрэглэгчийн уншилтад байдаг.
   */
  const fakeDb = {
    select: (columns: Record<string, unknown>) => ({
      from: () => ({
        where: () => ({
          limit: () => {
            if ("tokenVersion" in columns) {
              return state.user === null ? [] : [state.user];
            }
            return state.owner === undefined ? [] : [state.owner];
          },
        }),
      }),
    }),

    update: () => ({
      set: (patch: Record<string, unknown>) => {
        state.updateCalls.push(patch);
        return {
          where: () => ({ returning: () => state.updateResult }),
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

/** Засагдсаны дараа буцах мөрийн жишээ. */
const updatedRow = {
  id: GOAL_ID,
  title: "Шинэ нэр",
  description: null,
  category: "personal",
  deadline: null,
  status: "in_progress",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-11-18T00:00:00.000Z"),
};

function put(id: string, body: unknown, withCookie = true) {
  const req = request(app).put(`/api/goals/${id}`);
  if (withCookie) req.set("Cookie", cookie);
  return req.send(body as object);
}

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
  state.owner = { userId: MY_ID };
  state.updateCalls = [];
  state.updateResult = [updatedRow];
});

describe("PUT /api/goals/:id — эрх", () => {
  it("нэвтрээгүй бол 401, бичихгүй", async () => {
    const res = await put(GOAL_ID, { title: "Шинэ нэр" }, false);

    expect(res.status).toBe(401);
    expect(state.updateCalls).toHaveLength(0);
  });

  /**
   * ХАМГИЙН ЧУХАЛ ТЕСТ.
   *
   * Өөр хүний зорилгыг засах оролдлого нь 403 буцаахаас гадна ӨС рүү
   * БИЧИХ ОРОЛДЛОГО ОГТ ГАРГАХГҮЙ байх ёстой. Зөвхөн статусыг
   * шалгавал "бичсэний дараа 403 буцаах" гэсэн эвдэрсэн хувилбар
   * тестийг давах байв.
   */
  it("өөр хүний зорилго бол 403, бичихгүй", async () => {
    state.owner = { userId: OTHER_ID };

    const res = await put(GOAL_ID, { title: "Залилсан нэр", status: "abandoned" });

    expect(res.status).toBe(403);
    expect(state.updateCalls).toHaveLength(0);
  });

  it("зорилго байхгүй бол 404, бичихгүй", async () => {
    state.owner = undefined;

    const res = await put(GOAL_ID, { title: "Шинэ нэр" });

    expect(res.status).toBe(404);
    expect(state.updateCalls).toHaveLength(0);
  });

  /**
   * UUID биш id нь ӨС-д ХҮРЭХГҮЙ.
   *
   * Postgres-ийн `uuid` төрөлд хөрвөхгүй мөрийг дамжуулбал query нь
   * шидэж 500 болно. Байхгүй зорилгыг асуусан хүнд 500 буцаах нь
   * зөв биш — 404 л зөв.
   */
  it("UUID биш id бол 404, бичихгүй", async () => {
    for (const bad of ["мөр-биш", "123", "", "11111111-1111-1111-1111"]) {
      state.updateCalls = [];

      const res = await put(bad, { title: "Шинэ нэр" });

      expect(res.status, bad).toBe(404);
      expect(state.updateCalls, bad).toHaveLength(0);
    }
  });

  /**
   * Уншилт ба бичилтийн хооронд зорилго уствал (TOCTOU) 404.
   *
   * UPDATE нь `userId`-гаар мөн хязгаарлагддаг тул эзэмшигч
   * өөрчлөгдсөн тохиолдолд ч мөр буцахгүй — энэ нь эрхийн эцсийн
   * хамгаалалт.
   */
  it("UPDATE мөр буцаахгүй бол 404", async () => {
    state.updateResult = [];

    const res = await put(GOAL_ID, { title: "Шинэ нэр" });

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/goals/:id — засвар", () => {
  it("эзэмшигч засаж чадна", async () => {
    const res = await put(GOAL_ID, { title: "Шинэ нэр" });

    expect(res.status).toBe(200);
    expect(res.body.goal.title).toBe("Шинэ нэр");
    expect(state.updateCalls).toHaveLength(1);
  });

  /**
   * `updatedAt`-ыг ГАРААР тавих ёстой.
   *
   * Schema дээр `defaultNow()` байгаа ч тэр нь ЗӨВХӨН INSERT-д
   * ажиллана. Мартвал засвар хийсэн ч "хэзээ засагдсан" нь үүсгэсэн
   * цаг хэвээр хоцорно — issue-ийн шалгуурыг зөрчинө.
   */
  it("updatedAt-ыг үргэлж шинэчилнэ", async () => {
    const before = Date.now();
    await put(GOAL_ID, { title: "Шинэ нэр" });

    const patch = state.updateCalls[0];
    expect(patch).toBeDefined();
    expect(patch?.updatedAt).toBeInstanceOf(Date);
    expect((patch?.updatedAt as Date).getTime()).toBeGreaterThanOrEqual(before);
  });

  /**
   * Хүсэлтээс авч болохгүй талбарууд ӨС рүү ОРОХГҮЙ.
   *
   * `userId` орвол хэрэглэгч зорилгоо өөр хүн рүү шилжүүлэх,
   * `createdAt` орвол үүсгэсэн цагаа хуурах боломжтой болно.
   */
  it("userId, id, createdAt нь .set()-д орохгүй", async () => {
    await put(GOAL_ID, {
      title: "Шинэ нэр",
      userId: OTHER_ID,
      id: "00000000-0000-0000-0000-000000000000",
      createdAt: "2020-01-01T00:00:00.000Z",
    });

    const patch = state.updateCalls[0] ?? {};
    expect(Object.keys(patch).sort()).toEqual(["title", "updatedAt"]);
  });

  it("зөвхөн заасан талбар .set()-д орно", async () => {
    await put(GOAL_ID, { status: "completed" });

    const patch = state.updateCalls[0] ?? {};
    expect(Object.keys(patch).sort()).toEqual(["status", "updatedAt"]);
  });

  it("тайлбар, хугацааг null болгож авч хаяна", async () => {
    await put(GOAL_ID, { description: "", deadline: null });

    const patch = state.updateCalls[0] ?? {};
    expect(patch.description).toBeNull();
    expect(patch.deadline).toBeNull();
  });
});

describe("PUT /api/goals/:id — буруу хүсэлт", () => {
  it("хоосон хүсэлт бол 400, бичихгүй", async () => {
    const res = await put(GOAL_ID, {});

    expect(res.status).toBe(400);
    expect(state.updateCalls).toHaveLength(0);
  });

  it("буруу талбар бол 400, бичихгүй", async () => {
    for (const body of [
      { title: "   " },
      { status: "done" },
      { category: "work" },
      { deadline: "2020-01-01" },
      { description: 42 },
    ]) {
      state.updateCalls = [];

      const res = await put(GOAL_ID, body);

      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(state.updateCalls, JSON.stringify(body)).toHaveLength(0);
    }
  });

  /**
   * Нэг талбар буруу бол НЭГ Ч талбар бичигдэхгүй.
   *
   * Хагас хадгалах нь хамгийн дор хувилбар: хэрэглэгч алдаа харсан
   * ч өгөгдөл нь хэсэгчлэн өөрчлөгдсөн байна.
   */
  it("зөв, буруу талбар хольсон бол юу ч бичихгүй", async () => {
    const res = await put(GOAL_ID, { title: "Зөв нэр", status: "done" });

    expect(res.status).toBe(400);
    expect(res.body.errors.status).toBeDefined();
    expect(state.updateCalls).toHaveLength(0);
  });
});
