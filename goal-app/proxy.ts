import { NextResponse, type NextRequest } from "next/server";

/**
 * Хамгаалалттай замууд.
 *
 * (Next.js 16-д энэ файлын нэр `middleware.ts`-ээс `proxy.ts` болсон.)
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ЯАГААД ШАЛГАЛТ ЭНД БАЙНА
 *
 * Хуудас дотроо шалгаж бас болно — гэхдээ энэ төсөл `cacheComponents`
 * горимд ажилладаг. Тэр горимд хуудасны тогтмол хэсэг эхлээд явж,
 * динамик хэсэг нь дараа нь урсгалаар нэмэгддэг. Өөрөөр хэлбэл HTTP
 * статус аль хэдийн 200 гэж явчихсан байх тул хуудас дотроос 404
 * буцаах оройтсон байдаг.
 *
 * Proxy нь хуудас зурагдахаас ӨМНӨ ажилладаг тул жинхэнэ 404, 307
 * буцааж чадна.
 *
 * Хуудас дээрх шалгалтыг ҮҮНИЙГЭЭР ОРЛУУЛААГҮЙ — хоёулаа байна.
 * `app/admin/page.tsx` нь backend-ээс эрхийг дахин асууна. Нэг
 * давхаргад алдаа гарахад нөгөө нь барина.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
const SESSION_COOKIE = "goal_session";

/**
 * Next.js-ийн сервер дотроос backend руу хандах хаяг.
 *
 * Docker дээр "localhost" нь өөрийнх нь контейнерийг заах тул
 * сүлжээн дэх нэрээр нь (`backend`) дуудна.
 */
const INTERNAL_API_URL =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

type SessionUser = { role: "admin" | "user" };

async function fetchSession(token: string): Promise<SessionUser | null> {
  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/users/me`, {
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const body: unknown = await res.json();
    if (typeof body !== "object" || body === null || !("user" in body)) {
      return null;
    }

    return (body as { user: SessionUser }).user;
  } catch {
    // Backend унтраа бол "нэвтрээгүй" гэж үзнэ. Эргэлзээтэй үед
    // хамгаалалттай хуудсыг НЭЭХГҮЙ байх нь зөв тал руугаа алдаж буй хэрэг.
    return null;
  }
}

function toLogin(request: NextRequest): NextResponse {
  const login = new URL("/login", request.url);

  // Нэвтэрсний дараа очих гэж байсан хуудас руугаа буцаана.
  login.searchParams.set("next", request.nextUrl.pathname);

  return NextResponse.redirect(login);
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE);

  if (token === undefined || token.value.length === 0) {
    return toLogin(request);
  }

  // Token-ыг энд ЗАДАЛЖ УНШИХГҮЙ: гарын үсгийг шалгах нууц түлхүүр нь
  // зөвхөн backend дээр байх ёстой. Үүний оронд backend-ээс асууна —
  // ингэснээр эрх нь үргэлж одоогийн утгаар шалгагдана.
  const user = await fetchSession(token.value);

  if (user === null) {
    const response = toLogin(request);

    // Хүчингүй cookie-г устгана. Үгүй бол хүсэлт болгон дээр backend
    // руу дэмий нэг дуудлага явсаар байна.
    response.cookies.delete(SESSION_COOKIE);

    return response;
  }

  if (request.nextUrl.pathname.startsWith("/admin") && user.role !== "admin") {
    // Байхгүй зам руу шилжүүлснээр Next.js өөрийн 404 хуудсыг ЖИНХЭНЭ
    // 404 статустайгаар буцаана.
    //
    // Доогуур зураасаар эхэлсэн нэр сонгосон нь санаатай: App Router-т
    // ийм хавтас нь зам БОЛОХГҮЙ. Иймээс хэн нэгэн хожим санамсаргүйгээр
    // энэ хаяг дээр хуудас үүсгэж, шалгалтыг цоолох аргагүй.
    //
    // 403 биш 404 байгаа нь бас санаатай: 403 нь "энд ямар нэг зүйл
    // байна, чамд эрх алга" гэж хэлж өгдөг.
    return NextResponse.rewrite(new URL("/_forbidden", request.url));
  }

  return NextResponse.next();
}

// Proxy нь үргэлж Node.js орчинд ажилладаг (хуучин middleware шиг
// Edge орчинд биш). Тиймээс `process.env`-ийг ажиллах үедээ уншина —
// BACKEND_INTERNAL_URL-ийг контейнер асах үед өгч болно.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/goals/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
