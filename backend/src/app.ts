import express, { type Express } from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";

export type AppOptions = {
  /** Хөтчөөс хандахыг зөвшөөрөх эх үүсвэрүүд. */
  corsOrigins: string[];
};

/**
 * Express аппыг угсарна.
 *
 * Сервер асаах ажлыг энд хийхгүй (`index.ts` хариуцна). Ингэснээр тест
 * нь порт эзлэхгүйгээр аппыг шууд дуудаж чадна.
 */
export function createApp({ corsOrigins }: AppOptions): Express {
  const app = express();

  // Хөтөч өөр порт дээрх API руу хандахад CORS шаардлагатай:
  // frontend 3000, backend 4000 — өөр origin гэж тооцогдоно.
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );

  // JSON биеийн дээд хэмжээ. Хязгаарлахгүй бол хэн ч асар том бие
  // илгээж санах ойг дүүргэх боломжтой.
  app.use(express.json({ limit: "100kb" }));

  app.use("/health", healthRouter);
  app.use("/api/auth", authRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
