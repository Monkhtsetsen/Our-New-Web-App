import type { NextFunction, Request, Response } from "express";

/**
 * Хүлээгдээгүй алдааг барих сүүлчийн давхарга.
 *
 * Express-д алдааны middleware нь ЗААВАЛ дөрвөн параметртэй байх ёстой —
 * Express параметрийн тоогоор нь ялгаж танидаг. `next`-ийг ашиглахгүй ч
 * хасаж болохгүй.
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Жинхэнэ алдааг зөвхөн серверийн лог руу. Хэрэглэгчид stack trace,
  // ӨС-ийн бүтэц, холболтын мөр зэргийг хэзээ ч харуулахгүй.
  console.error("Хүлээгдээгүй алдаа:", error);

  if (res.headersSent) {
    // Хариу илгээж эхэлсэн бол дахин бичиж болохгүй — холболтыг хаана.
    res.end();
    return;
  }

  res.status(500).json({
    error: "Серверийн дотоод алдаа гарлаа. Хэсэг хүлээгээд дахин оролдоно уу.",
  });
}
