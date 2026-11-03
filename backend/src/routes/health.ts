import { Router } from "express";
import { sql } from "drizzle-orm";
import { getDb } from "../db/index.js";

export const healthRouter: Router = Router();

const startedAt = Date.now();

/**
 * Амьд эсэх (liveness).
 *
 * ӨС рүү ХАНДАХГҮЙ. Энэ зам нь "процесс амьд, хүсэлт хүлээж авч байна"
 * гэдгийг л хэлнэ. ӨС унасан ч энэ 200 буцаана — тэгж байж л асуудлыг
 * оношлох боломжтой.
 *
 * Kubernetes-ийн livenessProbe үүнийг ашиглана (Лаб 9).
 */
healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
  });
});

/**
 * Үйлчилгээ үзүүлэхэд бэлэн эсэх (readiness).
 *
 * ӨС рүү хамгийн хямд хүсэлт илгээж холболт ажиллаж байгааг шалгана.
 * Бэлэн биш бол 503 — Kubernetes ийм үед трафик илгээхээ зогсооно.
 */
healthRouter.get("/ready", async (_req, res) => {
  try {
    await getDb().execute(sql`select 1`);
    res.json({ status: "ready", database: "connected" });
  } catch (error) {
    console.error("Readiness шалгалт амжилтгүй:", error);
    res.status(503).json({ status: "not_ready", database: "unavailable" });
  }
});
