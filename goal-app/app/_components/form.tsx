"use client";

/**
 * Формын нийтлэг хэсгүүд.
 *
 * Бүртгүүлэх, нэвтрэх, профайл гурав ижил харагдах ёстой. Гурван
 * газар хуулж бичвэл нэгийг нь засахад бусад нь хоцорно.
 *
 * Өнгийг `globals.css`-ийн тогтмолоор (bg-surface, text-muted гэх мэт)
 * авна — иймээс энд `dark:` хувилбар бичихгүй. Харанхуй/гэрэл хоёрын
 * ялгааг нэг файл шийднэ.
 *
 * `_components` гэсэн доогуур зураас нь Next.js-д "энэ бол зам биш"
 * гэж хэлнэ — /\_components гэж хандах боломжгүй.
 */

/**
 * Оролтын талбарын өндөр 40px.
 *
 * WCAG 2.5.8 нь хүрэх талбайг 24×24-ээс багагүй байхыг шаарддаг;
 * хүрэлцэх дэлгэцэнд 44px зөвлөдөг. 40px нь хоёрын дунд — хулганатай
 * дэлгэц дээр сийрэг харагдахгүй, хуруугаар ч оносон хэвээр.
 */
const INPUT_CLASS =
  "mt-2 block h-10 w-full rounded-md border border-control bg-surface px-3 " +
  "text-sm text-foreground outline-none transition-colors " +
  "placeholder:text-muted focus:border-foreground " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  "aria-[invalid=true]:border-danger";

const PASSWORD_INPUT_CLASS = `${INPUT_CLASS} pr-12`;

export const LABEL_CLASS = "block text-sm font-medium text-foreground";
export const ERROR_CLASS = "mt-2 text-sm text-danger";
export const HINT_CLASS = "mt-2 text-sm text-muted";

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
  type?: "text" | "email" | "tel" | "date";
  autoComplete?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  /**
   * `type="date"`-ийн хамгийн эрт сонгож болох өдөр.
   *
   * Хөтчийн хуанли өмнөх өдрүүдийг бүдгэрүүлнэ — хэрэглэгчийг
   * буруу сонгоод алдаа хүлээж авахаас хамгаална. Энэ нь ТОХИЛОГ
   * байлгах зорилготой; эцсийн шийдвэрийг сервер гаргана.
   */
  min?: string;
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
  min,
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
        min={min}
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
          className="absolute inset-y-0 right-0 mt-2 flex w-12 items-center justify-center rounded-r-md text-muted transition-colors hover:text-foreground"
        >
          <EyeIcon crossed={visible} />
        </button>
      </div>

      <Message id={id} error={error} hint={hint} />
    </div>
  );
}

const BUTTON_BASE =
  "flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-60";

/** Хуудас бүрт нэг л байна. Хамгийн тод, өргөн. */
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
      className={`${BUTTON_BASE} mt-8 w-full bg-primary text-on-primary hover:opacity-90`}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

/** Хоёрдогч үйлдэл — хүрээтэй, дэвсгэргүй. */
export function SecondaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${BUTTON_BASE} border border-control text-foreground hover:bg-surface-2`}
    >
      {children}
    </button>
  );
}

/**
 * Мэдэгдлийн хайрцаг.
 *
 * Өнгө нь ГАНЦ дохио биш: тэмдэг, текст хоёр мөн байна. WCAG 1.4.1 —
 * мэдээллийг зөвхөн өнгөөр дамжуулж болохгүй (өнгө ялгадаггүй хүн,
 * хар цагаан хэвлэлт).
 */
function Notice({
  tone,
  role,
  children,
}: {
  tone: "success" | "danger";
  role: "status" | "alert";
  children: React.ReactNode;
}) {
  const styles =
    tone === "success"
      ? "border-success-line bg-success-surface text-success"
      : "border-danger-line bg-danger-surface text-danger";

  return (
    <div
      role={role}
      className={`mb-6 flex items-start gap-2.5 rounded-md border p-3 text-sm ${styles}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="mt-0.5 h-4 w-4 shrink-0"
      >
        {tone === "success" ? (
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
            clipRule="evenodd"
          />
        ) : (
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
            clipRule="evenodd"
          />
        )}
      </svg>
      <span>{children}</span>
    </div>
  );
}

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <Notice tone="danger" role="alert">
      {children}
    </Notice>
  );
}

export function FormSuccess({ children }: { children: React.ReactNode }) {
  return (
    <Notice tone="success" role="status">
      {children}
    </Notice>
  );
}

/** Формыг багцлах хайрцаг. */
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-6 sm:p-8">
      {children}
    </div>
  );
}
