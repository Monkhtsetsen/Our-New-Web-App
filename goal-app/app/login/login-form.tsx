"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FormError,
  PasswordField,
  SubmitButton,
  TextField,
} from "../_components/form";
import { login, type FieldErrors } from "@/src/lib/api";
import { safeDestination } from "@/src/lib/redirect";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrors({});
    setFormError(undefined);
    setPending(true);

    const result = await login({ contact, password });

    if (result.ok) {
      router.replace(safeDestination(searchParams.get("next")));
      router.refresh();
      return;
    }

    setPending(false);

    if (result.fieldErrors) {
      setErrors(result.fieldErrors);
      return;
    }

    // Backend нь "хаяг буруу" ба "нууц үг буруу" хоёрыг ялгадаггүй тул
    // энэ мессеж нь аль ч талбарт биш, формын дээр гарна.
    setFormError(result.message);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8">
      {formError && <FormError>{formError}</FormError>}

      <div className="space-y-5">
        <TextField
          id="contact"
          label="И-мэйл эсвэл утасны дугаар"
          autoComplete="username"
          placeholder="name@example.com эсвэл 9911 2233"
          value={contact}
          onChange={setContact}
          error={errors.contact}
          disabled={pending}
        />

        <PasswordField
          id="password"
          label="Нууц үг"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          disabled={pending}
          visible={passwordVisible}
          onToggleVisible={() => setPasswordVisible((v) => !v)}
        />
      </div>

      <SubmitButton
        pending={pending}
        label="Нэвтрэх"
        pendingLabel="Нэвтэрч байна…"
      />
    </form>
  );
}
