import { describe, expect, it } from "vitest";
import {
  APP_TIME_ZONE,
  describeDeadline,
  formatGoalDate,
  todayInAppZone,
} from "./dates";

const TODAY = "2026-11-03";

describe("todayInAppZone", () => {
  it("ISO хэлбэрээр буцаана", () => {
    expect(todayInAppZone()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  /**
   * Backend-ийн адил тест.
   *
   * Хоёр тал ижил "өнөөдөр"-ийг гаргаж байх ёстой: үгүй бол сервер
   * хүлээж авсан хугацааг хөтөч "хэтэрсэн" гэж харуулна.
   */
  it("Улаанбаатарын өдрөөр тоолно, UTC-ээр биш", () => {
    const evening = new Date("2026-11-03T17:00:00Z");

    expect(evening.toISOString().slice(0, 10)).toBe("2026-11-03");
    expect(todayInAppZone(evening)).toBe("2026-11-04");
  });

  it("backend-тэй ижил цагийн бүс", () => {
    expect(APP_TIME_ZONE).toBe("Asia/Ulaanbaatar");
  });
});

describe("formatGoalDate", () => {
  it("монгол хэлээр бичнэ", () => {
    expect(formatGoalDate("2026-11-10", TODAY)).toBe("11 дүгээр сарын 10");
    expect(formatGoalDate("2026-06-01", TODAY)).toBe("6 дугаар сарын 1");
  });

  /** Ижил жилд жилийг нуруулдах нь дэмий — хэрэглэгч аль хэдийн мэднэ. */
  it("ижил жилд жилийг бичихгүй", () => {
    expect(formatGoalDate("2026-12-31", TODAY)).not.toContain("2026");
  });

  it("өөр жилд жилийг бичнэ", () => {
    expect(formatGoalDate("2027-01-15", TODAY)).toBe(
      "2027 оны 1 дүгээр сарын 15",
    );
  });

  it("тэг нөхөөсийг дэлгэц дээр үлдээхгүй", () => {
    expect(formatGoalDate("2026-11-05", TODAY)).toBe("11 дүгээр сарын 5");
  });
});

describe("describeDeadline", () => {
  it("өнөөдөр", () => {
    const info = describeDeadline(TODAY, TODAY);

    expect(info.label).toBe("Өнөөдөр дуусна");
    expect(info.overdue).toBe(false);
    expect(info.soon).toBe(true);
  });

  it("маргааш", () => {
    expect(describeDeadline("2026-11-04", TODAY).label).toBe("Маргааш дуусна");
  });

  it("үлдсэн хоногийг тоолно", () => {
    expect(describeDeadline("2026-11-10", TODAY).label).toBe("7 хоног үлдсэн");
  });

  it("долоо хоногоос хэтэрвэл ойрхон гэж тооцохгүй", () => {
    expect(describeDeadline("2026-11-10", TODAY).soon).toBe(true);
    expect(describeDeadline("2026-11-11", TODAY).soon).toBe(false);
  });

  it("хэтэрсэн хугацааг тэмдэглэнэ", () => {
    const info = describeDeadline("2026-11-01", TODAY);

    expect(info.overdue).toBe(true);
    expect(info.label).toBe("Хугацаа 2 хоногоор хэтэрсэн");
  });

  it("нэг хоногийн зөрөөг нэгдүгээр тоогоор бичнэ", () => {
    expect(describeDeadline("2026-11-02", TODAY).label).toBe(
      "Хугацаа 1 хоногоор хэтэрсэн",
    );
  });

  /**
   * САР, ЖИЛ ДАМЖСАН ТООЛОЛТ.
   *
   * Хоногийн зөрөөг "өдрийн дугаарыг хасах"-аар тооцвол энэ тестүүд
   * унана. Иймээс UTC шөнө дундаар хөрвүүлж тоолдог.
   */
  it("сар дамжсан ч зөв тоолно", () => {
    expect(describeDeadline("2026-12-01", "2026-11-28").label).toBe(
      "3 хоног үлдсэн",
    );
  });

  it("жил дамжсан ч зөв тоолно", () => {
    expect(describeDeadline("2027-01-02", "2026-12-30").label).toBe(
      "3 хоног үлдсэн",
    );
  });

  it("үсрэх жилийн хоёрдугаар сарыг зөв тоолно", () => {
    // 2028 нь үсрэх жил — 02-29 байдаг тул зөрөө нь 2 хоног.
    expect(describeDeadline("2028-03-01", "2028-02-28").label).toBe(
      "2 хоног үлдсэн",
    );
  });

  it("яг өдрийг хамт буцаана", () => {
    expect(describeDeadline("2026-11-10", TODAY).date).toBe(
      "11 дүгээр сарын 10",
    );
  });
});
