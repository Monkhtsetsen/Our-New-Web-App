import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Docker-т зориулсан горим. Build хийхэд .next/standalone дотор аппыг
  // ажиллуулахад хэрэгтэй файлууд (server.js + зөвхөн ашиглагддаг
  // хамаарлууд) цуглардаг. Ингэснээр image дотор node_modules-ыг бүтнээр
  // нь зөөх шаардлагагүй болж хэмжээ хэд дахин багасна.
  // Локал хөгжүүлэлтэд (npm run dev) ямар ч нөлөөгүй.
  output: "standalone",

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
