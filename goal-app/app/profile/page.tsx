import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSessionUser } from "@/src/lib/api-server";
import { ProfileClient } from "./profile-client";

export const metadata: Metadata = {
  title: "Профайл — Goal App",

  // Хувь хүний хуудас. Хайлтын системд огт хэрэггүй.
  robots: { index: false, follow: false },
};

/**
 * Профайлын хуудас.
 *
 * Мэдээллийг СЕРВЕР дээр татна. Ингэснээр:
 *
 *   - Хуудас нээгдмэгц агуулгатай гарч ирнэ (хоосон дэлгэц харагдахгүй)
 *   - Нэвтрээгүй хүнд агуулга огт илгээгдэхгүй
 *
 * Нэвтрээгүй хүн ихэвчлэн энд хүрэхгүй — `proxy.ts` cookie
 * байхгүйг хараад нэвтрэх хуудас руу шиднэ. Гэхдээ cookie нь байж
 * байгаад хүчингүй байх тохиолдол бий (хугацаа дууссан, нууц үг
 * солигдсон) тул энд ДАХИН шалгана.
 */
export default function ProfilePage() {
  return (
    <div className="flex flex-1 justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Профайл
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Бүртгэлийн мэдээллээ эндээс засна уу.
        </p>

        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileLoader />
        </Suspense>
      </div>
    </div>
  );
}

async function ProfileLoader() {
  const user = await getSessionUser();

  if (user === null) {
    redirect("/login?next=/profile");
  }

  return <ProfileClient user={user} />;
}

/** Мэдээлэл ирэх хүртэл байрыг нь эзэлж байх хоосон хүрээ. */
function ProfileSkeleton() {
  return (
    <div className="mt-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Ачаалж байна…</span>

      {/* Гурван тоо */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[74px] animate-pulse rounded-lg bg-surface-2"
          />
        ))}
      </div>

      {/* Формын карт */}
      <div className="mt-6 h-[420px] animate-pulse rounded-lg bg-surface-2" />
    </div>
  );
}
