# Copilot — муу prompt ("зорилго шинэчлэх validation функц бичээд өг")

## Оролдлого 1 — Agent горим (copilot-bad-prompt.png, copilot-bad-prompt.diff)
- 23 алхам, 2м43с, 4 файл өөрчилсөн (+243 −1) — зөвхөн функц хүссэн ч route + frontend API нэмсэн (хүсээгүй хүрээ тэлэлт)
- validation.ts-д validateGoalUpdate(input, today) → { errors, changes }
- Review олдворууд:
  - Хоосон PATCH {} → алдаагүй, changes={} (route нь 200 + одоогийн зорилгыг буцаадаг)
  - Хугацаа ирэх бүрд "өнгөрсөн" шалгана → хугацаа нь өнгөрсөн зорилгын нэрийг (хуучин deadline-тай хамт) засаж чадахгүй
  - category: "" → validateCategory анхны "personal" руу чимээгүй солино (null-ийг л барьсан)
  - status-ийг ижил байсан ч changes-д оруулна (хор багатай)
  - validateGoalChanges() — validateGoalUpdate-ийг дуудах л илүүц давхар функц
  - Алдаатай үед changes хагас бөглөгдсөн буцна
  - PUT ашигласан ч семантик нь PATCH (хэсэгчилсэн)
  - deadline салбар: validateDeadline(null)-ийг давхар шалгасан, нийлмэл
  - САЙН: `input.X !== undefined` + шинэ changes объект → mass assignment-гүй (userId үл тоомсорлоно, тесттэй);
    route-д and(eq(id), eq(userId)) — BOLA-гүй; title "" алдаа өгнө
  - 191 backend тест давсан гэж мэдэгдсэн
- Хэрэглэгч энэ өөрчлөлтийг буцаасан (working tree цэвэр).

## Оролдлого 2 — Ask горим (copilot-bad-prompt-ask.png)
- 7 алхам, 38с
- "validateGoal() функц аль хэдийн бүрэн хэрэгжсэн байна" — ШИНЭЧЛЭХ (update) хүсэлтийг ҮҮСГЭХ (create) шалгалттай андуурсан.
- Ямар ч код бичээгүй; "бичих эрхтэй agent руу сольж бол..." гэж санал болгосон.
- Дүгнэлт: тодорхойгүй prompt → AI буруу ойлгосон / огт өөр хариу.
