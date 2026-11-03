import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

const app = createApp({ corsOrigins: ["http://localhost:3000"] });

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

  // Алдааны хариуд нууц үг эргэж гарч болохгүй — лог, алдаа мэдээлэх
  // систем рүү тэр чигээрээ орох эрсдэлтэй.
  it("нууц үгийг хариуд эргүүлж өгөхгүй", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...VALID, name: "" });

    expect(JSON.stringify(res.body)).not.toContain(VALID.password);
  });
});
