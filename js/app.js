/* ===== Shared utilities ===== */

const LEVEL_ORDER = ["a1", "a2", "b1", "b2", "c1"];
const PASS_THRESHOLD_SECTION = 0.7; // 70% to mark a section complete
const PASS_THRESHOLD_TEST = 0.8; // 80% to pass a level-up test

function qs(name) {
  return new URLSearchParams(location.search).get(name);
}

// Sessiya davomida bir xil faylni ikki marta fetch qilmaslik uchun xotirada kesh.
const fetchCache = new Map();

async function fetchJSON(path) {
  if (fetchCache.has(path)) return fetchCache.get(path);
  const res = await fetch(path);
  if (!res.ok) throw new Error("Failed to load " + path);
  const data = await res.json();
  fetchCache.set(path, data);
  return data;
}

function getLevels() {
  return fetchJSON("data/levels.json");
}

// Levelning faqat metama'lumotini yuklaydi (mavzular, so'zlar soni) — bo'limlarning
// to'liq kontenti (so'zlar, matn, savollar) shu yerda yuklanmaydi.
function getLevelIndex(code) {
  return fetchJSON(`data/${code}/index.json`);
}

// Bitta bo'limning to'liq kontentini yuklaydi.
function getSectionData(code, id) {
  const num = String(id).padStart(2, "0");
  return fetchJSON(`data/${code}/${num}.json`);
}

function getLevelTest(code) {
  return fetchJSON(`data/${code}/test.json`);
}

// Ma'lumot yuklashda xato bo'lsa, foydalanuvchiga tushunarli xabar va
// "Qayta urinish" tugmasini ko'rsatadi.
function showLoadError(container) {
  container.innerHTML = `
    <div class="error-banner" role="alert">
      <span>⚠️ Ma'lumotni yuklab bo'lmadi. Internetni tekshirib, sahifani yangilang.</span>
      <button class="btn secondary" type="button" onclick="location.reload()">Qayta urinish</button>
    </div>
  `;
}

const PROGRESS_KEY = "wordpath:v1:progress";
const PROGRESS_VERSION = 1;

function freshProgress() {
  const levels = {};
  LEVEL_ORDER.forEach((l) => (levels[l] = { sections: {}, testPassed: false }));
  return { version: PROGRESS_VERSION, levels };
}

// Eski yoki buzilgan JSON o'qilsa ham ilova qulab tushmasligi uchun har doim
// try/catch bilan o'raladi va noto'g'ri shakl bo'lsa standart holatga qaytadi.
function getProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === PROGRESS_VERSION && parsed.levels && typeof parsed.levels === "object") {
        return parsed.levels;
      }
    }
  } catch (e) {}
  return freshProgress().levels;
}

function saveProgress(levels) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ version: PROGRESS_VERSION, levels }));
}

function clearProgress() {
  localStorage.removeItem(PROGRESS_KEY);
}

function exportProgress() {
  const levels = getProgress();
  return JSON.stringify({ version: PROGRESS_VERSION, levels }, null, 2);
}

// Import qilinayotgan faylni tekshiradi va shakli to'g'ri bo'lsagina saqlaydi.
function importProgress(jsonText) {
  const parsed = JSON.parse(jsonText);
  if (!parsed || parsed.version !== PROGRESS_VERSION || typeof parsed.levels !== "object") {
    throw new Error("Fayl shakli noto'g'ri");
  }
  saveProgress(parsed.levels);
}

function ensureLevel(progress, code) {
  if (!progress[code]) progress[code] = { sections: {}, testPassed: false };
  return progress[code];
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

const SPEECH_RATE_KEY = "wordpath:v1:speechRate";

function getSavedSpeechRate() {
  const raw = parseFloat(localStorage.getItem(SPEECH_RATE_KEY));
  if (isNaN(raw)) return 1;
  return Math.min(1.5, Math.max(0.5, raw)); // iOS Safari uchun 0.5–1.5 oralig'ida cheklaymiz
}

function saveSpeechRate(rate) {
  localStorage.setItem(SPEECH_RATE_KEY, String(rate));
}

let speechRate = getSavedSpeechRate(); // joriy o'qish tezligi, tezlik tanlagichdan o'zgaradi

// Ingliz ovozini tanlash: getVoices() sahifa ochilganda ba'zan bo'sh massiv
// qaytaradi, shuning uchun ovozlar hali kelmagan bo'lsa voiceschanged hodisasini kutamiz.
let cachedEnglishVoice = null;
let voiceLookupDone = false;

function pickEnglishVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  return (
    voices.find((v) => v.lang === "en-US") ||
    voices.find((v) => v.lang === "en-GB") ||
    voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("en")) ||
    null
  );
}

