import type { CookieOptions, Response } from "express";
import { TOKEN_TTL_SECONDS } from "./token.js";

/**
 * Сессийн token-ыг хөтөч рүү хэрхэн дамжуулах.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ЯАГААД localStorage БИШ, COOKIE ВЭ
 *
 * Жишээ заавруудад token-ыг `localStorage`-д хадгалж, `Authorization`
 * толгойгоор илгээхийг зөвлөдөг. Хийхэд амархан ч нэг ноцтой нүхтэй:
 * localStorage-ийг JavaScript уншиж чадна. Сайт дээр нэг ч XSS гарвал
 * (гуравдагч этгээдийн script, зар, npm багцын халдлага) халдагч
 * token-ыг шууд уншиж авна.
 *
 * `HttpOnly` cookie-г JavaScript уншиж ЧАДАХГҮЙ. XSS гарсан ч token
 * задрахгүй — халдагч зөвхөн тухайн хуудаснаас хүсэлт илгээж чадна.
 *
 * Хариуд нь CSRF гэдэг эрсдэл нэмэгдэнэ: хөтөч cookie-г АВТОМАТААР
 * хавсаргадаг тул өөр сайт манай API руу хүсэлт илгээвэл хэрэглэгчийн
 * нэрийн өмнөөс ажиллана. Үүнийг `sameSite: "lax"` хаана — өөр сайтаас
 * илгээсэн POST хүсэлтэд cookie явахгүй.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export const SESSION_COOKIE = "goal_session";

export type CookieConfig = {
  /**
   * Production дээр `true`. Тэгвэл cookie зөвхөн HTTPS-ээр явна —
   * сүлжээ чагнаж байгаа хүн үүнийг уншихгүй. Локал дээр HTTPS
   * байхгүй тул `false`.
   */
  cookieSecure: boolean;
};

function options({ cookieSecure }: CookieConfig): CookieOptions {
  return {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS * 1000, // Express нь миллисекундээр авна
  };
}

export function setSessionCookie(
  res: Response,
  token: string,
  config: CookieConfig,
): void {
  res.cookie(SESSION_COOKIE, token, options(config));
}

/**
 * Cookie-г устгана.
 *
 * Устгахдаа үүсгэх үеийнхтэй ИЖИЛ шинжүүдийг (path, sameSite, secure)
 * дамжуулах ёстой. Ядаж нэг нь зөрвөл хөтөч өөр cookie гэж үзэж,
 * хуучныг нь үлдээнэ.
 */
export function clearSessionCookie(res: Response, config: CookieConfig): void {
  const { maxAge: _maxAge, ...rest } = options(config);
  res.clearCookie(SESSION_COOKIE, rest);
}
