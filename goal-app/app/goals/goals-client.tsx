"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  FormError,
  SubmitButton,
  TextField,
} from "../_components/form";
import { createGoal, type FieldErrors, type Goal } from "@/src/lib/api";
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
}: {
  initialGoals: Goal[];
  today: string;
}) {
  const [goals, setGoals] = useState(initialGoals);

  return (
    <>
      <Card>
        <GoalForm
          today={today}
          onCreated={(goal) => setGoals((list) => [goal, ...list])}
        />
      </Card>

      <GoalList goals={goals} today={today} />
    </>
  );
}

function GoalForm({
  today,
  onCreated,
}: {
  today: string;
  onCreated: (goal: Goal) => void;
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrors({});
    setFormError(undefined);
    setPending(true);

    // Хоосон хугацааг ОГТ илгээхгүй. "" гэж илгээвэл "тохируулаагүй"
    // гэдгийг "хоосон бичсэн" гэснээс ялгах шалтгаан байхгүй болно.
    const result = await createGoal({
      title,
      description,
      ...(deadline === "" ? {} : { deadline }),
    });
    setPending(false);

    if (result.ok) {
      onCreated(result.data.goal);
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

function GoalList({ goals, today }: { goals: Goal[]; today: string }) {
  if (goals.length === 0) {
    return <EmptyState />;
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium text-foreground">
        Миний зорилгууд
        <span className="ml-2 font-normal text-muted">{goals.length}</span>
      </h2>

      <ul className="mt-4 space-y-3">
        {goals.map((goal) => (
          <li
            key={goal.id}
            className="rounded-lg border border-line bg-surface p-4"
          >
            <h3 className="font-medium text-foreground">{goal.title}</h3>
            {goal.description !== null && (
              <p className="mt-1.5 text-sm leading-6 text-muted">
                {goal.description}
              </p>
            )}
            {goal.deadline !== null && (
              <Deadline deadline={goal.deadline} today={today} />
            )}
          </li>
        ))}
      </ul>
    </section>
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
