// Bir martalik migratsiya skripti: data/<level>.json fayllarini
// data/<level>/<NN>.json (har bir bo'lim alohida) va data/<level>/index.json
// (faqat metama'lumot: mavzu, so'zlar soni, savollar soni) ko'rinishiga o'tkazadi.
// Ishlatish: node scripts/split-data.mjs
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const LEVELS = ["a1", "a2", "b1", "b2", "c1"];

async function splitLevel(code) {
  const srcPath = new URL(`../data/${code}.json`, import.meta.url);
  const raw = await readFile(srcPath, "utf-8");
  const data = JSON.parse(raw);

  const outDir = new URL(`../data/${code}/`, import.meta.url);
  if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });

  const indexSections = [];
  for (const sec of data.sections) {
    const num = String(sec.id).padStart(2, "0");
    await writeFile(
      new URL(`${num}.json`, outDir),
      JSON.stringify(sec, null, 2),
      "utf-8"
    );
    indexSections.push({
      id: sec.id,
      topic: sec.topic,
      wordCount: sec.words.length,
      questionCount: sec.questions.length,
    });
  }

  const index = {
    level: data.level,
    sections: indexSections,
    test: { questionCount: data.levelTest.questions.length },
  };
  await writeFile(new URL("index.json", outDir), JSON.stringify(index, null, 2), "utf-8");
  await writeFile(
    new URL("test.json", outDir),
    JSON.stringify(data.levelTest, null, 2),
    "utf-8"
  );

  console.log(`${code}: ${indexSections.length} ta bo'lim yozildi -> data/${code}/`);
}

for (const code of LEVELS) {
  await splitLevel(code);
}
console.log("Tayyor. Eski data/<level>.json fayllarni endi o'chirsangiz bo'ladi.");
