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
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-24 dark:bg-black">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-zinc-950 dark:text-zinc-50">
          Зорилгоо тодорхойлж,
          <br />
          өдөр бүр ахи.
        </h1>

        <p className="mt-5 max-w-lg text-base leading-7 text-zinc-600 dark:text-zinc-400">
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
            className="flex h-11 items-center justify-center rounded-md bg-zinc-900 px-6 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Бүртгүүлэх
          </Link>
          <Link
            href="/login"
            className="flex h-11 items-center justify-center rounded-md border border-zinc-300 px-6 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Нэвтрэх
          </Link>
        </>
      ) : (
        <Link
          href="/dashboard"
          className="flex h-11 items-center justify-center rounded-md bg-zinc-900 px-6 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
      <div className="h-11 w-36 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-900" />
      <div className="h-11 w-32 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-900" />
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
    <dl className="mt-16 grid gap-8 border-t border-zinc-200 pt-10 sm:grid-cols-3 dark:border-zinc-800">
      {items.map((item) => (
        <div key={item.title}>
          <dt className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {item.title}
          </dt>
          <dd className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {item.body}
          </dd>
        </div>
      ))}
    </dl>
  );
}
