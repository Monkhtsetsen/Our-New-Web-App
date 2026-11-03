import Link from "next/link";
import { Suspense } from "react";
import { getSessionUser } from "@/src/lib/api-server";

const LINK_CLASS =
  "rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground";

/**
 * Сайтын дээд цэс.
 *
 * Нэвтэрсэн эсэхээс хамаарч холбоосууд өөрчлөгдөнө. Энэ нь cookie
 * уншихыг шаарддаг тул урьдчилан бэлтгэх боломжгүй — Suspense дотор
 * тусгаарлав. Ингэснээр хуудасны бусад хэсэг урьдчилан бэлтгэгдсэн
 * хэвээр үлдэж, зөвхөн энэ хэсэг нь хүсэлт ирэх үед бодогдоно.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          Goal App
        </Link>

        <div className="flex items-center gap-1">
          <Suspense fallback={<span className="h-7 w-32" aria-hidden="true" />}>
            <SessionLinks />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}

async function SessionLinks() {
  const user = await getSessionUser();

  if (user === null) {
    return (
      <>
        <Link href="/login" className={LINK_CLASS}>
          Нэвтрэх
        </Link>
        <Link href="/register" className={LINK_CLASS}>
          Бүртгүүлэх
        </Link>
      </>
    );
  }

  return (
    <>
      <Link href="/dashboard" className={LINK_CLASS}>
        Самбар
      </Link>
      <Link href="/goals" className={LINK_CLASS}>
        Зорилгууд
      </Link>

      {/*
        Админ холбоосыг зөвхөн админд харуулна. Энэ нь ТОХЬ болохоос
        хамгаалалт биш — хаягийг нь шууд бичсэн хүнийг /admin хуудас
        өөрөө сервер дээр шалгаж таслана.
      */}
      {user.role === "admin" && (
        <Link href="/admin" className={LINK_CLASS}>
          Админ
        </Link>
      )}
      <Link href="/profile" className={LINK_CLASS}>
        {user.name}
      </Link>
    </>
  );
}
