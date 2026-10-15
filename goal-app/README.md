# 🎯 Goal-Oriented Personal Web App

AI болон Gamification (XP, Streaks, Achievements) ашиглан хувийн зорилгоо даалгаварт хувааж, түүнийгээ хэрэгжүүлэхэд туслах веб аппликейшн.

---

## 🛠️ Tech Stack & Architecture

- **Framework:** Next.js (App Router, TypeScript)
- **Database:** PostgreSQL (Supabase)
- **ORM:** Drizzle ORM & Drizzle Kit
- **AI Integration:** Google Gemini API
- **Styling:** Tailwind CSS

---

## ⚙️ Environment Setup (.env.local)

Төслийг local дээр ажиллуулахын тулд төслийн root фолдерт `.env.local` файл үүсгэж дараах тохиргоонуудыг оруулах шаардлагатай:

```env
# Database Connection (Direct 5432 Connection)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Gemini API
GEMINI_API_KEY="your-gemini-api-key"
```

---

## 🗄️ Өгөгдлийн сангийн миграц

Схемийг `src/db/schema.ts` дээр тодорхойлж, түүнээс SQL миграц **үүсгэж**
хадгална. ӨС-г гараар, эсвэл Supabase-ийн SQL editor дээр шууд өөрчлөхгүй —
тэгвэл хэн нэгний компьютер дээр нэг, ӨС дээр өөр бүтэц үүснэ.

```bash
npm run db:generate   # schema.ts-ийн өөрчлөлтөөс шинэ миграц үүсгэнэ
npm run db:migrate    # үүссэн миграцуудыг DATABASE_URL дээр ажиллуулна
```

`drizzle-kit push` ашиглахгүй. `push` нь ямар SQL ажиллуулсныг үлдээдэггүй
тул багийн хэн нь ямар өөрчлөлт хийснийг хянах, буцаах боломжгүй болдог.

### Ажиллах дараалал

1. `schema.ts` дээр өөрчлөлтөө хийнэ
2. `npm run db:generate` ажиллуулж, үүссэн `drizzle/*.sql`-ийг **уншиж шалгана**
3. Схем ба миграц хоёрыг **нэг коммитод** оруулна
4. PR merge болсны дараа `npm run db:migrate`

### Анхаарах

`drizzle/` доторх миграц нь `0000_init` дээрээс шинээр эхэлсэн. Өмнөх миграц
нь `tb_` угтваргүй хүснэгт үүсгэдэг байсан тул схемтэйгээ зөрсөн байв.

Хэрэв чиний local ӨС дээр хуучин миграц ажилласан байвал (`users`, `goals`
гэх мэт угтваргүй хүснэгттэй бол) тэр ӨС-г устгаад шинээр үүсгэ:

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```
