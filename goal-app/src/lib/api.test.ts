import { afterEach, describe, expect, it, vi } from "vitest";
import { checkHealth, signup } from "./api";

/** fetch-ийг орлуулж, backend-ийн янз бүрийн хариуг дуурайлгана. */
function mockFetch(
  impl: (...args: Parameters<typeof fetch>) => Promise<Response> | Response,
) {
  const fn = vi.fn(impl);
  vi.stubGlobal("fetch", fn);
  return fn;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const INPUT = {
  name: "Эрдэнэбаяр",
  contact: "erka@example.com",
  password: "nuuts-ug-2026",
};

describe("signup — амжилттай", () => {
  it("хэрэглэгчийг буцаана", async () => {
    mockFetch(() =>
      jsonResponse(201, {
        user: {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Эрдэнэбаяр",
          email: "erka@example.com",
          phone: null,
          role: "user",
          createdAt: "2026-11-03T00:00:00.000Z",
        },
      }),
    );

    const result = await signup(INPUT);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.user.email).toBe("erka@example.com");
      // Шинэ бүртгэл энгийн хэрэглэгч эрхтэй байх ёстой.
      expect(result.data.user.role).toBe("user");
    }
  });

  it("зөв зам руу JSON илгээнэ", async () => {
    const fn = mockFetch(() => jsonResponse(201, { user: {} }));

    await signup(INPUT);

    const [call] = fn.mock.calls;
    if (call === undefined) throw new Error("fetch огт дуудагдаагүй");

    const [url, init] = call;
    expect(String(url)).toContain("/api/auth/signup");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual(INPUT);
  });
});

describe("signup — алдаа", () => {
  it("талбарын алдааг дамжуулна", async () => {
    mockFetch(() =>
      jsonResponse(400, { errors: { contact: "И-мэйл хаяг буруу байна" } }),
    );

    const result = await signup({ ...INPUT, contact: "abc" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.contact).toBe("И-мэйл хаяг буруу байна");
    }
  });

  it("давхардсан бүртгэлийг (409) талбарын алдаа болгоно", async () => {
    mockFetch(() =>
      jsonResponse(409, { errors: { contact: "Энэ и-мэйл бүртгэлтэй байна" } }),
    );

    const result = await signup(INPUT);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.contact).toContain("бүртгэлтэй");
    }
  });

  // Backend унтарсан, эсвэл CORS хориглосон тохиолдол. Хэрэглэгчид
  // техникийн дэлгэрэнгүй биш, юу хийхийг нь хэлнэ.
  it("сүлжээний алдааг ойлгомжтой мессеж болгоно", async () => {
    mockFetch(() => Promise.reject(new TypeError("Failed to fetch")));

    const result = await signup(INPUT);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("холбогдож чадсангүй");
    }
  });

  it("JSON биш хариу ирвэл ч унахгүй", async () => {
    mockFetch(() => new Response("<html>502</html>", { status: 502 }));

    const result = await signup(INPUT);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBeTruthy();
    }
  });

  it("серверийн 500 алдааг мессеж болгоно", async () => {
    mockFetch(() => jsonResponse(500, { error: "дотоод алдаа" }));

    const result = await signup(INPUT);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors).toBeUndefined();
      expect(result.message).toBeTruthy();
    }
  });
});

describe("checkHealth", () => {
  it("backend амьд бол true", async () => {
    mockFetch(() => jsonResponse(200, { status: "ok" }));

    expect(await checkHealth()).toBe(true);
  });

  it("backend хариу өгөхгүй бол false", async () => {
    mockFetch(() => Promise.reject(new TypeError("Failed to fetch")));

    expect(await checkHealth()).toBe(false);
  });

  it("backend алдаа буцаавал false", async () => {
    mockFetch(() => jsonResponse(503, {}));

    expect(await checkHealth()).toBe(false);
  });
});
