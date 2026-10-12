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
