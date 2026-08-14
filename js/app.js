/* ===== Shared utilities ===== */

const LEVEL_ORDER = ["a1", "a2", "b1", "b2", "c1"];
const PASS_THRESHOLD_SECTION = 0.7; // 70% to mark a section complete
const PASS_THRESHOLD_TEST = 0.8; // 80% to pass a level-up test

function qs(name) {
  return new URLSearchParams(location.search).get(name);
}

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error("Failed to load " + path);
  return res.json();
}

function getLevels() {
  return fetchJSON("data/levels.json");
}

function getLevelData(code) {
  return fetchJSON(`data/${code}.json`);
}

const PROGRESS_KEY = "vocab_progress_v1";

function getProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const fresh = {};
  LEVEL_ORDER.forEach((l) => (fresh[l] = { sections: {}, testPassed: false }));
  return fresh;
}

function saveProgress(p) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

function ensureLevel(progress, code) {
  if (!progress[code]) progress[code] = { sections: {}, testPassed: false };
  return progress[code];
}

function isLevelUnlocked(code, progress) {
  // All levels are unlocked from the start — users can freely jump between
  // A1-C1 without needing to pass the previous level's test first.
  return true;
}

function isSectionUnlocked(id, levelProgress) {
  // Section 1 is always open. Section N (N>1) unlocks only once section
  // N-1 has been completed with a passing score (>=70%).
  if (id <= 1) return true;
  return !!(levelProgress && levelProgress.sections && levelProgress.sections[id - 1]);
}

function levelCompletionPct(code, levelMeta, progress) {
  const total = levelMeta.sections;
  const done = progress[code] ? Object.keys(progress[code].sections).length : 0;
  return total ? Math.round((done / total) * 100) : 0;
}

function overallCompletionPct(levels, progress) {
  let totalSections = 0,
    doneSections = 0;
  levels.forEach((lv) => {
    totalSections += lv.sections;
    doneSections += progress[lv.code] ? Object.keys(progress[lv.code].sections).length : 0;
  });
  // level tests count as bonus weight equal to 1 section each
  totalSections += levels.length;
  levels.forEach((lv) => {
    if (progress[lv.code] && progress[lv.code].testPassed) doneSections += 1;
  });
  return totalSections ? Math.round((doneSections / totalSections) * 100) : 0;
}

let speechRate = 1; // current playback speed, adjustable via the speed selector on section.html

function speak(text, btn) {
  if (!("speechSynthesis" in window)) {
    alert("Brauzeringiz ovozli o'qishni qo'llab-quvvatlamaydi.");
    return;
  }
  window.speechSynthesis.cancel();
  document.querySelectorAll(".speaking").forEach((el) => el.classList.remove("speaking"));
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = speechRate;
  if (btn) {
    btn.classList.add("speaking");
    u.onend = () => btn.classList.remove("speaking");
    u.onerror = () => btn.classList.remove("speaking");
  }
  window.speechSynthesis.speak(u);
}

function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  document.querySelectorAll(".speaking").forEach((el) => el.classList.remove("speaking"));
}

/* ===== Topic → decorative emoji mapping (for section hero / cards) ===== */

