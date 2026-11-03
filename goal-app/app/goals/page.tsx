import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getGoals, getSessionUser } from "@/src/lib/api-server";
import { FormError } from "../_components/form";
import { GoalsClient } from "./goals-client";

export const metadata: Metadata = {
  title: "Зорилгууд — Goal App",

  // Хувь хүний өгөгдөл. Хайлтын системд хэрэггүй.
  robots: { index: false, follow: false },
};

export default function GoalsPage() {
  return (
    <div className="flex flex-1 justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Зорилгууд
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Юунд хүрэхийг хүсэж байгаагаа бичиж тодорхой болгоорой.
        </p>

        <div className="mt-8">
          <Suspense fallback={<GoalsSkeleton />}>
            <GoalsLoader />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function GoalsLoader() {
  const user = await getSessionUser();

  if (user === null) {
    redirect("/login?next=/goals");
  }

  const goals = await getGoals();

  // `null` нь "уншиж чадсангүй", `[]` нь "зорилго алга" — хоёр өөр зүйл.
  if (goals === null) {
    return (
      <FormError>
        Зорилгуудыг ачаалж чадсангүй. Хуудсыг дахин ачаална уу.
      </FormError>
    );
  }

  return <GoalsClient initialGoals={goals} />;
}

function GoalsSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Ачаалж байна…</span>
      <div className="h-[280px] animate-pulse rounded-lg bg-surface-2" />
      <div className="mt-8 h-24 animate-pulse rounded-lg bg-surface-2" />
    </div>
  );
}
