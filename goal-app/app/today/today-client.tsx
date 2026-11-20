"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  FormError,
  SubmitButton,
  TextField,
} from "../_components/form";
import { createTask, type FieldErrors, type Task } from "@/src/lib/api";
import { formatGoalDate, instantToAppDate } from "@/src/lib/dates";

/**
 * Өнөөдрийн даалгаврууд.
 *
 * `date` нь СЕРВЕРЭЭС ирнэ — энд `new Date()` дуудахгүй. Клиент талд
 * дахин тооцвол сервер нэг өдөр, хөтөч өөр өдөр гаргаж hydration
 * зөрөх эрсдэлтэй (хэрэглэгч өөр цагийн бүсэд байвал ялангуяа).
 */
export function TodayClient({
  date,
  initialToday,
  initialOverdue,
}: {
  date: string;
  initialToday: Task[];
  initialOverdue: Task[];
}) {
  const [today, setToday] = useState(initialToday);

  /**
   * Шинэ даалгаврыг жагсаалтад тавих.
   *
   * ӨӨР өдрийн даалгавар нэмэгдвэл өнөөдрийн жагсаалтад хийхгүй —
   * хийвэл хуудас нь өөрийн нэрийг хуурна. Форм нь тусад нь
   * мэдэгдэнэ.
   */
  function handleCreated(task: Task) {
    if (!isSameDay(task.dueDate, date)) return;

    // Биелээгүй шинэ даалгавар нь биелсэнүүдийн ДЭЭР орох ёстой.
    setToday((list) => sortTasks([task, ...list]));
  }

  return (
    <>
      {initialOverdue.length > 0 && (
        <OverdueSection tasks={initialOverdue} today={date} />
      )}

      <Card>
        <TaskForm date={date} onCreated={handleCreated} />
      </Card>

      <TodaySection tasks={today} />
    </>
  );
}

/**
 * Даалгаврын дараалал.
 *
 * Биелээгүй нь дээр, биелсэн нь доор; дотор нь хийх цагаар.
 * Серверийн `ORDER BY completed, due_date`-тай ижил дүрэм — хоёр
 * тал ижил дараалал гаргах ёстой, эс бөгөөс `router.refresh()`
 * хийхэд жагсаалт "харайна".
 */
function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
  });
}

/** Агшин нь тухайн өдөрт багтах эсэх. */
function isSameDay(instant: string | null, date: string): boolean {
  if (instant === null) return false;

  return instantToAppDate(instant) === date;
}

function TaskForm({
  date,
  onCreated,
}: {
  date: string;
  onCreated: (task: Task) => void;
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");

  // Анхны утга нь ӨНӨӨДӨР. Хугацаагүй даалгавар нь ямар ч өдрийн
  // хуудсанд харагдахгүй тул хоосон орхих нь хэрэглэгчийг
  // "даалгавар нэмсэн ч харагдахгүй" гэсэн эргэлзээнд унагана.
  const [dueDate, setDueDate] = useState(date);

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

    const result = await createTask({
      title,
      ...(dueDate === "" ? {} : { dueDate }),
    });
    setPending(false);

    if (result.ok) {
      const created = result.data.task;
      onCreated(created);

      if (!isSameDay(created.dueDate, date)) {
        setNotice(
          created.dueDate === null
            ? "Даалгавар нэмэгдлээ. Хугацаа тохируулаагүй тул өнөөдрийн жагсаалтад харагдахгүй."
            : "Даалгавар нэмэгдлээ. Өөр өдөрт тохируулсан тул өнөөдрийн жагсаалтад харагдахгүй.",
        );
      }

      setTitle("");
      router.refresh();
      return;
    }

    // Сесс дуусчихсан байж болно.
    if (result.status === 401) {
      router.replace("/login?next=/today");
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
      {notice && (
        <p className="mb-5 rounded-md bg-surface-2 px-3 py-2 text-sm text-foreground">
          {notice}
        </p>
      )}

      <h2 className="text-sm font-medium text-foreground">Шинэ даалгавар</h2>

      <div className="mt-5 space-y-5">
        <TextField
          id="task-title"
          label="Юу хийх вэ?"
          placeholder="Жишээ нь: 30 минут гүйх"
          value={title}
          onChange={setTitle}
          error={errors.title}
          disabled={pending}
        />

        <TextField
          id="task-due"
          label="Хийх өдөр"
          type="date"
          value={dueDate}
          onChange={setDueDate}
          error={errors.dueDate}
          hint="Анхны утга нь өнөөдөр."
          disabled={pending}
        />
      </div>

      <SubmitButton
        pending={pending}
        label="Даалгавар нэмэх"
        pendingLabel="Нэмж байна…"
      />
    </form>
  );
}

function TodaySection({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <EmptyState />;
  }

  const left = tasks.filter((task) => !task.completed).length;

  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium text-foreground">
        Өнөөдрийн даалгавар
        <span className="ml-2 font-normal text-muted">
          {left === 0 ? "бүгд биелсэн" : `${left} / ${tasks.length}`}
        </span>
      </h2>

      <ul className="mt-4 space-y-2">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </ul>
    </section>
  );
}