function ensureVoiceReady(callback) {
  if (!("speechSynthesis" in window)) {
    callback(null, "Brauzeringiz ovozli o'qishni qo'llab-quvvatlamaydi.");
    return;
  }
  const existing = pickEnglishVoice();
  if (existing) {
    cachedEnglishVoice = existing;
    voiceLookupDone = true;
    callback(existing, null);
    return;
  }
  if (voiceLookupDone) {
    callback(null, "Ingliz tilidagi ovoz topilmadi.");
    return;
  }
  // Ba'zi brauzerlarda ovozlar ro'yxati asinxron yuklanadi.
  window.speechSynthesis.onvoiceschanged = () => {
    const found = pickEnglishVoice();
    cachedEnglishVoice = found;
    voiceLookupDone = true;
    if (found) callback(found, null);
    else callback(null, "Ingliz tilidagi ovoz topilmadi.");
  };
  // Ba'zi brauzerlar onvoiceschanged'ni umuman chaqirmaydi — zaxira sifatida biroz kutamiz.
  setTimeout(() => {
    if (voiceLookupDone) return;
    const found = pickEnglishVoice();
    voiceLookupDone = true;
    cachedEnglishVoice = found;
    if (found) callback(found, null);
    else callback(null, "Ingliz tilidagi ovoz topilmadi.");
  }, 800);
}

// Uzun matnni Chrome ~15 soniyadan keyin to'xtatib qo'yishining oldini olish uchun
// gaplarga bo'lib, navbat bilan bittalab o'qitamiz.
function splitIntoSentences(text) {
  const parts = text.match(/[^.!?]+[.!?]*/g);
  return parts ? parts.map((s) => s.trim()).filter(Boolean) : [text];
}

let speechQueue = [];
let speechQueueIndex = 0;

function speakNextInQueue(btn) {
  if (speechQueueIndex >= speechQueue.length) {
    if (btn) btn.classList.remove("speaking");
    return;
  }
  const u = new SpeechSynthesisUtterance(speechQueue[speechQueueIndex]);
  u.lang = "en-US";
  u.rate = speechRate;
  if (cachedEnglishVoice) u.voice = cachedEnglishVoice;
  u.onend = () => {
    speechQueueIndex++;
    speakNextInQueue(btn);
  };
  u.onerror = () => {
    if (btn) btn.classList.remove("speaking");
  };
  window.speechSynthesis.speak(u);
}

// iOS Safari faqat foydalanuvchi bosgan hodisa ichida ovoz boshlashga ruxsat beradi,
// shuning uchun speak() doim tugma bosilganda to'g'ridan-to'g'ri chaqiriladi.
function speak(text, btn) {
  ensureVoiceReady((voice, warning) => {
    if (!("speechSynthesis" in window)) {
      showVoiceWarning(warning);
      return;
    }
    if (!voice) showVoiceWarning(warning);
    window.speechSynthesis.cancel();
    document.querySelectorAll(".speaking").forEach((el) => el.classList.remove("speaking"));
    speechQueue = splitIntoSentences(text);
    speechQueueIndex = 0;
    if (btn) btn.classList.add("speaking");
    speakNextInQueue(btn);
  });
}

function showVoiceWarning(message) {
  const el = document.getElementById("voiceWarning");
  if (!el) return;
  if (message) {
    el.textContent = "⚠️ " + message;
    el.hidden = false;
  } else {
    el.hidden = true;
  }
}

function stopSpeaking() {
  speechQueue = [];
  speechQueueIndex = 0;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  document.querySelectorAll(".speaking").forEach((el) => el.classList.remove("speaking"));
}

