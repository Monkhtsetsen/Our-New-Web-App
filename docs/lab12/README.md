# Лабораторийн ажил 12 — AI хэрэгсэл ашиглан код бичих, Review хийх

| | |
|---|---|
| **Төсөл** | Our-New-Web-App (backend, TypeScript + Express 5 + Drizzle) |
| **AI хэрэгсэл** | GitHub Copilot (VS Code Chat) **ба** Claude Code — хоёуланг харьцуулсан |
| **Даалгавар** | `validateGoalUpdate()` — зорилгыг засах (`PATCH /api/goals/:id`) оролтын шалгалт |
| **Эцсийн код** | [`backend/src/goals/update-validation.ts`](../../backend/src/goals/update-validation.ts) |
| **Тест** | [`backend/src/goals/update-validation.lab12.test.ts`](../../backend/src/goals/update-validation.lab12.test.ts) (17 тест) |
| **Нотолгоо** | [`evidence/copilot/`](evidence/copilot/), [`evidence/claude/`](evidence/claude/) |

## Даалгавар сонгосон шалтгаан (алхам 2)

Төсөлд зорилго **үүсгэх** шалгалт (`validateGoal`) байгаа ч **засах** шалгалт алга.
PATCH нь хэсэгчилсэн шинэчлэл тул "талбар ирээгүй" ба "талбар хоосон" хоёрыг ялгах,
хориотой талбар (`userId`) хүлээж авахгүй байх, төлөв (`status`) солих зэрэг алдаа
гаргахад амархан нөхцөлтэй — AI-ийн кодыг review хийхэд тохиромжтой.

**Туршилтын нөхцөл:** AI бүрийг шинэ (өмнөх яриагүй) чатад ажиллуулсан. Туршилтын үеэр
эцсийн код, тайланг `git stash`-аар нууж, AI-ууд урьдчилсан хариуг харахгүй байлгасан.

---

## 1. Муу prompt (алхам 3)

> `зорилго шинэчлэх validation функц бичээд өг`

### Copilot

| Горим | Үр дүн | Нотолгоо |
|-------|--------|----------|
| **Ask** | 38 сек. "`validateGoal()` функц аль хэдийн бүрэн хэрэгжсэн байна" — **шинэчлэх** хүсэлтийг **үүсгэх** гэж андуурч, нэг ч мөр код бичээгүй | [screenshot](evidence/copilot/copilot-bad-prompt-ask.png) |
| **Agent** | 2 мин 43 сек, **4 файл** өөрчилсөн (+243): функц + `PUT` route + frontend `updateGoal()` + тест | [screenshot](evidence/copilot/copilot-bad-prompt.png), [diff](evidence/copilot/copilot-bad-prompt.diff) |

Agent горимын кодын review:

| Төрөл | Олдвор |
|-------|--------|
|  Хүрээ | Зөвхөн функц хүссэн ч route, frontend API нэмсэн — хүсээгүй өөрчлөлт review-г хүндрүүлнэ |
|  Логик | Хоосон хүсэлт `{}` → алдаагүй; route нь 200 буцаана |
|  Логик | Хугацаа нь өнгөрсөн зорилгын нэрийг (форм хуучин хугацааг хамт илгээхэд) засаж чадахгүй — `current` огт авдаггүй |
|  Логик | `category: ""` → анхны `"personal"` руу чимээгүй солино |
|  Стил | `validateGoalChanges()` — зөвхөн `validateGoalUpdate`-ийг дууддаг илүүц функц; семантик нь PATCH боловч `PUT` ашигласан |
|  | `userId`/`id` үл тоомсорлоно; route `id` + `userId`-аар шүүнэ (BOLA-гүй) |

### Claude Code

[`evidence/claude/claude-bad-prompt.ts.txt`](evidence/claude/claude-bad-prompt.ts.txt) — репог уншаад
`validation.ts`-д функц, `PATCH` route жишээ, 7 тест **санал болгосон** (файл өөрчлөөгүй).

