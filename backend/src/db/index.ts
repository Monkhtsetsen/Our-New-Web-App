import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
import * as relations from "./relations.js";

/**
 * ӨС-ийн холболт.
 *
 * Холболтыг модуль ачаалагдах үед биш, ЭХЛЭЭД ХЭРЭГЛЭХ үед үүсгэнэ.
 * Ингэсний гурван шалтгаан:
 *
 *   1. `/health` зам ӨС-гүйгээр ажиллах ёстой. Эс бөгөөс ӨС унасан үед
 *      сервер өөрөө асаж чадахгүй болж, асуудлыг оношлох ч аргагүй болно.
 *   2. Нэгж тест бичихэд жинхэнэ ӨС шаардахгүй.
 *   3. Container асах үед ӨС хараахан бэлэн болоогүй байж болно.
 */

type Database = ReturnType<typeof createClient>;

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL тохируулаагүй байна. ӨС рүү хандах боломжгүй.",
    );
  }

  // prepare: false — Supabase-ийн pgBouncer (transaction pooling горим)
  // нь prepared statement-ийг дэмждэггүй.
  const client = postgres(connectionString, { prepare: false });

  return drizzle(client, { schema: { ...schema, ...relations } });
}

let cached: Database | null = null;

export function getDb(): Database {
  cached ??= createClient();
  return cached;
}

export * from "./schema.js";