// Boshqa bo'limga o'tishda yoki sahifadan chiqishda ovozni to'xtatamiz.
window.addEventListener("pagehide", stopSpeaking);

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

/* ===== Page: Dashboard (index.html) ===== */

async function initDashboard() {
  let levels;
  const progress = getProgress();
  try {
    levels = await getLevels();
  } catch (e) {
    showLoadError(document.getElementById("levelsGrid"));
    return;
  }
  const overallPct = overallCompletionPct(levels, progress);

  const overallBar = document.getElementById("overallBar");
  const overallPctEl = document.getElementById("overallPct");
  overallBar.style.width = overallPct + "%";
  overallPctEl.textContent = overallPct + "%";

  const WORDS_PER_SECTION = 20;
  let totalWords = 0,
    totalSections = 0;
  levels.forEach((lv) => {
    totalWords += lv.sections * WORDS_PER_SECTION;
    totalSections += lv.sections;
  });
  document.getElementById("totalWords").textContent = totalWords;
  document.getElementById("levelsSectionsSummary").textContent = `${levels.length} ta level, ${totalSections} ta bo'lim`;

  const grid = document.getElementById("levelsGrid");
  grid.innerHTML = "";
  levels.sort((a, b) => a.order - b.order);
  levels.forEach((lv) => {
    const pct = levelCompletionPct(lv.code, lv, progress);
    const testPassed = progress[lv.code] && progress[lv.code].testPassed;
    const card = document.createElement("a");
    card.href = `/level?level=${lv.code}`;
    card.className = "level-card";
    card.style.setProperty("--lc", lv.color);
    card.innerHTML = `
      <div class="bar"></div>
      <div class="code">${lv.name}</div>
      <div class="title">${lv.title}</div>
      <div class="subtitle">${lv.subtitle}</div>
      <div class="progress-bar"><div style="width:${pct}%"></div></div>
      <div class="stats"><span>${pct}% bajarildi</span><span>${testPassed ? "✅ Test topshirilgan" : ""}</span></div>
    `;
    grid.appendChild(card);
  });

  wireProgressTools();
}

function wireProgressTools() {
  const msgEl = document.getElementById("progressToolsMsg");
  const setMsg = (text) => {
    msgEl.textContent = text;
  };

  document.getElementById("exportProgressBtn").onclick = () => {
    const json = exportProgress();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wordpath-progress.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMsg("✅ Progress fayl sifatida saqlandi.");
  };

  const fileInput = document.getElementById("importProgressInput");
  document.getElementById("importProgressBtn").onclick = () => fileInput.click();
  fileInput.onchange = () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importProgress(String(reader.result));
        setMsg("✅ Progress yuklandi. Sahifa yangilanmoqda...");
        setTimeout(() => location.reload(), 700);
      } catch (e) {
        setMsg("⚠️ Fayl noto'g'ri formatda — import qilinmadi.");
      }
    };
    reader.readAsText(file);
    fileInput.value = "";
  };

  document.getElementById("clearProgressBtn").onclick = () => {
    if (!confirm("Butun progressni tozalashni tasdiqlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.")) return;
    clearProgress();
    setMsg("✅ Progress tozalandi. Sahifa yangilanmoqda...");
    setTimeout(() => location.reload(), 700);
  };
}

/* ===== Page: Level (level.html) ===== */

