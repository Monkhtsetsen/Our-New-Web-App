# Лабораторийн ажил №8 — Тайлан

## Dockerfile бичих, Image бүтээх, ажиллуулах

| | |
|---|---|
| **Хичээл** | Программ хангамжийн хөгжүүлэлтийн процесс |
| **Долоо хоног** | 9 · CLO4 |
| **Төсөл** | `Monkhtsetsen/Our-New-Web-App` — Goal App |
| **Салбар** | `feature/erka-lab08-docker` |
| **Pull Request** | [#52](https://github.com/Monkhtsetsen/Our-New-Web-App/pull/52) |
| **Огноо** | 2026-10-31 |

### Гүйцэтгэсэн баг

| Нэр | Код | Үүрэг |
|---|---|---|
| О.Дэлгэрмаа | B232270024 | Product Owner |
| Т.Мөнхцэцэн | B232270025 | Scrum Master |
| Д.Нурсултан | B232270039 | Хөгжүүлэгч |
| И.Эрдэнэбаяр | B232270136 | Хөгжүүлэгч |

---

## 1. Зорилго

1. Dockerfile бие даан бичиж, layer caching-ийн зарчмыг ашиглах
2. Docker image бүтээж, container ажиллуулах
3. Docker Compose ашиглан олон сервис зэрэг ажиллуулах

---

## 2. Зааврын алхмуудын гүйцэтгэл

| № | Алхам | Хаана гүйцэтгэсэн |
|---|---|---|
| 1 | `docker --version` | CI, "Docker хувилбар" алхам |
| 2 | Жишиг апп бэлдэх | Багшийн жишээ биш, **өөрсдийн Goal App**-ыг ашигласан |
| 3 | Dockerfile бичих | [`goal-app/Dockerfile`](../../goal-app/Dockerfile) |
| 4 | `docker build` | §5 |
| 5 | `docker run -p 3000:3000` + хариу шалгах | §6 |
| 6 | `docker logs` | §6 |
| 7 | Docker Compose | [`docker-compose.yml`](../../docker-compose.yml), §7 |
| 8 | Layer caching ажиглах | §8 |

---

## 3. Dockerfile — гурван шат

Зааварт `FROM, WORKDIR, COPY package.json, RUN npm install, COPY . ., CMD`
гэсэн дараалал өгсөн. Үүнийг мөрдөж, дээр нь Next.js-ийн шаардлагад
тохируулан **multi-stage** болгов.

| Шат | Юу хийдэг | Яагаад тусдаа вэ |
|---|---|---|
| `deps` | `npm ci` | Хамаарал нь кодоос хамаарахгүй — тусад нь кэшлэгдэнэ |
| `builder` | `npm run build` | Build-ийн хэрэгслүүд энд үлдэж, эцсийн image-д орохгүй |
| `runner` | `node server.js` | Цэвэр суурь, зөвхөн ажиллахад хэрэгтэй зүйлс |

### Дарааллын учир

```dockerfile
COPY package.json package-lock.json ./   # ЭХЛЭЭД зөвхөн энэ хоёр
RUN npm ci
COPY . .                                 # ДАРАА НЬ эх код
RUN npm run build
```

Docker мөр бүрийг тусдаа layer болгон кэшлэдэг. Layer нь өөрийн болон
**өмнөх** мөрүүдийн оролт өөрчлөгдсөн үед л дахин ажиллана.

Хэрэв `COPY . .`-г эхэнд нь бичсэн бол кодын нэг үсэг засах бүрт түүний
дараах бүх layer хүчингүй болж, 600 МБ хамаарал дахин суух байв. Хамаарлын
хоёр файл нь ховор өөрчлөгддөг тул тэднийг эхэнд тавьснаар `npm ci`
кэшнээс ирдэг болно. §8-д үүнийг тоогоор баталсан.

### output: "standalone"

`next.config.ts` дээр нэмэв. Build хийхэд ажиллуулахад шаардлагатай файлууд
нэг газар цуглардаг:

| | Хэмжээ |
|---|---|
| `node_modules` бүтнээр | 569 МБ |
| `.next/standalone` | **23 МБ** |

Иймд `runner` шатанд `node_modules`-ыг огт зөөхгүй. Эцсийн image-д эх код,
`devDependencies`, build-ийн хэрэгсэл **байхгүй**.

### Хоёр нарийн зүйл

**`HOSTNAME=0.0.0.0`.** Анхны утга нь `localhost`. Тэр тохиолдолд сервер
зөвхөн контейнерийн дотор сонсох тул `-p 3000:3000` нээсэн ч гаднаас
хүрэхгүй. Энэ бол контейнержуулалтын хамгийн түгээмэл алдаануудын нэг.

**`USER nextjs`.** Контейнер анхдагчаар `root` эрхээр ажилладаг. Аппад эмзэг
байдал илэрвэл халдагч шууд root болно. Тусдаа хэрэглэгч үүсгэж эрхийг
хязгаарлав.

### .dockerignore

`node_modules`, `.next`, `.git`-ээс гадна **`.env`**-ийг заавал хассан.
Хасахгүй бол ӨС-ийн нууц үг, API түлхүүр image дотор шатаж үлдэнэ — image-ийг
хэн ч татаж, задлан уншиж чадна.

---

## 4. Docker суусан эсэхийг шалгах (алхам 1)

```
$ docker --version
Docker version 28.0.4, build b8034c0
```

---

## 5. Image бүтээх (алхам 4)

```
$ docker build --progress=plain -t goal-app:1.0 goal-app
```

Бүтэн лог: [`docker-build.txt`](docker-build.txt)

```
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
goal-app     1.0       c489b8e6a73e   1 second ago   210MB
```

210 МБ. Үүний дийлэнх нь `node:24-alpine` суурь. Хэрэв `node_modules`-ыг
бүтнээр нь хуулсан бол 700 МБ-аас давах байв.

---

## 6. Контейнер ажиллуулах ба лог (алхам 5, 6)

```
$ docker run -d --name goal-app -p 3000:3000 goal-app:1.0
$ curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
HTTP 200 — апп хариу өгч байна
```

`docker logs goal-app` — бүтэн лог: [`docker-run.txt`](docker-run.txt)

```
▲ Next.js 16.4.3
- Local:         http://localhost:3000
- Network:       http://0.0.0.0:3000
✓ Ready in 0ms
```

`Network: 0.0.0.0` гэж байгаа нь `HOSTNAME` тохиргоо ажилласны нотолгоо.
Хэрэв `localhost` байсан бол `curl` амжилтгүй болох байв.

---

## 7. Docker Compose (алхам 7)

[`docker-compose.yml`](../../docker-compose.yml) нь апп + **PostgreSQL 17**-г
зэрэг асаана:

```bash
docker compose up --build
```

Supabase төсөл хараахан нээгээгүй тул бүртгүүлэх урсгалыг жинхэнэ ӨС дээр
турших боломжгүй байсан. Энэ нь тэр цоорхойг нөхнө.

**Хоёр зүйлийг онцлох нь зүйтэй.**

`DATABASE_URL`-ийн хост нь `localhost` биш **`db`**. Контейнер бүр өөрийн
сүлжээний орон зайтай тул `localhost` нь аппын өөрийнх нь контейнерийг заана.
Compose сервисийн нэрийг DNS болгож өгдөг.

`healthcheck` нь "процесс асав" биш "**хүсэлт хүлээж авахад бэлэн**" гэдгийг
шалгана. Үгүй бол апп ӨС бэлэн болохоос өмнө асч холболтын алдаа өгнө.

---

## 8. Layer caching ажиглах (алхам 8)

`goal-app/app/page.tsx`-д нэг мөр нэмээд дахин `docker build` хийв.

Бүтэн лог: [`docker-rebuild.txt`](docker-rebuild.txt)

**Кэшнээс ирсэн алхам: 9**

| Layer | Үр дүн | Шалтгаан |
|---|---|---|
| `[deps] RUN apk add libc6-compat` | CACHED | Өөрчлөгдөөгүй |
| `[deps] COPY package.json package-lock.json` | CACHED | Хамаарлын файл хөдлөөгүй |
| **`[deps] RUN npm ci`** | **CACHED** | Гол нь энэ. Хамаарал дахин суугаагүй |
| `[builder] COPY --from=deps node_modules` | CACHED | deps шат өөрчлөгдөөгүй |
| **`[builder] COPY . .`** | **дахин ажиллав** | Эх код өөрчлөгдсөн |
| **`[builder] RUN npm run build`** | **дахин ажиллав** | Өмнөх layer хүчингүй болсон |
| `[runner] RUN addgroup / adduser` | CACHED | Build-ээс хамаарахгүй |
| `[runner] COPY public` | CACHED | Өөрчлөгдөөгүй |

Энэ бол дарааллын шийдвэрийн шууд үр дүн. `npm ci`-г `COPY . .`-ийн **дараа**
бичсэн бол тэр мөр ч улаан болж, 600 МБ хамаарал дахин суух байв.

---

## 9. Нотолгоог хэрхэн гаргасан бэ

Docker Desktop миний машин дээр суугаагүй тул локал дээр build, run хийх
боломжгүй байв. Оронд нь CI-д `docker` ажил нэмж, GitHub-ийн runner дээр
бодитоор гүйцэтгэв:

[**Run 41186551402**](https://github.com/Monkhtsetsen/Our-New-Web-App/actions/runs/41186551402)

| Алхам | Үр дүн |
|---|---|
| Docker хувилбар | амжилттай |
| Image бүтээх (хүйтэн) | амжилттай |
| Image-ийн хэмжээ | амжилттай |
| Контейнер ажиллуулах | амжилттай |
| **Апп хариу өгч байгааг шалгах** | **HTTP 200** |
| Контейнерийн лог | амжилттай |
| **Layer caching** | **9 алхам кэшнээс** |

Энэ нь дэлгэцийн зурагнаас нэг давуу талтай: хэн ч дарж орж өөрийн нүдээр
шалгаж болно. Мөн PR бүр дээр дахин ажиллах тул Dockerfile эвдэрвэл шууд
мэдэгдэнэ.

---

## 10. Хажуугаар илэрсэн зүйл — Next.js-ийн critical эмзэг байдал

Энэ ажлыг хийх явцад `npm run build` **санамсаргүй байдлаар** унах нь
анзаарагдав:

```
Error [SecurityFatalError]: Your version of Next.js is affected by
a known security vulnerability.
```

Ажиллуулалт болгон дээр биш — гурваас хоёр дээр. `npm audit` шалгахад
Next.js 16.4.0 дээр **critical** зэрэглэлийн гурван advisory байв:

| Advisory | Төрөл | Манай кодод |
|---|---|---|
| [GHSA-2464-fhr4-w9xw](https://github.com/advisories/GHSA-2464-fhr4-w9xw) | RCE — Image Optimization, SVG | `<Image src="/next.svg">` |
| [GHSA-673q-mjm6-r5xr](https://github.com/advisories/GHSA-673q-mjm6-r5xr) | RCE — `use cache` + typed array | `cacheComponents: true` |
| [GHSA-p3m5-59mp-jv5r](https://github.com/advisories/GHSA-p3m5-59mp-jv5r) | DoS — Server Actions | signup |

**16.4.3** болгон засав — patch хувилбар тул эвдрэх зүйлгүй. Шинэчилсний
дараа build гурван удаа дараалан `exit 0`.

Энэ нь лаб 8-ын сэдэв биш боловч тус PR-т хамт оруулсан: хуучин хувилбар
дээр Docker image-ийг найдвартай build хийж чадахгүй байв.

---

## 11. Гүйцэтгэлийн шалгуурын хяналт

| Зааврын шаардлага | Төлөв | Нотолгоо |
|---|---|---|
| `docker --version` шалгах | ✅ | §4 |
| Dockerfile — FROM, WORKDIR, COPY, RUN, CMD зөв дараалалтай | ✅ | §3 |
| Layer caching-ийг санасан дараалал | ✅ | §3, §8 |
| `docker build` | ✅ | §5 |
| `docker run -p 3000:3000` + хөтөч дээр шалгах | ✅ | §6 — HTTP 200 |
| `docker logs` | ✅ | §6 |
| `docker-compose.yml` (апп + database) | ✅ | §7 |
| Layer caching ажиглах | ✅ | §8 — 9 алхам кэшнээс |
| **Dockerfile** | ✅ | [`goal-app/Dockerfile`](../../goal-app/Dockerfile) |
| **Screenshot: ажиллаж буй апп** | ⏳ | §12 |
| **Screenshot: build output** | ⏳ | §12 |

---

## 12. Дутуу зүйл — шулуухан хэлэхэд

Заавар **2 дэлгэцийн зураг** шаарддаг. Docker Desktop суугаагүй тул локал
дээр авч чадаагүй.

Оронд нь §5, §6, §8-д бодит лог, ажиллалтын холбоосыг тавьсан. Эдгээр нь
зурагнаас илүү шалгагдахуйц боловч **зааврын шаардлагыг бүрэн орлохгүй**.

Docker Desktop суулгасны дараа дараах хоёрыг авч энд нэмнэ:

```bash
docker build -t goal-app:1.0 goal-app        # build output-ийн зураг
docker run -p 3000:3000 goal-app:1.0         # localhost:3000 нээж зураг
```

---

## 13. Дүгнэлт

Өмнө нь аппыг ажиллуулахын тулд Node.js-ийн зөв хувилбар суулгах, 600 МБ
хамаарал татах, орчны хувьсагч тохируулах шаардлагатай байв. Багийн гишүүн
бүр өөр өөр орчинд ажиллаж байсан — "миний машин дээр ажиллаж байна" гэдэг
асуудал яг эндээс гардаг.

Одоо нэг команд:

```bash
docker compose up --build
```

Хэн ч, ямар ч машин дээр ижил орчинд, ӨС-тэй нь хамт ажиллуулна.

Хамгийн чухал ажиглалт: **Dockerfile-ийн мөрийн дараалал нь гоо сайхны
асуудал биш.** `COPY` хоёр мөрийн байрыг солиход build бүр 600 МБ хамаарал
дахин суух бөгөөд CI-гийн хугацаа хэдэн минутаар уртсана. §8-ын хүснэгт тэр
ялгааг шууд харуулж байна.

Дараагийн алхам (Лаб 9): энэ image-ийг Minikube дээр Deployment, Service
болгон байрлуулах.
