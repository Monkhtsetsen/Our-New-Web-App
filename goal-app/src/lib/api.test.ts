import { afterEach, describe, expect, it, vi } from "vitest";
import { checkHealth, getMe, login, logout, register, updateProfile } from "./api";

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

describe("register — амжилттай", () => {
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

    const result = await register(INPUT);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.user.email).toBe("erka@example.com");
      // Шинэ бүртгэл энгийн хэрэглэгч эрхтэй байх ёстой.
      expect(result.data.user.role).toBe("user");
    }
  });

  it("зөв зам руу JSON илгээнэ", async () => {
    const fn = mockFetch(() => jsonResponse(201, { user: {} }));

    await register(INPUT);

    const [call] = fn.mock.calls;
    if (call === undefined) throw new Error("fetch огт дуудагдаагүй");

    const [url, init] = call;
    expect(String(url)).toContain("/api/auth/register");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual(INPUT);
  });
});

describe("register — алдаа", () => {
  it("талбарын алдааг дамжуулна", async () => {
    mockFetch(() =>
      jsonResponse(400, { errors: { contact: "И-мэйл хаяг буруу байна" } }),
    );

    const result = await register({ ...INPUT, contact: "abc" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.contact).toBe("И-мэйл хаяг буруу байна");
    }
  });

  it("давхардсан бүртгэлийг (409) талбарын алдаа болгоно", async () => {
    mockFetch(() =>
      jsonResponse(409, { errors: { contact: "Энэ и-мэйл бүртгэлтэй байна" } }),
    );

    const result = await register(INPUT);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.contact).toContain("бүртгэлтэй");
    }
  });

  // Backend унтарсан, эсвэл CORS хориглосон тохиолдол. Хэрэглэгчид
  // техникийн дэлгэрэнгүй биш, юу хийхийг нь хэлнэ.
  it("сүлжээний алдааг ойлгомжтой мессеж болгоно", async () => {
    mockFetch(() => Promise.reject(new TypeError("Failed to fetch")));

    const result = await register(INPUT);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("холбогдож чадсангүй");
    }
  });

  it("JSON биш хариу ирвэл ч унахгүй", async () => {
    mockFetch(() => new Response("<html>502</html>", { status: 502 }));

    const result = await register(INPUT);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBeTruthy();
    }
  });

  it("серверийн 500 алдааг мессеж болгоно", async () => {
    mockFetch(() => jsonResponse(500, { error: "дотоод алдаа" }));

    const result = await register(INPUT);

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

describe("cookie дамжуулалт", () => {
  /**
   * ЭНЭ ТЕСТ НЬ БҮХ СЕССИЙГ БАРЬЖ БАЙНА.
   *
   * `credentials: "include"` байхгүй бол хөтөч өөр порт руу (3000 → 4000)
   * cookie илгээхгүй. Нэвтрэх нь амжилттай харагдах боловч дараагийн
   * хүсэлт болгонд 401 ирнэ — шалтгааныг нь олоход маш төвөгтэй алдаа.
   */
  it("хүсэлт бүр cookie-г хамт илгээнэ", async () => {
    const fn = mockFetch(() => jsonResponse(200, { user: {} }));

    await login({ contact: "erka@example.com", password: "nuuts-ug-2026" });
    await getMe();
    await updateProfile({ name: "Шинэ нэр" });
    await logout();

    expect(fn.mock.calls.length).toBe(4);
    for (const [, init] of fn.mock.calls) {
      expect(init?.credentials).toBe("include");
    }
  });
});

describe("login", () => {
  it("амжилттай бол хэрэглэгчийг буцаана", async () => {
    mockFetch(() => jsonResponse(200, { user: { id: "1", role: "user" } }));

    const result = await login({ contact: "erka@example.com", password: "x" });

    expect(result.ok).toBe(true);
  });

  it("зөв зам, арга ашиглана", async () => {
    const fn = mockFetch(() => jsonResponse(200, { user: {} }));

    await login({ contact: "erka@example.com", password: "x" });

    const [call] = fn.mock.calls;
    if (call === undefined) throw new Error("fetch огт дуудагдаагүй");

    const [url, init] = call;
    expect(String(url)).toContain("/api/auth/login");
    expect(init?.method).toBe("POST");
  });

  // Backend нь "хаяг буруу" ба "нууц үг буруу" хоёрыг ялгадаггүй.
  // Frontend ч гэсэн ялгаж харуулах ёсгүй.
  it("401-ийг мессеж болгон дамжуулна", async () => {
    mockFetch(() =>
      jsonResponse(401, { error: "И-мэйл/утас эсвэл нууц үг буруу байна" }),
    );

    const result = await login({ contact: "erka@example.com", password: "x" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
      expect(result.message).toContain("буруу байна");
    }
  });

  it("хүсэлтийн хязгаарын мессежийг дамжуулна", async () => {
    mockFetch(() => jsonResponse(429, { error: "Хэт олон удаа оролдлоо." }));

    const result = await login({ contact: "erka@example.com", password: "x" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(429);
      expect(result.message).toContain("Хэт олон");
    }
  });
});

describe("getMe", () => {
  it("нэвтрээгүй бол 401 төлөв буцаана", async () => {
    mockFetch(() => jsonResponse(401, { error: "Нэвтэрнэ үү" }));

    const result = await getMe();

    expect(result.ok).toBe(false);
    // Профайлын хуудас энэ тоогоор "нэвтрэх хуудас руу шидэх үү"
    // гэдгийг шийддэг.
    if (!result.ok) expect(result.status).toBe(401);
  });

  it("сүлжээний алдаанд status нь 0", async () => {
    mockFetch(() => Promise.reject(new TypeError("Failed to fetch")));

    const result = await getMe();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(0);
  });
});

describe("updateProfile", () => {
  it("PUT аргаар, зөвхөн илгээсэн талбарыг явуулна", async () => {
    const fn = mockFetch(() => jsonResponse(200, { user: {} }));

    await updateProfile({ name: "Шинэ нэр" });

    const [call] = fn.mock.calls;
    if (call === undefined) throw new Error("fetch огт дуудагдаагүй");

    const [url, init] = call;
    expect(String(url)).toContain("/api/users/me");
    expect(init?.method).toBe("PUT");
    expect(JSON.parse(String(init?.body))).toEqual({ name: "Шинэ нэр" });
  });

  it("талбарын алдааг дамжуулна", async () => {
    mockFetch(() =>
      jsonResponse(401, { errors: { currentPassword: "Одоогийн нууц үг буруу байна" } }),
    );

    const result = await updateProfile({ newPassword: "shine-nuuts-ug" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.currentPassword).toContain("буруу");
    }
  });
});

describe("logout", () => {
  it("биегүй 204 хариуг амжилттай гэж үзнэ", async () => {
    mockFetch(() => new Response(null, { status: 204 }));

    const result = await logout();

    expect(result.ok).toBe(true);
  });
});
