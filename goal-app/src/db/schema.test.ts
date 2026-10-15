import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";

import {
  DEFAULT_USER_LEVEL,
  USER_ROLE_DEFAULT,
  achievements,
  aiCoaches,
  coachStyleEnum,
  friendStatusEnum,
  friends,
  goalCategoryEnum,
  goalStatusEnum,
  goals,
  reminders,
  reportPeriodEnum,
  reports,
  tasks,
  userAchievements,
  users,
} from "./schema";

const ALL_TABLES = [
  users,
  goals,
  tasks,
  achievements,
  userAchievements,
  friends,
  reminders,
  reports,
  aiCoaches,
];

/** Хүснэгтийн тохиргоог нэрээр нь авах туслах. */
function columnsOf(table: (typeof ALL_TABLES)[number]) {
  const config = getTableConfig(table);
  return Object.fromEntries(config.columns.map((c) => [c.name, c]));
}

describe("Хүснэгтийн нэршил", () => {
  // Багийн тохиролцоо: ӨС дэх хүснэгт бүр tb_ угтвартай байна.
  // Энэ дүрэм зөрчигдвөл апп нэг нэрээр хайж, ӨС өөр нэртэй байх эрсдэлтэй.
  it("бүх хүснэгт tb_ угтвартай", () => {
    const names = ALL_TABLES.map((t) => getTableConfig(t).name);

    expect(names).toHaveLength(9);
    for (const name of names) {
      expect(name.startsWith("tb_"), `"${name}" нь tb_ угтваргүй байна`).toBe(
        true,
      );
    }
  });

  it("хүснэгтийн нэрс хүлээгдэж буй жагсаалттай тохирно", () => {
    const names = ALL_TABLES.map((t) => getTableConfig(t).name).sort();

    expect(names).toEqual([
      "tb_achievements",
      "tb_ai_coaches",
      "tb_friends",
      "tb_goals",
      "tb_reminders",
      "tb_reports",
      "tb_tasks",
      "tb_user_achievements",
      "tb_users",
    ]);
  });
});

describe("Анхны утгын тогтмолууд", () => {
  // Шинэ хэрэглэгч 1-р түвшнээс, энгийн эрхтэй эхэлнэ.
  it("DEFAULT_USER_LEVEL нь 1", () => {
    expect(DEFAULT_USER_LEVEL).toBe(1);
  });

  it("USER_ROLE_DEFAULT нь standard_member", () => {
    expect(USER_ROLE_DEFAULT).toBe("standard_member");
  });

  // Тогтмол ба баганын default хоёр салж явах нь түгээмэл алдаа.
  // Хоёулаа нэг утга заасан байх ёстой.
  it("DEFAULT_USER_LEVEL нь level баганын default-тай тохирно", () => {
    const level = columnsOf(users).level;

    expect(level.hasDefault).toBe(true);
    expect(level.default).toBe(DEFAULT_USER_LEVEL);
  });
});

describe("tb_users баганууд", () => {
  // Бүртгэл и-мэйл ЭСВЭЛ утсаар үүсдэг тул аль нь ч дангаараа заавал биш.
  // Гэхдээ хоёулаа давхцахгүй байх ёстой — нэг хаягаар хоёр бүртгэл болохгүй.
  it("email заавал биш ч давхцахгүй", () => {
    const email = columnsOf(users).email;

    expect(email.notNull).toBe(false);
    expect(email.isUnique).toBe(true);
  });

  it("phone заавал биш ч давхцахгүй", () => {
    const phone = columnsOf(users).phone;

    expect(phone.notNull).toBe(false);
    expect(phone.isUnique).toBe(true);
  });

  // Хоёулаа хоосон бүртгэл үүсвэл тухайн хэрэглэгч рүү дахин хандах арга
  // байхгүй болно (нууц үг сэргээх ч боломжгүй). ӨС түвшинд хориглоно.
  it("и-мэйл, утас хоёулаа хоосон байхыг CHECK хориглоно", () => {
    const { checks } = getTableConfig(users);
    const contact = checks.find((c) => c.name === "tb_users_contact_required");

    expect(contact, "tb_users_contact_required CHECK алга").toBeDefined();
  });

  it("нэр заавал байх", () => {
    expect(columnsOf(users).name.notNull).toBe(true);
  });

  it("xp ба streak тэгээс эхэлнэ", () => {
    const cols = columnsOf(users);

    expect(cols.xp.default).toBe(0);
    expect(cols.streak.default).toBe(0);
  });

  it("нууц үгийн hash заавал байх", () => {
    expect(columnsOf(users).password_hash.notNull).toBe(true);
  });
});

