"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FormError,
  PasswordField,
  SubmitButton,
  TextField,
} from "../_components/form";
import { PASSWORD_MIN_LENGTH, register, type FieldErrors } from "@/src/lib/api";

export function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [passwordsVisible, setPasswordsVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirmError, setConfirmError] = useState<string>();
  const [formError, setFormError] = useState<string>();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrors({});
    setFormError(undefined);

    // Нууц үгийн давталт нь зөвхөн интерфейсийн асуудал — хэрэглэгч зөв
    // бичсэн эсэхээ шалгах зорилготой. Backend рүү илгээх шаардлагагүй
    // тул энд шалгана.
    if (passwordConfirm !== password) {
      setConfirmError("Нууц үг таарахгүй байна");
      return;
    }
    setConfirmError(undefined);

    setPending(true);
    const result = await register({ name, contact, password });

    if (result.ok) {
      // Бүртгэл үүсэхэд backend сесс нээчихсэн байна. `refresh` нь
      // серверийн кэшийг цэвэрлэнэ — үгүй бол шинэ хуудас хуучин,
      // "нэвтрээгүй" төлөвөөрөө харагдах эрсдэлтэй.
      router.replace("/profile");
      router.refresh();
      return;
    }

    setPending(false);

    if (result.fieldErrors) {
      setErrors(result.fieldErrors);
      return;
    }

    setFormError(result.message);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8">
      {formError && <FormError>{formError}</FormError>}

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
          id="contact"
          label="И-мэйл эсвэл утасны дугаар"
          autoComplete="username"
          placeholder="name@example.com эсвэл 9911 2233"
          value={contact}
          onChange={setContact}
          error={errors.contact}
          hint="Аль нэгийг нь л оруулахад хангалттай."
          disabled={pending}
        />

        <PasswordField
          id="password"
          label="Нууц үг"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          hint={`Дор хаяж ${PASSWORD_MIN_LENGTH} тэмдэгт. Урт өгүүлбэр ч болно.`}
          disabled={pending}
          visible={passwordsVisible}
          onToggleVisible={() => setPasswordsVisible((v) => !v)}
        />

        <PasswordField
          id="passwordConfirm"
          label="Нууц үг давтах"
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={setPasswordConfirm}
          error={confirmError}
          disabled={pending}
          visible={passwordsVisible}
          onToggleVisible={() => setPasswordsVisible((v) => !v)}
        />
      </div>

      <SubmitButton
        pending={pending}
        label="Бүртгүүлэх"
        pendingLabel="Бүртгэж байна…"
      />
    </form>
  );
}
