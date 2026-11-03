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
    <div className="flex flex-1 justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Профайл
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
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
    <div className="mt-8 space-y-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Ачаалж байна…</span>
      <div className="h-[70px] animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-900" />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-[66px] animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-900"
        />
      ))}
    </div>
  );
}