describe("tb_tasks баганууд", () => {
  it("шинэ даалгавар биелээгүй төлөвтэй эхэлнэ", () => {
    expect(columnsOf(tasks).completed.default).toBe(false);
  });

  it("даалгаврын үндсэн XP урамшуулал 10", () => {
    const xpReward = columnsOf(tasks).xp_reward;

    expect(xpReward.notNull).toBe(true);
    expect(xpReward.default).toBe(10);
  });
});

describe("Enum утгууд", () => {
  it("зорилгын ангилал", () => {
    expect(goalCategoryEnum.enumValues).toEqual([
      "study",
      "career",
      "finance",
      "health",
      "personal",
    ]);
  });

  it("зорилгын төлөв", () => {
    expect(goalStatusEnum.enumValues).toEqual([
      "in_progress",
      "completed",
      "abandoned",
    ]);
  });

  it("найзын хүсэлтийн төлөв", () => {
    expect(friendStatusEnum.enumValues).toEqual([
      "pending",
      "accepted",
      "blocked",
    ]);
  });

  it("тайлангийн хугацаа", () => {
    expect(reportPeriodEnum.enumValues).toEqual(["daily", "weekly", "monthly"]);
  });

  it("AI зөвлөхийн хэв маяг", () => {
    expect(coachStyleEnum.enumValues).toEqual(["hard", "low"]);
  });
});

describe("Түлхүүр ба холбоос", () => {
  it("хүснэгт бүр анхдагч түлхүүртэй", () => {
    for (const table of ALL_TABLES) {
      const config = getTableConfig(table);
      const hasSingleColumnPk = config.columns.some((c) => c.primary);
      const hasCompositePk = config.primaryKeys.length > 0;

      expect(
        hasSingleColumnPk || hasCompositePk,
        `"${config.name}" хүснэгт анхдагч түлхүүргүй байна`,
      ).toBe(true);
    }
  });

  it("tb_user_achievements нь хосолсон түлхүүртэй", () => {
    const pks = getTableConfig(userAchievements).primaryKeys;

    expect(pks).toHaveLength(1);
    expect(pks[0].columns.map((c) => c.name).sort()).toEqual([
      "achievement_id",
      "user_id",
    ]);
  });

  // Хэрэглэгч устахад түүний өгөгдөл үлдэж хоцрох ёсгүй.
  it("хэрэглэгчтэй холбоотой хүснэгтүүд cascade-аар устана", () => {
    for (const table of [goals, tasks, friends, reminders, reports, aiCoaches]) {
      const config = getTableConfig(table);
      const userFk = config.foreignKeys.find((fk) =>
        fk.reference().columns.some((c) => c.name === "user_id"),
      );

      expect(userFk, `"${config.name}" дээр user_id FK алга`).toBeDefined();
      expect(userFk!.onDelete, `"${config.name}" FK cascade биш`).toBe(
        "cascade",
      );
    }
  });

  // Зорилго устахад доорх даалгаврууд устахгүй, зөвхөн холбоо нь тасарна.
  it("даалгаврын goal_id нь зорилго устахад null болно", () => {
    const goalFk = getTableConfig(tasks).foreignKeys.find((fk) =>
      fk.reference().columns.some((c) => c.name === "goal_id"),
    );

    expect(goalFk).toBeDefined();
    expect(goalFk!.onDelete).toBe("set null");
  });
});
