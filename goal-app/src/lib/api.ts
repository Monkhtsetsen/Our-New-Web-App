/**
 * Backend рүү хандах цорын ганц цэг.
 *
 * Frontend нь ӨС рүү шууд хандахгүй. Бүх өгөгдөл энэ файлаар дамжин
 * backend-ийн HTTP API-аар л ирнэ. Ингэснээр хоёр талыг тусад нь deploy
 * хийх, тусад нь масштаблах боломжтой болно.
 */

/**
 * Backend-ийн хаяг.
 *
 * NEXT_PUBLIC_ угтвартай учраас хөтөч рүү дамжина — энэ нь зориуд.
 * Доорх хүсэлтүүд хэрэглэгчийн хөтчөөс шууд явдаг тул хаяг нь нийтэд
 * ил байх ёстой. Нууц утгыг ХЭЗЭЭ Ч NEXT_PUBLIC_ угтвараар дамжуулж
 * болохгүй.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Backend-тэй ижил байх ёстой хязгаарууд. */
export const PASSWORD_MIN_LENGTH = 8;

export type SignupFields = "name" | "contact" | "password";
export type FieldErrors = Partial<Record<SignupFields, string>>;

export type User = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; fieldErrors: FieldErrors; message?: undefined }
  | { ok: false; fieldErrors?: undefined; message: string };

const NETWORK_ERROR =
  "Серверт холбогдож чадсангүй. Backend ажиллаж байгаа эсэхийг шалгана уу.";

async function postJson<T>(
  path: string,
  body: unknown,
): Promise<ApiResult<T>> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // Сүлжээний алдаа — backend унтарсан, CORS хориглосон, эсвэл интернэт
    // тасарсан. Хэрэглэгчид техникийн дэлгэрэнгүйг харуулах утгагүй.
    return { ok: false, message: NETWORK_ERROR };
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (response.ok) {
    return { ok: true, data: payload as T };
  }

  // Backend талбар тус бүрийн алдааг { errors: { талбар: мессеж } }
  // хэлбэрээр буцаадаг.
  const errors =
    typeof payload === "object" && payload !== null && "errors" in payload
      ? (payload as { errors: FieldErrors }).errors
      : null;

  if (errors !== null && Object.keys(errors).length > 0) {
    return { ok: false, fieldErrors: errors };
  }

  return {
    ok: false,
    message: "Хүсэлтийг боловсруулж чадсангүй. Дахин оролдоно уу.",
  };
}

export type SignupInput = {
  name: string;
  /** И-мэйл эсвэл утасны дугаар. */
  contact: string;
  password: string;
};

export function signup(input: SignupInput): Promise<ApiResult<{ user: User }>> {
  return postJson<{ user: User }>("/api/auth/signup", input);
}

/** Backend амьд эсэхийг шалгана. Нүүр хуудсан дээрх төлөв харуулахад. */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}
