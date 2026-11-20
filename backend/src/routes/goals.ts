import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { goals } from "../db/schema.js";
import type { AuthConfig } from "../auth/session.js";
import { requireAuth } from "../middleware/require-auth.js";
import {
  isGoalCategory,
  validateGoal,
  validateGoalUpdate,
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

  /**
   * PUT /api/goals/:id
   *
   * Хүлээн авах:  { title?, description?, deadline?, category?, status? }
   *   Талбар бүр сонголт — байхгүй талбар хөндөгдөхгүй. `PUT
   *   /api/users/me`-тэй ижил хэлбэр.
   *
   * Буцаах:
   *   200  { goal: {...} }
   *   400  { errors: { талбар: мессеж } }
   *   403  өөр хүний зорилго
   *   404  байхгүй зорилго
   */
  router.put("/:id", (req, res, next) => {
    (async () => {
      const user = req.user;
      if (user === undefined) {
        res.status(401).json({ error: "Нэвтэрнэ үү" });
        return;
      }

      const id = req.params.id;

      // UUID эсэхийг ӨС-д хүрэхээс НААНА шалгана. Хэлбэр буруу мөрийг
      // Postgres рүү дамжуулбал тэр нь 500 болж хувирна — байхгүй
      // зорилгыг асуусан хүнд 500 буцаах нь зөв биш.
      if (!isUuid(id)) {
        res.status(404).json({ error: "Зорилго олдсонгүй" });
        return;
      }

      const body: unknown = req.body;
      if (typeof body !== "object" || body === null) {
        res.status(400).json({ errors: { title: "Хүсэлтийн бие буруу байна" } });
        return;
      }

      const { errors, patch } = validateGoalUpdate(body as Record<string, unknown>);
      if (Object.keys(errors).length > 0) {
        res.status(400).json({ errors });
        return;
      }

      // Хоосон хүсэлт нь бараг үргэлж клиентийн алдаа. Чимээгүй 200
      // буцаавал тэр алдаа нуугдана.
      if (Object.keys(patch).length === 0) {
        res.status(400).json({ errors: { title: "Засах талбар заагаагүй" } });
        return;
      }

      const db = getDb();

      // Эзэмшигчийг тусад нь уншина — ЗӨВХӨН 403, 404 хоёрыг
      // ЯЛГАХЫН тулд. Эрхийн шийдвэрийг энэ уншилт гаргахгүй:
      // доорх UPDATE өөрөө `userId`-гаар хязгаарлагдана. Хоёр
      // хүсэлтийн хооронд өгөгдөл өөрчлөгдөж болох тул (TOCTOU)
      // шалгалтыг бичилтийн нөхцөлд НЬ хийх нь цорын ганц
      // найдвартай арга.
      const [existing] = await db
        .select({ userId: goals.userId })
        .from(goals)
        .where(eq(goals.id, id))
        .limit(1);

      if (existing === undefined) {
        res.status(404).json({ error: "Зорилго олдсонгүй" });
        return;
      }

      if (existing.userId !== user.id) {
        res.status(403).json({ error: "Энэ зорилгыг засах эрх байхгүй" });
        return;
      }

      const [updated] = await db
        .update(goals)
        .set({
          ...patch,

          // `updatedAt` нь `defaultNow()`-тэй ч тэр нь ЗӨВХӨН
          // INSERT-д ажиллана. Гараар тавихгүй бол засвар хийсэн ч
          // "хэзээ засагдсан" нь үүсгэсэн цаг хэвээр хоцорно.
          updatedAt: new Date(),
        })
        .where(and(eq(goals.id, id), eq(goals.userId, user.id)))
        .returning(PUBLIC_GOAL_COLUMNS);

      if (updated === undefined) {
        // Уншилт ба бичилтийн хооронд зорилго устсан/шилжсэн.
        res.status(404).json({ error: "Зорилго олдсонгүй" });
        return;
      }

      res.status(200).json({ goal: updated });
    })().catch(next);
  });

  return router;
}

/**
 * Мөр нь UUID эсэх.
 *
 * Хувилбарын цифрийг (`[1-5]`) ба хувилбарын битийг (`[89ab]`)
 * нарийн шалгахгүй: бидний хэрэгцээ нь "Postgres-ийн `uuid` төрөлд
 * хөрвөх эсэх" л бөгөөд тэр нь найман-дөрөв-дөрөв-дөрөв-арван хоёр
 * арван зургаатын цифрээр хангагдана.
 */
function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}
