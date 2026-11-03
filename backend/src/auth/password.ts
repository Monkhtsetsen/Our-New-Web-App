import {
  randomBytes,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";
import { promisify } from "node:util";

/**
 * `promisify` нь `scrypt`-ийн олон хувилбараас options-гүйг нь сонгодог тул
 * төрлийг нь гараар зарлав. Ингэхгүй бол N, r, p дамжуулахад TypeScript
 * "Expected 3 arguments, but got 4" гэж алдаа өгнө.
 */
const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

/**
 * scrypt-ийн параметрүүд — OWASP Password Storage Cheat Sheet-ийн доод хэмжээ.
 *
 * Яагаад scrypt вэ:
 *   - Node-ийн дотоод сан тул нэмэлт хамаарал, native build шаардахгүй
 *   - Санах ойд хүндрэлтэй (memory-hard) тул GPU-гаар эвдэхэд үнэтэй
 *   - OWASP-ийн зөвшөөрсөн жагсаалтад багтана
 *
 * Argon2id нь илүү зөвлөмжтэй боловч гадны сан (native binding) шаардана.
 * Хэрэв ирээдүйд argon2 руу шилжвэл доорх ALGORITHM тэмдэглэгээг ашиглан
 * хуучин hash-уудыг нэвтрэх үед нь аажмаар дахин тооцоолж шилжүүлнэ.
 */
const PARAMS = {
  N: 131072, // 2^17 — CPU/санах ойн зардал
  r: 8, // блокийн хэмжээ
  p: 1, // параллель зэрэг
} as const;

/** 128 МБ-аас арай илүү — N·r·128 байт шаардагдана. */
const MAX_MEM = 192 * 1024 * 1024;

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const ALGORITHM = "scrypt";
const SEPARATOR = "$";

/**
 * Зэрэг ажиллах hash-ийн дээд тоо.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ЯАГААД ХЯЗГААРЛАХ ЁСТОЙ ВЭ
 *
 * scrypt нь зориуд санах ой иддэг: N·r·128 = 131072·8·128 ≈ 128 МБ
 * нэг тооцоололд. Энэ нь GPU-гаар эвдэхийг үнэтэй болгодог давуу
 * тал — гэхдээ хамгаалалтгүй орхивол өөрийн эсрэг эргэнэ.
 *
 * Хэрэв 20 хүн зэрэг нэвтрэхийг оролдвол 20 × 128 МБ = 2.5 ГБ
 * шаардагдана. Ердийн контейнер 512 МБ-тай байдаг тул процесс
 * санах ой дүүрч унана — өөрөөр хэлбэл хэн ч хэдхэн хүсэлтээр
 * серверийг унагаах боломжтой болно.
 *
 * Энэ хаалга нь зэрэг ажиллахыг хоёроор хязгаарлана: санах ойн
 * дээд хэрэглээ ~256 МБ болж тогтоно. Бусад хүсэлт ээлжиндээ
 * хүлээнэ — удаан боловч унахаас дээр.
 *
 * (Хүсэлтийн хязгаарлагч нь нэг IP-г барьдаг; энэ нь бүх эх
 * үүсвэрээс ирэх нийт ачааллыг барина. Хоёулаа хэрэгтэй.)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
const MAX_CONCURRENT_HASHES = 2;

let activeHashes = 0;
const waiting: Array<() => void> = [];

function acquireSlot(): Promise<void> | undefined {
  if (activeHashes < MAX_CONCURRENT_HASHES) {
    activeHashes += 1;
    return undefined;
  }
  return new Promise<void>((resolve) => waiting.push(resolve));
}

/**
 * Суудлыг чөлөөлнө.
 *
 * Хүлээгч байвал тоолуурыг БУУРУУЛАХГҮЙ, суудлыг шууд түүнд
 * шилжүүлнэ. Эс бөгөөс буурах ба хүлээгч сэрэх хоёрын хооронд
 * шинэ дуудлага орж ирээд хязгаар давах эрсдэлтэй.
 */
function releaseSlot(): void {
  const next = waiting.shift();
  if (next !== undefined) {
    next();
    return;
  }
  activeHashes -= 1;
}

async function withSlot<T>(run: () => Promise<T>): Promise<T> {
  const wait = acquireSlot();
  if (wait !== undefined) await wait;

  try {
    return await run();
  } finally {
    releaseSlot();
  }
}

/**
 * Нууц үгийг hash болгоно.
 *
 * Буцаах утга нь өөрөө параметрээ агуулсан мөр тул ирээдүйд параметр
 * өөрчлөгдсөн ч хуучин hash-ууд шалгагдсаар байна:
 *
 *     scrypt$131072$8$1$<salt>$<hash>
 *
 * Давс (salt) нь hash тутамд санамсаргүй үүсдэг тул ижил нууц үгтэй хоёр
 * хэрэглэгч өөр өөр hash-тай болно.
 *
 * @param plain - Хэрэглэгчийн оруулсан нууц үг
 * @returns Өгөгдлийн санд хадгалах мөр
 */
export async function hashPassword(plain: string): Promise<string> {
  if (typeof plain !== "string" || plain.length === 0) {
    throw new Error("Нууц үг хоосон байж болохгүй");
  }

  const salt = randomBytes(SALT_LENGTH);
  const derived = await withSlot(() =>
    scryptAsync(plain, salt, KEY_LENGTH, { ...PARAMS, maxmem: MAX_MEM }),
  );

  return [
    ALGORITHM,
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("base64"),
    derived.toString("base64"),
  ].join(SEPARATOR);
}

/**
 * Оруулсан нууц үг хадгалсан hash-тай тохирч байгаа эсэхийг шалгана.
 *
 * Харьцуулалтыг `timingSafeEqual`-аар хийнэ. Энгийн `===` ашиглавал
 * тэнцүү биш болох мөчид шууд зогсдог тул хариу өгөх хугацаанаас нууц үгийн
 * эхний хэдэн тэмдэгт таарсныг таах боломж үүсдэг (timing attack).
 *
 * Хадгалсан мөр гэмтэлтэй бол алдаа шидэхгүй, `false` буцаана — ингэснээр
 * дуудаж буй код алдааны төрлөөр ялгаж мэдэхгүй.
 *
 * @param plain - Шалгах нууц үг
 * @param stored - Өгөгдлийн сангаас уншсан `password_hash`
 */
export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<boolean> {
  if (typeof plain !== "string" || typeof stored !== "string") {
    return false;
  }

  const parts = stored.split(SEPARATOR);
  if (parts.length !== 6) return false;

  const [algorithm, nRaw, rRaw, pRaw, saltB64, hashB64] = parts;

  // Урт нь 6 гэдгийг дээр шалгасан ч TypeScript массивын элемент бүрийг
  // undefined байж болзошгүй гэж үздэг (noUncheckedIndexedAccess).
  // Энэ нь зүй ёсны хатуу байдал — гэмтэлтэй мөр ирвэл яг энд таслана.
  if (
    algorithm !== ALGORITHM ||
    nRaw === undefined ||
    rRaw === undefined ||
    pRaw === undefined ||
    saltB64 === undefined ||
    hashB64 === undefined
  ) {
    return false;
  }

  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return false;
  }

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltB64, "base64");
    expected = Buffer.from(hashB64, "base64");
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length === 0) return false;

  let actual: Buffer;
  try {
    actual = await withSlot(() =>
      scryptAsync(plain, salt, expected.length, { N, r, p, maxmem: MAX_MEM }),
    );
  } catch {
    // Гэмтэлтэй параметр (ж.нь хэт том N) scrypt-ийг унагаана.
    return false;
  }

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * Жинхэнэ hash шиг харагдах, хэнд ч хамаарахгүй мөр үүсгэнэ.
 *
 * Хэрэггүй мэт санагдаж болох ч чухал: нэвтрэх үед "ийм хэрэглэгч алга"
 * гэж шууд буцаавал хариу 1 миллисекундэд ирнэ, харин нууц үг буруу бол
 * scrypt ажиллаад ~300мс болно. Халдагч энэ ялгааг хэмжээд ямар хаяг
 * бүртгэлтэй байгааг жагсааж чадна.
 *
 * Тиймээс хэрэглэгч олдоогүй үед ч энэ мөрийн эсрэг `verifyPassword`
 * ажиллуулна — хариу өгөх хугацаа ижил болно.
 *
 * Санамсаргүй байт тул ямар ч нууц үг үүнтэй таарахгүй.
 */
export function createDummyHash(): string {
  return [
    ALGORITHM,
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    randomBytes(SALT_LENGTH).toString("base64"),
    randomBytes(KEY_LENGTH).toString("base64"),
  ].join(SEPARATOR);
}
