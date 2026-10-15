"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { PASSWORD_MIN_LENGTH } from "@/src/auth/validation";
import { signup, type SignupState } from "./actions";

const INPUT_CLASS =
  "mt-1.5 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 " +
  "text-sm text-zinc-950 outline-none placeholder:text-zinc-400 " +
  "focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 " +
  "dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 " +
  "dark:placeholder:text-zinc-600 dark:focus:border-zinc-500";

const LABEL_CLASS = "block text-sm font-medium text-zinc-800 dark:text-zinc-200";
const ERROR_CLASS = "mt-1.5 text-sm text-red-600 dark:text-red-400";

function SubmitButton() {
  // Сервер дээр scrypt ажиллах хугацаанд (~0.3с) товчийг идэвхгүй болгоно,
  // эс бөгөөс хэрэглэгч олон удаа дарж олон бүртгэл үүсгэх магадлалтай.
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 flex h-10 w-full items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? "Бүртгэж байна…" : "Бүртгүүлэх"}
    </button>
  );
}

const INITIAL: SignupState = {};

export function SignupForm() {
  const [state, formAction] = useActionState(signup, INITIAL);

  if (state.success) {
    return (
      <div
        role="status"
        className="mt-8 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950"
      >
        <p className="text-sm font-medium text-green-900 dark:text-green-200">
          Бүртгэл амжилттай үүслээ.
        </p>
        <p className="mt-1 text-sm leading-6 text-green-800 dark:text-green-300">
          Одоо нэвтэрч орох боломжтой.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="mt-8">
      {state.formError && (
        <div
          role="alert"
          className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {state.formError}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label htmlFor="name" className={LABEL_CLASS}>
            Нэр
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            defaultValue={state.values?.name}
            aria-invalid={Boolean(state.errors?.name)}
            aria-describedby={state.errors?.name ? "name-error" : undefined}
            className={INPUT_CLASS}
          />
          {state.errors?.name && (
            <p id="name-error" className={ERROR_CLASS}>
              {state.errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className={LABEL_CLASS}>
            И-мэйл
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.values?.email}
            aria-invalid={Boolean(state.errors?.email)}
            aria-describedby={state.errors?.email ? "email-error" : undefined}
            className={INPUT_CLASS}
          />
          {state.errors?.email && (
            <p id="email-error" className={ERROR_CLASS}>
              {state.errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className={LABEL_CLASS}>
            Нууц үг
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(state.errors?.password)}
            aria-describedby="password-hint"
            className={INPUT_CLASS}
          />
          {state.errors?.password ? (
            <p id="password-hint" className={ERROR_CLASS}>
              {state.errors.password}
            </p>
          ) : (
            <p
              id="password-hint"
              className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-500"
            >
              Дор хаяж {PASSWORD_MIN_LENGTH} тэмдэгт. Урт өгүүлбэр ч болно.
            </p>
          )}
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
