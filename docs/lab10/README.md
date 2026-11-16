# Лабораторийн ажил 10 — Unit тест + CI

| | |
|---|---|
| **Төсөл** | Our-New-Web-App |
| **Тестийн сан** | **Vitest 5** (Jest-тэй ижил AAA, `describe`/`it`/`expect`) |
| **CI** | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (Лаб 7) |
| **Лаб 10 deliverable** | [`backend/src/goals/validate-goal.lab10.test.ts`](../../backend/src/goals/validate-goal.lab10.test.ts) |

## Төсөлд юу бэлэн байгаа вэ

| Алхам | Байдал |
|-------|--------|
| Тестийн сан | `goal-app` + `backend` — `package.json` → `"test": "vitest run"` |
| Unit тестүүд | `**/*.test.ts` (redirect, api+mock fetch, validation, dates, …) |
| CI | `frontend` / `backend` job дээр `npm test` аль хэдийн ажиллана |

Лаб 10-ийн **5 тест** (2 хэвийн + 2 edge + 1 mock) — тусдаа файл дээр, багшид хүлээлгэхэд тохиромжтой.

## Сонгосон функц

**`validateGoal()`** — [`backend/src/goals/validation.ts`](../../backend/src/goals/validation.ts)

Зорилгын оролтыг шалгана; өгөгдлийн сан дуудахгүй (цэвэр логик). Анхдагч `today`-г [`todayInAppZone()`](../../backend/src/goals/dates.ts)-аас авдаг тул mock-той тест хийхэд тохиромжтой.

## Локал ажиллуулах

```bash
cd backend
npm ci
npm test                    # бүх тест
npm test -- validate-goal.lab10   # зөвхөн лаб 10 файл
```

`goal-app` талд:

```bash
cd goal-app
npm ci && npm test
```

## CI (Лаб 7 pipeline)

`main` руу **PR** нээхэд GitHub Actions:

1. **Frontend — lint, тест, build** → `npm test`
2. **Backend — typecheck, тест, build** → `npm test`

Screenshot: PR → **Checks** → хоёр job ногоон (ямар нь ч улаан биш).

## Алхам 8 — санаатай унагаах (сонголттой)

Нэг тестийг түр эвдэж push хийгээд CI улаан болохыг хараад, дараа нь засаад дахин push:

```ts
// validate-goal.lab10.test.ts дотор түр:
expect(errors).toEqual({}); // → expect(errors.title).toBe("буруу");
```

**Анхаар:** `main` руу шууд push хийхгүй — feature branch + PR ашигла.

## Хүлээлгэж өгөх зүйл

| Зүйл | Байршил |
|------|---------|
| Тестийн файл | `backend/src/goals/validate-goal.lab10.test.ts` |
| CI амжилттай screenshot | жишээ нь `docs/lab10/evidence/ci-success.png` |

## Лабын шаардлагатай хэрэгслүүд

| Заавар | Энэ төсөл |
|--------|-----------|
| Jest | Vitest (`import { describe, expect, it, vi } from "vitest"`) |
| `npm test` | `backend` / `goal-app` хавтас дотор |
| `ci.yml` шинэчлэх | Шаардлагагүй — тест аль хэдийн CI-д байна |

## Холбоотой файлууд

- Mock жишээ (fetch): [`goal-app/src/lib/api.test.ts`](../../goal-app/src/lib/api.test.ts)
- Open redirect + edge: [`goal-app/src/lib/redirect.test.ts`](../../goal-app/src/lib/redirect.test.ts)
- Лаб 7 тайлан: [`docs/lab07/README.md`](../lab07/README.md)