import { relations } from "drizzle-orm";
import {
  users,
  goals,
  tasks,
  achievements,
  userAchievements,
  friends,
  reminders,
  reports,
  aiCoaches,
} from "./models";

export const usersRelations = relations(users, ({ one, many }) => ({
  goals: many(goals),
  tasks: many(tasks),
  reminders: many(reminders),
  reports: many(reports),
  aiCoach: one(aiCoaches),
  userAchievements: many(userAchievements),
  sentFriendRequests: many(friends, { relationName: "sentFriendRequests" }),
  receivedFriendRequests: many(friends, {
    relationName: "receivedFriendRequests",
  }),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  goal: one(goals, {
    fields: [tasks.goalId],
    references: [goals.id],
  }),
  reminders: many(reminders),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(
  userAchievements,
  ({ one }) => ({
    user: one(users, {
      fields: [userAchievements.userId],
      references: [users.id],
    }),
    achievement: one(achievements, {
      fields: [userAchievements.achievementId],
      references: [achievements.id],
    }),
  }),
);

export const friendsRelations = relations(friends, ({ one }) => ({
  user: one(users, {
    fields: [friends.userId],
    references: [users.id],
    relationName: "sentFriendRequests",
  }),
  friendUser: one(users, {
    fields: [friends.friendUserId],
    references: [users.id],
    relationName: "receivedFriendRequests",
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(users, {
    fields: [reminders.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [reminders.taskId],
    references: [tasks.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
}));

export const aiCoachesRelations = relations(aiCoaches, ({ one }) => ({
  user: one(users, {
    fields: [aiCoaches.userId],
    references: [users.id],
  }),
}));
