/**
 * Зорилгын оролтыг шалгана.
 *
 * `auth/validation.ts`-тай ижил зарчим: хөтөч дээрх шалгалт нь зөвхөн
 * хэрэглэгчид эвтэйхэн байлгах зориулалттай. Түүнийг тойрч API руу
 * шууд хүсэлт илгээх боломжтой тул эцсийн шийдвэрийг энд гаргана.
 */

import { goalCategoryEnum } from "../db/schema.js";
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

export type GoalFields = "title" | "description" | "deadline" | "category";
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
