/**
 * ӨС-рүү жижиг хандалт — "сэрүүн" байлгах, бас эрүүл мэндийг шалгах.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ЯАГААД ЭНЭ ХЭРЭГТЭЙ ВЭ
 *
 * Supabase-ийн үнэгүй төлөвлөгөө нь ДОЛОО ХОНОГ хөдөлгөөнгүй байсан
 * төслийг зогсоодог. Зогссон төсөл нь дараах алдаа буцаана:
 *
 *   PostgresError: (ENOTFOUND) tenant/user postgres.xxxx not found
 *
 * Хичээлийн явцад хоёр долоо хоног кодод хүрэлгүй байхад яг тэр нь
 * тохиолдсон. Өдөр бүр нэг хүсэлт илгээх нь долоо хоногийн хязгаарт
 * хүрэхээс сэргийлнэ.
 *
 * ЗӨВХӨН УНШИНА. Хиймэл мөр бичиж "хөдөлгөөн" үүсгэх нь өгөгдлийг
 * хогжуулна — уншилт нь хөдөлгөөнд адилхан тооцогддог.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Хоёр дахь үүрэг нь ОНОШ: ӨС холбогдож байна уу, миграц хэрэгжсэн
 * үү гэдгийг өдөр бүр хэлнэ. Иймээс холбогдож чадаагүй бол 1-ээр
 * гарна — GitHub Actions тэр даруй мэйл илгээнэ.
 *
 * Хэрэглэх:  npm run db:ping
 */

// Локал дээр `.env`-ээс уншина; `src/index.ts` ч ижил аргаар хийдэг.
//
// GitHub Actions дээр `.env` файл байхгүй бөгөөд dotenv нь түүнд
// дуугарахгүй — утга нь secret-ээс орчны хувьсагчаар ирнэ. Бас
// dotenv нь АЛЬ ХЭДИЙН тохируулсан хувьсагчийг дардаггүй тул
// CI-ийн утга үргэлж дээгүүр байна.
import "dotenv/config";
import postgres from "postgres";

/** Хүлээх дээд хугацаа. Унтарсан ӨС-г хэдэн минут хүлээх нь дэмий. */
const CONNECT_TIMEOUT_SECONDS = 20;

const url = process.env.DATABASE_URL;

if (url === undefined || url.length === 0) {
  console.error(
    "DATABASE_URL тохируулаагүй байна.\n" +
      "Локал дээр: backend/.env файлд бич.\n" +
      "GitHub Actions дээр: Settings → Secrets → Actions дотор нэм.",
  );
  process.exit(1);
}

// prepare: false — Supabase-ийн pooler нь prepared statement-ийг
// дэмждэггүй. max: 1 — нэг хүсэлтэд хөлийн сан хэрэггүй.
const sql = postgres(url, {
  prepare: false,
  max: 1,
  idle_timeout: 5,
  connect_timeout: CONNECT_TIMEOUT_SECONDS,
  onnotice: () => {},
});

/**
 * Онош авах туслах.
 *
 * Нэг ч оношийн query нь гол зорилгыг (холболт) унагаах ёсгүй:
 * `drizzle` схем байхгүй, хүснэгт үүсээгүй байж болно — тэр нь
 * "ӨС унтарсан" гэсэн утга БИШ.
 */
async function tryQuery<T>(
  label: string,
  run: () => Promise<T>,
): Promise<T | null> {
  try {
    return await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`   ${label}: уншиж чадсангүй (${message})`);
    return null;
  }
}

try {
  // Гол хандалт. Үүнээс цаашхи бүхэн нь онош.
  const [alive] = await sql<{ at: Date; db: string }[]>`
    select now() as at, current_database() as db
  `;

  console.log("ӨС хариулав");
  console.log(`   өгөгдлийн сан: ${alive?.db ?? "?"}`);
  console.log(`   серверийн цаг: ${alive?.at.toISOString() ?? "?"}`);

  // Миграц хэрэгжсэн эсэх. drizzle-kit нь журналаа `drizzle` схемд
  // хадгалдаг; схем байхгүй бол миграц хэзээ ч хэрэгжээгүй гэсэн үг.
  //
  // `created_at` нь миграцыг ХЭРЭГЖҮҮЛСЭН цаг БИШ — `_journal.json`
  // дотор бичигдсэн, файлыг ГАРГАСАН цаг. Иймээс шинэ контейнер ч
  // хуучин огноо хэлнэ. Шошгыг үүний дагуу нэрлэсэн: "хэрэгжсэн
  // огноо" гэж бичвэл оношлогчийг ӨС хоцорсон гэж бууруу бодуулна.
  const migrations = await tryQuery("миграцын журнал", async () => {
    const rows = await sql<{ n: number; last: Date | null }[]>`
      select count(*)::int as n, max(to_timestamp(created_at / 1000)) as last
      from drizzle.__drizzle_migrations
    `;

    // Хураангуй query нь үргэлж нэг мөр буцаана — гэхдээ
    // `noUncheckedIndexedAccess` үүнийг мэдэхгүй тул нөхөж өгнө.
    return rows[0] ?? { n: 0, last: null };
  });

  if (migrations !== null) {
    console.log(`   хэрэгжсэн миграц: ${migrations.n}`);
    if (migrations.last !== null) {
      console.log(
        `   сүүлчийн миграцыг гаргасан: ${migrations.last.toISOString()}`,
      );
    }
  }

  // Хүснэгтүүд үнэхээр байгаа эсэх. Миграц хэрэгжсэн ч хүснэгт
  // алга бол ямар нэг зүйл буруу.
  const tables = await tryQuery("хүснэгтүүд", async () => {
    const rows = await sql<{ n: number }[]>`
      select count(*)::int as n
      from information_schema.tables
      where table_schema = 'public' and table_name like 'tb_%'
    `;
    return rows[0]?.n ?? 0;
  });

  if (tables !== null) {
    console.log(`   tb_ хүснэгт: ${tables}`);

    if (tables === 0) {
      console.log("");
      console.log(
        "Хүснэгт алга. Миграцыг хэрэгжүүлэх шаардлагатай:  npm run db:migrate",
      );
    }
  }
} catch (error) {
  // Холбогдож чадсангүй — энэ нь ЖИНХЭНЭ алдаа.
  console.error("ӨС-рүү холбогдож чадсангүй.");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(
    "Шалгах зүйлс:\n" +
      "  - Supabase төсөл зогссон эсвэл устсан эсэх (dashboard-аас хар)\n" +
      "  - DATABASE_URL зөв эсэх (нууц үг, порт, хост)\n" +
      "  - Session pooler-ийн хаягийг хэрэглэж байгаа эсэх",
  );

  await sql.end({ timeout: 5 }).catch(() => {});
  process.exit(1);
}

await sql.end({ timeout: 5 });
