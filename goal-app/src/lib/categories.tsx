import type { GoalCategory } from "./api";

/**
 * Ангилал бүрийн нэр, дүрс, өнгө.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ЯАГААД ГУРВУУЛАА ВЭ
 *
 * Ангиллыг зөвхөн ӨНГӨӨР ялгаж болохгүй (WCAG 1.4.1). Өнгө сохор
 * хэрэглэгч, хар цагаан хэвлэлт, нарны доорх дэлгэц гурав бүгд өнгийг
 * үгүй хийж чадна. Иймээс ангилал бүр:
 *
 *   1. ӨӨР НЭРТЭЙ  — дэлгэц уншигч програм үүнийг уншина
 *   2. ӨӨР ДҮРСТЭЙ — өнгөгүй ч ялгагдана
 *   3. өөр өнгөтэй — хурдан харахад тусална, гэхдээ ГАНЦААРАА биш
 *
 * Өнгө нь зөвхөн дүрсэнд. Текст нь үргэлж `foreground`/`muted` —
 * ингэснээр ямар ангилал байхаас үл хамааран уншигдана.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const ICON_PROPS = {
  "aria-hidden": true,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function BookIcon({ className }: { className: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M12 6.5v12" />
      <path d="M12 6.5C10.5 5 8.5 4.5 5 4.5v12c3.5 0 5.5.5 7 2 1.5-1.5 3.5-2 7-2v-12c-3.5 0-5.5.5-7 2Z" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5" />
      <path d="M3 12.5h18" />
    </svg>
  );
}

function CoinIcon({ className }: { className: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8" />
      <path d="M14.5 10h-3.75a1.75 1.75 0 0 0 0 3.5h2.5a1.75 1.75 0 0 1 0 3.5H9.5" />
    </svg>
  );
}

function HeartIcon({ className }: { className: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M12 19.5C8 17 4.5 14.2 4.5 10.7A3.95 3.95 0 0 1 12 8.6a3.95 3.95 0 0 1 7.5 2.1c0 3.5-3.5 6.3-7.5 8.8Z" />
    </svg>
  );
}

function PersonIcon({ className }: { className: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 19.5a7 7 0 0 1 14 0" />
    </svg>
  );
}

export type CategoryMeta = {
  /** Хэрэглэгчид харагдах нэр. */
  label: string;
  /** Дүрсний өнгөний Tailwind класс (`globals.css`-ийн тогтмолоос). */
  tone: string;
  Icon: (props: { className: string }) => React.ReactElement;
};

/**
 * Дарааллыг санаатай тогтоов: суралцах → карьер → санхүү → эрүүл
 * мэнд → хувийн. Шүүлтүүрийн товчнууд үргэлж ижил дараалалтай байх
 * нь хэрэглэгчийн булчингийн тогтоц (muscle memory)-д тусална.
 */
export const CATEGORY_ORDER: readonly GoalCategory[] = [
  "study",
  "career",
  "finance",
  "health",
  "personal",
];

/** Хэрэглэгч ангилал сонгоогүй бол. Backend-ийн анхны утгатай ижил. */
export const DEFAULT_CATEGORY: GoalCategory = "personal";

export const CATEGORIES: Record<GoalCategory, CategoryMeta> = {
  study: { label: "Суралцах", tone: "text-category-study", Icon: BookIcon },
  career: {
    label: "Карьер",
    tone: "text-category-career",
    Icon: BriefcaseIcon,
  },
  finance: { label: "Санхүү", tone: "text-category-finance", Icon: CoinIcon },
  health: {
    label: "Эрүүл мэнд",
    tone: "text-category-health",
    Icon: HeartIcon,
  },
  personal: {
    label: "Хувийн",
    tone: "text-category-personal",
    Icon: PersonIcon,
  },
};

/** Ангиллын шошго — жагсаалтын мөр дээр. */
export function CategoryBadge({ category }: { category: GoalCategory }) {
  const { label, tone, Icon } = CATEGORIES[category];

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-xs font-medium text-foreground">
      <Icon className={`h-3.5 w-3.5 shrink-0 ${tone}`} />
      {label}
    </span>
  );
}
