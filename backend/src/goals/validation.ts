/**
 * Зорилгын оролтыг шалгана.
 *
 * `auth/validation.ts`-тай ижил зарчим: хөтөч дээрх шалгалт нь зөвхөн
 * хэрэглэгчид эвтэйхэн байлгах зориулалттай. Түүнийг тойрч API руу
 * шууд хүсэлт илгээх боломжтой тул эцсийн шийдвэрийг энд гаргана.
 */

export const GOAL_TITLE_MAX_LENGTH = 200;
export const GOAL_DESCRIPTION_MAX_LENGTH = 2000;

export type GoalFields = "title" | "description";
export type GoalErrors = Partial<Record<GoalFields, string>>;

/** Цэгцэлсэн, ӨС рүү бичихэд бэлэн утгууд. */
export type GoalInput = {
  title: string;
  /** Хоосон бол `null` — ӨС дээр хоосон мөр биш, үнэхээр хоосон байна. */
  description: string | null;
};

/**
 * Шинэ зорилгын оролтыг шалгана.
 *
 * `userId`, `status`, `createdAt` зэргийг ЭНД ОГТ АВАХГҮЙ. Эдгээрийг
 * хүсэлтээс уншвал хэрэглэгч өөр хүний нэр дээр зорилго үүсгэх,
 * эсвэл шууд "биелсэн" төлөвтэй үүсгэх боломжтой болно.
 */
export function validateGoal(input: Record<string, unknown>): {
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

  return { errors, goal: { title: rawTitle, description } };
}
