// Persistence. Progress lives in localStorage as one JSON document (small: text only). Audio, when the user chooses
// to keep it, lives in IndexedDB on this device. Nothing here ever leaves the browser.
import { DEFAULT_PROMPTER, DEFAULT_SETTINGS, emptyData, type AppData } from "./types";

export const STORAGE_KEY = "speakup30:v1";

export function mergeData(raw: unknown): AppData {
  const base = emptyData();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<AppData>;
  return {
    version: 1,
    welcomed: !!r.welcomed,
    settings: { ...DEFAULT_SETTINGS, ...(r.settings ?? {}), ai: { ...DEFAULT_SETTINGS.ai, ...(r.settings?.ai ?? {}) } },
    prompter: { ...DEFAULT_PROMPTER, ...(r.prompter ?? {}) },
    sessions: Array.isArray(r.sessions) ? r.sessions : [],
    attempts: Array.isArray(r.attempts) ? r.attempts : [],
    reflections: Array.isArray(r.reflections) ? r.reflections : [],
    fills: r.fills && typeof r.fills === "object" ? r.fills : {},
    active: r.active ?? null,
    notes: r.notes && typeof r.notes === "object" ? r.notes : {},
  };
}

export function loadData(): AppData {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    return text ? mergeData(JSON.parse(text)) : emptyData();
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

// ── Export and import ──────────────────────────────────────────────────────────────────────────────────────────

export function exportJSON(data: AppData, includeKey = false): string {
  const copy: AppData = JSON.parse(JSON.stringify(data));
  // Never put the API key in a backup file by default.
  if (!includeKey) copy.settings.ai.apiKey = "";
  copy.active = null;
  return JSON.stringify({ app: "speakup-30", exportedAt: new Date().toISOString(), data: copy }, null, 2);
}

export function parseImport(text: string): { ok: true; data: AppData } | { ok: false; error: string } {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file is not valid JSON. Choose a backup exported from SpeakUp 30." };
  }
  const obj = json as { app?: string; data?: unknown };
  const payload = obj && obj.app === "speakup-30" ? obj.data : null;
  if (!payload || typeof payload !== "object") return { ok: false, error: "That file is not a SpeakUp 30 backup. Choose a file exported from Settings." };
  const d = payload as Partial<AppData>;
  if (!Array.isArray(d.sessions) || !Array.isArray(d.attempts)) return { ok: false, error: "The backup is missing its sessions. It may be damaged." };
  return { ok: true, data: mergeData(payload) };
}

// ── Audio in IndexedDB ─────────────────────────────────────────────────────────────────────────────────────────

const DB = "speakup30-audio";
const STORE = "clips";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    t.oncomplete = () => db.close();
  });
}
export const putAudio = (id: string, blob: Blob) => tx("readwrite", (s) => s.put(blob, id)).catch(() => undefined);
export const getAudio = (id: string) => tx<Blob | undefined>("readonly", (s) => s.get(id)).catch(() => undefined);
export const deleteAudio = (id: string) => tx("readwrite", (s) => s.delete(id)).catch(() => undefined);
export const clearAudio = () => tx("readwrite", (s) => s.clear()).catch(() => undefined);

// Recordings from this page visit that were not saved to disk: kept in memory so replay and compare still work.
const memory = new Map<string, Blob>();
export const rememberAudio = (id: string, blob: Blob) => memory.set(id, blob);
export const forgetAudio = (id: string) => memory.delete(id);
export const clearMemoryAudio = () => memory.clear();
export async function loadAudio(id: string): Promise<Blob | undefined> {
  return memory.get(id) ?? (await getAudio(id));
}
