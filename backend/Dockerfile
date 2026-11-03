# syntax=docker/dockerfile:1

# =====================================================================
# Goal App — Backend (Node + Express + TypeScript)
#
# Гурван шат. Frontend-ийн Dockerfile-тай ижил зарчим: хамаарлын
# файлуудыг эхэлж хуулж layer caching-ийг ашиглана.
# =====================================================================


# ---------------------------------------------------------------------
# 1-р шат — ХАМААРАЛ (build хийхэд хэрэгтэй бүгд, dev-ийг оруулаад)
# ---------------------------------------------------------------------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci


# ---------------------------------------------------------------------
# 2-р шат — BUILD (TypeScript → JavaScript)
# ---------------------------------------------------------------------
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build


# ---------------------------------------------------------------------
# 3-р шат — АЖИЛЛУУЛАХ
#
# Шинэ суурь. TypeScript, vitest, tsx зэрэг build-ийн хэрэгслүүд
# эцсийн image-д орохгүй — зөвхөн ажиллахад хэрэгтэй хамаарал.
# ---------------------------------------------------------------------
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 api

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder --chown=api:nodejs /app/dist ./dist

USER api
EXPOSE 4000

CMD ["node", "dist/index.js"]
