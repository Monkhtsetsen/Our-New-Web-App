import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSessionUser, getTodayTasks } from "@/src/lib/api-server";
import { FormError } from "../_components/form";
import { TodayClient } from "./today-client";

export const metadata: Metadata = {
  title: "Өнөөдөр — Goal App",

  // Хувийн өгөгдөл. Хайлтын системд хэрэггүй.
  robots: { index: false, follow: false },
};

export default function TodayPage() {
  return (
    <div className="flex flex-1 justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Өнөөдөр
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Өнөөдөр хийх ажлууд. Багахан зүйлээс эхлэх нь хамгийн хялбар.
        </p>

        <div className="mt-8">
          <Suspense fallback={<TodaySkeleton />}>
            <TodayLoader />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function TodayLoader() {
  const user = await getSessionUser();

  if (user === null) {
    redirect("/login?next=/today");
  }

  const data = await getTodayTasks();

  // `null` нь "уншиж чадсангүй" — хоосон жагсаалттай ХОЛИХГҮЙ.
  if (data === null) {
    return (
      <FormError>
        Даалгавруудыг ачаалж чадсангүй. Хуудсыг дахин ачаална уу.
      </FormError>
    );
  }

  return (
    <TodayClient
      date={data.date}
      initialToday={data.today}
      initialOverdue={data.overdue}
    />
  );
}

function TodaySkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Ачаалж байна…</span>
      <div className="h-[240px] animate-pulse rounded-lg bg-surface-2" />
      <div className="mt-8 h-32 animate-pulse rounded-lg bg-surface-2" />
    </div>
  );
}