const TOPIC_EMOJI_MAP = [
  [["family"], "👨‍👩‍👧‍👦"],
  [["food", "cuisine", "cooking", "drink", "restaurant", "dietary", "agricult", "nutrition"], "🍽️"],
  [["weather", "climate"], "🌦️"],
  [["color", "clothes", "clothing"], "👕"],
  [["mental health", "human body", "health", "illness", "medical", "healthcare", "wellbeing", "bioethic", "exercise physiology", "human performance"], "🩺"],
  [["animal", "wildlife"], "🐾"],
  [["job", "occupation", "career", "employ", "workplace", "labor", "labour", "work-life", "work and"], "💼"],
  [["house", "furniture", "housing", "home", "living", "urban", "smart cities", "city and", "infrastructure"], "🏠"],
  [["calendar", "days,", "months"], "📅"],
  [["hobbies", "free time", "entertainment", "leisure"], "🎨"],
  [["number", "time management", "time"], "🕐"],
  [["shopping", "consumer", "money", "banking", "economics", "economy", "trade", "finance", "monetary"], "💰"],
  [["emotion", "feeling", "relationship"], "❤️"],
  [["technology", "phone", "computing", "digital", "device", "automation", "artificial intelligence", "robot"], "💻"],
  [["travel", "tourism", "places", "journey"], "✈️"],
  [["nature", "environment", "recycl", "sustainab", "conservation", "food systems"], "🌳"],
  [["school", "education", "learning", "academic", "research", "writing"], "🎓"],
  [["direction"], "🗺️"],
  [["communicat", "greeting", "persuasion", "rhetoric", "argumentation", "linguistic", "language"], "🗣️"],
  [["holiday", "celebrat", "festival"], "🎉"],
  [["routine"], "⏰"],
  [["internet", "social media"], "📱"],
  [["government", "politic"], "🏛️"],
  [["music", "film", "art", "literature", "storytelling", "narrative", "aesthetic"], "🎵"],
  [["community", "volunteer", "friend", "social responsibility", "social movement", "activism", "social justice", "helping others"], "🤝"],
  [["identity", "self-reflection", "self "], "🪞"],
  [["ethics", "moral", "philosoph", "existential", "epistemology"], "🤔"],
  [["critical thinking", "reasoning", "cognitive", "psycholog", "neuroscience", "brain", "decision"], "🧠"],
  [["leadership", "networking", "corporate", "governance", "management", "organization", "strategy"], "🏢"],
  [["law", "legal", "crime", "justice", "rights", "constitution"], "⚖️"],
  [["startup", "entrepreneur", "innovation", "patent"], "💡"],
  [["space", "universe", "astronaut", "quantum"], "🚀"],
  [["biotechnology", "genetic", "genome"], "🧬"],
  [["cybersecurity", "privacy", "security", "surveillance"], "🔒"],
  [["news", "journalism", "media literacy", "misinformation", "propaganda", "discourse"], "📰"],
  [["diplomacy", "international", "global order", "migration", "diversity", "globalization", "immigration"], "🌐"],
  [["history"], "🏛️"],
  [["science", "scientific"], "🔬"],
  [["energy"], "⚡"],
  [["describing people", "people"], "🧑"],
  [["future", "goals", "ambitions", "development", "lifelong"], "🎯"],
  [["neighborhood", "local services"], "🏘️"],
  [["culture", "tradition", "heritage"], "🏺"],
];

// "sport"/"transport" and "art"/"start" collide as substrings (e.g. "tranSPORTation",
// "stARTup"), so they're matched first with a word-boundary check.
function wordBoundaryIncludes(text, keyword) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("\\b" + escaped).test(text);
}

function getTopicEmoji(topic) {
  const t = (topic || "").toLowerCase();
  if (wordBoundaryIncludes(t, "sport")) return "⚽";
  if (wordBoundaryIncludes(t, "transport")) return "🚌";
  for (const [keywords, emoji] of TOPIC_EMOJI_MAP) {
    if (keywords.some((k) => wordBoundaryIncludes(t, k))) return emoji;
  }
  return "📘";
}

function shuffleSeeded(arr) {
  return arr; // keep deterministic order for reproducibility
}

/* ===== Page: Dashboard (index.html) ===== */

async function initDashboard() {
  const [levels, progress] = await Promise.all([getLevels(), Promise.resolve(getProgress())]);
  const overallPct = overallCompletionPct(levels, progress);

  const overallBar = document.getElementById("overallBar");
  const overallPctEl = document.getElementById("overallPct");
  overallBar.style.width = overallPct + "%";
  overallPctEl.textContent = overallPct + "%";

  let totalWords = 0;
  levels.forEach((lv) => (totalWords += lv.sections * 20));
  document.getElementById("totalWords").textContent = totalWords;

  const grid = document.getElementById("levelsGrid");
  grid.innerHTML = "";
  levels.sort((a, b) => a.order - b.order);
  levels.forEach((lv) => {
    const unlocked = isLevelUnlocked(lv.code, progress);
    const pct = levelCompletionPct(lv.code, lv, progress);
    const testPassed = progress[lv.code] && progress[lv.code].testPassed;
    const card = document.createElement(unlocked ? "a" : "div");
    if (unlocked) card.href = `level.html?level=${lv.code}`;
    card.className = "level-card" + (unlocked ? "" : " locked");
    card.style.setProperty("--lc", lv.color);
    card.innerHTML = `
      <div class="bar"></div>
      ${unlocked ? "" : '<div class="lock-badge">🔒 Yopiq</div>'}
      <div class="code">${lv.name}</div>
      <div class="title">${lv.title}</div>
      <div class="subtitle">${lv.subtitle}</div>
      <div class="progress-bar"><div style="width:${pct}%"></div></div>
      <div class="stats"><span>${pct}% bajarildi</span><span>${testPassed ? "✅ Test topshirilgan" : ""}</span></div>
    `;
    grid.appendChild(card);
  });
}

