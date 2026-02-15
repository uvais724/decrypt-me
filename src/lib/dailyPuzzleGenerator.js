import { supabase } from "./supabaseClient";
import { GoogleGenAI } from "@google/genai";

const IST_TIME_ZONE = "Asia/Kolkata";
const IST_GENERATION_HOUR = 10;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const GEMINI_MODEL = "gemini-2.0-flash";

const DAILY_PROMPT = `Generate a short message for a word puzzle game.

Rules:
- Length 40 to 80 characters
- Family friendly
- Mix of trivia, quotes, facts, humor
- Single sentence
- No special characters except basic punctuation
- Interesting but not too obscure
- Suitable for all ages

Return only the message text.`;

function getISTDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function getISTHour(date = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: IST_TIME_ZONE,
      hour: "2-digit",
      hour12: false,
    }).format(date)
  );
}

function getMsUntilNextIST10AM() {
  const now = new Date();
  const nowInIST = new Date(now.toLocaleString("en-US", { timeZone: IST_TIME_ZONE }));
  const nextRun = new Date(nowInIST);
  nextRun.setHours(IST_GENERATION_HOUR, 0, 0, 0);

  if (nowInIST >= nextRun) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  return nextRun.getTime() - nowInIST.getTime();
}

async function generateMessageWithGemini() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });
  const result = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: DAILY_PROMPT,
    config: {
      temperature: 0.9,
      maxOutputTokens: 100,
    },
  });

  const raw = result?.text?.trim();

  if (!raw) {
    throw new Error("Gemini returned empty content");
  }

  const cleaned = raw.replace(/\s+/g, " ").trim();

  if (cleaned.length < 60 || cleaned.length > 100) {
    throw new Error(`Generated message length out of range (${cleaned.length})`);
  }

  return cleaned;
}

async function ensureDailyPuzzleForToday() {
  const todayIST = getISTDateKey();

  const { data: existing, error: readError } = await supabase
    .from("daily_puzzles")
    .select("*")
    .eq("puzzle_date", todayIST)
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  if (existing) {
    return;
  }

  const message = await generateMessageWithGemini();

  const { error: insertError } = await supabase.from("daily_puzzles").insert({
    puzzle_date: todayIST,
    message,
  });

  if (insertError) {
    throw insertError;
  }
}

async function runGenerationIfScheduled() {
  const istHour = getISTHour();
  if (istHour < IST_GENERATION_HOUR) return;

  try {
    await ensureDailyPuzzleForToday();
  } catch (error) {
    console.error("Daily puzzle generation failed:", error);
  }
}

export function startDailyPuzzleGenerationScheduler() {
  if (typeof window === "undefined") return;
  if (window.__dailyPuzzleSchedulerStarted) return;
  window.__dailyPuzzleSchedulerStarted = true;

  runGenerationIfScheduled();

  const initialDelay = getMsUntilNextIST10AM();

  setTimeout(() => {
    runGenerationIfScheduled();
    setInterval(runGenerationIfScheduled, ONE_DAY_MS);
  }, initialDelay);
}

if (typeof window !== "undefined") {
  startDailyPuzzleGenerationScheduler();
}
