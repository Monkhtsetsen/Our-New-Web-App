const PILLARS = [
  {
    title: "Зорилгоо задал",
    body: "Том зорилгоо өдөр тутам биелүүлэх боломжтой жижиг даалгавруудад хуваана.",
  },
  {
    title: "XP цуглуул",
    body: "Даалгавар биелүүлэх бүрд XP авч, хангалттай цуглуулаад level ахина.",
  },
  {
    title: "Streak хадгал",
    body: "Өдөр бүр тасралтгүй хийснээр streak өснө. Таслах тусам тэг рүү буцна.",
  },
  {
    title: "AI зөвлөх",
    body: "Ахицад чинь шинжилгээ хийж, хойшлуулах үед сануулга өгнө.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-3xl flex-1 px-6 py-20 sm:px-10">
        <p className="text-sm font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
          Goal App
        </p>

        <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-tight tracking-tight text-zinc-950 dark:text-zinc-50">
          Зорилгоо даалгавар болгон биелүүл
        </h1>

        <p className="mt-5 max-w-lg text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Хувийн зорилгоо жижиг алхмуудад хувааж, өдөр тутмын даалгавраа
          биелүүлэн XP цуглуулж, тасралтгүй хичээх дадал бий болгоход туслах
          систем.
        </p>

        <ul className="mt-14 grid gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-800">
          {PILLARS.map((p) => (
            <li key={p.title} className="bg-zinc-50 p-6 dark:bg-black">
              <h2 className="text-base font-medium text-zinc-950 dark:text-zinc-50">
                {p.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {p.body}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-14 text-sm leading-6 text-zinc-500 dark:text-zinc-500">
          Энэ хуудас түр зуурынх. Нэвтрэлт, dashboard, quest-ийн урсгал
          хөгжүүлэгдэж дуусахад солигдоно.
        </p>
      </main>
    </div>
  );
}
