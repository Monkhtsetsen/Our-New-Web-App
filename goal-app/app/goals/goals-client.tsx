"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  FormError,
  FormSuccess,
  SecondaryButton,
  SelectField,
  SubmitButton,
  TextField,
} from "../_components/form";
import {
  createGoal,
  updateGoal,
  type FieldErrors,
  type Goal,
  type GoalCategory,
  type GoalStatus,
} from "@/src/lib/api";
import {
  CATEGORIES,
  CATEGORY_ORDER,
  CategoryBadge,
  DEFAULT_CATEGORY,
} from "@/src/lib/categories";
import { describeDeadline } from "@/src/lib/dates";

/**
 * Зорилгын жагсаалт ба шинээр үүсгэх форм.
 *
 * Эхний жагсаалт сервер талаас бэлэн ирнэ. Шинэ зорилго нэмэгдэхэд
 * хуудсыг бүтнээр дахин ачаалахгүй, жагсаалтдаа шууд нэмнэ — дараа
 * нь `router.refresh()` сервер талын хуулбарыг нь цэгцэлнэ.
 *
 * `today` нь серверээс пропоор ирнэ. Энд `new Date()` дуудвал сервер
 * ба хөтөч хоёр өөр өдөр гаргаж hydration зөрөх эрсдэлтэй.
 */
export function GoalsClient({
  initialGoals,
  today,
  activeCategory,
}: {
  initialGoals: Goal[];
  today: string;
  activeCategory?: GoalCategory;
}) {
  const [goals, setGoals] = useState(initialGoals);

  /**
   * Шинэ зорилгыг жагсаалтад нэмэх.
   *
   * Шүүлтүүр нээлттэй байхад ӨӨР ангиллын зорилго нэмэгдвэл түүнийг
   * жагсаалтад хийхгүй — хийвэл шүүлтүүрийн утга хуурамч болно.
   * Харин хэрэглэгчид "юу ч болсонгүй" гэж харагдах нь бүүр дор тул
   * форм нь тусад нь мэдэгдэнэ.
   */
  function handleCreated(goal: Goal) {
    if (activeCategory !== undefined && goal.category !== activeCategory) {
      return;
    }
    setGoals((list) => [goal, ...list]);
  }

  /**
   * Засагдсан зорилгыг жагсаалтад тавих.
   *
   * Ангилал нь өөрчлөгдсөн бол нээлттэй шүүлтүүрээс ГАРНА — тэр
   * мөрийг жагсаалтаас хасна. Үгүй бол шүүлтүүр нь "эрүүл мэнд"
   * байхад карьерын зорилго харагдаж, шүүлтүүрийн утга хуурамч
   * болно.
   */
  function handleUpdated(goal: Goal) {
    setGoals((list) => {
      if (activeCategory !== undefined && goal.category !== activeCategory) {
        return list.filter((item) => item.id !== goal.id);
      }
      return list.map((item) => (item.id === goal.id ? goal : item));
    });
  }

  return (
    <>
      <Card>
        <GoalForm
          today={today}
          activeCategory={activeCategory}
          onCreated={handleCreated}
        />
      </Card>

      <GoalList
        goals={goals}
        today={today}
        activeCategory={activeCategory}
        onUpdated={handleUpdated}
      />
    </>
  );
}

