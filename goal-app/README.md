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

## 🚀 Ажиллуулах

```bash
cd goal-app
npm install
cp .env.example .env.local   # дараа нь утгуудыг нь бөглөнө
npm run dev
```

Апп `http://localhost:3000` дээр ажиллана.

| Команд | Үүрэг |
|---|---|
| `npm run dev` | Хөгжүүлэлтийн сервер |
| `npm run build` | Production build |
| `npm run lint` | ESLint шалгалт |
| `npx drizzle-kit generate` | Schema-гийн өөрчлөлтөөс migration үүсгэх |

---

## ⚙️ Environment Setup (.env.local)

Тохиргооны хувьсагчдын загварыг [`.env.example`](.env.example) файлд бэлтгэсэн.
Түүнийг `goal-app/` хавтас дотор `.env.local` нэрээр хуулж аваад утгуудыг нь
солино. `.env.local` нь `.gitignore`-д багтсан тул git-д орохгүй.

```env
# Database Connection (Direct 5432 Connection)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Gemini API
GEMINI_API_KEY="your-gemini-api-key"
```
