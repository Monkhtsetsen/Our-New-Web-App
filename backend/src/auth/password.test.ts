import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

// scrypt нь санаатайгаар удаан тул анхны 5 секундын хязгаар хүрэлцэхгүй.
const TIMEOUT = 30_000;

describe("hashPassword", () => {
  it(
    "нууц үгийг задлах боломжгүй болгоно",
    async () => {
      const hash = await hashPassword("zoriltoo-biluuleh-2026");

      expect(hash).not.toContain("zoriltoo-biluuleh-2026");
      expect(hash.length).toBeGreaterThan(80);
    },
    TIMEOUT,
  );

  it(
    "параметрээ өөртөө агуулсан хэлбэртэй байна",
    async () => {
      const hash = await hashPassword("nuuts-ug-12345");
      const parts = hash.split("$");

      expect(parts).toHaveLength(6);
      expect(parts[0]).toBe("scrypt");
      expect(Number(parts[1])).toBe(131072); // N = 2^17, OWASP доод хэмжээ
      expect(Number(parts[2])).toBe(8); // r
      expect(Number(parts[3])).toBe(1); // p
    },
    TIMEOUT,
  );

  // AC: "хоёр хэрэглэгч ижил нууц үг сонгосон ч hash нь өөр байна"
  it(
    "ижил нууц үгээс өөр өөр hash гаргана (salt ажиллаж байна)",
    async () => {
      const [a, b] = await Promise.all([
        hashPassword("ижил-нууц-үг-123"),
        hashPassword("ижил-нууц-үг-123"),
      ]);

      expect(a).not.toBe(b);
    },
    TIMEOUT,
  );

  it("хоосон нууц үг хүлээж авахгүй", async () => {
    await expect(hashPassword("")).rejects.toThrow(
      "Нууц үг хоосон байж болохгүй",
    );
  });
});

describe("verifyPassword", () => {
  it(
    "зөв нууц үгийг хүлээн зөвшөөрнө",
    async () => {
      const hash = await hashPassword("zov-nuuts-ug-2026");

      await expect(verifyPassword("zov-nuuts-ug-2026", hash)).resolves.toBe(
        true,
      );
    },
    TIMEOUT,
  );

  it(
    "буруу нууц үгийг няцаана",
    async () => {
      const hash = await hashPassword("zov-nuuts-ug-2026");

      await expect(verifyPassword("buruu-nuuts-ug", hash)).resolves.toBe(false);
    },
    TIMEOUT,
  );

  it(
    "нэг тэмдэгтийн зөрүүг ч барина",
    async () => {
      const hash = await hashPassword("nuuts-ug-123");

      await expect(verifyPassword("nuuts-ug-124", hash)).resolves.toBe(false);
    },
    TIMEOUT,
  );

  it(
    "кирилл ба emoji агуулсан нууц үг ажиллана",
    async () => {
      const password = "Монгол-нууц-үг-🔒-2026";
      const hash = await hashPassword(password);

      await expect(verifyPassword(password, hash)).resolves.toBe(true);
    },
    TIMEOUT,
  );

  describe("гэмтэлтэй өгөгдөлд алдаа шидэхгүй, false буцаана", () => {
    const BROKEN = [
      ["хоосон мөр", ""],
      ["хэсэг дутуу", "scrypt$131072$8$1$abc"],
      ["танихгүй алгоритм", "md5$131072$8$1$YWJj$ZGVm"],
      ["N нь тоо биш", "scrypt$abc$8$1$YWJj$ZGVm"],
      ["salt хоосон", "scrypt$131072$8$1$$ZGVm"],
      ["hash хоосон", "scrypt$131072$8$1$YWJj$"],
    ] as const;

    for (const [name, stored] of BROKEN) {
      it(name, async () => {
        await expect(verifyPassword("yamar-ch-ug", stored)).resolves.toBe(
          false,
        );
      });
    }
  });

  it("мөр биш утга өгвөл false буцаана", async () => {
    // Гадны өгөгдөл төрлийн шалгалтыг тойрч ирэх магадлалтай.
    const notAString = null as unknown as string;

    await expect(verifyPassword("ug", notAString)).resolves.toBe(false);
    await expect(verifyPassword(notAString, "scrypt$1$1$1$a$b")).resolves.toBe(
      false,
    );
  });
});

