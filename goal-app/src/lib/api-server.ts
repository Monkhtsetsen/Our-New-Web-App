import { cookies } from "next/headers";
import type { User } from "./api";

/**
 * Серверийн талаас backend рүү хандах.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ЯАГААД ТУСДАА ФАЙЛ, ТУСДАА ХАЯГ ВЭ
 *
 * `api.ts` нь ХӨТЧӨӨС дуудагддаг тул `NEXT_PUBLIC_API_URL` буюу
 * хэрэглэгчийн хөтөчөөс харагдах хаягийг (`http://localhost:4000`)
 * ашигладаг.
 *
 * Энэ файл нь Next.js-ийн СЕРВЕР дотроос ажиллана. Docker дээр тэр
 * сервер нь өөр контейнер дотор байгаа тул "localhost:4000" гэж
 * хандвал өөрийнхөө дотор хайж олохгүй. Контейнерийн сүлжээн дэх нэр
 * нь `backend` — иймээс тусдаа хувьсагч.
 *
 * NEXT_PUBLIC_ угтваргүй тул энэ утга хөтөч рүү дамжихгүй.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
const INTERNAL_API_URL =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

/** Backend-ийн `SESSION_COOKIE`-тэй ижил байх ёстой. */
export const SESSION_COOKIE = "goal_session";

/**
 * Нэвтэрсэн хэрэглэгчийг СЕРВЕР талд шалгана.
 *
 * Token-ыг энд задалж уншихгүй — нууц түлхүүр нь зөвхөн backend дээр
 * байх ёстой. Үүний оронд backend-ээс асууна. Ингэснээр:
 *
 *   - Эрх нь ҮРГЭЛЖ одоогийн утга байна (token доторх хуучин утга биш)
 *   - Устгасан бүртгэл, хүчингүй болсон сесс шууд таслагдана
 *   - JWT-ийн түлхүүр хоёр үйлчилгээнд тараагдахгүй
 *
 * @returns Хэрэглэгч, эсвэл нэвтрээгүй/хүчингүй бол `null`
 */
export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token === undefined || token.length === 0) return null;

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

    return (body as { user: User }).user;
  } catch {
    // Backend унтарсан бол "нэвтрээгүй" гэж үзнэ. Хамгаалалттай хуудсыг
    // эргэлзээтэй үед НЭЭХГҮЙ байх нь зөв тал руугаа алдаж буй хэрэг.
    return null;
  }
}
