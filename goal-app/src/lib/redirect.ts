/** Нэвтэрсний дараа очих анхны хуудас. */
const DEFAULT_DESTINATION = "/profile";

/**
 * `?next=` параметрийг аюулгүй болгоно.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ЭНЭ НЬ ЖИНХЭНЭ ЭМЗЭГ БАЙДЛААС СЭРГИЙЛНЭ (open redirect).
 *
 * Халдагч `/login?next=https://hуurmаg-sait.com` гэсэн холбоос
 * тараана. Хэрэглэгч манай жинхэнэ хаяг дээр, жинхэнэ формд нууц
 * үгээ бичиж нэвтэрнэ — дараа нь хуурамч сайт руу шиднэ. Тэнд
 * "сесс дууслаа, дахин нэвтэрнэ үү" гэсэн хуулбар форм хүлээж байна.
 *
 * Тиймээс зөвхөн ӨӨРИЙН сайтын доторх замыг зөвшөөрнө.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export function safeDestination(raw: string | null): string {
  if (raw === null || raw.length === 0) return DEFAULT_DESTINATION;

  // Нэг ташуу зураасаар эхлэх ёстой. "//evil.com" нь протоколгүй
  // ГАДНЫ хаяг, "/\evil.com"-ыг зарим хөтөч мөн тэгж үздэг.
  if (!raw.startsWith("/")) return DEFAULT_DESTINATION;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return DEFAULT_DESTINATION;

  return raw;
}