function GoalForm({
  today,
  activeCategory,
  onCreated,
}: {
  today: string;
  activeCategory?: GoalCategory;
  onCreated: (goal: Goal) => void;
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");

  // Шүүлтүүр нээлттэй бол тэр ангиллыг анхны утга болгоно — хэрэглэгч
  // "эрүүл мэнд"-ийг харж байгаад зорилго нэмэх гэж байгаа бол тэр
  // ангилалд нэмэхийг хүсэж байгаа нь илэрхий.
  const [category, setCategory] = useState<GoalCategory>(
    activeCategory ?? DEFAULT_CATEGORY,
  );

  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrors({});
    setFormError(undefined);
    setNotice(undefined);
    setPending(true);

    // Хоосон хугацааг ОГТ илгээхгүй. "" гэж илгээвэл "тохируулаагүй"
    // гэдгийг "хоосон бичсэн" гэснээс ялгах шалтгаан байхгүй болно.
    const result = await createGoal({
      title,
      description,
      category,
      ...(deadline === "" ? {} : { deadline }),
    });
    setPending(false);

    if (result.ok) {
      const created = result.data.goal;
      onCreated(created);

      // Нэмсэн зорилго нь нээлттэй шүүлтүүрт таарахгүй бол доорх
      // жагсаалтад гарахгүй. Чимээгүй орхивол хэрэглэгч товч
      // ажиллаагүй гэж бодно.
      if (activeCategory !== undefined && created.category !== activeCategory) {
        const where = CATEGORIES[created.category].label;
        setNotice(
          `Зорилго нэмэгдлээ. «${where}» ангилалд байгаа тул энэ ` +
            "шүүлтүүрт харагдахгүй.",
        );
      }

      setTitle("");
      setDescription("");
      setDeadline("");
      router.refresh();
      return;
    }

    // Сесс дуусчихсан байж болно.
    if (result.status === 401) {
      router.replace("/login?next=/goals");
      return;
    }

    if (result.fieldErrors) {
      setErrors(result.fieldErrors);
      return;
    }

    setFormError(result.message);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && <FormError>{formError}</FormError>}
      {notice && <FormSuccess>{notice}</FormSuccess>}

      <h2 className="text-sm font-medium text-foreground">Шинэ зорилго</h2>

      <div className="mt-5 space-y-5">
        <TextField
          id="title"
          label="Юунд хүрэхийг хүсэж байна вэ?"
          placeholder="Жишээ нь: хагас марафон гүйх"
          value={title}
          onChange={setTitle}
          error={errors.title}
          disabled={pending}
        />

        <TextField
          id="description"
          label="Тайлбар"
          placeholder="Заавал биш"
          value={description}
          onChange={setDescription}
          error={errors.description}
          hint="Яагаад энэ зорилго чухал вэ, юу гэж тоолох вэ."
          disabled={pending}
        />

        <SelectField
          id="category"
          label="Ангилал"
          value={category}
          onChange={(value) => setCategory(value as GoalCategory)}
          options={CATEGORY_ORDER.map((key) => ({
            value: key,
            label: CATEGORIES[key].label,
          }))}
          error={errors.category}
          disabled={pending}
        />

        <TextField
          id="deadline"
          label="Дуусах хугацаа"
          type="date"
          min={today}
          value={deadline}
          onChange={setDeadline}
          error={errors.deadline}
          hint="Заавал биш. Хугацаа тавих нь төвлөрөхөд тусална."
          disabled={pending}
        />
      </div>

      <SubmitButton
        pending={pending}
        label="Зорилго нэмэх"
        pendingLabel="Нэмж байна…"
      />
    </form>
  );
}