| Төрөл | Олдвор |
|-------|--------|
|  | Хоосон хүсэлт → алдаа; `category: null/""` → алдаа; хугацаа өөрчлөгдөөгүй бол дахин шалгахгүй; `userId` уншихгүй |
|  Логик | `currentDeadline` нь **заавал биш** параметр — route дамжуулахаа мартвал өнгөрсөн хугацааны алдаа буцаж гарна |
|  Логик | Одоогийн төлөв мэдэхгүй тул ижил `status`-ыг ч `changes`-д оруулна |
|  Логик | Алдаатай үед `changes` хагас бөглөгдсөн буцна |

**Ажиглалт:** Claude Code репог өөрөө уншдаг тул муу prompt-оор ч төслийн загварт нийцсэн
код гаргасан. Copilot нэг удаа даалгаврыг огт буруу ойлгож, нөгөө удаа хүрээгээ хэтрүүлсэн.
**Ямар ч хэрэгсэлд муу prompt-ын үр дүн тогтворгүй, урьдчилан таамаглах боломжгүй.**

## 2. Сайн prompt (алхам 4)

```
Контекст:
Our-New-Web-App төслийн backend (TypeScript, ESM, Express 5, Drizzle ORM, Vitest).
Зорилго үүсгэх шалгалт backend/src/goals/validation.ts дахь validateGoal()-д байгаа.
Зорилгын хүснэгт backend/src/db/schema.ts дахь `goals` (tb_goals).

Даалгавар:
PATCH /api/goals/:id-д зориулсан шинэ функц бич:
validateGoalUpdate(input: Record<string, unknown>, current: { deadline: string | null; status: GoalStatus }, today?: string)
Шинэ файл: backend/src/goals/update-validation.ts

Шаардлага:
1. Хэсэгчилсэн засвар — хүсэлтэд ирсэн талбарыг л шалгаж, update-д оруулна.
2. Засаж болох талбар зөвхөн: title, description, deadline, category, status.
   userId, id, createdAt зэргийг ХЭЗЭЭ Ч update-д оруулахгүй (mass assignment).
3. Хоосон PATCH ({}) бол errors._form алдаа.
4. title: trim хийнэ, 1..GOAL_TITLE_MAX_LENGTH тэмдэгт.
5. description: null эсвэл "" бол тайлбарыг арилгана (null), GOAL_DESCRIPTION_MAX_LENGTH-аас урт бол алдаа.
6. deadline, category: validation.ts дахь validateDeadline / validateCategory-г дахин ашигла.
7. status: goalStatusEnum.enumValues-ийн нэг байх ёстой; одоогийнхтой ижил бол update-д оруулахгүй.
8. today-ийн анхны утгыг todayInAppZone()-оос авна (тестэд mock хийнэ).

Аюулгүй байдал:
- input нь хэрэглэгчээс ирсэн unknown өгөгдөл — талбар бүрийн төрлийг заавал шалга.

Хариуны хэлбэр:
- Буцаах утга: { errors: { талбар: "монгол хэл дээрх мессеж" }, update }
- Кодын загвар, тайлбар (comment)-ыг validation.ts-тэй ижил монгол хэлээр бич.
- Кодыг зөвхөн харуул, файл бүү өөрчил.
```

(Copilot-д эхэнд нь `#file:backend/src/goals/validation.ts #file:backend/src/db/schema.ts` нэмсэн.)

Хариунууд: [Copilot](evidence/copilot/copilot-good-prompt.ts.txt) · [Claude Code](evidence/claude/claude-good-prompt.ts.txt)

Хоёулаа **шаардлагын хэлбэрийг яг дагасан**: зөв файл, зөв сигнатур, `{ errors, update }`,
`_form`, монгол мессеж, `validateDeadline`/`validateCategory`-г дахин ашигласан, whitelist-ээр
mass assignment-аас хамгаалсан, хоёулаа `validateDeadline`/`validateCategory`-г `export` хийх
шаардлагатайг өөрсдөө анзаарсан. Муу prompt-той харьцуулахад **хүрээ, хэлбэр, чанар эрс тогтворжсон**.

## 3. Review тэмдэглэл (алхам 5–6)

Лекц 13-ын шалгуур: **логик зөв үү · аюулгүй юу · стил нийцэж байна уу**.
Олдвор бүрийг тест болгож, хоёр ноорог дээр ажиллуулсан.

