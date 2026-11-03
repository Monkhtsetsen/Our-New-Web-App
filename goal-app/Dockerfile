# syntax=docker/dockerfile:1

# =====================================================================
# Goal App — олон шаттай (multi-stage) Dockerfile
#
# Гурван шат: хамаарал суулгах → build хийх → ажиллуулах.
# Эцсийн image-д зөвхөн сүүлийн шатны агуулга үлдэнэ: эх код ч,
# devDependencies ч, build-ийн хэрэгсэл ч орохгүй.
# =====================================================================


# ---------------------------------------------------------------------
# 1-р шат — ХАМААРАЛ
#
# package.json, package-lock.json хоёрыг ЭХЛЭЭД дангаар нь хуулж байгаа
# нь санамсаргүй биш. Docker мөр бүрийг тусдаа layer болгон кэшлэдэг
# бөгөөд layer нь өөрийн болон өмнөх мөрүүдийн оролт өөрчлөгдсөн үед л
# дахин ажилладаг.
#
# Иймд: эх кодоо засахад энэ хоёр файл хөдлөхгүй тул `npm ci` кэшнээс
# шууд ирнэ. Харин эхэнд нь `COPY . .` бичсэн бол нэг үсэг засах бүрт
# бүх хамаарал дахин суух байв.
# ---------------------------------------------------------------------
FROM node:24-alpine AS deps

# Alpine нь musl libc ашигладаг. Next.js-ийн зарим хоёртын файл glibc
# хүлээдэг тул нийцүүлэх давхарга нэмнэ.
RUN apk add --no-cache libc6-compat

WORKDIR /app
COPY package.json package-lock.json ./

# `npm install` биш `npm ci`: package-lock.json-ыг яг мөрдөж, хувилбар
# санамсаргүй хөдлөхөөс сэргийлнэ. Image нь хэзээ бүтээснээс үл хамааран
# ижил байх ёстой.
RUN npm ci


# ---------------------------------------------------------------------
# 2-р шат — BUILD
# ---------------------------------------------------------------------
FROM node:24-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Backend-ийн хаяг.
#
# NEXT_PUBLIC_ хувьсагчийг Next.js BUILD хийх үедээ кодод шууд
# шигтгэдэг — ажиллах үед өөрчлөх боломжгүй. Тиймээс энэ нь ENV биш
# ARG байх ёстой бөгөөс image бүтээхдээ л дамжуулна.
#
# Утга нь ХӨТЧӨӨС харагдах хаяг байх ёстой. Хүсэлт нь хэрэглэгчийн
# хөтчөөс явдаг тул "http://backend:4000" (Docker доторх нэр) ажиллахгүй.
ARG NEXT_PUBLIC_API_URL="http://localhost:4000"
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# next.config.ts дээр output: "standalone" тул энэ алхам нь
# .next/standalone дотор server.js болон ажиллахад шаардлагатай
# хамаарлуудыг цуглуулж өгнө.
RUN npm run build


# ---------------------------------------------------------------------
# 3-р шат — АЖИЛЛУУЛАХ
#
# Шинэ цэвэр суурь. Өмнөх шатнуудаас зөвхөн хэрэгтэй гурван зүйлийг
# хуулж авна. node_modules бүтнээр 569 МБ байсан бол standalone нь
# 23 МБ — 24 дахин бага.
# ---------------------------------------------------------------------
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# 0.0.0.0 заавал. Анхны утга нь localhost бөгөөд тэр тохиолдолд сервер
# контейнерийн дотор л сонсох тул гаднаас -p порт нээсэн ч хүрэхгүй.
ENV HOSTNAME=0.0.0.0

# root эрхээр ажиллуулахгүй. Апп эвдэрсэн тохиолдолд халдагчийн
# боломжийг хязгаарлана.
RUN addgroup --system --gid 1001 nodejs  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
