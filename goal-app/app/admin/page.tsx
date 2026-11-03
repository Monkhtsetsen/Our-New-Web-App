import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getSessionUser } from "@/src/lib/api-server";

export const metadata: Metadata = {
  title: "Админ — Goal App",

  /**
   * Хайлтын системд индексэлэхгүй байхыг хэлнэ.
   *
   * Энэ нь robots.txt-ээс өөр, илүү хүчтэй зүйл: robots.txt нь зөвхөн
   * "бүү уншаарай" гэж хэлдэг бол noindex нь "уншсан ч үр дүнд бүү
   * гаргаарай" гэнэ. Хуудас гаднаас холбоостой байсан ч индексэд
   * орохгүй.
   */
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

/**
 * Админы хуудас.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ХАМГААЛАЛТ ГУРВАН ДАВХАРГАТАЙ
 *
 *   1. `proxy.ts` — cookie огт байхгүй бол нэвтрэх хуудас руу
 *   2. ЭНЭ ФАЙЛ — СЕРВЕР дээр backend-ээс эрхийг асууж, admin биш бол
 *      404 буцаана
 *   3. Backend — ямар ч API хүсэлт дээр эрхийг дахин шалгана
 *
 * Хоёрдугаар давхарга нь гол нь. Энэ шалгалт хөтөч дээр биш, СЕРВЕР
 * дээр ажиллана — тиймээс JavaScript унтраах, DevTools нээх, API руу
 * шууд хүсэлт илгээх зэргээр тойрох боломжгүй. Хэрэглэгчийн хөтөч рүү
 * админы агуулга огт илгээгдэхгүй.
 *
 * 403 биш 404 буцааж байгаа нь санаатай: 403 нь "энд ямар нэг зүйл
 * байна, чамд эрх алга" гэж хэлж өгдөг. 404 бол юу ч хэлэхгүй.
 * (robots.txt нь энэ замыг аль хэдийн зарласан тул энэ нь төгс
 * нуулт биш — гэхдээ илүүг хэлэх шалтгаан алга.)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export default function AdminPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-xl">
        {/*
          Эрхийн шалгалт нь cookie уншихыг шаарддаг тул урьдчилан
          бэлтгэх боломжгүй — хүсэлт ирэх үед л хийгдэнэ.
        */}
        <Suspense fallback={<Checking />}>
          <AdminGate />
        </Suspense>
      </div>
    </div>
  );
}

function Checking() {
  return (
    <p className="text-sm text-zinc-500 dark:text-zinc-500" aria-busy="true">
      Эрх шалгаж байна…
    </p>
  );
}

async function AdminGate() {
  const user = await getSessionUser();

  if (user === null) {
    redirect("/login?next=/admin");
  }

  if (user.role !== "admin") {
    notFound();
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Админ
      </h1>
      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {user.name} — <code>admin</code> эрхтэй нэвтэрсэн.
      </p>

      <div className="mt-8 rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Удирдлагын хэрэгслүүд хараахан нэмэгдээгүй байна. Нэмэх үед
          эрхийн шалгалтыг хуудас бүр дээр биш,{" "}
          <strong className="font-medium text-zinc-900 dark:text-zinc-100">
            backend-ийн зам бүр дээр
          </strong>{" "}
          давтаж хийнэ — энэ хуудсыг тойрч API руу шууд хандах боломжтой
          хэвээр байгаа.
        </p>
      </div>
    </>
  );
}