| Тест | Шалгах зүйл | Copilot | Claude |
|------|-------------|:-------:|:------:|
| REVIEW #1 | `userId`, `id`, `createdAt` update-д орохгүй (mass assignment) | ✅ | ✅ |
| REVIEW #2 | `title: ""` чимээгүй алгасахгүй, алдаа өгнө | ✅ | ✅ |
| REVIEW #3 | Хугацаа нь өнгөрсөн зорилгын **нэрийг** засах боломжтой | ❌ | ✅ |
| REVIEW #4 | `category: null` / `"  "` → `"personal"` руу чимээгүй солихгүй | ❌ | ❌ |
| REVIEW #5 | Нэг талбар буруу бол хагас засвар буцаахгүй | ❌ | ❌ |
| **Нийт (17 тест)** | | **14 / 17** | **15 / 17** |

Нотолгоо: [`test-on-copilot-good-prompt.txt`](evidence/copilot/test-on-copilot-good-prompt.txt),
[`test-on-claude-good-prompt.txt`](evidence/claude/test-on-claude-good-prompt.txt)

### Олдвор бүрийн тайлбар

**#3 — Copilot: хугацааг өөрчлөгдсөн эсэхийг шалгахаас ӨМНӨ "өнгөрсөн өдөр" гэж шалгадаг.**
```ts
const { error, deadline } = validateDeadline(input.deadline, today); // эхлээд шалгана
if (error !== undefined) errors.deadline = error;                     // ← энд унана
else if (deadline !== current.deadline) update.deadline = deadline;   // дараа нь харьцуулна
```
Фронт форм бүх талбарыг илгээдэг тул хугацаа нь өнгөрсөн зорилгын нэрийг засахад 400 буцаана.
`current.deadline` параметрийг авсан ч буруу дараалалд ашигласан. Claude энэ тохиолдлыг
JSDoc-доо тусгайлан тайлбарлаад зөв шийдсэн.

**#4 — Хоёулаа: `validateCategory("")` нь POST-д зориулсан анхны утга `"personal"` буцаадаг.**
PATCH дээр энэ нь хэрэглэгчийн `"health"` ангиллыг чимээгүй солино. Copilot `null`-ийг барьсан
ч `""`-г алдсан. **Claude энэ асуудлыг өөрөө анзаарч хариундаа бичсэн боловч засаагүй** —
"Таны шийдэх асуудал" гэж үлдээсэн. Prompt-д "validateCategory-г дахин ашигла" гэж заасан нь
AI-г буруу зан төлөвтэй функц руу түлхсэн гэж үзэж болно.

**#5 — Хоёулаа: алдаатай үед ч `update`-д зөв талбаруудыг буцаадаг.**
Route `errors`-ийг шалгахаа мартвал хагас засвар хадгалагдана. Prompt-д энэ нөхцөлийг
заагаагүй — **AI зөвхөн хэлсэн зүйлээ хийнэ, хэлээгүй аюулгүй байдлын нөхцөлийг нөхдөггүй.**

**Стил:** Copilot `Object.prototype.hasOwnProperty.call(...)` 6 удаа давтсан (`Object.hasOwn` хангалттай);
`status`-ыг `as GoalStatus`-аар cast хийсэн (type guard байхгүй). Claude `isGoalStatus` type guard,
`has()` туслах функц ашигласан — цэвэр.

### Review-гийн асуултууд

1. *`current.deadline`-ийг яагаад авсан бэ, хэзээ ашиглах ёстой вэ?* — Copilot параметрийг авсан
   ч шалгалтын дараалал буруу байсан. Шаардлагад "өөрчлөгдөөгүй хугацааг дахин шалгахгүй" гэж
   тодорхой бичээгүй нь шалтгаан.
2. *`validateCategory`-г дахин ашиглахад PATCH дээр ямар зан төлөв гарах вэ?* — дахин ашиглаж
   буй функцийн "анхны утга" нь шинэ нөхцөлд алдаа болж хувирсан.
3. *Алдаатай үед `update` юу агуулах ёстой вэ?* — гэрээ (contract)-нд тодорхойгүй байсан.

