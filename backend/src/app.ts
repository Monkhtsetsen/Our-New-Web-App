import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { healthRouter } from "./routes/health.js";
import { createAuthRouter } from "./routes/auth.js";
import { createUsersRouter } from "./routes/users.js";
import type { AuthConfig } from "./auth/session.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";

export type AppOptions = AuthConfig & {
  /** Хөтчөөс хандахыг зөвшөөрөх эх үүсвэрүүд. */
  corsOrigins: string[];
};

/**
 * Express аппыг угсарна.
 *
 * Сервер асаах ажлыг энд хийхгүй (`index.ts` хариуцна). Ингэснээр тест
 * нь порт эзлэхгүйгээр аппыг шууд дуудаж чадна.
 */
export function createApp({
  corsOrigins,
  jwtSecret,
  cookieSecure,
}: AppOptions): Express {
  const app = express();
  const auth: AuthConfig = { jwtSecret, cookieSecure };

  // Хөтөч өөр порт дээрх API руу хандахад CORS шаардлагатай:
  // frontend 3000, backend 4000 — өөр origin гэж тооцогдоно.
  //
  // `credentials: true` нь сессийн cookie-г дамжуулахад ЗААВАЛ хэрэгтэй.
  // Үүнтэй хамт `origin` нь хэзээ ч "*" байж болохгүй — хөтөч зөвшөөрөхгүй,
  // зөвшөөрсөн ч дурын сайт манай API руу хэрэглэгчийн нэрийн өмнөөс
  // хандах байв. Тиймээс зөвшөөрөгдсөн хаягуудыг нэрээр нь жагсаана.
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );

  // JSON биеийн дээд хэмжээ. Хязгаарлахгүй бол хэн ч асар том бие
  // илгээж санах ойг дүүргэх боломжтой.
  app.use(express.json({ limit: "100kb" }));

  // Сессийн token нь HttpOnly cookie дотор ирдэг. Express 5 нь cookie-г
  // өөрөө задалдаггүй тул энэ middleware хэрэгтэй.
  app.use(cookieParser());

  app.use("/health", healthRouter);
  app.use("/api/auth", createAuthRouter(auth));
  app.use("/api/users", createUsersRouter(auth));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
