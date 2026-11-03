"use client";

/**
 * Формын нийтлэг хэсгүүд.
 *
 * Бүртгүүлэх, нэвтрэх, профайл гурав ижил харагдах ёстой. Гурван
 * газар хуулж бичвэл нэгийг нь засахад бусад нь хоцорно.
 *
 * `_components` гэсэн доогуур зураас нь Next.js-д "энэ бол зам биш"
 * гэж хэлнэ — /\_components гэж хандах боломжгүй.
 */

const INPUT_CLASS =
  "mt-1.5 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 " +
  "text-sm text-zinc-950 outline-none placeholder:text-zinc-400 " +
  "focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  "dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 " +
  "dark:placeholder:text-zinc-600 dark:focus:border-zinc-500";

const PASSWORD_INPUT_CLASS = `${INPUT_CLASS} pr-11`;

export const LABEL_CLASS =
  "block text-sm font-medium text-zinc-800 dark:text-zinc-200";
export const ERROR_CLASS = "mt-1.5 text-sm text-red-600 dark:text-red-400";
export const HINT_CLASS = "mt-1.5 text-sm text-zinc-500 dark:text-zinc-500";

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

function Message({
  id,
  error,
  hint,
}: {
  id: string;
  error?: string;
  hint?: string;
}) {
  if (error) {
    return (
      <p id={`${id}-error`} className={ERROR_CLASS}>
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={`${id}-hint`} className={HINT_CLASS}>
        {hint}
      </p>
    );
  }
  return null;
}

export type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
};

export function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
  error,
  hint,
  disabled,
}: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        // Алдаа, зөвлөмжийг оролтын талбартай холбоно — дэлгэц уншигч
        // програм энэ холбоосоор дамжуулж уншиж өгдөг.
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={INPUT_CLASS}
      />
      <Message id={id} error={error} hint={hint} />
    </div>
  );
}

export type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /**
   * Хөтөч, нууц үгийн менежерт энэ талбар юу болохыг хэлнэ.
   * Нэвтрэхэд "current-password", шинээр үүсгэхэд "new-password".
   */
  autoComplete: "current-password" | "new-password";
  error?: string;
  hint?: string;
  disabled?: boolean;
  visible: boolean;
  onToggleVisible: () => void;
};

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
  hint,
  disabled,
  visible,
  onToggleVisible,
}: PasswordFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={PASSWORD_INPUT_CLASS}
        />

        <button
          type="button"
          onClick={onToggleVisible}
          aria-label={visible ? "Нууц үгийг нуух" : "Нууц үгийг харуулах"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 mt-1.5 flex w-11 items-center justify-center rounded-r-md text-zinc-500 transition-colors hover:text-zinc-800 focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 dark:text-zinc-500 dark:hover:text-zinc-200"
        >
          <EyeIcon crossed={visible} />
        </button>
      </div>

      <Message id={id} error={error} hint={hint} />
    </div>
  );
}

export function SubmitButton({
  pending,
  label,
  pendingLabel,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 flex h-10 w-full items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
    >
      {children}
    </div>
  );
}

export function FormSuccess({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="mb-5 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
    >
      {children}
    </div>
  );
}