async function initLevelPage() {
  const code = qs("level");
  let levels, data;
  try {
    [levels, data] = await Promise.all([getLevels(), getLevelIndex(code)]);
  } catch (e) {
    showLoadError(document.getElementById("levelContent"));
    return;
  }
  const progressAll = getProgress();
  const meta = levels.find((l) => l.code === code);
  const progress = ensureLevel(progressAll, code);

  document.title = `${meta.name} — LearningEnglishStat`;
  document.getElementById("levelName").textContent = meta.name;
  document.getElementById("levelName").classList.remove("skeleton");
  const titleEl = document.getElementById("levelNameTitle");
  titleEl.textContent = `${meta.name} — ${meta.title} (${meta.subtitle})`;
  titleEl.classList.remove("skeleton");
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
    if (clickable) el.href = `/section?level=${code}&id=${i}`;
    else el.setAttribute("aria-disabled", "true");
    el.className = "sec-card " + (done ? "done" : clickable ? "todo" : "locked");
    let status;
    if (done) status = "✅ Bajarildi";
    else if (!exists) status = "...";
    else if (!unlockedSec) status = "🔒 Yopiq";
    else status = "Boshlash";
    el.innerHTML = `
      <div class="num">${i}</div>
      ${exists ? `<span class="topic-icon" aria-hidden="true">${getTopicEmoji(sec.topic)}</span>` : ""}
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
    testMsg.textContent = "Barcha bo'limlar tugallandi! Endi o'zlashtirishingizni tekshirish uchun testni topshiring.";
    testBtn.disabled = false;
  } else {
    testMsg.textContent = `Testga kirish uchun avval barcha ${meta.sections} ta bo'limni tugatishingiz kerak.`;
    testBtn.disabled = true;
  }
  testBtn.onclick = () => (location.href = `/test?level=${code}`);
}

/* ===== Page: Section (section.html) ===== */

