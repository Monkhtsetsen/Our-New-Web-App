import Link from "next/link";
import type { GoalCategory } from "@/src/lib/api";
import { CATEGORIES, CATEGORY_ORDER } from "@/src/lib/categories";

/**
 * Ангиллын шүүлтүүр.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ЯАГААД ТОВЧ БИШ, ХОЛБООС ВЭ
 *
 * Шүүлтүүр нь URL-д байна (`/goals?category=health`), товчны дотоод
 * төлөвт биш. Үүнээс гарах гурван ач холбогдол:
 *
 *   - Шүүсэн жагсаалтыг ХУУЛЖ ИЛГЭЭХ боломжтой
 *   - Хөтчийн "буцах" товч хүлээгдсэн ёсоор ажиллана
 *   - JavaScript ачаалагдаагүй байхад ч ажиллана
 *
 * Серверийн компонент тул ямар ч JS хөтөч руу явахгүй.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * Товчлуурын хэлбэр.
 *
 * Өндөр нь 36px — WCAG 2.5.8-ийн 24×24-ээс дээш, хуруугаар оноход ч
 * хүрэлцэнэ. Хүрээ нь `border-control` (3:1-ээс дээш ялгаралттай),
 * иймээс товчлуур хаана эхэлж хаана дуусахыг харж болно (WCAG 1.4.11).
 */
const CHIP =
  "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm " +
  "transition-colors";

const CHIP_IDLE =
  `${CHIP} border-control bg-surface text-foreground hover:bg-surface-2`;

/**
 * Сонгогдсон товчлуур.
 *
 * Зөвхөн өнгөөр ялгахгүй: `aria-current="page"` нь дэлгэц уншигчид
 * хэлнэ, дэвсгэр нь бүрэн эсрэг болсон нь хараад шууд ойлгогдоно.
 */
const CHIP_ACTIVE =
  `${CHIP} border-primary bg-primary text-on-primary`;

export function CategoryFilter({ active }: { active?: GoalCategory }) {
  return (
    <nav aria-label="Ангиллын шүүлтүүр" className="mt-6">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href="/goals"
            aria-current={active === undefined ? "page" : undefined}
            className={active === undefined ? CHIP_ACTIVE : CHIP_IDLE}
          >
            Бүгд
          </Link>
        </li>

        {CATEGORY_ORDER.map((category) => {
          const { label, tone, Icon } = CATEGORIES[category];
          const selected = active === category;

          return (
            <li key={category}>
              <Link
                href={`/goals?category=${category}`}
                aria-current={selected ? "page" : undefined}
                className={selected ? CHIP_ACTIVE : CHIP_IDLE}
              >
                {/* Сонгогдсон товч дээр ангиллын өнгө нь эсрэг дэвсгэр
                    дээр бүдгэрэх тул дүрсийг текстийн өнгөөр аваачна. */}
                <Icon
                  className={`h-4 w-4 shrink-0 ${selected ? "" : tone}`}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
