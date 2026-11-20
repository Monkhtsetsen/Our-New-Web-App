/**
 * Даалгаврын оролтыг шалгана.
 *
 * `goals/validation.ts`-тай ижил зарчим: хөтөч дээрх шалгалт нь зөвхөн
 * хэрэглэгчид эвтэйхэн байлгах зориулалттай. Түүнийг тойрч API руу
 * шууд хүсэлт илгээх боломжтой тул эцсийн шийдвэрийг энд гаргана.
 */

import { parseIsoDate } from "../goals/dates.js";
import { dayStartUtc } from "./day-window.js";

export const TASK_TITLE_MAX_LENGTH = 200;
export const TASK_DESCRIPTION_MAX_LENGTH = 2000;

export type TaskFields = "title" | "description" | "dueDate";
export type TaskErrors = Partial<Record<TaskFields, string>>;

/** Цэгцэлсэн, ӨС рүү бичихэд бэлэн утгууд. */
export type TaskInput = {
  title: string;
  description: string | null;
  /**
   * Тодорхой АГШИН, эсвэл хугацаагүй бол `null`.
   *
   * Хэрэглэгч "YYYY-MM-DD" гэж өдөр заана; бид түүнийг тэр өдрийн
   * Улаанбаатарын шөнө дунд болгож хадгална. Ингэснээр "өнөөдөр"
   * хуудсын интервалд яг таарна.
   */
  dueDate: Date | null;
};

/**
 * Шинэ даалгаврын оролтыг шалгана.
 *
 * `userId`, `completed`, `xpReward` зэргийг ЭНД ОГТ АВАХГҮЙ.
 * Эдгээрийг хүсэлтээс уншвал хэрэглэгч өөр хүний нэр дээр даалгавар
 * үүсгэх, шууд "биелсэн" төлөвтэй үүсгэх, эсвэл өөртөө дурын XP
 * тогтоох боломжтой болно.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ӨНГӨРСӨН ӨДРИЙГ ЗӨВШӨӨРНӨ — зорилгын хугацаанаас ӨӨР.
 *
 * Зорилгод өнгөрсөн хугацаа тавих нь утгагүй. Харин даалгаварт
 * утгатай: өчигдөр хийх байсан ажлаа мартаад одоо бүртгэж байж
 * болно. Issue нь "хоцорсон" хэсгийг тусад нь харуулахыг шаарддаг
 * тул өнгөрсөн хугацаатай даалгавар нь БҮРЭН хүчинтэй төлөв.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export function validateTask(input: Record<string, unknown>): {
  errors: TaskErrors;
  task: TaskInput;
} {
  const errors: TaskErrors = {};

  const rawTitle = typeof input.title === "string" ? input.title.trim() : "";
  if (rawTitle.length === 0) {
    errors.title = "Даалгаврынхаа нэрийг оруулна уу";
  } else if (rawTitle.length > TASK_TITLE_MAX_LENGTH) {
    errors.title = `Нэр ${TASK_TITLE_MAX_LENGTH} тэмдэгтээс урт байж болохгүй`;
  }

  let description: string | null = null;
  if (input.description !== undefined && input.description !== null) {
    if (typeof input.description !== "string") {
      errors.description = "Тайлбар буруу байна";
    } else {
      const trimmed = input.description.trim();
      if (trimmed.length > TASK_DESCRIPTION_MAX_LENGTH) {
        errors.description = `Тайлбар ${TASK_DESCRIPTION_MAX_LENGTH} тэмдэгтээс урт байж болохгүй`;
      } else if (trimmed.length > 0) {
        description = trimmed;
      }
    }
  }

  const { error: dueError, dueDate } = validateDueDate(input.dueDate);
  if (dueError !== undefined) {
    errors.dueDate = dueError;
  }

  return { errors, task: { title: rawTitle, description, dueDate } };
}

/**
 * Хийх өдрийг шалгаж, агшин болгоно.
 *
 * Хугацаа нь СОНГОЛТ. Тохируулаагүй даалгавар нь ямар ч өдрийн
 * хуудсанд харагдахгүй — "хэзээ нэгэн цагт" гэсэн сан. Иймээс
 * дэлгэц дээрх форм нь өнөөдрийг анхны утга болгоно.
 */
function validateDueDate(raw: unknown): {
  error?: string;
  dueDate: Date | null;
} {
  if (raw === undefined || raw === null) return { dueDate: null };

  if (typeof raw !== "string") {
    return { error: "Хийх өдөр буруу байна", dueDate: null };
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) return { dueDate: null };

  // Хэлбэр ба хуанлийн бодит эсэхийг хоёуланг нь шалгана:
  // "2027-02-30" нь хэлбэрээрээ зөв ч тийм өдөр байхгүй.
  if (parseIsoDate(trimmed) === null) {
    return {
      error: "Өдрийг YYYY-MM-DD хэлбэрээр, бодит өдрөөр оруулна уу",
      dueDate: null,
    };
  }

  return { dueDate: dayStartUtc(trimmed) };
}