async function initSectionPage() {
  const code = qs("level");
  const id = parseInt(qs("id"), 10);
  let levels, sec;
  try {
    [levels, sec] = await Promise.all([getLevels(), getSectionData(code, id)]);
  } catch (e) {
    showLoadError(document.getElementById("secBody"));
    return;
  }
  const meta = levels.find((l) => l.code === code);
  document.documentElement.style.setProperty("--lc", meta.color);

  if (!sec) {
    document.getElementById("secContent").innerHTML = "<p>Bu bo'lim topilmadi.</p>";
    return;
  }

  const progressAll = getProgress();
  const levelProgress = ensureLevel(progressAll, code);
  if (!isSectionUnlocked(id, levelProgress)) {
    const lockedEl = document.getElementById("lockedMsg");
    lockedEl.hidden = false;
    document.getElementById("secBody").hidden = true;
    lockedEl.innerHTML = `
      🔒 Bu bo'lim hali yopiq. Avval <strong>${id - 1}-bo'limni</strong> kamida 70% natija bilan tugating.
      <br /><a class="btn secondary locked-return-link" href="/level?level=${code}">Levelga qaytish</a>
    `;
    return;
  }

  document.title = `${meta.name} · ${id}-bo'lim: ${sec.topic} — LearningEnglishStat`;
  document.getElementById("crumbLevel").textContent = meta.name;
  document.getElementById("crumbLevel").href = `/level?level=${code}`;
  const secTitleEl = document.getElementById("secTitle");
  secTitleEl.textContent = `Bo'lim ${id}: ${sec.topic}`;
  secTitleEl.classList.remove("skeleton");
  document.getElementById("heroEmoji").textContent = getTopicEmoji(sec.topic);
  document.getElementById("wordsHeading").textContent = `1. Yangi so'zlar (${sec.words.length} ta)`;

  // Words
  const wg = document.getElementById("wordGrid");
  wg.innerHTML = "";
  sec.words.forEach((w) => {
    const card = document.createElement("div");
    card.className = "word-card";
    card.innerHTML = `
      <div class="row1">
        <span class="w" lang="en">${w.word}</span>
        <span class="pos" lang="en">${w.pos}</span>
        <span class="ipa" lang="en">${w.ipa}</span>
        <button class="speak" aria-label="${w.word} so'zini tinglash">🔊</button>
      </div>
      <div class="def" lang="en">${w.definition}</div>
      <div class="uz"><img class="flag-icon" src="assets/uz-flag.svg" alt="" width="18" height="12" /> ${w.uz || ""}</div>
      <div class="ex" lang="en">"${w.example}"</div>
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
  speedSelect.value = String(speechRate); // avval saqlangan tezlikni tanlagichda ko'rsatamiz
  speedSelect.onchange = () => {
    speechRate = parseFloat(speedSelect.value) || 1;
    saveSpeechRate(speechRate);
  };

  // Quiz
  document.getElementById("quizHeading").textContent = `3. Tushunishni tekshiring (${sec.questions.length} ta savol)`;
  const quizEl = document.getElementById("quiz");
  quizEl.innerHTML = "";
  const answers = new Array(sec.questions.length).fill(null);
  sec.questions.forEach((q, qi) => {
    const qEl = document.createElement("div");
    qEl.className = "quiz-q";
    qEl.innerHTML = `<div class="qtext"><span lang="uz">${qi + 1}.</span> <span lang="en">${q.question}</span></div>`;
    q.options.forEach((opt, oi) => {
      const optEl = document.createElement("label");
      optEl.className = "opt";
      optEl.innerHTML = `<input type="radio" name="q${qi}" value="${oi}"> <span lang="en">${opt}</span>`;
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
    resEl.hidden = false;
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

  // Prev/Next nav — hozir mavjud bo'lmagan yo'nalish uchun href real qoldiriladi,
  // lekin aria-disabled va vizual "yopiq" holat qo'yiladi (screen reader va klaviatura uchun tushunarli).
  const prevBtn = document.getElementById("prevSec");
  const nextBtn = document.getElementById("nextSec");
  if (id > 1) {
    prevBtn.href = `/section?level=${code}&id=${id - 1}`;
    prevBtn.removeAttribute("aria-disabled");
    prevBtn.classList.remove("disabled");
  } else {
    prevBtn.removeAttribute("href");
    prevBtn.setAttribute("aria-disabled", "true");
    prevBtn.classList.add("disabled");
  }
  if (id < meta.sections && isSectionUnlocked(id + 1, levelProgress)) {
    nextBtn.href = `/section?level=${code}&id=${id + 1}`;
    nextBtn.removeAttribute("aria-disabled");
    nextBtn.classList.remove("disabled");
  } else {
    nextBtn.removeAttribute("href");
    nextBtn.setAttribute("aria-disabled", "true");
    nextBtn.classList.add("disabled");
  }
}

/* ===== Page: Level-up Test (test.html) ===== */

async function initTestPage() {
  const code = qs("level");
  let levels, test;
  try {
    [levels, test] = await Promise.all([getLevels(), getLevelTest(code)]);
  } catch (e) {
    showLoadError(document.querySelector("main"));
    return;
  }
  const meta = levels.find((l) => l.code === code);
  document.documentElement.style.setProperty("--lc", meta.color);
  document.title = `${meta.name} — Test — LearningEnglishStat`;
  document.getElementById("crumbLevel").textContent = meta.name;
  document.getElementById("crumbLevel").href = `/level?level=${code}`;

  const testTitleEl = document.getElementById("testTitle");
  testTitleEl.textContent = `${meta.name} — O'zlashtirish testi`;
  testTitleEl.classList.remove("skeleton");

  const quizEl = document.getElementById("quiz");
  quizEl.innerHTML = "";
  const answers = new Array(test.questions.length).fill(null);
  test.questions.forEach((q, qi) => {
    const qEl = document.createElement("div");
    qEl.className = "quiz-q";
    qEl.innerHTML = `<div class="qtext"><span lang="uz">${qi + 1}.</span> <span lang="en">${q.question}</span></div>`;
    q.options.forEach((opt, oi) => {
      const optEl = document.createElement("label");
      optEl.className = "opt";
      optEl.innerHTML = `<input type="radio" name="q${qi}" value="${oi}"> <span lang="en">${opt}</span>`;
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
    resEl.hidden = false;
    resEl.className = "result-card " + (pass ? "pass" : "fail");
    resEl.innerHTML = `
      <div class="score">${correct}/${test.questions.length} (${Math.round(pct * 100)}%)</div>
      <p>${
        pass
          ? "Tabriklaymiz! Siz bu levelni muvaffaqiyatli o'zlashtirdingiz."
          : "O'tish uchun kamida 80% kerak. Bo'limlarni qayta ko'rib chiqib, yana urinib ko'ring."
      }</p>
      <a class="btn" href="/level?level=${code}">Levelga qaytish</a>
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

  const footerYear = document.getElementById("footerYear");
  if (footerYear) footerYear.textContent = new Date().getFullYear();
});

// PWA: birinchi tashrifdan keyin sayt internetsiz ham ochilishi uchun.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
