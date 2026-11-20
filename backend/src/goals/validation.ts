/**
 * Зорилгын оролтыг шалгана.
 *
 * `auth/validation.ts`-тай ижил зарчим: хөтөч дээрх шалгалт нь зөвхөн
 * хэрэглэгчид эвтэйхэн байлгах зориулалттай. Түүнийг тойрч API руу
 * шууд хүсэлт илгээх боломжтой тул эцсийн шийдвэрийг энд гаргана.
 */

import { goalCategoryEnum, goalStatusEnum } from "../db/schema.js";
import { parseIsoDate, todayInAppZone } from "./dates.js";

export const GOAL_TITLE_MAX_LENGTH = 200;
export const GOAL_DESCRIPTION_MAX_LENGTH = 2000;

/**
 * Дуусах хугацааны дээд хязгаар — өнөөдрөөс 10 жил.
 *
 * Хязгаарлахгүй бол "9999-12-31" гэж бичих боломжтой. Тэр нь зорилго
 * биш, өгөгдлийн хог. Хүрэх боломжтой хугацаа л зорилгыг зорилго
 * болгодог.
 */
export const GOAL_DEADLINE_MAX_YEARS = 10;

/**
 * Зөвшөөрөгдөх ангиллууд.
 *
 * Жагсаалтыг ЭНД гараар бичихгүй, enum-ээс авна. Хуулж бичвэл
 * schema дээр ангилал нэмэхэд шалгагч нь хоцорч, шинэ ангилал
 * "буруу утга" болж хоцрох байв.
 */
export const GOAL_CATEGORIES = goalCategoryEnum.enumValues;

export type GoalCategory = (typeof GOAL_CATEGORIES)[number];

/** Хэрэглэгч ангилал сонгоогүй бол. */
export const DEFAULT_GOAL_CATEGORY: GoalCategory = "personal";

/**
 * Зөвшөөрөгдөх төлвүүд.
 *
 * Үүсгэхэд төлөв нь ҮРГЭЛЖ `in_progress` — хүсэлтээс авдаггүй.
 * Засахад л өөрчлөгдөж болно: "биелсэн" гэж тэмдэглэх, эсвэл
 * андуурсан бол буцааж "хийгдэж байна" болгох нь хэрэглэгчийн эрх.
 */
export const GOAL_STATUSES = goalStatusEnum.enumValues;

export type GoalStatus = (typeof GOAL_STATUSES)[number];

export function isGoalStatus(value: string): value is GoalStatus {
  return (GOAL_STATUSES as readonly string[]).includes(value);
}

export type GoalFields =
  | "title"
  | "description"
  | "deadline"
  | "category"
  | "status";
export type GoalErrors = Partial<Record<GoalFields, string>>;

/** Цэгцэлсэн, ӨС рүү бичихэд бэлэн утгууд. */
export type GoalInput = {
  title: string;
  /** Хоосон бол `null` — ӨС дээр хоосон мөр биш, үнэхээр хоосон байна. */
  description: string | null;
  /** "YYYY-MM-DD", эсвэл хугацаа тохируулаагүй бол `null`. */
  deadline: string | null;
  category: GoalCategory;
};

/**
 * Шинэ зорилгын оролтыг шалгана.
 *
 * `userId`, `status`, `createdAt` зэргийг ЭНД ОГТ АВАХГҮЙ. Эдгээрийг
 * хүсэлтээс уншвал хэрэглэгч өөр хүний нэр дээр зорилго үүсгэх,
 * эсвэл шууд "биелсэн" төлөвтэй үүсгэх боломжтой болно.
 */
export function validateGoal(
  input: Record<string, unknown>,
  today: string = todayInAppZone(),
): {
  errors: GoalErrors;
  goal: GoalInput;
} {
  const errors: GoalErrors = {};

  const rawTitle = typeof input.title === "string" ? input.title.trim() : "";
  if (rawTitle.length === 0) {
    errors.title = "Зорилгынхоо нэрийг оруулна уу";
  } else if (rawTitle.length > GOAL_TITLE_MAX_LENGTH) {
    errors.title = `Нэр ${GOAL_TITLE_MAX_LENGTH} тэмдэгтээс урт байж болохгүй`;
  }

  let description: string | null = null;
  if (input.description !== undefined && input.description !== null) {
    if (typeof input.description !== "string") {
      errors.description = "Тайлбар буруу байна";
    } else {
      const trimmed = input.description.trim();
      if (trimmed.length > GOAL_DESCRIPTION_MAX_LENGTH) {
        errors.description = `Тайлбар ${GOAL_DESCRIPTION_MAX_LENGTH} тэмдэгтээс урт байж болохгүй`;
      } else if (trimmed.length > 0) {
        description = trimmed;
      }
    }
  }

  const { error: deadlineError, deadline } = validateDeadline(
    input.deadline,
    today,
  );
  if (deadlineError !== undefined) {
    errors.deadline = deadlineError;
  }

  const { error: categoryError, category } = validateCategory(input.category);
  if (categoryError !== undefined) {
    errors.category = categoryError;
  }

  return { errors, goal: { title: rawTitle, description, deadline, category } };
}

