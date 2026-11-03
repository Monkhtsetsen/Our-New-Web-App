import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Бүртгүүлэх — Goal App",
  description: "Goal App-д бүртгүүлж зорилгоо биелүүлж эхлээрэй.",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Бүртгүүлэх
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Зорилгоо тодорхойлж, өдөр тутам ахиж эхлэхэд хэдхэн хором л хангалттай.
        </p>

        <RegisterForm />

        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          Бүртгэлтэй юу?{" "}
          <Link
            href="/login"
            className="font-medium text-zinc-950 underline underline-offset-4 dark:text-zinc-50"
          >
            Нэвтрэх
          </Link>
        </p>
      </div>
    </div>
  );
}
