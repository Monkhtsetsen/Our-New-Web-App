import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// .env.local файлыг унших
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