/* ===== Page: Level (level.html) ===== */

async function initLevelPage() {
  const code = qs("level");
  const levels = await getLevels();
  const progressAll = getProgress();
  const meta = levels.find((l) => l.code === code);

  if (!isLevelUnlocked(code, progressAll)) {
    document.getElementById("lockedMsg").style.display = "block";
    document.getElementById("levelContent").style.display = "none";
    return;
  }

  const data = await getLevelData(code);
  const progress = ensureLevel(progressAll, code);

  document.title = `${meta.name} — ${meta.title}`;
  document.getElementById("levelName").textContent = meta.name;
  document.getElementById("levelNameTitle").textContent = `${meta.name} — ${meta.title} (${meta.subtitle})`;
  document.documentElement.style.setProperty("--lc", meta.color);

  const doneCount = Object.keys(progress.sections).length;
  const pct = Math.round((doneCount / meta.sections) * 100);
  document.getElementById("levelProgressText").textContent = `${doneCount}/${meta.sections} bo'lim tugallandi (${pct}%)`;
  document.getElementById("levelProgressBar").style.width = pct + "%";
  document.getElementById("levelProgressBar").style.background = meta.color;

  const grid = document.getElementById("sectionGrid");
  grid.innerHTML = "";
  for (let i = 1; i <= meta.sections; i++) {
    const sec = data.sections.find((s) => s.id === i);
    const done = !!progress.sections[i];
    const exists = !!sec;
    const unlockedSec = exists && isSectionUnlocked(i, progress);
    const clickable = exists && unlockedSec;
    const el = document.createElement(clickable ? "a" : "div");
    if (clickable) el.href = `section.html?level=${code}&id=${i}`;
    el.className = "sec-card " + (done ? "done" : clickable ? "todo" : "locked");
    let status;
    if (done) status = "✅ Bajarildi";
    else if (!exists) status = "...";
    else if (!unlockedSec) status = "🔒 Yopiq";
    else status = "Boshlash";
    el.innerHTML = `
      <div class="num">${i}</div>
      ${exists ? `<span class="topic-icon">${getTopicEmoji(sec.topic)}</span>` : ""}
      <div class="topic">${exists ? sec.topic : "Tez orada"}</div>
      <div class="status">${status}</div>
    `;
    grid.appendChild(el);
  }

  const allDone = doneCount >= meta.sections;
  const testBtn = document.getElementById("levelTestBtn");
  const testMsg = document.getElementById("testMsg");
  if (progress.testPassed) {
    testMsg.textContent = "✅ Siz bu levelni muvaffaqiyatli yakunladingiz!";
    testBtn.textContent = "Testni qayta topshirish";
    testBtn.disabled = false;
  } else if (allDone) {
    testMsg.textContent = "Barcha bo'limlar tugallandi. Endi keyingi levelga o'tish uchun testni topshiring.";
    testBtn.disabled = false;
  } else {
    testMsg.textContent = `Testga kirish uchun avval barcha ${meta.sections} ta bo'limni tugatishingiz kerak.`;
    testBtn.disabled = true;
  }
  testBtn.onclick = () => (location.href = `test.html?level=${code}`);
}

/* ===== Page: Section (section.html) ===== */

