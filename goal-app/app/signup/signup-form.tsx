"use client";

import { useState } from "react";
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

/** Нүдний товчийг багтаахын тулд баруун талд зай үлдээнэ. */
const PASSWORD_INPUT_CLASS = `${INPUT_CLASS} pr-11`;

const LABEL_CLASS = "block text-sm font-medium text-zinc-800 dark:text-zinc-200";
const ERROR_CLASS = "mt-1.5 text-sm text-red-600 dark:text-red-400";
const HINT_CLASS = "mt-1.5 text-sm text-zinc-500 dark:text-zinc-500";

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {crossed ? (
        <>
          <path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.774 3.162 10.066 7.498a10.52 10.52 0 0 1-4.293 5.774" />
          <path d="M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.244-4.243" />
        </>
      ) : (
        <>
          <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
          <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </>
      )}
    </svg>
  );
}

type PasswordFieldProps = {
  id: string;
  name: string;
  label: string;
  error?: string;
  /** Алдаа байхгүй үед харуулах тайлбар. */
  hint?: string;
  /** Харагдах төлөв формын түвшинд — хоёр талбар хамт нээгдэж, хамт нуугдана. */
  visible: boolean;
  onToggleVisible: () => void;
};

/**
 * Нууц үгийн талбар, харах/нуух товчтой.
 *
 * Товч нь `type="button"` — эс бөгөөс форм илгээгдэнэ. Харагдах төлөвийг
 * өөртөө хадгалахгүй: нууц үгээ шалгахдаа хоёр талбараа зэрэг харах нь
 * зүйн хэрэг тул аль ч товч хоёуланг нь зэрэг нээнэ.
 */
function PasswordField({
  id,
  name,
  label,
  error,
  hint,
  visible,
  onToggleVisible,
}: PasswordFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={PASSWORD_INPUT_CLASS}
        />

        <button
          type="button"
          onClick={onToggleVisible}
          // Товч хоёуланг нь удирддаг тул талбарын нэрээр биш, ерөнхийгөөр нэрлэв.
          aria-label={visible ? "Нууц үгийг нуух" : "Нууц үгийг харуулах"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 mt-1.5 flex w-11 items-center justify-center rounded-r-md text-zinc-500 transition-colors hover:text-zinc-800 focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 dark:text-zinc-500 dark:hover:text-zinc-200"
        >
          <EyeIcon crossed={visible} />
        </button>
      </div>

      {error ? (
        <p id={`${id}-error`} className={ERROR_CLASS}>
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className={HINT_CLASS}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

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

  // Хоёр талбарт нийтлэг төлөв — аль ч нүдийг дарахад хоёулаа нээгдэнэ.
  const [passwordsVisible, setPasswordsVisible] = useState(false);
  const togglePasswords = () => setPasswordsVisible((shown) => !shown);

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
          <label htmlFor="contact" className={LABEL_CLASS}>
            И-мэйл эсвэл утасны дугаар
          </label>
          <input
            id="contact"
            name="contact"
            type="text"
            // Нэвтрэх нэрийн үүрэгтэй тул "username" — хөтөч и-мэйл, утас
            // хоёуланг нь энэ нэрээр санадаг.
            autoComplete="username"
            placeholder="name@example.com эсвэл 9911 2233"
            defaultValue={state.values?.contact}
            aria-invalid={Boolean(state.errors?.contact)}
            aria-describedby={
              state.errors?.contact ? "contact-error" : "contact-hint"
            }
            className={INPUT_CLASS}
          />
          {state.errors?.contact ? (
            <p id="contact-error" className={ERROR_CLASS}>
              {state.errors.contact}
            </p>
          ) : (
            <p id="contact-hint" className={HINT_CLASS}>
              Аль нэгийг нь л оруулахад хангалттай.
            </p>
          )}
        </div>

        <PasswordField
          id="password"
          name="password"
          label="Нууц үг"
          error={state.errors?.password}
          hint={`Дор хаяж ${PASSWORD_MIN_LENGTH} тэмдэгт. Урт өгүүлбэр ч болно.`}
          visible={passwordsVisible}
          onToggleVisible={togglePasswords}
        />

        <PasswordField
          id="passwordConfirm"
          name="passwordConfirm"
          label="Нууц үг давтах"
          error={state.errors?.passwordConfirm}
          visible={passwordsVisible}
          onToggleVisible={togglePasswords}
        />
      </div>

      <SubmitButton />
    </form>
  );
}
