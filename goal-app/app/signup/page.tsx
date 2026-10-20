import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Бүртгүүлэх — Goal App",
  description: "Goal App-д бүртгүүлж зорилгоо биелүүлж эхлээрэй.",
};

export default function SignupPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Бүртгүүлэх
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Зорилгоо тодорхойлж, өдөр тутам ахиж эхлэхэд хэдхэн хором л хангалттай.
        </p>

        <SignupForm />
      </div>
    </div>
  );
}
