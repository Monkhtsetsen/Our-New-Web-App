# Лабораторийн ажил 11 — Статик шинжилгээ, эмзэг байдал

| | |
|---|---|
| **CLO** | CLO4, CLO5 |
| **Issue** | #66 |
| **Frontend** | `goal-app/eslint.config.mjs` → `npm run lint` |
| **Backend** | `backend/eslint.config.js` → `npm run lint` (лаб 11-ээр нэмсэн) |
| **CI** | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) |

## 1. Linter

| Алхам | Файл |
|-------|------|
| Суулгах | `backend`: `eslint`, `@eslint/js`, `typescript-eslint` |
| Тохиргоо | [`backend/eslint.config.js`](../../backend/eslint.config.js) |
| Ажиллуулах | `cd backend && npm run lint` |

### Өмнө / дараа

| | Баримт |
|---|--------|
| Өмнө | [`evidence/lint-backend-before.txt`](evidence/lint-backend-before.txt) — `express.d.ts` дээрх илүүдэл `eslint-disable` |
| Дараа | [`evidence/lint-backend-after.txt`](evidence/lint-backend-after.txt) — 0 алдаа |
| Frontend | [`evidence/lint-goal-app.txt`](evidence/lint-goal-app.txt) — 0 анхааруулга |

**Зассан зүйлс:** (1) `express.d.ts` — хэрэггүй `eslint-disable-next-line` устгасан; (2) `drizzle.config.ts` — ESLint `globalIgnores`-д; (3) `eslint.config.js` нэмсэн; (4) `package.json` `lint` script.

`goal-app` код өмнө нь цэвэр байсан тул лабын “5–10 засвар” голчлон **backend ESLint суулгалт + дээрх засварууд**-д төвлөрсөн.

## 2. `npm audit` — ангилал

### Backend

| Critical | High | Moderate | Low |
|----------|------|----------|-----|
| 0 | 0 | 4 (+ ESLint гинж) | 0 |

Гол: `esbuild` (moderate) → `drizzle-kit` / `@esbuild-kit/*` — **зөвхөн dev**, production runtime-д орохгүй.

Баримт: [`evidence/npm-audit-backend.txt`](evidence/npm-audit-backend.txt)

### goal-app

| Critical | High | Moderate | Low |
|----------|------|----------|-----|
| 0 | 0 | 7 | 0 |

Гол: `minimatch` (moderate) → `eslint` / `typescript-eslint` toolchain — **devDependency**.

Баримт: [`evidence/npm-audit-goal-app.txt`](evidence/npm-audit-goal-app.txt)

### Шинэчлэх төлөвлөгөө

- **Critical / High:** байхгүй — `npm audit fix` заавал биш.
- **Moderate:** `npm audit fix --force` нь `drizzle-kit` эсвэл `typescript-eslint` **downgrade** (breaking) — хүлээлгэж, `drizzle-kit` шинэ хувилбар гарсан үед шинэчилнэ.
- Production (`express`, `postgres`, `jsonwebtoken`) шууд advisory-д орсонгүй.

## 3. CI

| Job | Lint | Audit (лог) |
|-----|------|-------------|
| Frontend | `npm run lint` (Лаб 7) | `npm audit --audit-level=high \|\| true` |
| Backend | `npm run lint` (Лаб 11) | `npm audit --audit-level=high \|\| true` |

Push / PR бүрт автоматаар ажиллана.

## 4. Deliverable

- [x] Lint өмнө/дараа (`evidence/lint-backend-*.txt`)
- [x] `npm audit` тайлан + ангилал (энэ README + `evidence/`)
- [x] Critical/High засвар эсвэл тайлбар (дээрх хүснэгт)
- [x] `ci.yml` — backend lint + audit
- [ ] PR Checks screenshot (GitHub дээр хадгалах)

## 5. Локал шалгалт

```bash
cd backend && npm ci && npm run lint && npm test
cd ../goal-app && npm ci && npm run lint
```