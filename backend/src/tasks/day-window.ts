/**
 * "Өнөөдөр" гэдгийг цаг хугацааны интервал болгож хөрвүүлэх.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ЯАГААД ЭНЭ НЬ ЗОРИЛГЫН ХУГАЦААНААС ХҮНД ВЭ
 *
 * Зорилгын `deadline` нь `date` багана — "2026-11-20" гэсэн хуанлийн
 * өдөр, тэмдэгтээр харьцуулахад хангалттай.
 *
 * Даалгаврын `due_date` нь `timestamp` — тодорхой АГШИН. Иймээс
 * "өнөөдрийн даалгаврууд" гэдэг нь нэг өдөр биш, ИНТЕРВАЛ:
 *
 *   [Улаанбаатарын өнөөдөр 00:00,  Улаанбаатарын маргааш 00:00)
 *
 * Улаанбаатар нь UTC+8 тул 2026-11-20-ны интервал нь UTC дээр
 * 2026-11-19T16:00Z-ээс 2026-11-20T16:00Z хүртэл. Серверийн UTC
 * өдрөөр шүүвэл найман цагийн зөрүүтэй буруу даалгавар гарна.
 *
 * Интервал нь ХАГАС ХААЛТТАЙ — эхлэл орно, дуусгавар орохгүй.
 * Хоёр талыг нь хаавал шөнө дундын даалгавар хоёр өдөрт хоёуланд
 * харагдана.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * `APP_TIME_ZONE`, `parseIsoDate` нь `goals/dates.ts` дотор байна.
 * Тэр нь аппын хэмжээний туслах болсон тул хожим `src/time/` рүү
 * зөөх нь зөв — одоо зөөвөл багийнхны лабораторийн тестүүдийн
 * импортыг хөндөх тул хүлээв.
 */

import { APP_TIME_ZONE, parseIsoDate, toIsoDate } from "../goals/dates.js";

const MS_PER_MINUTE = 60_000;

/**
 * Тухайн агшинд аппын бүсийн офсет, минутаар.
 *
 * Улаанбаатарт үргэлж +480 (UTC+8) — зуны цаг байхгүй. Гэхдээ
 * тоймлосон тогтмол бичихгүй: агшин бүрт `Intl`-ээс асууна.
 * Ингэснээр бүс солигдвол (эсвэл бүсийг хэрэглэгчийн тохиргоо
 * болговол) код өөрөө зөв хэвээр байна.
 */
export function offsetMinutesAt(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);

  const get = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  // Бүсийн "хана дээрх" цагийг UTC гэж уншвал офсет нь зөрүү болно.
  const wall = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );

  // `wall` нь миллисекундгүй тул агшнаа мөн секунд хүртэл тоймлоно.
  const truncated = Math.floor(instant.getTime() / 1000) * 1000;

  return Math.round((wall - truncated) / MS_PER_MINUTE);
}

/**
 * Аппын бүсээр тухайн өдрийн шөнө дунд, UTC агшин болгож.
 *
 * Хоёр удаа залруулна: нэг дэх нь UTC шөнө дундын офсетээр, хоёр
 * дахь нь гарсан агшны өөрийнх нь офсетээр. Улаанбаатарт хоёр нь
 * ижил, харин зуны цагтай бүсэд өдрийн эхэнд офсет солигдох
 * тохиолдол байдаг тул ерөнхий зөв байдлыг хадгална.
 *
 * @throws Хэлбэр буруу, эсвэл хуанлид байхгүй өдөр
 */
export function dayStartUtc(isoDate: string): Date {
  const parsed = parseIsoDate(isoDate);

  if (parsed === null) {
    throw new Error(`Өдөр "YYYY-MM-DD" хэлбэртэй байх ёстой: ${isoDate}`);
  }

  const midnightAsUtc = Date.UTC(parsed.year, parsed.month - 1, parsed.day);

  const first =
    midnightAsUtc - offsetMinutesAt(new Date(midnightAsUtc)) * MS_PER_MINUTE;
  const second =
    midnightAsUtc - offsetMinutesAt(new Date(first)) * MS_PER_MINUTE;

  return new Date(second);
}

/** Дараагийн хуанлийн өдөр. Сар, жилийн зааг, үсрэх жилийг дагана. */
export function nextIsoDate(isoDate: string): string {
  const parsed = parseIsoDate(isoDate);

  if (parsed === null) {
    throw new Error(`Өдөр "YYYY-MM-DD" хэлбэртэй байх ёстой: ${isoDate}`);
  }

  const next = new Date(
    Date.UTC(parsed.year, parsed.month - 1, parsed.day + 1),
  );

  return toIsoDate({
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  });
}

/**
 * Өдрийн интервал: `start` орно, `end` ОРОХГҮЙ.
 *
 * SQL дээр `due_date >= start AND due_date < end` гэж хэрэглэнэ.
 * `<=` гэж бичвэл маргаашийн шөнө дундын даалгавар өнөөдөр гарна.
 */
export function dayWindowUtc(isoDate: string): { start: Date; end: Date } {
  return {
    start: dayStartUtc(isoDate),
    end: dayStartUtc(nextIsoDate(isoDate)),
  };
}