/**
 * Хоцорсон даалгаврууд.
 *
 * Өнөөдрийн жагсаалттай ХОЛИХГҮЙ, тусдаа хэсэгт, ДЭЭР талд. Хоцорсон
 * ажил нь өнөөдрийн ажлаас эрт шийдвэр шаарддаг: хийх, эсвэл
 * хугацааг нь хойшлуулах.
 */
function OverdueSection({ tasks, today }: { tasks: Task[]; today: string }) {
  return (
    <section className="mb-8 rounded-lg border border-danger-line bg-danger-surface p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-medium text-danger">
        <AlertIcon />
        Хоцорсон
        <span className="font-normal">{tasks.length}</span>
      </h2>

      <ul className="mt-3 space-y-2">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} showDate today={today} />
        ))}
      </ul>
    </section>
  );
}

/**
 * Даалгаврын нэг мөр.
 *
 * Биелснийг ГУРВАН зүйл хэлнэ: зураас, бүдэг өнгө, "биелсэн" гэсэн
 * текст. Зөвхөн зураасаар хэлбэл дэлгэц уншигч програм түүнийг
 * дамжуулахгүй — `line-through` нь зөвхөн харагдац (WCAG 1.4.1).
 *
 * Биелсэнээр тэмдэглэх товч нь #8-д орно; одоо зөвхөн ХАРУУЛНА.
 */
function TaskRow({
  task,
  showDate,
  today = "",
}: {
  task: Task;
  showDate?: boolean;
  /** Ижил жилд жилийг нуруулдахгүйн тулд. */
  today?: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-md border border-line bg-surface p-3">
      <CheckIcon done={task.completed} />

      <div className="min-w-0 flex-1">
        <p
          className={
            task.completed
              ? "text-sm text-muted line-through"
              : "text-sm text-foreground"
          }
        >
          {task.title}
          {task.completed && <span className="sr-only"> — биелсэн</span>}
        </p>

        {task.description !== null && (
          <p className="mt-1 text-sm leading-6 text-muted">
            {task.description}
          </p>
        )}

        {showDate && task.dueDate !== null && (
          <p className="mt-1 text-xs text-muted">
            <time dateTime={task.dueDate}>
              {formatDay(task.dueDate, today)}
            </time>
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * Агшныг аппын бүсээр "11 дүгээр сарын 19" болгоно.
 *
 * Сарын нэрийг `formatGoalDate` аль хэдийн монголоор бичдэг тул
 * түүнийг дахин хэрэглэнэ — арван хоёр сарын нэрийг хоёр дахь
 * газар бичих шаардлагагүй.
 */
function formatDay(instant: string, today: string): string {
  return formatGoalDate(instantToAppDate(instant), today);
}

function CheckIcon({ done }: { done: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`mt-0.5 h-4 w-4 shrink-0 ${done ? "text-success" : "text-muted"}`}
    >
      <circle cx="12" cy="12" r="9" />
      {done && <path d="M8.5 12.5l2.5 2.5 4.5-5" />}
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
 * Issue нь "мэдэгдэл ба шинэ даалгавар нэмэх санал" хоёуланг
 * шаарддаг. Хоосон жагсаалтыг зүгээр орхивол хуудас эвдэрсэн мэт
 * харагддаг.
 */
function EmptyState() {
  return (
    <div className="mt-8 rounded-lg border border-dashed border-control p-8 text-center">
      <p className="text-sm font-medium text-foreground">
        Өнөөдөр даалгавар алга.
      </p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-muted">
        Дээрх формоор өнөөдрийн ажлаа нэмээрэй. Нэг жижиг даалгавраас
        эхлэх нь өдрийг хөдөлгөхөд хангалттай.
      </p>
    </div>
  );
}
