import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { signToken } from "./auth/token.js";

/** Тестэд зориулсан түлхүүр. Жинхэнэ нууц утга БИШ. */
const TEST_SECRET = "test-only-secret-at-least-32-characters-long";

const app = createApp({
  corsOrigins: ["http://localhost:3000"],
  jwtSecret: TEST_SECRET,
  cookieSecure: false,
});

describe("GET /health", () => {
  // ӨС-гүйгээр ажиллах ёстой. Энэ тест яг түүнийг баталгаажуулна:
  // DATABASE_URL тохируулаагүй орчинд ажиллаж байна.
  it("ӨС-гүйгээр ч 200 буцаана", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("ажилласан хугацааг буцаана", async () => {
    const res = await request(app).get("/health");

    expect(typeof res.body.uptimeSeconds).toBe("number");
    expect(res.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});

describe("Байхгүй зам", () => {
  it("JSON хэлбэрээр 404 буцаана", async () => {
    const res = await request(app).get("/ийм-зам-байхгүй");

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("олдсонгүй");
  });
});

describe("CORS", () => {
  it("зөвшөөрөгдсөн эх үүсвэрт толгой нэмнэ", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "http://localhost:3000");

    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );
  });

  it("зөвшөөрөөгүй эх үүсвэрт толгой нэмэхгүй", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "http://evil.example.com");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("POST /api/auth/signup — шалгалт", () => {
  // Эдгээр нь бүгд шалгалтын шатанд таслагддаг тул ӨС рүү хүрэхгүй.
  const VALID = {
    name: "Эрдэнэбаяр",
    contact: "erka@example.com",
    password: "nuuts-ug-2026",
  };

  it("хоосон бие илгээвэл 400", async () => {
    const res = await request(app).post("/api/auth/signup").send({});

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errors).sort()).toEqual([
      "contact",
      "name",
      "password",
    ]);
  });

  it("нэргүй бол 400", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...VALID, name: "" });

    expect(res.status).toBe(400);
    expect(res.body.errors.name).toBe("Нэрээ оруулна уу");
  });

  it("буруу и-мэйл бол 400", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...VALID, contact: "abc@@example.com" });

    expect(res.status).toBe(400);
    expect(res.body.errors.contact).toContain("буруу байна");
  });

  it("буруу утасны дугаар бол 400", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...VALID, contact: "12345678" });

    expect(res.status).toBe(400);
    expect(res.body.errors.contact).toContain("буруу байна");
  });

  it("богино нууц үг бол 400", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...VALID, password: "1234" });

    expect(res.status).toBe(400);
    expect(res.body.errors.password).toContain("дор хаяж 8");
  });

  it("тоон төрөлтэй утгыг хүлээж авахгүй", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ name: 123, contact: 456, password: 789 });

    expect(res.status).toBe(400);
  });

  // Эрхийг хүсэлтээр тогтоох боломжгүй байх ёстой. Энд ӨС байхгүй тул
  // 201 хүртэл хүрэхгүй — гэхдээ шалгалт нь `role`-ийг огт мэддэггүй
  // учраас түүнээс болж 400 гарах ёсгүй. Өөрөөр хэлбэл илүүдэл талбарыг
  // чимээгүй үл тоомсорлоно.
  it("хүсэлт доторх role талбарыг шалгалт үл тоомсорлоно", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...VALID, role: "admin" });

    // Шалгалтаас унаагүй (400 биш) — оролт зөв гэж тооцогдсон.
    expect(res.status).not.toBe(400);
    expect(JSON.stringify(res.body)).not.toContain("admin");
  });

  // Алдааны хариуд нууц үг эргэж гарч болохгүй — лог, алдаа мэдээлэх
  // систем рүү тэр чигээрээ орох эрсдэлтэй.
  it("нууц үгийг хариуд эргүүлж өгөхгүй", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...VALID, name: "" });

    expect(JSON.stringify(res.body)).not.toContain(VALID.password);
  });
});

describe("Хамгаалалттай зам — /api/users/me", () => {
  // Эдгээр нь бүгд ӨС рүү хүрэхээс ӨМНӨ таслагддаг: cookie байхгүй,
  // эсвэл token нь гарын үсгийн шалгалтаас унана.

  it("cookie-гүй бол 401", async () => {
    const res = await request(app).get("/api/users/me");

    expect(res.status).toBe(401);
  });

  it("хог cookie-той бол 401", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Cookie", "goal_session=this-is-not-a-token");

    expect(res.status).toBe(401);
  });

  // Өөр түлхүүрээр гаргасан token нь гарын үсгийн шалгалтаас унана.
  // Энэ нь "өөрөө token зохиож админ болох" оролдлогыг барина.
  it("өөр түлхүүрээр зохиосон token-ыг хүлээж авахгүй", async () => {
    const forged = signToken(
      { sub: "11111111-2222-3333-4444-555555555555", role: "admin", tv: 0 },
      "attacker-own-secret-at-least-32-characters",
    );

    const res = await request(app)
      .get("/api/users/me")
      .set("Cookie", `goal_session=${forged}`);

    expect(res.status).toBe(401);
  });

  it("засах хүсэлт ч нэвтрэхийг шаардана", async () => {
    const res = await request(app).put("/api/users/me").send({ name: "Шинэ" });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/login — шалгалт", () => {
  it("хоосон бие илгээвэл 400", async () => {
    const res = await request(app).post("/api/auth/login").send({});

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errors).sort()).toEqual(["contact", "password"]);
  });

  it("буруу хэлбэрийн хаягт 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ contact: "зүгээр нэг мөр", password: "nuuts-ug-2026" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/logout", () => {
  it("нэвтрээгүй байсан ч 204 буцаана", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(204);
  });

  it("cookie-г устгах заавар илгээнэ", async () => {
    const res = await request(app).post("/api/auth/logout");
    const cookies = res.headers["set-cookie"] ?? [];

    expect(String(cookies)).toContain("goal_session=;");
  });
});

describe("/api/goals — нэвтрэхийг шаардана", () => {
  // ӨС рүү хүрэхээс өмнө таслагдана: cookie байхгүй.
  it("cookie-гүй бол жагсаалт 401", async () => {
    const res = await request(app).get("/api/goals");

    expect(res.status).toBe(401);
  });

  it("cookie-гүй бол үүсгэх 401", async () => {
    const res = await request(app)
      .post("/api/goals")
      .send({ title: "Марафон гүйх" });

    expect(res.status).toBe(401);
  });

  it("өөр түлхүүрээр зохиосон token-оор орж болохгүй", async () => {
    const forged = signToken(
      { sub: "11111111-2222-3333-4444-555555555555", role: "user", tv: 0 },
      "attacker-own-secret-at-least-32-characters",
    );

    const res = await request(app)
      .get("/api/goals")
      .set("Cookie", `goal_session=${forged}`);

    expect(res.status).toBe(401);
  });
});
