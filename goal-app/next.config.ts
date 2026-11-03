import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Docker-т зориулсан горим. Build хийхэд .next/standalone дотор аппыг
  // ажиллуулахад хэрэгтэй файлууд (server.js + зөвхөн ашиглагддаг
  // хамаарлууд) цуглардаг. Ингэснээр image дотор node_modules-ыг бүтнээр
  // нь зөөх шаардлагагүй болж хэмжээ хэд дахин багасна.
  // Локал хөгжүүлэлтэд (npm run dev) ямар ч нөлөөгүй.
  output: "standalone",

  /**
   * Хуучин хаягийг шинэ рүү чиглүүлнэ.
   *
   * Бүртгүүлэх хуудсыг эхлээд /signup гэж нэрлэсэн бөгөөд одоо багийн
   * тохиролцоо /register болов. Хуучин холбоосыг зүгээр орхивол 404
   * болох тул 308-аар шилжүүлнэ (хайлтын систем бас шинэчилнэ).
   */
  async redirects() {
    return [{ source: "/signup", destination: "/register", permanent: true }];
  },

  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