async function initSectionPage() {
  const code = qs("level");
  const id = parseInt(qs("id"), 10);
  const [levels, data] = await Promise.all([getLevels(), getLevelData(code)]);
  const meta = levels.find((l) => l.code === code);
  const sec = data.sections.find((s) => s.id === id);
  document.documentElement.style.setProperty("--lc", meta.color);

  if (!sec) {
    document.getElementById("secContent").innerHTML = "<p>Bu bo'lim topilmadi.</p>";
    return;
  }

  const progressAll = getProgress();
  const levelProgress = ensureLevel(progressAll, code);
  if (!isSectionUnlocked(id, levelProgress)) {
    document.getElementById("lockedMsg").style.display = "block";
    document.getElementById("secBody").style.display = "none";
    document.getElementById("lockedMsg").innerHTML = `
      🔒 Bu bo'lim hali yopiq. Avval <strong>${id - 1}-bo'limni</strong> kamida 70% natija bilan tugating.
      <br /><a class="btn secondary" style="margin-top:10px;display:inline-block;" href="level.html?level=${code}">Levelga qaytish</a>
    `;
    return;
  }

  document.title = `${meta.name} - Bo'lim ${id}`;
  document.getElementById("crumbLevel").textContent = meta.name;
  document.getElementById("crumbLevel").href = `level.html?level=${code}`;
  document.getElementById("secTitle").textContent = `Bo'lim ${id}: ${sec.topic}`;
  document.getElementById("heroEmoji").textContent = getTopicEmoji(sec.topic);

  // Words
  const wg = document.getElementById("wordGrid");
  wg.innerHTML = "";
  sec.words.forEach((w) => {
    const card = document.createElement("div");
    card.className = "word-card";
    card.innerHTML = `
      <div class="row1">
        <span class="w">${w.word}</span>
        <span class="pos">${w.pos}</span>
        <span class="ipa">${w.ipa}</span>
        <button class="speak" title="Tinglash">🔊</button>
      </div>
      <div class="def">${w.definition}</div>
      <div class="uz"><img class="flag-icon" src="assets/uz-flag.svg" alt="UZ" width="18" height="12" /> ${w.uz || ""}</div>
      <div class="ex">"${w.example}"</div>
    `;
    card.querySelector(".speak").onclick = (e) => speak(w.word, e.target);
    wg.appendChild(card);
  });

  // Reading text with bolded vocab words
  let text = sec.text;
  const words = sec.words.map((w) => w.word).sort((a, b) => b.length - a.length);
  words.forEach((word) => {
    const re = new RegExp(`\\b(${word}s?|${word}es?)\\b`, "gi");
    text = text.replace(re, (m) => `<b>${m}</b>`);
  });
  document.getElementById("readingText").innerHTML = text;
  document.getElementById("speakAllBtn").onclick = (e) => speak(sec.text, e.target);
  document.getElementById("stopSpeakBtn").onclick = () => stopSpeaking();
  const speedSelect = document.getElementById("speedSelect");
  speechRate = parseFloat(speedSelect.value) || 1;
  speedSelect.onchange = () => {
    speechRate = parseFloat(speedSelect.value) || 1;
  };

  // Quiz
  const quizEl = document.getElementById("quiz");
  quizEl.innerHTML = "";
  const answers = new Array(sec.questions.length).fill(null);
  sec.questions.forEach((q, qi) => {
    const qEl = document.createElement("div");
    qEl.className = "quiz-q";
    qEl.innerHTML = `<div class="qtext">${qi + 1}. ${q.question}</div>`;
    q.options.forEach((opt, oi) => {
      const optEl = document.createElement("label");
      optEl.className = "opt";
      optEl.innerHTML = `<input type="radio" name="q${qi}" value="${oi}"> <span>${opt}</span>`;
      optEl.querySelector("input").onchange = () => {
        answers[qi] = oi;
        qEl.querySelectorAll(".opt").forEach((o) => o.classList.remove("selected"));
        optEl.classList.add("selected");
      };
      qEl.appendChild(optEl);
    });
    quizEl.appendChild(qEl);
  });

  document.getElementById("submitQuiz").onclick = () => {
    if (answers.includes(null)) {
      alert("Iltimos, barcha savollarga javob bering.");
      return;
    }
    let correct = 0;
    sec.questions.forEach((q, qi) => {
      const qEl = quizEl.children[qi];
      qEl.querySelectorAll(".opt").forEach((optEl, oi) => {
        optEl.style.pointerEvents = "none";
        if (oi === q.answer) optEl.classList.add("correct");
        else if (oi === answers[qi] && oi !== q.answer) optEl.classList.add("wrong");
      });
      if (answers[qi] === q.answer) correct++;
    });
    const pct = correct / sec.questions.length;
    const pass = pct >= PASS_THRESHOLD_SECTION;
    const resEl = document.getElementById("result");
    resEl.style.display = "block";
    resEl.className = "result-card " + (pass ? "pass" : "fail");
    resEl.innerHTML = `
      <div class="score">${correct}/${sec.questions.length}</div>
      <p>${pass ? "Ajoyib! Bo'lim tugallandi." : "Yana bir bor urinib ko'ring — kamida 70% kerak."}</p>
    `;
    document.getElementById("submitQuiz").disabled = true;

    if (pass) {
      const progress = getProgress();
      ensureLevel(progress, code).sections[id] = true;
      saveProgress(progress);
    }
    resEl.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Prev/Next nav
  const prevBtn = document.getElementById("prevSec");
  const nextBtn = document.getElementById("nextSec");
  if (id > 1) {
    prevBtn.href = `section.html?level=${code}&id=${id - 1}`;
  } else {
    prevBtn.style.visibility = "hidden";
  }
  if (id < meta.sections && isSectionUnlocked(id + 1, levelProgress)) {
    nextBtn.href = `section.html?level=${code}&id=${id + 1}`;
  } else {
    nextBtn.style.visibility = "hidden";
  }
}

/* ===== Page: Level-up Test (test.html) ===== */

async function initTestPage() {
  const code = qs("level");
  const [levels, data] = await Promise.all([getLevels(), getLevelData(code)]);
  const meta = levels.find((l) => l.code === code);
  document.documentElement.style.setProperty("--lc", meta.color);
  document.title = `${meta.name} - Level testi`;
  document.getElementById("crumbLevel").textContent = meta.name;
  document.getElementById("crumbLevel").href = `level.html?level=${code}`;

  const idx = LEVEL_ORDER.indexOf(code);
  const nextCode = LEVEL_ORDER[idx + 1];
  const nextMeta = nextCode ? levels.find((l) => l.code === nextCode) : null;

  document.getElementById("testTitle").textContent = nextMeta
    ? `${meta.name} → ${nextMeta.name} o'tish testi`
    : `${meta.name} — Yakuniy test`;

  const test = data.levelTest;
  const quizEl = document.getElementById("quiz");
  quizEl.innerHTML = "";
  const answers = new Array(test.questions.length).fill(null);
  test.questions.forEach((q, qi) => {
    const qEl = document.createElement("div");
    qEl.className = "quiz-q";
    qEl.innerHTML = `<div class="qtext">${qi + 1}. ${q.question}</div>`;
    q.options.forEach((opt, oi) => {
      const optEl = document.createElement("label");
      optEl.className = "opt";
      optEl.innerHTML = `<input type="radio" name="q${qi}" value="${oi}"> <span>${opt}</span>`;
      optEl.querySelector("input").onchange = () => {
        answers[qi] = oi;
        qEl.querySelectorAll(".opt").forEach((o) => o.classList.remove("selected"));
        optEl.classList.add("selected");
      };
      qEl.appendChild(optEl);
    });
    quizEl.appendChild(qEl);
  });

  document.getElementById("submitQuiz").onclick = () => {
    if (answers.includes(null)) {
      alert("Iltimos, barcha savollarga javob bering.");
      return;
    }
    let correct = 0;
    test.questions.forEach((q, qi) => {
      const qEl = quizEl.children[qi];
      qEl.querySelectorAll(".opt").forEach((optEl, oi) => {
        optEl.style.pointerEvents = "none";
        if (oi === q.answer) optEl.classList.add("correct");
        else if (oi === answers[qi] && oi !== q.answer) optEl.classList.add("wrong");
      });
      if (answers[qi] === q.answer) correct++;
    });
    const pct = correct / test.questions.length;
    const pass = pct >= PASS_THRESHOLD_TEST;
    const resEl = document.getElementById("result");
    resEl.style.display = "block";
    resEl.className = "result-card " + (pass ? "pass" : "fail");
    resEl.innerHTML = `
      <div class="score">${correct}/${test.questions.length} (${Math.round(pct * 100)}%)</div>
      <p>${
        pass
          ? nextMeta
            ? `Tabriklaymiz! Siz ${meta.name} levelni tugatdingiz va ${nextMeta.name} ochildi.`
            : "Tabriklaymiz! Siz barcha levellarni muvaffaqiyatli yakunladingiz!"
          : "O'tish uchun kamida 80% kerak. Bo'limlarni qayta ko'rib chiqib, yana urinib ko'ring."
      }</p>
      <a class="btn" href="level.html?level=${code}">Levelga qaytish</a>
    `;
    document.getElementById("submitQuiz").disabled = true;

    if (pass) {
      const progress = getProgress();
      ensureLevel(progress, code).testPassed = true;
      saveProgress(progress);
    }
    resEl.scrollIntoView({ behavior: "smooth", block: "center" });
  };
}

/* ===== Router ===== */

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (page === "dashboard") initDashboard();
  else if (page === "level") initLevelPage();
  else if (page === "section") initSectionPage();
  else if (page === "test") initTestPage();
});
