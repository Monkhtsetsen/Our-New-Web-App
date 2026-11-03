"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FormError,
  FormSuccess,
  LABEL_CLASS,
  PasswordField,
  SubmitButton,
  TextField,
} from "../_components/form";
import {
  logout,
  updateProfile,
  PASSWORD_MIN_LENGTH,
  type FieldErrors,
  type ProfileInput,
  type User,
} from "@/src/lib/api";

/**
 * Профайлын засварын хэсэг.
 *
 * Хэрэглэгчийн мэдээллийг өөрөө татдаггүй — сервер талаас бэлэн
 * ирнэ (`page.tsx`). Ингэснээр хуудас нээгдмэгц агуулгатай гарч
 * ирнэ, "хоосон дэлгэц → ачаалах → агуулга" гэсэн гурван үе
 * үүсэхгүй.
 */
export function ProfileClient({ user }: { user: User }) {
  const [current, setCurrent] = useState(user);

  return (
    <>
      <Summary user={current} />
      <ProfileForm user={current} onSaved={setCurrent} />
      <LogoutButton />
    </>
  );
}

function Summary({ user }: { user: User }) {
  return (
    <dl className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800">
      {[
        { label: "Түвшин", value: user.level },
        { label: "Оноо", value: user.xp },
        { label: "Тасралтгүй", value: `${user.streak} хоног` },
      ].map((item) => (
        <div key={item.label} className="bg-white px-4 py-3 dark:bg-black">
          <dt className="text-xs text-zinc-500 dark:text-zinc-500">
            {item.label}
          </dt>
          <dd className="mt-0.5 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ProfileForm({
  user,
  onSaved,
}: {
  user: User;
  onSaved: (user: User) => void;
}) {
  const router = useRouter();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  const [passwordsVisible, setPasswordsVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirmError, setConfirmError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [saved, setSaved] = useState(false);

  // Юу өөрчлөгдсөнийг энд тооцно — өөрчлөгдөөгүй талбарыг илгээхгүй.
  // Ингэснээр "и-мэйлээ хөндөөгүй атлаа одоогийн нууц үгээ бич" гэж
  // дэмий шаардахаас сэргийлнэ.
  const contactChanged =
    email !== (user.email ?? "") || phone !== (user.phone ?? "");
  const passwordChanged = newPassword.length > 0;
  const needsPassword = contactChanged || passwordChanged;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrors({});
    setFormError(undefined);
    setSaved(false);

    if (passwordChanged && newPasswordConfirm !== newPassword) {
      setConfirmError("Нууц үг таарахгүй байна");
      return;
    }
    setConfirmError(undefined);

    const changes: ProfileInput = {};
    if (name !== user.name) changes.name = name;
    if (email !== (user.email ?? "")) changes.email = email;
    if (phone !== (user.phone ?? "")) changes.phone = phone;
    if (passwordChanged) changes.newPassword = newPassword;
    if (needsPassword) changes.currentPassword = currentPassword;

    if (Object.keys(changes).length === 0) {
      setFormError("Өөрчлөх зүйл алга.");
      return;
    }

    setPending(true);
    const result = await updateProfile(changes);
    setPending(false);

    if (result.ok) {
      onSaved(result.data.user);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      setSaved(true);

      // Дээд цэс дэх нэрийг сервер бэлтгэдэг тул шинэчлүүлнэ.
      router.refresh();
      return;
    }

    // Сесс дуусчихсан байж болно (хугацаа өнгөрсөн, эсвэл өөр
    // төхөөрөмж дээрээс нууц үг солигдсон).
    if (result.status === 401 && result.fieldErrors === undefined) {
      router.replace("/login?next=/profile");
      return;
    }

    if (result.fieldErrors) {
      setErrors(result.fieldErrors);
      return;
    }

    setFormError(result.message);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8">
      {formError && <FormError>{formError}</FormError>}
      {saved && <FormSuccess>Хадгаллаа.</FormSuccess>}

      <div className="space-y-5">
        <TextField
          id="name"
          label="Нэр"
          autoComplete="name"
          value={name}
          onChange={setName}
          error={errors.name}
          disabled={pending}
        />

        <TextField
          id="email"
          label="И-мэйл"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={email}
          onChange={setEmail}
          error={errors.email}
          hint="Хоосон үлдээвэл устгана."
          disabled={pending}
        />

        <TextField
          id="phone"
          label="Утасны дугаар"
          type="tel"
          autoComplete="tel"
          placeholder="9911 2233"
          value={phone}
          onChange={setPhone}
          error={errors.phone}
          hint="И-мэйл, утасны аль нэг нь заавал үлдэнэ."
          disabled={pending}
        />
      </div>

      <fieldset className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <legend className={`${LABEL_CLASS} px-0`}>Нууц үг солих</legend>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
          Солихгүй бол хоосон орхино уу.
        </p>

        <div className="mt-5 space-y-5">
          <PasswordField
            id="newPassword"
            label="Шинэ нууц үг"
            autoComplete="new-password"
            value={newPassword}
            onChange={setNewPassword}
            error={errors.newPassword}
            hint={`Дор хаяж ${PASSWORD_MIN_LENGTH} тэмдэгт.`}
            disabled={pending}
            visible={passwordsVisible}
            onToggleVisible={() => setPasswordsVisible((v) => !v)}
          />

          {passwordChanged && (
            <PasswordField
              id="newPasswordConfirm"
              label="Шинэ нууц үг давтах"
              autoComplete="new-password"
              value={newPasswordConfirm}
              onChange={setNewPasswordConfirm}
              error={confirmError}
              disabled={pending}
              visible={passwordsVisible}
              onToggleVisible={() => setPasswordsVisible((v) => !v)}
            />
          )}
        </div>
      </fieldset>

      {/*
        Холбоо барих хаяг, нууц үг солиход одоогийн нууц үгээ
        баталгаажуулна. Энэ талбар нь ХЭРЭГТЭЙ ҮЕДЭЭ л гарч ирнэ —
        зүгээр нэрээ засахад асуух шаардлагагүй.
      */}
      {needsPassword && (
        <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <PasswordField
            id="currentPassword"
            label="Одоогийн нууц үг"
            autoComplete="current-password"
            value={currentPassword}
            onChange={setCurrentPassword}
            error={errors.currentPassword}
            hint="Хаяг эсвэл нууц үг солиход баталгаажуулалт шаардана."
            disabled={pending}
            visible={passwordsVisible}
            onToggleVisible={() => setPasswordsVisible((v) => !v)}
          />
        </div>
      )}

      <SubmitButton
        pending={pending}
        label="Хадгалах"
        pendingLabel="Хадгалж байна…"
      />
    </form>
  );
}

function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        // Амжилтгүй болсон ч нэвтрэх хуудас руу явна: cookie нь
        // HttpOnly тул энд устгах арга байхгүй, гэхдээ хэрэглэгчийг
        // эвдэрсэн хуудсан дээр барьж байх нь утгагүй.
        void logout().finally(() => {
          router.replace("/login");
          router.refresh();
        });
      }}
      className="mt-10 h-10 w-full rounded-md border border-zinc-300 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      {pending ? "Гарч байна…" : "Гарах"}
    </button>
  );
}
