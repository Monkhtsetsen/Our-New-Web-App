import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Энгийн хүсэлтийн хязгаарлагч.
 *
 * Нэвтрэх зам нь нууц үг таах халдлагын гол бай: халдагч нэг хаяг дээр
 * олон мянган нууц үг туршиж чадна. scrypt нь удаан (~300мс) тул энэ нь
 * нэгэн зэрэг серверийг ачаалах арга ч болно.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ХЯЗГААР: тоолуур нь энэ процессын санах ойд байна.
 *
 *   - Сервер дахин асахад тэглэгдэнэ
 *   - Хэд хэдэн хувилбар зэрэг ажиллавал тус бүр өөрийн тоолууртай
 *     болох тул бодит хязгаар нь N дахин сулрана
 *
 * Жинхэнэ production-д Redis зэрэг нийтлэг сан дээр тоолох ёстой.
 * Гэхдээ "юу ч байхгүй"-гээс энэ нь хамаагүй дээр: энгийн скриптээр
 * хийх халдлагыг зогсооно.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export type RateLimitOptions = {
  /** Цонхны урт (миллисекунд). */
  windowMs: number;
  /** Нэг цонхонд зөвшөөрөх дээд хүсэлт. */
  max: number;
};

type Bucket = {
  count: number;
  /** Цонх хэзээ дуусах (эпох, мс). */
  resetAt: number;
};

/** Санах ой хязгааргүй өсөхөөс сэргийлнэ. */
const MAX_TRACKED_KEYS = 10_000;

export function rateLimit({ windowMs, max }: RateLimitOptions): RequestHandler {
  const buckets = new Map<string, Bucket>();

  function prune(now: number): void {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();

    // IP-г түлхүүр болгоно. Нэг сүлжээний ард олон хүн байж болох тул
    // хязгаарыг хэт чанга тавихгүй.
    const key = req.ip ?? "unknown";

    if (buckets.size > MAX_TRACKED_KEYS) prune(now);

    const bucket = buckets.get(key);

    if (bucket === undefined || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({
        error: `Хэт олон удаа оролдлоо. ${retryAfter} секундын дараа дахин оролдоно уу.`,
      });
      return;
    }

    next();
  };
}