function GoalList({
  goals,
  today,
  activeCategory,
  onUpdated,
}: {
  goals: Goal[];
  today: string;
  activeCategory?: GoalCategory;
  onUpdated: (goal: Goal) => void;
}) {
  // Нэг зэрэг зөвхөн НЭГ мөр засагдана. Хэд хэдэн форм зэрэг
  // нээлттэй байвал хэрэглэгч аль нь хадгалагдаагүйг мартана.
  const [editingId, setEditingId] = useState<string>();

  if (goals.length === 0) {
    return activeCategory === undefined ? (
      <EmptyState />
    ) : (
      <EmptyCategoryState category={activeCategory} />
    );
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium text-foreground">
        {activeCategory === undefined
          ? "Миний зорилгууд"
          : CATEGORIES[activeCategory].label}
        <span className="ml-2 font-normal text-muted">{goals.length}</span>
      </h2>

      <ul className="mt-4 space-y-3">
        {goals.map((goal) => (
          <li
            key={goal.id}
            className="rounded-lg border border-line bg-surface p-4"
          >
            {editingId === goal.id ? (
              <GoalEditForm
                goal={goal}
                today={today}
                onDone={() => setEditingId(undefined)}
                onUpdated={onUpdated}
              />
            ) : (
              <GoalRow
                goal={goal}
                today={today}
                showCategory={activeCategory === undefined}
                onEdit={() => setEditingId(goal.id)}
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Төлвийн нэрс.
 *
 * `in_progress` нь анхны бөгөөд хамгийн түгээмэл төлөв тул мөр
 * дээр ТУСГАЙ тэмдэглэхгүй — "хэвийн" төлөвт шошго хэрэггүй.
 * Бусад хоёрыг л тэмдэглэнэ.
 */
const STATUS_LABELS: Record<GoalStatus, string> = {
  in_progress: "Хийгдэж байна",
  completed: "Биелсэн",
  abandoned: "Больсон",
};

/** Жагсаалтын нэг мөр, харагдах төлөв. */
function GoalRow({
  goal,
  today,
  showCategory,
  onEdit,
}: {
  goal: Goal;
  today: string;
  showCategory: boolean;
  onEdit: () => void;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-foreground">{goal.title}</h3>
        <div className="flex shrink-0 items-center gap-2">
          {goal.status !== "in_progress" && <StatusBadge status={goal.status} />}
          {/* Шүүлтүүр нээлттэй байхад шошго нь илүүц — мөр бүр
              дээр ижил утга давтагдана. */}
          {showCategory && <CategoryBadge category={goal.category} />}
        </div>
      </div>

      {goal.description !== null && (
        <p className="mt-1.5 text-sm leading-6 text-muted">
          {goal.description}
        </p>
      )}

      {goal.deadline !== null && (
        <Deadline deadline={goal.deadline} today={today} />
      )}

      <div className="mt-3">
        <SecondaryButton
          onClick={onEdit}
          ariaLabel={`«${goal.title}» зорилгыг засах`}
        >
          Засах
        </SecondaryButton>
      </div>
    </>
  );
}

/**
 * Төлвийн шошго.
 *
 * Өнгө нь ганцаараа утга дамжуулахгүй — шошго нь төлвийнхөө нэрийг
 * бичсэн байна (WCAG 1.4.1).
 */
function StatusBadge({ status }: { status: GoalStatus }) {
  const tone =
    status === "completed"
      ? "bg-success-surface text-success"
      : "bg-surface-2 text-muted";

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${tone}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

/**
 * Мөрийг засах форм.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ЗӨВХӨН ӨӨРЧЛӨГДСӨН ТАЛБАРЫГ ИЛГЭЭНЭ
 *
 * Хэрэглэгч гарчгийг л зассан бол гарчгийг л илгээнэ. Бүх талбарыг
 * үргэлж илгээвэл:
 *
 *   - өнгөрсөн хугацаатай зорилгын НЭРИЙГ засах боломжгүй болно
 *     (хугацаа нь дахин шалгагдаад "өнгөрсөн" гэж татгалзана)
 *   - хоёр хүн зэрэг засахад нэг нь нөгөөгийн өөрчлөлтийг дарж хаана
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
function GoalEditForm({
  goal,
  today,
  onDone,
  onUpdated,
}: {
  goal: Goal;
  today: string;
  onDone: () => void;
  onUpdated: (goal: Goal) => void;
}) {
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description ?? "");
  const [deadline, setDeadline] = useState(goal.deadline ?? "");
  const [category, setCategory] = useState<GoalCategory>(goal.category);
  const [status, setStatus] = useState<GoalStatus>(goal.status);

  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  // Форм нээгдэхэд курсорыг эхний талбарт аваачна. Үгүй бол
  // товчлуураар ажилладаг хэрэглэгч формыг нээснийхээ дараа дахин
  // tab дарж хаана байгааг хайх шаардлагатай болно.
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  /** Хуучин ба шинэ утгыг тулгаж, ӨӨРЧЛӨГДСӨНИЙГ л буцаана. */
  function buildPatch() {
    const patch: Record<string, unknown> = {};

    if (title.trim() !== goal.title) patch.title = title;

    // Хоосон мөр ба `null` хоёулаа "тайлбаргүй" гэсэн утга.
    const nextDescription = description.trim() === "" ? null : description.trim();
    if (nextDescription !== goal.description) patch.description = nextDescription;

    const nextDeadline = deadline === "" ? null : deadline;
    if (nextDeadline !== goal.deadline) patch.deadline = nextDeadline;

    if (category !== goal.category) patch.category = category;
    if (status !== goal.status) patch.status = status;

    return patch;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const patch = buildPatch();

    // Юу ч өөрчлөөгүй бол сервер рүү хандахгүй, формыг хаана.
    if (Object.keys(patch).length === 0) {
      onDone();
      return;
    }

    setErrors({});
    setFormError(undefined);
    setPending(true);

    const result = await updateGoal(goal.id, patch);
    setPending(false);

    if (result.ok) {
      onUpdated(result.data.goal);
      onDone();
      router.refresh();
      return;
    }

    if (result.status === 401) {
      router.replace("/login?next=/goals");
      return;
    }

    if (result.fieldErrors) {
      setErrors(result.fieldErrors);
      return;
    }

    setFormError(result.message);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && <FormError>{formError}</FormError>}

      <h3 className="text-sm font-medium text-foreground">Зорилго засах</h3>

      <div className="mt-5 space-y-5">
        <TextField
          id={`title-${goal.id}`}
          label="Нэр"
          value={title}
          onChange={setTitle}
          error={errors.title}
          disabled={pending}
          inputRef={titleRef}
        />

        <TextField
          id={`description-${goal.id}`}
          label="Тайлбар"
          placeholder="Заавал биш"
          value={description}
          onChange={setDescription}
          error={errors.description}
          disabled={pending}
        />

        <SelectField
          id={`category-${goal.id}`}
          label="Ангилал"
          value={category}
          onChange={(value) => setCategory(value as GoalCategory)}
          options={CATEGORY_ORDER.map((key) => ({
            value: key,
            label: CATEGORIES[key].label,
          }))}
          error={errors.category}
          disabled={pending}
        />

        <SelectField
          id={`status-${goal.id}`}
          label="Төлөв"
          value={status}
          onChange={(value) => setStatus(value as GoalStatus)}
          options={(
            ["in_progress", "completed", "abandoned"] as const
          ).map((key) => ({ value: key, label: STATUS_LABELS[key] }))}
          error={errors.status}
          disabled={pending}
        />

        <TextField
          id={`deadline-${goal.id}`}
          label="Дуусах хугацаа"
          type="date"
          // Хугацааг ХӨНДӨӨГҮЙ бол `min` нь хамаагүй — сервер рүү
          // илгээгдэхгүй. Харин шинээр сонгох бол өнгөрсөн өдрийг
          // хаана.
          min={today}
          value={deadline}
          onChange={setDeadline}
          error={errors.deadline}
          hint="Хоосон бол хугацаагүй."
          disabled={pending}
        />
      </div>

      <div className="mt-6 flex gap-3">
        <SubmitButton
          pending={pending}
          label="Хадгалах"
          pendingLabel="Хадгалж байна…"
        />
        <SecondaryButton onClick={onDone} disabled={pending}>
          Болих
        </SecondaryButton>
      </div>
    </form>
  );
}

/**
 * Зорилгын дуусах хугацаа.
 *
 * Үлдсэн хоногийг эхэлж бичнэ — "7 хоног үлдсэн" нь "11 дүгээр сарын
 * 10"-аас хамаагүй шууд ойлгогддог. Яг өдрийг хажууд нь үлдээнэ,
 * хуанлиндаа тэмдэглэхэд хэрэгтэй.
 *
 * Хугацаа хэтэрсэн гэдгийг ГУРВАН зүйл зэрэг хэлнэ: текст, дүрс,
 * өнгө. Зөвхөн өнгөөр хэлбэл өнгө сохор хэрэглэгч түүнийг хармагц
 * мэдэхгүй (WCAG 1.4.1).
 */
function Deadline({ deadline, today }: { deadline: string; today: string }) {
  const { label, date, overdue, soon } = describeDeadline(deadline, today);

  const tone = overdue
    ? "text-danger"
    : soon
      ? "text-warning"
      : "text-muted";

  return (
    <p className={`mt-2.5 flex items-center gap-1.5 text-sm ${tone}`}>
      {overdue ? <AlertIcon /> : <ClockIcon />}
      <span className="font-medium">{label}</span>
      <span className="text-muted">·</span>
      <time dateTime={deadline} className="text-muted">
        {date}
      </time>
    </p>
  );
}

function ClockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4.5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

/**
 * Тодорхой ангилалд зорилго байхгүй.
 *
 * Хоосон хүснэгт харуулахгүй: хэрэглэгч зорилгоо алдсан гэж бодож
 * магадгүй. Юу болсныг хэлээд, шүүлтүүрээс гарах гарцыг нь хамт
 * үзүүлнэ — "бүгд"-рүү буцахын тулд товчоо хайх шаардлагагүй.
 */
function EmptyCategoryState({ category }: { category: GoalCategory }) {
  const { label, tone, Icon } = CATEGORIES[category];

  return (
    <div className="mt-8 rounded-lg border border-dashed border-control p-8 text-center">
      <Icon className={`mx-auto h-6 w-6 ${tone}`} />
      <p className="mt-3 text-sm font-medium text-foreground">
        Энэ ангилалд зорилго алга.
      </p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-muted">
        «{label}» ангилалд одоогоор зорилго байхгүй. Дээрх формоор нэмэх,
        эсвэл{" "}
        <Link
          href="/goals"
          className="font-medium text-foreground underline underline-offset-2"
        >
          бүх зорилгоо харах
        </Link>
        .
      </p>
    </div>
  );
}

/**
 * Хоосон төлөв.
 *
 * Хоосон жагсаалтыг зүгээр орхивол хуудас эвдэрсэн мэт харагддаг.
 * Юу болж байгааг, дараа нь юу хийхийг хэлнэ.
 */
function EmptyState() {
  return (
    <div className="mt-8 rounded-lg border border-dashed border-control p-8 text-center">
      <p className="text-sm font-medium text-foreground">
        Одоогоор зорилго алга.
      </p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-muted">
        Дээрх формоор эхний зорилгоо нэмээрэй. Жижиг, тодорхой зорилго
        эхлэхэд хялбар байдаг.
      </p>
    </div>
  );
}
