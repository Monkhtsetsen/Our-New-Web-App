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

/**
 * Зорилгын жагсаалт ба шинээр үүсгэх форм.
 *
 * Эхний жагсаалт сервер талаас бэлэн ирнэ. Шинэ зорилго нэмэгдэхэд
 * хуудсыг бүтнээр дахин ачаалахгүй, жагсаалтдаа шууд нэмнэ — дараа
 * нь `router.refresh()` сервер талын хуулбарыг нь цэгцэлнэ.
 */
export function GoalsClient({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, setGoals] = useState(initialGoals);

  return (
    <>
      <Card>
        <GoalForm onCreated={(goal) => setGoals((list) => [goal, ...list])} />
      </Card>

      <GoalList goals={goals} />
    </>
  );
}

function GoalForm({ onCreated }: { onCreated: (goal: Goal) => void }) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrors({});
    setFormError(undefined);
    setPending(true);

    const result = await createGoal({ title, description });
    setPending(false);

    if (result.ok) {
      onCreated(result.data.goal);
      setTitle("");
      setDescription("");
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
      </div>

      <SubmitButton
        pending={pending}
        label="Зорилго нэмэх"
        pendingLabel="Нэмж байна…"
      />
    </form>
  );
}

function GoalList({ goals }: { goals: Goal[] }) {
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
          </li>
        ))}
      </ul>
    </section>
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
