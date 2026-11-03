import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSessionUser } from "@/src/lib/api-server";
import type { User } from "@/src/lib/api";

export const metadata: Metadata = {
  title: "Хяналтын самбар — Goal App",

  // Хувь хүний хуудас. Хайлтын системд хэрэггүй.
  robots: { index: false, follow: false },
};

/**
 * Хяналтын самбар.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ЭНЭ ХУУДАС ӨМНӨ НЬ ОГТ НЭЭГДДЭГГҮЙ БАЙВ.
 *
 * `goal-app/src/app/dashboard/` дотор байсан. Next.js нь `app/` ба
 * `src/app/` хоёрын аль нэгийг л уншдаг — энэ төсөлд үндсэн `app/`
 * байсан тул `src/app/` доторх бүхнийг үл тоомсорлож байсан.
 * Үүнээс болж /dashboard нь 404 буцааж байлаа.
 *
 * Одоо `app/dashboard/` руу зөөсөн (git түүх нь хадгалагдсан).
 * Хуучин `src/app/` хавтсыг бүрмөсөн устгасан — дахин ийм төөрөгдөл
 * үүсэхгүй байхын тулд.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export default function DashboardPage() {
  return (
    <div className="flex flex-1 justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  );
}

async function DashboardContent() {
  const user = await getSessionUser();

  if (user === null) {
    redirect("/login?next=/dashboard");
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Сайн байна уу, {user.name}
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Өнөөдрийн байдал.
      </p>

      <Stats user={user} />
      <NextSteps />
    </>
  );
}

/**
 * Хэрэглэгчийн ахиц.
 *
 * Эдгээр гурван тоо нь ӨС-аас ирдэг ЖИНХЭНЭ утга. Өмнө нь энэ
 * хуудсан дээр "Total projects: 12", "Last activity: Today" гэсэн
 * зохиосон тоонууд бичигдсэн байсан — тэдгээрийг хассан. Бодитой
 * биш тоог жинхэнэ мэт харуулах нь хуудсыг бүхэлд нь итгэлгүй
 * болгодог.
 */
function Stats({ user }: { user: User }) {
  const items = [
    { label: "Түвшин", value: user.level, unit: null, hint: "Даалгавар гүйцэтгэх тусам өснө" },
    { label: "Оноо", value: user.xp, unit: null, hint: "Нийт цуглуулсан оноо" },
    { label: "Тасралтгүй", value: user.streak, unit: "хоног", hint: "Дараалан идэвхтэй байсан хоног" },
  ];

  return (
    <dl className="mt-8 grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-line bg-surface px-4 py-4">
          <dt className="text-xs font-medium text-muted">{item.label}</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {item.value}
            {item.unit !== null && (
              <span className="ml-1 text-sm font-normal text-muted">
                {item.unit}
              </span>
            )}
          </dd>
          <p className="mt-1 text-xs leading-5 text-muted">
            {item.hint}
          </p>
        </div>
      ))}
    </dl>
  );
}

/**
 * Зорилго, даалгаврын хэсэг.
 *
 * `tb_goals`, `tb_tasks` хүснэгтүүд схем дээр бэлэн ч тэдгээрт хандах
 * API хараахан бичигдээгүй. Хоосон жагсаалт эсвэл зохиосон өгөгдөл
 * харуулахын оронд юу дутуу байгааг шулуухан хэлж байна.
 */
function NextSteps() {
  return (
    <div className="mt-8 rounded-md border border-line bg-surface p-5">
      <h2 className="text-sm font-medium text-foreground">
        Зорилго, даалгавар
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Хүснэгтүүд нь өгөгдлийн санд бэлэн боловч эдгээрийг унших,
        бичих API хараахан нэмэгдээгүй байна. Нэмэгдмэгц энэ хэсэгт
        зорилгын жагсаалт, өнөөдрийн даалгаврууд гарч ирнэ.
      </p>
      <Link
        href="/profile"
        className="mt-4 inline-flex h-9 items-center rounded-md border border-control px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
      >
        Профайл руу
      </Link>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Ачаалж байна…</span>
      <div className="h-9 w-64 animate-pulse rounded-md bg-surface-2" />
      <div className="h-[104px] animate-pulse rounded-md bg-surface-2" />
      <div className="h-[148px] animate-pulse rounded-md bg-surface-2" />
    </div>
  );
}
