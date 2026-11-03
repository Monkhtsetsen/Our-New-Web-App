import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Бүртгүүлэх — Goal App",
  description: "Goal App-д бүртгүүлж зорилгоо биелүүлж эхлээрэй.",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Бүртгүүлэх
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Зорилгоо тодорхойлж, өдөр тутам ахиж эхлэхэд хэдхэн хором л хангалттай.
        </p>

        <RegisterForm />

        <p className="mt-6 text-sm text-muted">
          Бүртгэлтэй юу?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Нэвтрэх
          </Link>
        </p>
      </div>
    </div>
  );
}
