import { NextResponse, type NextRequest } from "next/server";

/**
 * Хамгаалалттай замууд.
 *
 * (Next.js 16-д энэ файлын нэр `middleware.ts`-ээс `proxy.ts` болж өөрчлөгдсөн.)
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ЭНЭ НЬ ХАМГААЛАЛТЫН ЭХНИЙ ДАВХАРГА, ГАНЦ НЬ БИШ.
 *
 * Энд зөвхөн cookie БАЙГАА ЭСЭХИЙГ шалгана — доторх token зөв эсэхийг
 * НЭЭЖ ҮЗЭХГҮЙ. Яагаад гэвэл түүнийг шалгах нууц түлхүүр нь зөвхөн
 * backend дээр байх ёстой.
 *
 * Өөрөөр хэлбэл хэн ч `goal_session=хог` гэсэн cookie гараараа бичээд
 * энэ шалгалтыг давж чадна. Гэхдээ цааш юу ч олохгүй:
 *
 *   - Хуудасны өгөгдөл бүр backend-ээс ирнэ, тэнд token шалгагдана
 *   - /admin хуудас сервер дээрээ эрхийг дахин шалгадаг
 *
 * Энэ давхаргын ажил нь аюулгүй байдал биш, ТОХЬ: нэвтрээгүй хүнийг
 * хоосон хуудас руу оруулалгүй шууд нэвтрэх хуудас руу илгээх.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
const SESSION_COOKIE = "goal_session";

export function proxy(request: NextRequest): NextResponse {
  const token = request.cookies.get(SESSION_COOKIE);

  if (token === undefined || token.value.length === 0) {
    const login = new URL("/login", request.url);

    // Нэвтэрсний дараа очих гэж байсан хуудас руугаа буцаана.
    login.searchParams.set("next", request.nextUrl.pathname);

    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/admin/:path*"],
};
