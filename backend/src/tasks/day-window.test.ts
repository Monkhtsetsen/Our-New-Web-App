import { describe, expect, it } from "vitest";
import {
  dayStartUtc,
  dayWindowUtc,
  nextIsoDate,
  offsetMinutesAt,
} from "./day-window.js";

describe("offsetMinutesAt", () => {
  /**
   * Улаанбаатар нь UTC+8, зуны цаггүй.
   *
   * Монгол 2015-2016 онд зуны цаг хэрэглэж байсан бөгөөд дараа нь
   * болиулсан. Тиймээс ӨНӨӨГИЙН өдрүүдэд офсет нь үргэлж +480.
   */
  it("UTC+8 буюу 480 минут", () => {
    for (const iso of [
      "2026-01-15T00:00:00Z",
      "2026-06-15T00:00:00Z", // зуны цаг байвал энд өөр байх байв
      "2026-11-20T12:34:56Z",
      "2027-03-01T23:59:59Z",
    ]) {
      expect(offsetMinutesAt(new Date(iso)), iso).toBe(480);
    }
  });

  /** Миллисекунд нь офсетийн тооцоонд оролцох ёсгүй. */
  it("миллисекундээс хамаарахгүй", () => {
    expect(offsetMinutesAt(new Date("2026-11-20T12:34:56.789Z"))).toBe(480);
  });
});

describe("dayStartUtc", () => {
  /**
   * ГОЛ ТЕСТ.
   *
   * Улаанбаатарын 2026-11-20-ны шөнө дунд нь UTC дээр өмнөх өдрийн
   * 16:00. Серверийн UTC шөнө дундаар шүүвэл найман цагийн зөрүүтэй
   * буруу даалгавар гарна.
   */
  it("Улаанбаатарын шөнө дундыг UTC болгоно", () => {
    expect(dayStartUtc("2026-11-20").toISOString()).toBe(
      "2026-11-19T16:00:00.000Z",
    );
  });

  it("сарын зааг", () => {
    expect(dayStartUtc("2026-12-01").toISOString()).toBe(
      "2026-11-30T16:00:00.000Z",
    );
  });

  it("жилийн зааг", () => {
    expect(dayStartUtc("2027-01-01").toISOString()).toBe(
      "2026-12-31T16:00:00.000Z",
    );
  });

  it("үсрэх жилийн 02-29", () => {
    expect(dayStartUtc("2028-02-29").toISOString()).toBe(
      "2028-02-28T16:00:00.000Z",
    );
  });

  it("буруу өдөрт алдаа шиднэ", () => {
    for (const bad of ["2026-13-01", "2026-02-30", "өнөөдөр", "2026-1-1", ""]) {
      expect(() => dayStartUtc(bad), bad).toThrow();
    }
  });
});

describe("nextIsoDate", () => {
  it("дараагийн өдөр", () => {
    expect(nextIsoDate("2026-11-20")).toBe("2026-11-21");
  });

  it("сарын сүүлийн өдөр", () => {
    expect(nextIsoDate("2026-11-30")).toBe("2026-12-01");
    expect(nextIsoDate("2026-01-31")).toBe("2026-02-01");
  });

  it("жилийн сүүлийн өдөр", () => {
    expect(nextIsoDate("2026-12-31")).toBe("2027-01-01");
  });

  it("үсрэх жил", () => {
    expect(nextIsoDate("2028-02-28")).toBe("2028-02-29");
    expect(nextIsoDate("2028-02-29")).toBe("2028-03-01");
  });

  it("үсрэх биш жил", () => {
    expect(nextIsoDate("2026-02-28")).toBe("2026-03-01");
  });
});

describe("dayWindowUtc", () => {
  it("яг 24 цаг", () => {
    const { start, end } = dayWindowUtc("2026-11-20");

    expect(start.toISOString()).toBe("2026-11-19T16:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-20T16:00:00.000Z");
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  /**
   * ХАГАС ХААЛТТАЙ ИНТЕРВАЛ.
   *
   * Хоёр талыг нь хаавал (`<=`) шөнө дундын даалгавар хоёр өдөрт
   * хоёуланд харагдана. Энэ тест яг тэр заагийг барина.
   */
  it("эхлэл орно, дуусгавар орохгүй", () => {
    const { start, end } = dayWindowUtc("2026-11-20");

    const inside = (iso: string): boolean => {
      const t = new Date(iso).getTime();
      return t >= start.getTime() && t < end.getTime();
    };

    // Улаанбаатарын 2026-11-20-ны 00:00 — орно
    expect(inside("2026-11-19T16:00:00Z")).toBe(true);
    // Улаанбаатарын 2026-11-20-ны 23:59:59 — орно
    expect(inside("2026-11-20T15:59:59Z")).toBe(true);
    // Улаанбаатарын 2026-11-21-ны 00:00 — ОРОХГҮЙ
    expect(inside("2026-11-20T16:00:00Z")).toBe(false);
    // Улаанбаатарын 2026-11-19-ны 23:59:59 — ОРОХГҮЙ
    expect(inside("2026-11-19T15:59:59Z")).toBe(false);
  });

  /** Дараалсан өдрүүдийн интервал зөрөхгүй, нүх ч үлдэхгүй. */
  it("дараалсан өдрүүд залгаа", () => {
    const first = dayWindowUtc("2026-11-20");
    const second = dayWindowUtc("2026-11-21");

    expect(first.end.getTime()).toBe(second.start.getTime());
  });
});
