import { Router } from "express";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { tasks } from "../db/schema.js";
import type { AuthConfig } from "../auth/session.js";
import { requireAuth } from "../middleware/require-auth.js";
import { todayInAppZone } from "../goals/dates.js";
import { dayWindowUtc } from "../tasks/day-window.js";
import { validateTask } from "../tasks/validation.js";

/**
 * Хариуд гарах баганууд.
 *
 * `userId`-г гаргахгүй: хэрэглэгч зөвхөн ӨӨРИЙНХӨӨ даалгаврыг хардаг
 * тул тэр утга нь илүүц бөгөөд дотоод id-г дэмий ил гаргана.
 */
const PUBLIC_TASK_COLUMNS = {
  id: tasks.id,
  goalId: tasks.goalId,
  title: tasks.title,
  description: tasks.description,
  dueDate: tasks.dueDate,
  completed: tasks.completed,
  xpReward: tasks.xpReward,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
} as const;

export function createTasksRouter(config: AuthConfig): Router {
  const router: Router = Router();

  // Бүх зам нэвтэрсэн байхыг шаардана.
  router.use(requireAuth(config));

  /**
   * GET /api/tasks/today
   *
   * Буцаах:
   *   200  { date, today: [...], overdue: [...] }
   *
   * `today`   — өнөөдөр хийх даалгаврууд (биелсэн нь ДООД талд)
   * `overdue` — өнөөдрөөс ӨМНӨ хийх байсан, БИЕЛЭЭГҮЙ даалгаврууд
   *
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * Хоёр жагсаалтыг НЭГ хүсэлтээр буцаана. Тусад нь хоёр зам болговол
   * хуудас нь хоёр удаа хандана — хоёр дахин хоцролт, хоёр хүсэлтийн
   * хооронд шөнө дунд болж хоёр өөр өдрийн өгөгдөл холих эрсдэлтэй.
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  router.get("/today", (req, res, next) => {
    (async () => {
      const user = req.user;
      if (user === undefined) {
        res.status(401).json({ error: "Нэвтэрнэ үү" });
        return;
      }

      // "Өнөөдөр"-ийг нэг л удаа тооцно. Хоёр query-д хоёр удаа
      // тооцвол шөнө дундын заагт хоёр өөр өдрөөр шүүх эрсдэлтэй.
      const date = todayInAppZone();
      const { start, end } = dayWindowUtc(date);

      const db = getDb();

      const [todayRows, overdueRows] = await Promise.all([
        db
          .select(PUBLIC_TASK_COLUMNS)
          .from(tasks)
          .where(
            and(
              // `userId` нь энэ файлын ХАМГИЙН ЧУХАЛ нөхцөл. Мартвал
              // хэрэглэгч бүр бусдын даалгаврыг харна (OWASP API1).
              eq(tasks.userId, user.id),
              gte(tasks.dueDate, start),
              lt(tasks.dueDate, end),
            ),
          )
          // Биелсэн нь доод талд (false < true), дараа нь цагаар.
          .orderBy(asc(tasks.completed), asc(tasks.dueDate)),

        db
          .select(PUBLIC_TASK_COLUMNS)
          .from(tasks)
          .where(
            and(
              eq(tasks.userId, user.id),
              lt(tasks.dueDate, start),
              // Биелсэн хоцрогдол нь хоцрогдол биш — хийгдсэн ажил.
              eq(tasks.completed, false),
            ),
          )
          .orderBy(asc(tasks.dueDate)),
      ]);

      res.status(200).json({ date, today: todayRows, overdue: overdueRows });
    })().catch(next);
  });

  /**
   * POST /api/tasks
   *
   * Хүлээн авах:  { title, description?, dueDate? }
   *   `dueDate` нь "YYYY-MM-DD". Байхгүй бол даалгавар нь ямар ч
   *   өдрийн хуудсанд харагдахгүй сан руу орно.
   *
   * Буцаах:
   *   201  { task: {...} }
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

      const { errors, task } = validateTask(body as Record<string, unknown>);
      if (Object.keys(errors).length > 0) {
        res.status(400).json({ errors });
        return;
      }

      const db = getDb();

      // userId нь ХҮСЭЛТЭЭС биш, сесснээс ирнэ. `completed`,
      // `xpReward`, `goalId` нь ӨС-ийн анхны утгаар орно — хүсэлтээс
      // авбал хэрэглэгч шууд "биелсэн" даалгавар үүсгэж, дурын XP
      // тогтоох байв.
      const [created] = await db
        .insert(tasks)
        .values({
          userId: user.id,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
        })
        .returning(PUBLIC_TASK_COLUMNS);

      if (created === undefined) {
        throw new Error("Даалгавар үүссэн ч буцаж ирсэнгүй");
      }

      res.status(201).json({ task: created });
    })().catch(next);
  });

  return router;
}
