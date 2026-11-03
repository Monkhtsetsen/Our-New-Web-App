import Link from "next/link";
import { Suspense } from "react";
import { getSessionUser } from "@/src/lib/api-server";

/**
 * Нүүр хуудас.
 *
 * Өмнө нь `create-next-app`-ийн загвар хуудас ("To get started, edit
 * the page.tsx file") хэвээр байсан. Vercel, Next.js-ийн баримт руу
 * холбоос заадаг байв.
 */
export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground">
          Зорилгоо тодорхойлж,
          <br />
          өдөр бүр ахи.
        </h1>

        <p className="mt-5 max-w-lg text-base leading-7 text-muted">
          Goal App нь томоохон зорилгыг өдөр тутмын жижиг даалгавар
          болгон хуваахад тусална. Гүйцэтгэх тусам оноо цуглуулж,
          тасралтгүй ажилласан хоногоо хөтөлнө.
        </p>

        {/*
          Нэвтэрсэн эсэхээс хамаарч өөр товч харуулна. Энэ нь cookie
          уншихыг шаарддаг тул урьдчилан бэлтгэх боломжгүй — Suspense
          дотор тусгаарлав. Хуудасны бусад хэсэг урьдчилан бэлтгэгдсэн
          хэвээр үлдэнэ.
        */}
        <Suspense fallback={<ActionsSkeleton />}>
          <Actions />
        </Suspense>

        <Features />
      </div>
    </div>
  );
}

async function Actions() {
  const user = await getSessionUser();

  return (
    <div className="mt-10 flex flex-col gap-3 sm:flex-row">
      {user === null ? (
        <>
          <Link
            href="/register"
            className="flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-on-primary transition-colors hover:opacity-90"
          >
            Бүртгүүлэх
          </Link>
          <Link
            href="/login"
            className="flex h-11 items-center justify-center rounded-md border border-control px-6 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
          >
            Нэвтрэх
          </Link>
        </>
      ) : (
        <Link
          href="/dashboard"
          className="flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-on-primary transition-colors hover:opacity-90"
        >
          Самбар руу
        </Link>
      )}
    </div>
  );
}

function ActionsSkeleton() {
  return (
    <div className="mt-10 flex gap-3" aria-hidden="true">
      <div className="h-11 w-36 animate-pulse rounded-md bg-surface-2" />
      <div className="h-11 w-32 animate-pulse rounded-md bg-surface-2" />
    </div>
  );
}

function Features() {
  const items = [
    {
      title: "Зорилгоо хуваа",
      body: "Том зорилгыг гүйцэтгэх боломжтой даалгавар болгож, эцсийн хугацаа тавина.",
    },
    {
      title: "Ахицаа хар",
      body: "Гүйцэтгэсэн даалгавар бүр оноо болж, түвшин ахина.",
    },
    {
      title: "Тасралтгүй бай",
      body: "Дараалан ажилласан хоногоо хөтөлж, хэвшил болгоно.",
    },
  ];

  return (
    <dl className="mt-16 grid gap-8 border-t border-line pt-10 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.title}>
          <dt className="text-sm font-medium text-foreground">
            {item.title}
          </dt>
          <dd className="mt-2 text-sm leading-6 text-muted">
            {item.body}
          </dd>
        </div>
      ))}
    </dl>
  );
}