describe("Зэрэг ажиллах hash-ийн хязгаар", () => {
  /**
   * scrypt нэг бүр ~128 МБ санах ой иддэг. Хязгааргүй бол хэдхэн
   * зэрэгцээ хүсэлт процессыг унагаана.
   *
   * Хязгаарыг гаднаас шууд хэмжих боломжгүй (санах ойн хэрэглээг
   * тестээс найдвартай харах арга хомс) — харин дараалал зөв
   * ажиллаж байгааг шалгана: суудлыг буруу шилжүүлбэл энд гацах
   * эсвэл үр дүн холилдоно.
   */
  it(
    "олон зэрэгцээ дуудлага бүгд зөв үр дүн буцаана",
    async () => {
      const passwords = Array.from({ length: 6 }, (_, i) => `нууц-үг-${i}-2026`);

      const hashes = await Promise.all(passwords.map((p) => hashPassword(p)));

      // Давс нь hash тутамд санамсаргүй тул хоёр ижил гарч болохгүй.
      expect(new Set(hashes).size).toBe(passwords.length);

      const checks = await Promise.all(
        passwords.map((p, i) => verifyPassword(p, hashes[i] as string)),
      );
      expect(checks.every(Boolean)).toBe(true);
    },
    TIMEOUT,
  );

  it(
    "зэрэгцээ ажиллахад буруу нууц үг зөвшөөрөгдөхгүй",
    async () => {
      const hash = await hashPassword("зөв-нууц-үг-2026");

      const results = await Promise.all([
        verifyPassword("буруу-нэг", hash),
        verifyPassword("зөв-нууц-үг-2026", hash),
        verifyPassword("буруу-хоёр", hash),
        verifyPassword("зөв-нууц-үг-2026", hash),
      ]);

      expect(results).toEqual([false, true, false, true]);
    },
    TIMEOUT,
  );

  /**
   * Суудлыг `finally` дотор чөлөөлдөг. Үгүй бол алдаа гарсан
   * дуудлага суудлаа үүрд эзэмшиж, хоёр дахь алдааны дараа бүх
   * нэвтрэлт мөнхөд гацах байв.
   *
   * Энд scrypt-ийг ӨӨРИЙГ нь унагаана: N хэт том бол Node алдаа
   * шиднэ. Энэ нь суудал АВСНЫ ДАРАА болдог тул чөлөөлөлтийг
   * жинхэнээр шалгаж байна. (`hashPassword("")` нь суудал авахаасаа
   * өмнө унадаг тул энэ замыг шалгахгүй.)
   */
  it(
    "scrypt дотроо унасан ч суудал чөлөөлөгдөнө",
    async () => {
      const salt = Buffer.alloc(16).toString("base64");
      const key = Buffer.alloc(64).toString("base64");
      const impossible = `scrypt$1099511627776$8$1$${salt}$${key}`;

      // Хязгаараас олон удаа — чөлөөлөгдөхгүй бол эндээс цааш явахгүй.
      const failed = await Promise.all([
        verifyPassword("ямар ч нууц үг", impossible),
        verifyPassword("ямар ч нууц үг", impossible),
        verifyPassword("ямар ч нууц үг", impossible),
        verifyPassword("ямар ч нууц үг", impossible),
      ]);
      expect(failed).toEqual([false, false, false, false]);

      // Дараа нь энгийн ажиллагаа хэвийн үргэлжлэх ёстой.
      const hash = await hashPassword("дараагийн-нууц-үг");
      await expect(verifyPassword("дараагийн-нууц-үг", hash)).resolves.toBe(true);
    },
    TIMEOUT,
  );
});