/**
 * Ангиллыг шалгана.
 *
 * Сонгоогүй бол анхны утга. Бичсэн ч жагсаалтад байхгүй бол алдаа —
 * чимээгүйхэн анхны утга болгож залруулахгүй. Хэрэглэгч "health" гэж
 * сонгосон гэж бодоод, бодит байдалд "personal" дор хадгалагдвал
 * шүүлтүүр нь түүнийг хэзээ ч олохгүй.
 */
function validateCategory(
  raw: unknown,
): { error?: string; category: GoalCategory } {
  if (raw === undefined || raw === null) {
    return { category: DEFAULT_GOAL_CATEGORY };
  }

  if (typeof raw !== "string") {
    return { error: "Ангилал буруу байна", category: DEFAULT_GOAL_CATEGORY };
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) return { category: DEFAULT_GOAL_CATEGORY };

  if (!isGoalCategory(trimmed)) {
    return {
      error: `Ангилал нь ${GOAL_CATEGORIES.join(", ")}-ийн аль нэг байх ёстой`,
      category: DEFAULT_GOAL_CATEGORY,
    };
  }

  return { category: trimmed };
}

/**
 * Мөр нь ангилал эсэх.
 *
 * `GET /api/goals?category=...` ч үүнийг хэрэглэнэ: шүүлтүүрийн утгыг
 * шалгахгүйгээр query руу тавих нь ямар ч тохиолдолд болохгүй.
 */
