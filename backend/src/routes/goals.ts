import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { goals } from "../db/schema.js";
import type { AuthConfig } from "../auth/session.js";
import { requireAuth } from "../middleware/require-auth.js";
import {
  isGoalCategory,
  validateGoal,
  type GoalCategory,
} from "../goals/validation.js";

/**
 * Хариуд гарах баганууд.
 *
 * `userId`-г гаргахгүй: хэрэглэгч зөвхөн ӨӨРИЙНХӨӨ зорилгыг хардаг
 * тул тэр утга нь илүүц бөгөөд дотоод id-г дэмий ил гаргана.
 */
const PUBLIC_GOAL_COLUMNS = {
  id: goals.id,
  title: goals.title,
  description: goals.description,
  category: goals.category,
  deadline: goals.deadline,
  status: goals.status,
  createdAt: goals.createdAt,
  updatedAt: goals.updatedAt,
} as const;

export function createGoalsRouter(config: AuthConfig): Router {
  const router: Router = Router();

  // Бүх зам нэвтэрсэн байхыг шаардана.
  router.use(requireAuth(config));

  /**
   * GET /api/goals?category=health
   *
   * Нэвтэрсэн хэрэглэгчийн зорилгууд, шинэ нь эхэндээ.
   *
   * `category` нь сонголт. Бичсэн ч танихгүй утга бол 400 —
   * чимээгүйхэн БҮХ зорилгыг буцаахгүй. "?category=helth" гэж
   * бичихэд шүүлтүүр ажиллаагүйг хэрэглэгч мэдэх ёстой.
   *
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * `where(eq(goals.userId, user.id))` нь энэ файлын ХАМГИЙН ЧУХАЛ мөр.
   *
   * Үүнийг мартвал хэрэглэгч бүр бусдын бүх зорилгыг харна. OWASP-ийн
   * API жагсаалтад энэ төрлийн алдаа (Broken Object Level Authorization)
   * нэгдүгээрт бичигдсэн байдаг — хамгийн түгээмэл, хамгийн ноцтой.
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  router.get("/", (req, res, next) => {
    (async () => {
      const user = req.user;
      if (user === undefined) {
        res.status(401).json({ error: "Нэвтэрнэ үү" });
        return;
      }

      // Query-ийн утга нь массив ч байж болно ("?category=a&category=b").
      // Иймээс мөр эсэхийг тусад нь шалгана.
      const raw = req.query.category;
      let category: GoalCategory | undefined;

      if (raw !== undefined) {
        if (typeof raw !== "string" || !isGoalCategory(raw)) {
          res.status(400).json({ errors: { category: "Ангилал буруу байна" } });
          return;
        }
        category = raw;
      }

      const db = getDb();
      const rows = await db
        .select(PUBLIC_GOAL_COLUMNS)
        .from(goals)
        .where(
          // `userId` нь ЗААВАЛ хэвээр. Ангиллыг түүний ОРОНД биш,
          // ДЭЭР нь нэмнэ — `and` гэж бичсэний гол шалтгаан энэ.
          category === undefined
            ? eq(goals.userId, user.id)
            : and(eq(goals.userId, user.id), eq(goals.category, category)),
        )
        .orderBy(desc(goals.createdAt));

      res.status(200).json({ goals: rows });
    })().catch(next);
  });

  /**
   * POST /api/goals
   *
   * Хүлээн авах:  { title, description?, deadline?, category? }
   *
   * Буцаах:
   *   201  { goal: {...} }
   *   400  { errors: { талбар: мессеж } }
   */
  router.post("/", (req, res, next) => {
    (async () => {
      const user = req.user;
      if (user === undefined) {
        res.status(401).json({ error: "Нэвтэрнэ үү" });
        return;
      }

      const body: unknown = req.body;
      if (typeof body !== "object" || body === null) {
        res.status(400).json({ errors: { title: "Хүсэлтийн бие буруу байна" } });
        return;
      }

      const { errors, goal } = validateGoal(body as Record<string, unknown>);
      if (Object.keys(errors).length > 0) {
        res.status(400).json({ errors });
        return;
      }

      const db = getDb();

      // userId нь ХҮСЭЛТЭЭС биш, сесснээс ирнэ. Хүсэлтээс авбал
      // хэн ч өөр хүний нэр дээр зорилго үүсгэх байв.
      const [created] = await db
        .insert(goals)
        .values({
          userId: user.id,
          title: goal.title,
          description: goal.description,
          deadline: goal.deadline,
          category: goal.category,
        })
        .returning(PUBLIC_GOAL_COLUMNS);

      if (created === undefined) {
        throw new Error("Зорилго үүссэн ч буцаж ирсэнгүй");
      }

      res.status(201).json({ goal: created });
    })().catch(next);
  });

  return router;
}
