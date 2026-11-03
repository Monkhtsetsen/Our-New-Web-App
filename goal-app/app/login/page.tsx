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
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Нэвтрэх
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
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

        <p className="mt-6 text-sm text-muted">
          Бүртгэлгүй юу?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground underline underline-offset-4"
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
      <div className="h-[66px] animate-pulse rounded-md bg-surface-2" />
      <div className="h-[66px] animate-pulse rounded-md bg-surface-2" />
      <div className="h-10 animate-pulse rounded-md bg-surface-2" />
    </div>
  );
}
