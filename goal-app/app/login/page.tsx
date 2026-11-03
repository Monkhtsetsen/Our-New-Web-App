import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Нэвтрэх — Goal App",
  description: "Goal App-д нэвтэрч зорилгоо үргэлжлүүлээрэй.",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Нэвтрэх
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Бүртгүүлсэн и-мэйл эсвэл утасны дугаараараа орно уу.
        </p>

        {/*
          LoginForm нь `?next=` хаягийн параметрийг уншдаг. Тэр нь зөвхөн
          хүсэлт ирэх үед мэдэгдэх тул энэ хэсгийг урьдчилан бэлтгэх
          боломжгүй — Suspense хэрэгтэй.
        */}
        <Suspense fallback={<FormSkeleton />}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          Бүртгэлгүй юу?{" "}
          <Link
            href="/register"
            className="font-medium text-zinc-950 underline underline-offset-4 dark:text-zinc-50"
          >
            Бүртгүүлэх
          </Link>
        </p>
      </div>
    </div>
  );
}

/** Форм ачаалагдах хүртэл байрыг нь эзэлж байх хоосон хүрээ. */
function FormSkeleton() {
  return (
    <div className="mt-8 space-y-5" aria-hidden="true">
      <div className="h-[66px] animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-900" />
      <div className="h-[66px] animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-900" />
      <div className="h-10 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-900" />
    </div>
  );
}
