/**
 * Дуусах хугацааг харуулах.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * "ӨНӨӨДӨР" ХААНААС ИРЭХ ВЭ
 *
 * Хугацаа хэтэрсэн эсэхийг мэдэхийн тулд өнөөдрийг мэдэх шаардлагатай.
 * Гэтэл үүнийг зурах үед (`new Date()`) тооцоолбол сервер нэг өдөр,
 * хөтөч өөр өдөр гаргаж, React-ийн hydration зөрөөд алдаа бичнэ.
 *
 * Тиймээс өнөөдрийг СЕРВЕР талд нэг удаа тооцоод доош дамжуулна
 * (`app/goals/page.tsx`-ийг хар). Хоёр тал ижил мөрөөс ижил зүйл
 * зурна. Шөнө дунд хуудас нээлттэй байвал хоцрох боловч дараагийн
 * `router.refresh()` түүнийг цэгцэлнэ.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/** Backend-ийн `APP_TIME_ZONE`-тэй ижил байх ёстой. */
export const APP_TIME_ZONE = "Asia/Ulaanbaatar";

/**
 * Монгол хэлний сарын нэрс.
 *
 * `Intl`-ийн `mn` хэлний өгөгдөл бүх Node, бүх хөтөч дээр байдаггүй
 * бөгөөд байсан ч "дүгээр/дугаар" дагаврыг зөв тавьдаггүй. Арван хоёр
 * мөрийг гараар бичих нь илүү үнэн.
 */
const MONTH_NAMES = [
  "1 дүгээр сар",
  "2 дугаар сар",
  "3 дугаар сар",
  "4 дүгээр сар",
  "5 дугаар сар",
  "6 дугаар сар",
  "7 дугаар сар",
  "8 дугаар сар",
  "9 дүгээр сар",
  "10 дугаар сар",
  "11 дүгээр сар",
  "12 дугаар сар",
] as const;

/** Хэрэглэгчид "ойрхон" гэж тоолох хязгаар. */
const SOON_DAYS = 7;

/** Аппын цагийн бүсээр өнөөдөр, "YYYY-MM-DD" хэлбэрээр. */
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

/**
 * Хоёр ISO өдрийн хоорондох бүтэн хоногийн тоо.
 *
 * Хоёуланг нь UTC шөнө дунд гэж үзнэ — ингэснээр зуны цаг, бүсийн
 * хагас цагийн зөрөө зэрэг нь тооцоонд огт оролцохгүй, зөрөө нь
 * яг бүтэн хоногоор гарна.
 */
function daysBetween(from: string, to: string): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const utc = (iso: string): number =>
    Date.UTC(
      Number(iso.slice(0, 4)),
      Number(iso.slice(5, 7)) - 1,
      Number(iso.slice(8, 10)),
    );

  return Math.round((utc(to) - utc(from)) / MS_PER_DAY);
}

/** Өдрийг уншихад ойлгомжтой болгоно. Ижил жилд жилийг нуруулдахгүй. */
export function formatGoalDate(deadline: string, today: string): string {
  const month = MONTH_NAMES[Number(deadline.slice(5, 7)) - 1] ?? "";
  const day = Number(deadline.slice(8, 10));
  const year = deadline.slice(0, 4);

  if (year === today.slice(0, 4)) {
    return `${month}ын ${day}`;
  }

  return `${year} оны ${month}ын ${day}`;
}

export type DeadlineInfo = {
  /** Жагсаалтад гарах гол текст. */
  label: string;
  /** Яг өдөр — хажууд, эсвэл `title`-д хэрэглэнэ. */
  date: string;
  /**
   * Хугацаа хэтэрсэн эсэх.
   *
   * Зөвхөн ӨНГӨ шийдэхгүй — текст нь өөрөө "хэтэрсэн" гэж хэлж,
   * дүрс нь хамт гарна. WCAG 1.4.1 нь утгыг өнгөөр дамжуулахыг
   * хориглодог: өнгө сохор хэрэглэгч, хар цагаан хэвлэлт, гэрэлтэй
   * дэлгэц гурав бүгд өнгийг үгүй хийж чадна.
   */
  overdue: boolean;
  /** Хугацаа нь ойртсон эсэх (долоо хоногийн дотор). */
  soon: boolean;
};

/**
 * Дуусах хугацааг хүний хэлээр.
 *
 * "2026-11-10" гэснээс "7 хоногийн дараа" нь хамаагүй хэрэгтэй:
 * зорилгодоо төвлөрөхөд үлдсэн хугацаа нь өдрийн нэрнээс чухал.
 */
export function describeDeadline(
  deadline: string,
  today: string,
): DeadlineInfo {
  const date = formatGoalDate(deadline, today);
  const days = daysBetween(today, deadline);

  if (days < 0) {
    const late = Math.abs(days);
    return {
      label: late === 1 ? "Хугацаа 1 хоногоор хэтэрсэн" : `Хугацаа ${late} хоногоор хэтэрсэн`,
      date,
      overdue: true,
      soon: false,
    };
  }

  if (days === 0) {
    return { label: "Өнөөдөр дуусна", date, overdue: false, soon: true };
  }

  if (days === 1) {
    return { label: "Маргааш дуусна", date, overdue: false, soon: true };
  }

  if (days <= SOON_DAYS) {
    return {
      label: `${days} хоног үлдсэн`,
      date,
      overdue: false,
      soon: true,
    };
  }

  return { label: `${days} хоног үлдсэн`, date, overdue: false, soon: false };
}
