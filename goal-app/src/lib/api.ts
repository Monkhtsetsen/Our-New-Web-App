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

/** Backend-ийн буцаадаг алдааны түлхүүрүүд. */
export type FieldName =
  | "name"
  | "contact"
  | "password"
  | "email"
  | "phone"
  | "currentPassword"
  | "newPassword"
  | "title"
  | "description"
  | "deadline";

export type FieldErrors = Partial<Record<FieldName, string>>;

/** Backend-ийн user_role enum-тэй тохирно. */
export type UserRole = "admin" | "user";

export type User = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  /**
   * Эрх нь ЗӨВХӨН backend-ээс ирнэ. Хөтөч дээр үүнийг шалгаж хуудас
   * нуух нь хамгаалалт биш — хэрэглэгч JavaScript-ийг тойрч API руу
   * шууд хүсэлт илгээж чадна. Эцсийн шийдвэрийг сервер гаргана.
   */
  role: UserRole;
  level: number;
  xp: number;
  streak: number;
  createdAt: string;
  updatedAt: string;
};

export type ApiResult<T> =
  | { ok: true; data: T }
  /**
   * `status` нь HTTP төлвийн код. Сүлжээний алдаанд `0` — хариу огт
   * ирээгүй гэсэн үг. 401-ийг тусгайлан таних хэрэгтэй: дуудагч код
   * "нэвтрэх хуудас руу шидэх үү, эсвэл алдаа харуулах уу" гэдгийг
   * үүгээр шийднэ.
   */
  | { ok: false; status: number; fieldErrors: FieldErrors; message?: undefined }
  | { ok: false; status: number; fieldErrors?: undefined; message: string };

/** Сүлжээний алдаа — сервер хүртэл хүрээгүй. */
export const NO_RESPONSE = 0;

const NETWORK_ERROR =
  "Серверт холбогдож чадсангүй. Backend ажиллаж байгаа эсэхийг шалгана уу.";

const UNKNOWN_ERROR = "Хүсэлтийг боловсруулж чадсангүй. Дахин оролдоно уу.";

type RequestOptions = {
  method: "GET" | "POST" | "PUT";
  body?: unknown;
};

async function request<T>(
  path: string,
  { method, body }: RequestOptions,
): Promise<ApiResult<T>> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // Сессийн cookie-г хавсаргахад ЗААВАЛ хэрэгтэй.
      //
      // Frontend 3000, backend 4000 — хөтөч эдгээрийг өөр origin гэж
      // үздэг тул анхны байдлаар cookie явуулдаггүй. Backend талд
      // `cors({ credentials: true })` нь түүний хос.
      //
      // Мартвал: нэвтрэх амжилттай болох боловч дараагийн хүсэлт
      // болгонд 401 ирнэ — олж хэцүү алдаа.
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      credentials: "include",

      // Сессийн хариуг кэшлэх ёсгүй.
      cache: "no-store",
    });
  } catch {
    // Сүлжээний алдаа — backend унтарсан, CORS хориглосон, эсвэл интернэт
    // тасарсан. Хэрэглэгчид техникийн дэлгэрэнгүйг харуулах утгагүй.
    return { ok: false, status: NO_RESPONSE, message: NETWORK_ERROR };
  }

  // 204 (logout) гэх мэт биегүй хариу.
  if (response.status === 204) {
    return { ok: true, data: undefined as T };
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

  const object =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : {};

  // Backend талбар тус бүрийн алдааг { errors: { талбар: мессеж } }
  // хэлбэрээр буцаадаг.
  const errors = object.errors;
  if (typeof errors === "object" && errors !== null && Object.keys(errors).length > 0) {
    return { ok: false, status: response.status, fieldErrors: errors as FieldErrors };
  }

  // Талбарт хамаарахгүй алдаа: { error: "..." }. Нэвтрэх бүтэлгүйтэх,
  // хүсэлтийн хязгаар хэтрэх зэрэг.
  const message = object.error;
  return {
    ok: false,
    status: response.status,
    message: typeof message === "string" && message.length > 0 ? message : UNKNOWN_ERROR,
  };
}

export type RegisterInput = {
  name: string;
  /** И-мэйл эсвэл утасны дугаар. */
  contact: string;
  password: string;
};

/** Шинэ хэрэглэгч бүртгэнэ. Амжилттай бол сесс нь шууд нээгдэнэ. */
export function register(input: RegisterInput): Promise<ApiResult<{ user: User }>> {
  return request<{ user: User }>("/api/auth/register", {
    method: "POST",
    body: input,
  });
}

export type LoginInput = {
  contact: string;
  password: string;
};

export function login(input: LoginInput): Promise<ApiResult<{ user: User }>> {
  return request<{ user: User }>("/api/auth/login", {
    method: "POST",
    body: input,
  });
}

/**
 * Сессийг хаана.
 *
 * Token нь HttpOnly cookie дотор тул JavaScript-ээр устгах БОЛОМЖГҮЙ —
 * backend-ээс устгах заавар ирэх ёстой. Яг энэ л шалтгаанаар XSS
 * гарсан ч token задардаггүй.
 */
export function logout(): Promise<ApiResult<undefined>> {
  return request<undefined>("/api/auth/logout", { method: "POST" });
}

/** Нэвтэрсэн хэрэглэгчийн мэдээлэл. Нэвтрээгүй бол 401 ирнэ. */
export function getMe(): Promise<ApiResult<{ user: User }>> {
  return request<{ user: User }>("/api/users/me", { method: "GET" });
}

export type ProfileInput = {
  name?: string;
  /** Хоосон мөр нь "устга" гэсэн үг. */
  email?: string;
  phone?: string;
  /** И-мэйл, утас, нууц үг солиход заавал. */
  currentPassword?: string;
  newPassword?: string;
};

export function updateProfile(
  input: ProfileInput,
): Promise<ApiResult<{ user: User }>> {
  return request<{ user: User }>("/api/users/me", {
    method: "PUT",
    body: input,
  });
}

/** Backend-ийн goal_category enum-тэй тохирно. */
export type GoalCategory = "study" | "career" | "finance" | "health" | "personal";

/** Backend-ийн goal_status enum-тэй тохирно. */
export type GoalStatus = "in_progress" | "completed" | "abandoned";

export type Goal = {
  id: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  /** "YYYY-MM-DD" эсвэл null. Цагийн бүс оролцуулахгүй. */
  deadline: string | null;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
};

export function listGoals(): Promise<ApiResult<{ goals: Goal[] }>> {
  return request<{ goals: Goal[] }>("/api/goals", { method: "GET" });
}

export type NewGoal = {
  title: string;
  description?: string;
  /** "YYYY-MM-DD". Тохируулаагүй бол огт илгээхгүй. */
  deadline?: string;
};

export function createGoal(input: NewGoal): Promise<ApiResult<{ goal: Goal }>> {
  return request<{ goal: Goal }>("/api/goals", { method: "POST", body: input });
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
