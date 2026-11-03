import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  pgEnum,
  primaryKey,
  check,
} from "drizzle-orm/pg-core";

export const goalCategoryEnum = pgEnum("goal_category", [
  "study",
  "career",
  "finance",
  "health",
  "personal",
]);

export const goalStatusEnum = pgEnum("goal_status", [
  "in_progress",
  "completed",
  "abandoned",
]);

export const friendStatusEnum = pgEnum("friend_status", [
  "pending",
  "accepted",
  "blocked",
]);

export const reportPeriodEnum = pgEnum("report_period", [
  "daily",
  "weekly",
  "monthly",
]);

export const coachStyleEnum = pgEnum("coach_style", ["hard", "low"]);

/**
 * Хэрэглэгчийн эрх.
 *
 * Хоёр л түвшин байна: энгийн хэрэглэгч ба админ. Тусдаа permissions
 * хүснэгт, нарийн эрхийн систем хэрэг болтол нэмэхгүй — хоёр утгад
 * тэр нь илүүц төвөгтэй байдал.
 *
 * ЧУХАЛ: эрхийг бүртгэлийн хүсэлтээр тогтоож БОЛОХГҮЙ. Шинэ бүртгэл
 * бүр "user" эрхтэй үүснэ. Админ болгохын тулд ӨС дээр гараар
 * өөрчилнө (docs/architecture.md-д заавар бий).
 */
export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);

/**
 * Баганын анхны утгууд.
 *
 * Хүснэгтийн тодорхойлолтод ШУУД ашиглагдана. Урьд нь эдгээр нь файлын
 * төгсгөлд тусдаа байсан бөгөөд баганын default-тай салах эрсдэлтэй
 * байв — одоо нэг л эх сурвалжтай.
 */
export const DEFAULT_USER_LEVEL = 1;
export const DEFAULT_USER_XP = 0;
export const DEFAULT_USER_STREAK = 0;
export const USER_ROLE_DEFAULT = "user" as const;

/**
 * Хэрэглэгч.
 *
 * Бүртгэл нь и-мэйл ЭСВЭЛ утасны дугаарын аль нэгээр үүснэ — хоёуланг нь
 * шаардахгүй. Иймд хоёр багана тус тусдаа хоосон байж болох ч хоёулаа
 * зэрэг хоосон байхыг доорх CHECK хориглоно: тэгвэл тухайн хэрэглэгч рүү
 * дахин хандах (нууц үг сэргээх) арга үлдэхгүй.
 *
 * Хоёулаа давхцахгүй байх ёстой — нэг хаягаар хоёр бүртгэл үүсгэхээс
 * сэргийлнэ.
 */
export const users = pgTable(
  "tb_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").unique(),
    phone: text("phone").unique(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").default(USER_ROLE_DEFAULT).notNull(),
    level: integer("level").default(DEFAULT_USER_LEVEL).notNull(),
    xp: integer("xp").default(DEFAULT_USER_XP).notNull(),
    streak: integer("streak").default(DEFAULT_USER_STREAK).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    check(
      "tb_users_contact_required",
      sql`${table.email} IS NOT NULL OR ${table.phone} IS NOT NULL`,
    ),
  ],
);

export const goals = pgTable("tb_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: goalCategoryEnum("category").default("personal").notNull(),
  deadline: date("deadline"),
  status: goalStatusEnum("status").default("in_progress").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasks = pgTable("tb_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false).notNull(),
  xpReward: integer("xp_reward").default(10).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const achievements = pgTable("tb_achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url"),
  requiredXp: integer("required_xp").default(0).notNull(),
});

export const userAchievements = pgTable(
  "tb_user_achievements",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: uuid("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.achievementId] }),
  }),
);

export const friends = pgTable("tb_friends", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  friendUserId: uuid("friend_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: friendStatusEnum("status").default("pending").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const reminders = pgTable("tb_reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  remindTime: timestamp("remind_time").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
});

export const reports = pgTable("tb_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  period: reportPeriodEnum("period").notNull(),
  totalXp: integer("total_xp").default(0).notNull(),
  completedTasks: integer("completed_tasks").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiCoaches = pgTable("tb_ai_coaches", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  style: coachStyleEnum("style").default("hard").notNull(),
  model: text("model").default("gemini-1.5-flash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