export function isGoalCategory(value: string): value is GoalCategory {
  return (GOAL_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Дуусах хугацааг шалгана.
 *
 * Хугацаа нь СОНГОЛТ — тохируулаагүй зорилго бүрэн хүчинтэй. Иймээс
 * "байхгүй" ба "буруу" хоёрыг ялгана: хоосон бол `null`, бичсэн ч
 * буруу бол алдаа.
 */
function validateDeadline(
  raw: unknown,
  today: string,
): { error?: string; deadline: string | null } {
  if (raw === undefined || raw === null) return { deadline: null };

  if (typeof raw !== "string") {
    return { error: "Дуусах хугацаа буруу байна", deadline: null };
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) return { deadline: null };

  // Хэлбэр ба хуанлийн бодит эсэхийг хоёуланг нь шалгана:
  // "2026-02-30" нь хэлбэрээрээ зөв ч тийм өдөр байхгүй.
  const parsed = parseIsoDate(trimmed);
  if (parsed === null) {
    return {
      error: "Хугацааг YYYY-MM-DD хэлбэрээр, бодит өдрөөр оруулна уу",
      deadline: null,
    };
  }

  // Тэг нөхөөстэй ISO мөрийг тэмдэгтээр харьцуулахад хуанлийн
  // дараалал нь гардаг — `Date` объект хэрэггүй.
  if (trimmed < today) {
    return {
      error: "Өнгөрсөн өдрийг дуусах хугацаа болгож болохгүй",
      deadline: null,
    };
  }

  const limit = addYears(today, GOAL_DEADLINE_MAX_YEARS);
  if (trimmed > limit) {
    return {
      error: `Дуусах хугацаа ${GOAL_DEADLINE_MAX_YEARS} жилээс хэтэрч болохгүй`,
      deadline: null,
    };
  }

  return { deadline: trimmed };
}

/**
 * ISO өдөрт жил нэмнэ.
 *
 * Зөвхөн ХАРЬЦУУЛАХ хязгаар болгож хэрэглэнэ, хэрэглэгчид харуулахгүй.
 * Тиймээс 02-29 дээр жил нэмэхэд хуанлид байхгүй өдөр гарч магадгүй
 * (2028-02-29 → 2038-02-29) — тэмдэгтийн дараалал нь зөв хэвээр тул
 * хязгаар нь нэг өдрөөр уужуу болохоос цаашид хамаарахгүй.
 */
function addYears(date: string, years: number): string {
  return `${Number(date.slice(0, 4)) + years}${date.slice(4)}`;
}

/**
 * Засварт орох талбарууд.
 *
 * Талбар бүр СОНГОЛТ: байхгүй бол "хөндөхгүй" гэсэн утга. Үүний
 * ачаар гарчгийг л засахад ангилал, хугацаа нь хэвээр үлдэнэ.
 */
export type GoalPatch = {
  title?: string;
  description?: string | null;
  deadline?: string | null;
  category?: GoalCategory;
  status?: GoalStatus;
};

/**
 * Зорилгын засварыг шалгана.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ЯАГААД `validateGoal`-ЫГ ДАХИН ХЭРЭГЛЭХГҮЙ ВЭ
 *
 * Үүсгэхэд нэр нь ЗААВАЛ, засахад нэр нь СОНГОЛТ. Нэг функцээр
 * хоёуланг хийх гэвэл "заавал эсэх" гэсэн туг нэмэх шаардлагатай
 * болно — тэр туг нь дотор нь хоёр өөр дүрэм нуух бөгөөд аль нэгийг
 * засахад нөгөө нь мэдэгдэхгүй эвдэрнэ. Тусад нь бичих нь хоёр
 * дахин урт ч, хоёр дахин ойлгомжтой.
 *
 * ХООСОН УТГЫН УТГА нь талбар тус бүрт ӨӨР бөгөөд ӨС-ийн бүтцийг
 * дагана:
 *
 *   title     notNull        → хоосон бол АЛДАА (нэргүй зорилго үгүй)
 *   description  nullable    → хоосон бол `null` (тайлбарыг авч хаяж болно)
 *   deadline     nullable    → хоосон бол `null` (хугацааг авч хаяж болно)
 *   category  notNull        → хоосон бол АЛДАА
 *   status    notNull        → хоосон бол АЛДАА
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * `userId`, `id`, `createdAt` зэргийг ЭНД ОГТ УНШИХГҮЙ — уншвал
 * хэрэглэгч зорилгоо өөр хүн рүү шилжүүлэх, үүсгэсэн цагаа хуурах
 * боломжтой болно.
 *
 * @param today Хугацааг харьцуулах өдөр (тестэд гаднаас өгнө)
 */
export function validateGoalUpdate(
  input: Record<string, unknown>,
  today: string = todayInAppZone(),
): { errors: GoalErrors; patch: GoalPatch } {
  const errors: GoalErrors = {};
  const patch: GoalPatch = {};

  if (input.title !== undefined) {
    const title = typeof input.title === "string" ? input.title.trim() : "";

    if (title.length === 0) {
      errors.title = "Зорилгынхоо нэрийг оруулна уу";
    } else if (title.length > GOAL_TITLE_MAX_LENGTH) {
      errors.title = `Нэр ${GOAL_TITLE_MAX_LENGTH} тэмдэгтээс урт байж болохгүй`;
    } else {
      patch.title = title;
    }
  }

  if (input.description !== undefined) {
    if (input.description === null) {
      patch.description = null;
    } else if (typeof input.description !== "string") {
      errors.description = "Тайлбар буруу байна";
    } else {
      const trimmed = input.description.trim();

      if (trimmed.length > GOAL_DESCRIPTION_MAX_LENGTH) {
        errors.description = `Тайлбар ${GOAL_DESCRIPTION_MAX_LENGTH} тэмдэгтээс урт байж болохгүй`;
      } else {
        patch.description = trimmed.length === 0 ? null : trimmed;
      }
    }
  }

  if (input.deadline !== undefined) {
    if (input.deadline === null) {
      patch.deadline = null;
    } else {
      const { error, deadline } = validateDeadline(input.deadline, today);

      if (error !== undefined) {
        errors.deadline = error;
      } else {
        patch.deadline = deadline;
      }
    }
  }

  if (input.category !== undefined) {
    if (typeof input.category !== "string" || !isGoalCategory(input.category)) {
      errors.category = `Ангилал нь ${GOAL_CATEGORIES.join(", ")}-ийн аль нэг байх ёстой`;
    } else {
      patch.category = input.category;
    }
  }

  if (input.status !== undefined) {
    if (typeof input.status !== "string" || !isGoalStatus(input.status)) {
      errors.status = `Төлөв нь ${GOAL_STATUSES.join(", ")}-ийн аль нэг байх ёстой`;
    } else {
      patch.status = input.status;
    }
  }

  return { errors, patch };
}
