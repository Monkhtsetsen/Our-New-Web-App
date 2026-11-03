import "dotenv/config";
import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";

function main(): void {
  let env;
  try {
    env = loadEnv();
  } catch (error) {
    // Тохиргооны алдааг ойлгомжтой нэг мөрөөр хэлээд зогсоно. Буруу
    // тохиргоотой сервер асчихаад дараа нь унах нь хамгийн муу хувилбар.
    console.error(
      "Сервер асаж чадсангүй:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }

  const app = createApp({ corsOrigins: env.corsOrigins });

  // 0.0.0.0 заавал. Анхны утга нь зөвхөн localhost бөгөөд тэр тохиолдолд
  // контейнерийн дотроос л хандах боломжтой болно.
  const server = app.listen(env.port, "0.0.0.0", () => {
    console.log(`Backend ${env.port} порт дээр ажиллаж байна (${env.nodeEnv})`);
    console.log(`CORS зөвшөөрөгдсөн: ${env.corsOrigins.join(", ")}`);
  });

  // Docker, Kubernetes нь SIGTERM илгээж зогсоохыг хүсдэг. Шууд таслахгүй,
  // идэвхтэй хүсэлтүүдийг дуусгаад гарна.
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.on(signal, () => {
      console.log(`${signal} хүлээн авлаа — зогсож байна`);
      server.close(() => process.exit(0));
    });
  }
}

main();
