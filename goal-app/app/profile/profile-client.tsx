"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  FormError,
  FormSuccess,
  PasswordField,
  SecondaryButton,
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

      <div className="mt-6">
        <Card>
          <ProfileForm user={current} onSaved={setCurrent} />
        </Card>
      </div>

      <LogoutRow />
    </>
  );
}

/**
 * Ахицын гурван тоо.
 *
 * Тоо, нэгж хоёрыг өөр хэмжээгээр бичив: "0 хоног" гэхэд тоо нь
 * мэдээлэл, "хоног" нь зөвхөн нэгж. Ижил хэмжээтэй байвал аль нь
 * чухал болох нь уншигчид шууд мэдэгдэхгүй.
 */
function Summary({ user }: { user: User }) {
  const items = [
    { label: "Түвшин", value: user.level, unit: null },
    { label: "Оноо", value: user.xp, unit: null },
    { label: "Тасралтгүй", value: user.streak, unit: "хоног" },
  ];

  return (
    <dl className="mt-8 grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-line bg-surface px-4 py-3"
        >
          <dt className="truncate text-xs font-medium text-muted">
            {item.label}
          </dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {item.value}
            {item.unit !== null && (
              <span className="ml-1 text-sm font-normal text-muted">
                {item.unit}
              </span>
            )}
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
    <form onSubmit={handleSubmit} noValidate>
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

      <fieldset className="mt-8 border-t border-line pt-6">
        <legend className="sr-only">Нууц үг солих</legend>

        <h2 className="text-sm font-medium text-foreground">Нууц үг солих</h2>
        <p className="mt-1 text-sm text-muted">Солихгүй бол хоосон орхино уу.</p>

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
        <div className="mt-6 rounded-md border border-warning-line bg-warning-surface p-4">
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

/**
 * Гарах.
 *
 * Формоос ТУСДАА, картын гадна байрлуулав. Өмнө нь "Хадгалах"-тай
 * ижил өргөн, ижил жинтэй байсан нь андуурахад хялбар — хоёулаа
 * адил чухал мэт харагдана. Энэ бол ховор хийдэг, өөр төрлийн
 * үйлдэл тул жижиг, хоёрдогч байх ёстой.
 */
function LogoutRow() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <div className="mt-6 flex items-center justify-between gap-4">
      <p className="text-sm text-muted">Энэ төхөөрөмж дээрх сессийг хаана.</p>

      <SecondaryButton
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
      >
        {pending ? "Гарч байна…" : "Гарах"}
      </SecondaryButton>
    </div>
  );
}
