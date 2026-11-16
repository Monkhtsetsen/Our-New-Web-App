/**
 * Хуанлийн өдөртэй ажиллах туслахууд.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ЯАГААД `Date` БИШ, МӨР ВЭ
 *
 * Зорилгын дуусах хугацаа нь ХУАНЛИЙН ӨДӨР — "2026-12-31" гэдэг нь
 * тодорхой секунд биш, өдөр бүхэлдээ. JavaScript-ийн `Date` нь үргэлж
 * цаг хугацааны цэг (UTC миллисекунд) хадгалдаг тул өдрийг түүгээр
 * илэрхийлбэл цагийн бүс хөрвүүлэх үед өдөр нааш цааш шилждэг:
 * `new Date("2026-12-31")` нь UTC шөнө дунд, тэр нь Улаанбаатарт
 * аль хэдийн 2027-01-01-ийн 08:00.
 *
 * Иймээс дуусах хугацааг "YYYY-MM-DD" мөрөөр л хадгална. ӨС дээр ч
 * `date` төрөл (`timestamp` биш), Drizzle ч мөрөөр буцаана.
 *
 * Бонус: тэг нөхөөстэй ISO мөрийг ТЭМДЭГТЭЭР харьцуулахад хуанлийн
 * дараалал нь гарна ("2026-02-09" < "2026-02-10"), тул өдөр
 * харьцуулахад `Date` объект огт хэрэггүй.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * Аппын цагийн бүс.
 *
 * "Өнөөдөр" гэдэг нь хаана байгаагаас шалтгаална. Серверийг UTC дээр
 * ажиллуулдаг тул түүний өдрөөр шийдвэл Улаанбаатарт шөнө дундаас
 * 08:00 хүртэлх хугацаанд өчигдрийг "өнөөдөр" гэж тооцно.
 *
 * Хэрэглэгчид нь Монголд байгаа тул аппын өдрийг Улаанбаатараар
 * тоолно. (Хожим хэрэглэгч тус бүрийн бүсийг хадгалах болно —
 * сануулгын цаг нэмэхэд тэр нь хэрэгтэй болно.)
 */
export const APP_TIME_ZONE = "Asia/Ulaanbaatar";

/** ISO өдрийн хэлбэр: яг дөрөв-хоёр-хоёр цифр. */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type CalendarDate = { year: number; month: number; day: number };

/**
 * "YYYY-MM-DD" мөрийг задлана.
 *
 * Хэлбэр зөв байхад хангалтгүй — 2026-02-30 гэж бичиж болох ч тэр
 * өдөр байхгүй. Тиймээс задалсан утгыг буцаан бүтээж тулгана:
 * `Date.UTC` нь 02-30-ыг 03-02 болгон "нааж" тавьдаг тул ийм
 * нийцгүй утгыг барьж авна.
 *
 * @returns Задалсан өдөр, эсвэл хүчингүй бол `null`
 */
export function parseIsoDate(value: string): CalendarDate | null {
  if (!ISO_DATE_PATTERN.test(value)) return null;

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));

  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

/** Өдрийг "YYYY-MM-DD" болгоно. */
export function toIsoDate({ year, month, day }: CalendarDate): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/**
 * Аппын цагийн бүсээр өнөөдөр.
 *
 * `Intl`-ийн хэсгүүдээр угсарна. `toLocaleDateString`-ийн ямар нэг
 * хэлний кодоос ISO хэлбэр гарахыг найдвал хөрвүүлэлтийн өчүүхэн
 * ялгаа мууг нь үзүүлнэ — хэсгүүдийг нэрээр нь авах нь эргэлзээгүй.
 */
export function todayInAppZone(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const find = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${find("year")}-${find("month")}-${find("day")}`;
}