## 4. Засвар ба тестээр баталгаажуулалт (алхам 7)

Эцсийн хувилбар нь **Claude-ын ноорог дээр** суурилж дараах засваруудыг хийсэн:

| Засвар | Код |
|--------|-----|
| #4 | PATCH дээр `category: null` эсвэл `""` → `errors.category` (`validateCategory` руу дамжуулахгүй) |
| #5 | `errors` хоосон биш бол `update: {}` буцаана |
| Нэмэлт | `deadline: null` ба одоогийн хугацаа `null` бол "өөрчлөгдөөгүй" гэж үзнэ |
| Нэмэлт | `UPDATABLE_GOAL_FIELDS` тогтмол, `CurrentGoal` төрөл export |

Лаб 10-ын **AAA** аргаар 17 тест: 4 хэвийн, 12 edge/аюулгүй байдал, 1 mock (`todayInAppZone`).

| Хувилбар | Үр дүн |
|----------|--------|
| Copilot (сайн prompt) |  14 / 17 |
| Claude Code (сайн prompt) |  15 / 17 |
| **Эцсийн (review + засвар)** |  **17 / 17** — [`test-on-final.txt`](evidence/test-on-final.txt) |
| Backend бүх тест |  204 / 204, `typecheck` , `lint`  |

```bash
cd backend
npm ci
npm test -- update-validation.lab12
```

> Windows дээр `c:\...` (жижиг үсэг) замаас ажиллуулахад Vitest бүх suite дээр
> `Cannot read properties of undefined (reading 'config')` гэж унадаг. `C:\...`
> (том үсэг) замаас ажиллуулбал зүгээр — кодын алдаа биш.

### Өөрчлөгдсөн файлууд

| Файл | Өөрчлөлт |
|------|----------|
| `backend/src/goals/update-validation.ts` | **Шинэ** — `validateGoalUpdate`, `isGoalStatus`, `UPDATABLE_GOAL_FIELDS` |
| `backend/src/goals/update-validation.lab12.test.ts` | **Шинэ** — 17 тест |
| `backend/src/goals/validation.ts` | `validateDeadline`, `validateCategory`-г `export` болгосон |

Дараагийн алхам (лабын хүрээнээс гадуур): `routes/goals.ts`-д `PATCH /:id` нэмэхдээ
`where(and(eq(goals.id, id), eq(goals.userId, user.id)))` — өөр хэрэглэгчийн зорилгыг засахаас сэргийлнэ.

## 5. Дүгнэлт

- **Муу prompt → тогтворгүй үр дүн.** Copilot нэг удаа даалгаврыг буруу ойлгож код бичээгүй,
  нөгөө удаа 4 файл өөрчилж хүрээгээ хэтрүүлсэн. Claude Code репог уншиж нөхсөн ч сигнатур,
  алдааны түлхүүр (`form`) зэрэг нь бидний хүссэнээс өөр гарсан.
- **Сайн prompt → хэлбэр, хүрээ тогтворжсон.** Хоёр AI хоёулаа яг заасан файл, сигнатур, буцаах
  хэлбэр, хамгаалалтыг (mass assignment) зөв хэрэгжүүлсэн.
- **Сайн prompt ч review-г орлохгүй.** Хоёр AI-ийн код хоёулаа "ажилладаг" мэт харагдсан ч тест
  2–3 логик алдааг илрүүлсэн. Алдаа нь prompt-д **тодорхой бичээгүй** нөхцөлүүдэд (дахин ашиглаж
  буй функцийн анхны утга, алдаатай үеийн гэрээ) гарсан.
- **AI өөрөө анзаарсан ч засахгүй байж болно.** Claude #4-ийг тэмдэглэсэн ч хэрэглэгчид үлдээсэн —
  AI-ийн хариуны **тайлбар хэсгийг ч** заавал уншиж байх хэрэгтэй.
- **Тест нь review-г баталгаажуулна.** Олдвор бүрийг тест болгосноор ноорог дээр унаж, засварын
  дараа давж буйг нотолсон; цаашид регресс гарвал CI барина.
