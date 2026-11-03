import type { Metadata } from "next";

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
 * ЭНЭ ХУУДАС ОДООГООР ХАМГААЛАГДААГҮЙ.
 *
 * Хэн ч хаягаар нь шууд орох боломжтой. Шалтгаан нь нэвтрэх, сесс
 * хараахан хийгдээгүй — хэн орж ирснийг мэдэх арга байхгүй байна.
 *
 * Жинхэнэ хамгаалалт хийхэд хоёр зүйл хэрэгтэй:
 *   1. Нэвтрэх + сесс (issue #23)
 *   2. Сесснээс role-ийг уншиж, "admin" биш бол 404 буцаах
 *
 * Хоёрдугаарыг нь СЕРВЕР талд хийнэ. Хөтөч дээр нуух нь хамгаалалт
 * биш — хэрэглэгч JavaScript-ийг тойрч API руу шууд хүсэлт илгээж
 * чадна.
 *
 * Тиймээс энд БОДИТ ӨГӨГДӨЛ БҮҮ ТАВЬ. Нэвтрэлт бэлэн болтол зөвхөн
 * энэ сануулга байна.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export default function AdminPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Админ
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Энэ хэсэг нь <code>admin</code> эрхтэй хэрэглэгчдэд зориулагдана.
        </p>

        <div
          role="alert"
          className="mt-8 rounded-md border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950"
        >
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            Энэ хуудас хараахан хамгаалагдаагүй байна.
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-300">
            Нэвтрэх, сесс хийгдээгүй тул хэн орж ирснийг шалгах арга
            одоогоор байхгүй. Хайлтын системээс нуусан
            (<code>robots.txt</code>, <code>noindex</code>) ч энэ нь
            хамгаалалт биш — хаягийг мэдсэн хүн шууд орно.
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-300">
            Бодит өгөгдөл, удирдлагын үйлдлийг эрхийн шалгалт сервер
            талд хийгдсэний дараа нэмнэ үү.
          </p>
        </div>
      </div>
    </div>
  );
}
