import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getGoals, getSessionUser } from "@/src/lib/api-server";
import { isGoalCategory, type GoalCategory } from "@/src/lib/api";
import { todayInAppZone } from "@/src/lib/dates";
import { FormError } from "../_components/form";
import { CategoryFilter } from "./category-filter";
import { GoalsClient } from "./goals-client";

export const metadata: Metadata = {
  title: "Зорилгууд — Goal App",

  // Хувь хүний өгөгдөл. Хайлтын системд хэрэггүй.
  robots: { index: false, follow: false },
};

/** Next 16 дээр `searchParams` нь promise. */
type GoalsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function GoalsPage({ searchParams }: GoalsPageProps) {
  return (
    <div className="flex flex-1 justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Зорилгууд
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Юунд хүрэхийг хүсэж байгаагаа бичиж тодорхой болгоорой.
        </p>

        <Suspense fallback={<GoalsSkeleton />}>
          <GoalsLoader searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function GoalsLoader({ searchParams }: GoalsPageProps) {
  const user = await getSessionUser();

  if (user === null) {
    redirect("/login?next=/goals");
  }

  const { active, unknown } = readCategory(await searchParams);

  // Шүүлтийг backend дээр хийнэ. Бүх зорилгыг татаад JS дээр шүүвэл
  // зорилго олшрох тусам дэмий өгөгдөл зөөнө.
  const goals = await getGoals(active);

  // `null` нь "уншиж чадсангүй", `[]` нь "зорилго алга" — хоёр өөр зүйл.
  if (goals === null) {
    return (
      <div className="mt-8">
        <FormError>
          Зорилгуудыг ачаалж чадсангүй. Хуудсыг дахин ачаална уу.
        </FormError>
      </div>
    );
  }

  return (
    <>
      <CategoryFilter active={active} />

      {/* Танихгүй ангилал бол шүүлтгүй жагсаалт харуулна — гэхдээ
          чимээгүй биш. Хэрэглэгч "?category=helth" гэж бичсэн бол
          шүүлтүүр ажиллаагүйг мэдэх ёстой. */}
      {unknown && (
        <div className="mt-6">
          <FormError>
            Тийм ангилал байхгүй тул бүх зорилго харагдаж байна.
          </FormError>
        </div>
      )}

      <div className="mt-8">
        <GoalsClient
          initialGoals={goals}
          today={todayInAppZone()}
          activeCategory={active}
        />
      </div>
    </>
  );
}

/**
 * URL-ийн `?category=` утгыг уншина.
 *
 * Хэрэглэгч хаягийн мөрөнд юу ч бичиж болно: массив
 * ("?category=a&category=b"), танихгүй утга, хоосон. Бүгдийг барьж
 * нэг л хоёр төлөвт хувиргана — зөв ангилал, эсвэл шүүлтгүй.
 */
function readCategory(params: Record<string, string | string[] | undefined>): {
  active?: GoalCategory;
  unknown: boolean;
} {
  const raw = params.category;

  if (raw === undefined) return { unknown: false };
  if (typeof raw !== "string") return { unknown: true };
  if (raw.length === 0) return { unknown: false };

  return isGoalCategory(raw) ? { active: raw, unknown: false } : { unknown: true };
}

function GoalsSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="mt-6">
      <span className="sr-only">Ачаалж байна…</span>
      <div className="h-9 animate-pulse rounded-md bg-surface-2" />
      <div className="mt-8 h-[360px] animate-pulse rounded-lg bg-surface-2" />
      <div className="mt-8 h-24 animate-pulse rounded-lg bg-surface-2" />
    </div>
  );
}
