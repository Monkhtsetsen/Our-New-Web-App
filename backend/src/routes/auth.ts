import { Router } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { users } from "../db/schema.js";
import { hashPassword } from "../auth/password.js";
import { parseContact, validateSignup } from "../auth/validation.js";

export const authRouter: Router = Router();

/**
 * POST /api/auth/signup
 *
 * Шинэ хэрэглэгч бүртгэнэ.
 *
 * Хүлээн авах:  { name, contact, password }
 *   contact нь и-мэйл ЭСВЭЛ утасны дугаар — аль нь болохыг өөрөө таана.
 *
 * Буцаах:
 *   201  { user: { id, name, email, phone, createdAt } }
 *   400  { errors: { талбар: мессеж } }
 *   409  { errors: { contact: "..." } }   аль хэдийн бүртгэлтэй
 */
authRouter.post("/signup", async (req, res, next) => {
  try {
    const body: unknown = req.body;
    if (typeof body !== "object" || body === null) {
      res.status(400).json({ errors: { contact: "Хүсэлтийн бие буруу байна" } });
      return;
    }

    const { name, contact, password } = body as Record<string, unknown>;

    // Хөтөч дээрх шалгалтыг тойрч шууд API руу хүсэлт илгээх боломжтой
    // тул энд дахин, бүрэн шалгана.
    const errors = validateSignup({
      name: typeof name === "string" ? name : "",
      contact: typeof contact === "string" ? contact : "",
      password: typeof password === "string" ? password : "",
    });

    if (Object.keys(errors).length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const parsed = parseContact(contact as string);
    if (parsed === null) {
      // validateSignup үүнийг барьсан байх ёстой — давхар хамгаалалт.
      res.status(400).json({
        errors: { contact: "И-мэйл хаяг эсвэл утасны дугаар буруу байна" },
      });
      return;
    }

    const db = getDb();
    const column = parsed.kind === "email" ? users.email : users.phone;

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(column, parsed.value))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({
        errors: {
          contact:
            parsed.kind === "email"
              ? "Энэ и-мэйл бүртгэлтэй байна"
              : "Энэ дугаар бүртгэлтэй байна",
        },
      });
      return;
    }

    // Дараалал чухал: эхлээд шалгалт, дараа нь hash. scrypt нь ~300мс
    // зарцуулдаг тул буруу оролт болгон дээр ажиллуулбал хэн ч дуртай
    // үедээ серверийг ачаалах боломжтой болно.
    const passwordHash = await hashPassword(password as string);

    // level, xp, streak-ийг зааж өгөхгүй — схем дээрх анхны утга (1, 0, 0)
    // хүчинтэй байх ёстой. Хоёр газар давхардуулбал салж явах эрсдэлтэй.
    const [created] = await db
      .insert(users)
      .values(
        parsed.kind === "email"
          ? { name: name as string, email: parsed.value, passwordHash }
          : { name: name as string, phone: parsed.value, passwordHash },
      )
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        createdAt: users.createdAt,
      });

    // passwordHash-ийг хариуд ХЭЗЭЭ Ч оруулахгүй.
    res.status(201).json({ user: created });
  } catch (error) {
    next(error);
  }
});
