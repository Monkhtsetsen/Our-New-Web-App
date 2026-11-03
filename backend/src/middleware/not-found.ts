import type { Request, Response } from "express";

/** Бүртгэлгүй зам руу хандсан тохиолдолд JSON хэлбэрээр 404 буцаана. */
export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    error: `"${req.method} ${req.path}" зам олдсонгүй`,
  });
}
