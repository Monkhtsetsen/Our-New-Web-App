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

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  level: integer("level").default(1).notNull(),
  xp: integer("xp").default(0).notNull(),
  streak: integer("streak").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const goals = pgTable("goals", {
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

export const tasks = pgTable("tasks", {
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

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url"),
  requiredXp: integer("required_xp").default(0).notNull(),
});

export const userAchievements = pgTable(
  "user_achievements",
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

export const friends = pgTable("friends", {
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

export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  remindTime: timestamp("remind_time").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
});

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  period: reportPeriodEnum("period").notNull(),
  totalXp: integer("total_xp").default(0).notNull(),
  completedTasks: integer("completed_tasks").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiCoaches = pgTable("ai_coaches", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  style: coachStyleEnum("style").default("hard").notNull(),
  model: text("model").default("gemini-1.5-flash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
