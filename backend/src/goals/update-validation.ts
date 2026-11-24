/**
 * Лаб 12 — зорилгыг ЗАСАХ (PATCH) оролтын шалгалт.
 *
 * Claude Code-ын ноорог (сайн prompt) дээр суурилж, review + тестээр зассан хувилбар.
 * Review-гийн тэмдэглэл: `docs/lab12/README.md`.
 *
 * `validateGoal()`-оос ялгаа нь: PATCH нь ХЭСЭГЧИЛСЭН шинэчлэл. Хүсэлтэд
 * байхгүй талбарыг "хоосон" гэж үзэхгүй, харин огт хөндөхгүй.
 */

import { goalStatusEnum } from "../db/schema.js";
import { todayInAppZone } from "./dates.js";
import {
  GOAL_DESCRIPTION_MAX_LENGTH,
  GOAL_TITLE_MAX_LENGTH,
  validateCategory,
  validateDeadline,
  type GoalCategory,
} from "./validation.js";

export const GOAL_STATUSES = goalStatusEnum.enumValues;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

/** Хэрэглэгчийн засаж болох талбарууд — ЗӨВХӨН эдгээр. */
export const UPDATABLE_GOAL_FIELDS = [
  "title",
  "description",
  "deadline",
  "category",
  "status",
] as const;

export type UpdatableGoalField = (typeof UPDATABLE_GOAL_FIELDS)[number];
export type GoalUpdateErrors = Partial<
  Record<UpdatableGoalField | "_form", string>
>;

/** ӨС рүү бичихэд бэлэн, зөвхөн ӨӨРЧЛӨГДСӨН талбарууд. */
export type GoalUpdate = {
  title?: string;
  description?: string | null;
  deadline?: string | null;
  category?: GoalCategory;
  status?: GoalStatus;
};

/** Шалгалтад хэрэгтэй одоогийн төлөв (ӨС-ээс уншсан). */
export type CurrentGoal = {
  deadline: string | null;
  status: GoalStatus;
};

export function isGoalStatus(value: unknown): value is GoalStatus {
  return (
    typeof value === "string" &&
    (GOAL_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * Зорилгын засварыг шалгана.
 *
 * - Зөвхөн `UPDATABLE_GOAL_FIELDS`-ийг уншина. `userId`, `id`,
 *   `createdAt` гэх мэтийг хүсэлтэд бичсэн ч ҮЛ ТООМСОРЛОНО (mass assignment).
 * - Ядаж нэг засах талбар байх ёстой — хоосон PATCH нь алдаа.
 * - Дуусах хугацааг ӨӨРЧИЛСӨН үед л "өнгөрсөн өдөр" шалгана: хугацаа нь
 *   өнгөрсөн зорилгын нэрийг засахыг хаахгүй.
 */
export function validateGoalUpdate(
  input: Record<string, unknown>,
  current: CurrentGoal,
  today: string = todayInAppZone(),
): { errors: GoalUpdateErrors; update: GoalUpdate } {
  const errors: GoalUpdateErrors = {};
  const update: GoalUpdate = {};

  // `in` биш `Object.hasOwn`: "__proto__"/"toString" зэрэг өвлөгдсөн
  // шинжийг талбар гэж андуурахгүй.
  const present = UPDATABLE_GOAL_FIELDS.filter((field) =>
    Object.hasOwn(input, field),
  );

  if (present.length === 0) {
    errors._form = "Засах талбар алга";
    return { errors, update };
  }

  if (Object.hasOwn(input, "title")) {
    // Truthiness (`if (input.title)`) биш: "" нь "өөрчлөхгүй" биш, АЛДАА.
    const raw = input.title;
    const title = typeof raw === "string" ? raw.trim() : "";
    if (title.length === 0) {
      errors.title = "Зорилгынхоо нэрийг оруулна уу";
    } else if (title.length > GOAL_TITLE_MAX_LENGTH) {
      errors.title = `Нэр ${GOAL_TITLE_MAX_LENGTH} тэмдэгтээс урт байж болохгүй`;
    } else {
      update.title = title;
    }
  }

  if (Object.hasOwn(input, "description")) {
    const raw = input.description;
    if (raw === null) {
      update.description = null; // тайлбарыг арилгах
    } else if (typeof raw !== "string") {
      errors.description = "Тайлбар буруу байна";
    } else {
      const trimmed = raw.trim();
      if (trimmed.length > GOAL_DESCRIPTION_MAX_LENGTH) {
        errors.description = `Тайлбар ${GOAL_DESCRIPTION_MAX_LENGTH} тэмдэгтээс урт байж болохгүй`;
      } else {
        update.description = trimmed.length > 0 ? trimmed : null;
      }
    }
  }

  if (Object.hasOwn(input, "deadline")) {
    const raw = input.deadline;
    const unchanged =
      (typeof raw === "string" && raw.trim() === current.deadline) ||
      ((raw === null || raw === "") && current.deadline === null);

    if (!unchanged) {
      const { error, deadline } = validateDeadline(raw, today);
      if (error !== undefined) errors.deadline = error;
      else update.deadline = deadline;
    }
  }

  if (Object.hasOwn(input, "category")) {
    // `null`/"" → `validateCategory` анхны ангилал ("personal") буцаадаг.
    // PATCH дээр энэ нь чимээгүй солих болно — иймээс алдаа.
    const raw = input.category;
    if (raw === null || (typeof raw === "string" && raw.trim() === "")) {
      errors.category = "Ангилал буруу байна";
    } else {
      const { error, category } = validateCategory(input.category);
      if (error !== undefined) errors.category = error;
      else update.category = category;
    }
  }

  if (Object.hasOwn(input, "status")) {
    const raw = input.status;
    if (!isGoalStatus(raw)) {
      errors.status = `Төлөв нь ${GOAL_STATUSES.join(", ")}-ийн аль нэг байх ёстой`;
    } else if (raw !== current.status) {
      update.status = raw;
    }
  }

  // Алдаатай бол хагас засвар хадгалагдахаас сэргийлж юу ч буцаахгүй.
  if (Object.keys(errors).length > 0) return { errors, update: {} };

  return { errors, update };
}
