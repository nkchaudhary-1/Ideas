import { create } from "zustand";
import {
  emptyData,
  type AIReview,
  type ActiveSession,
  type AppData,
  type Attempt,
  type AttemptKind,
  type KeyPoint,
  type PhaseClock,
  type PrompterPrefs,
  type Reflection,
  type SessionRecord,
  type Settings,
  type TranscriptSource,
  type VadStats,
} from "./types";
import { analyse } from "./analysis/analyse";
import { clearAudio, clearMemoryAudio, deleteAudio, forgetAudio, loadData, saveData } from "./storage";
import { uid } from "./time";
import { phasesForDay, plannedMinutes } from "../content/curriculum";

export const clockMs = (c: PhaseClock, now = Date.now()) => c.accMs + (c.runningSince ? Math.max(0, now - c.runningSince) : 0);

export interface NewAttempt {
  id?: string;
  day: number;
  kind: AttemptKind;
  question: string;
  durationSec: number;
  transcript: string;
  source: TranscriptSource;
  vad: VadStats | null;
  hasAudio?: boolean;
  retryOf?: string;
  followUpOf?: string;
  followUpReason?: string;
  keyPoints?: KeyPoint[];
  targetSec?: [number, number];
}

interface Toast {
  id: number;
  text: string;
}

interface State {
  data: AppData;
  saveFailed: boolean;
  toast: Toast | null;
  // preferences
  welcome: () => void;
  setSettings: (p: Partial<Settings>) => void;
  setAi: (p: Partial<Settings["ai"]>) => void;
  setPrompter: (p: Partial<PrompterPrefs>) => void;
  setFill: (day: number, key: string, value: string) => void;
  clearFills: (day: number) => void;
  setNotes: (day: number, text: string) => void;
  // attempts
  addAttempt: (a: NewAttempt) => Attempt;
  setTranscript: (id: string, text: string) => void;
  setAttemptAI: (id: string, ai: AIReview) => void;
  deleteAttempt: (id: string) => void;
  clearTranscript: (id: string) => void;
  clearAllTranscripts: () => void;
  clearAllAudio: () => void;
  // session
  startSession: (day: number) => void;
  toggleClock: () => void;
  setRunning: (run: boolean) => void;
  foldClock: () => void;
  completePhase: (status: "done" | "skipped") => void;
  gotoPhase: (index: number) => void;
  setStep: (n: number) => void;
  finishSession: () => SessionRecord | null;
  abandonSession: () => void;
  saveReflection: (day: number, answers: Reflection["answers"], sessionId?: string) => void;
  deleteSession: (id: string) => void;
  deleteReflection: (id: string) => void;
  deleteAllSessions: () => void;
  // data
  importData: (d: AppData) => void;
  resetAll: () => void;
  say: (text: string) => void;
}

function initial(): AppData {
  const d = loadData();
  // A session that was running when the page closed comes back paused.
  if (d.active) {
    d.active = {
      ...d.active,
      clocks: d.active.clocks.map((c) => ({ accMs: c.accMs, runningSince: null })),
    };
  }
  return d;
}

let toastId = 0;

export const useStore = create<State>()((set, get) => {
  const patch = (fn: (d: AppData) => AppData) => set((s) => ({ data: fn(s.data) }));
  const patchActive = (fn: (a: ActiveSession) => ActiveSession) => patch((d) => (d.active ? { ...d, active: fn(d.active) } : d));

  const build = (n: NewAttempt): Attempt => {
    const analysis = analyse({ transcript: n.transcript, durationSec: n.durationSec, vad: n.vad, kind: n.kind, keyPoints: n.keyPoints, targetSec: n.targetSec });
    return {
      id: n.id ?? uid(),
      day: n.day,
      kind: n.kind,
      question: n.question,
      at: new Date().toISOString(),
      durationSec: Math.round(n.durationSec),
      transcript: n.transcript,
      source: n.source,
      vad: n.vad,
      hasAudio: !!n.hasAudio,
      analysis,
      retryOf: n.retryOf,
      followUpOf: n.followUpOf,
      followUpReason: n.followUpReason,
      keyPoints: n.keyPoints,
      targetSec: n.targetSec,
    };
  };

  return {
    data: initial(),
    saveFailed: false,
    toast: null,

    welcome: () => patch((d) => ({ ...d, welcomed: true })),
    setSettings: (p) => patch((d) => ({ ...d, settings: { ...d.settings, ...p } })),
    setAi: (p) => patch((d) => ({ ...d, settings: { ...d.settings, ai: { ...d.settings.ai, ...p } } })),
    setPrompter: (p) => patch((d) => ({ ...d, prompter: { ...d.prompter, ...p } })),
    setFill: (day, key, value) => patch((d) => ({ ...d, fills: { ...d.fills, [day]: { ...(d.fills[day] ?? {}), [key]: value } } })),
    clearFills: (day) =>
      patch((d) => {
        const fills = { ...d.fills };
        delete fills[day];
        return { ...d, fills };
      }),
    setNotes: (day, text) => patch((d) => ({ ...d, notes: { ...d.notes, [day]: text } })),

    addAttempt: (n) => {
      const a = build(n);
      const act = get().data.active;
      if (act && act.day === a.day) a.sessionId = act.id;
      patch((d) => ({
        ...d,
        attempts: [...d.attempts, a],
        active: d.active && d.active.day === a.day ? { ...d.active, attemptIds: [...d.active.attemptIds, a.id] } : d.active,
      }));
      return a;
    },
    setTranscript: (id, text) =>
      patch((d) => ({
        ...d,
        attempts: d.attempts.map((a) =>
          a.id === id
            ? {
                ...a,
                transcript: text,
                source: a.source === "typed" ? "typed" : "edited",
                ai: undefined,
                analysis: analyse({ transcript: text, durationSec: a.durationSec, vad: a.vad, kind: a.kind, keyPoints: a.keyPoints, targetSec: a.targetSec }),
              }
            : a,
        ),
      })),
    setAttemptAI: (id, ai) => patch((d) => ({ ...d, attempts: d.attempts.map((a) => (a.id === id ? { ...a, ai } : a)) })),
    deleteAttempt: (id) => {
      void deleteAudio(id);
      forgetAudio(id);
      patch((d) => ({
        ...d,
        attempts: d.attempts.filter((a) => a.id !== id),
        sessions: d.sessions.map((s) => ({ ...s, attemptIds: s.attemptIds.filter((x) => x !== id) })),
      }));
    },
    clearTranscript: (id) =>
      patch((d) => ({
        ...d,
        attempts: d.attempts.map((a) => (a.id === id ? { ...a, transcript: "", ai: undefined, analysis: null } : a)),
      })),
    clearAllTranscripts: () =>
      patch((d) => ({ ...d, attempts: d.attempts.map((a) => ({ ...a, transcript: "", ai: undefined, analysis: null })) })),
    clearAllAudio: () => {
      void clearAudio();
      clearMemoryAudio();
      patch((d) => ({ ...d, attempts: d.attempts.map((a) => ({ ...a, hasAudio: false })) }));
    },

    startSession: (day) => {
      const phases = phasesForDay(day);
      const now = Date.now();
      const clocks: PhaseClock[] = phases.map((_, i) => ({ accMs: 0, runningSince: i === 0 ? now : null }));
      patch((d) => {
        if (d.active && d.active.day === day) {
          // Resume the same day: keep the clocks, just start the current one.
          const a = d.active;
          return { ...d, active: { ...a, clocks: a.clocks.map((c, i) => (i === a.phaseIndex ? { ...c, runningSince: now } : c)) } };
        }
        return {
          ...d,
          active: { id: uid(), day, startedAt: new Date().toISOString(), phaseIndex: 0, clocks, status: phases.map(() => "pending"), attemptIds: [] },
        };
      });
    },
    toggleClock: () =>
      patchActive((a) => {
        const now = Date.now();
        return {
          ...a,
          clocks: a.clocks.map((c, i) => {
            if (i !== a.phaseIndex) return c;
            return c.runningSince ? { accMs: c.accMs + (now - c.runningSince), runningSince: null } : { ...c, runningSince: now };
          }),
        };
      }),
    setRunning: (run) =>
      patchActive((a) => {
        const now = Date.now();
        return {
          ...a,
          clocks: a.clocks.map((c, i) => {
            if (i !== a.phaseIndex) return c;
            if (run) return c.runningSince ? c : { ...c, runningSince: now };
            return c.runningSince ? { accMs: c.accMs + (now - c.runningSince), runningSince: null } : c;
          }),
        };
      }),
    foldClock: () =>
      patchActive((a) => {
        const now = Date.now();
        return { ...a, clocks: a.clocks.map((c) => (c.runningSince ? { accMs: c.accMs + (now - c.runningSince), runningSince: now } : c)) };
      }),
    completePhase: (status) =>
      patchActive((a) => {
        const now = Date.now();
        const next = a.phaseIndex + 1;
        const statusArr = a.status.slice();
        statusArr[a.phaseIndex] = status;
        const clocks = a.clocks.map((c, i) => {
          if (i === a.phaseIndex && c.runningSince) return { accMs: c.accMs + (now - c.runningSince), runningSince: null };
          if (i === next) return { ...c, runningSince: now };
          return c;
        });
        return { ...a, status: statusArr, clocks, phaseIndex: Math.min(next, a.clocks.length - 1), step: 0 };
      }),
    gotoPhase: (index) =>
      patchActive((a) => {
        const now = Date.now();
        const clocks = a.clocks.map((c, i) => {
          if (i === a.phaseIndex && c.runningSince) return { accMs: c.accMs + (now - c.runningSince), runningSince: null };
          if (i === index) return { ...c, runningSince: now };
          return c;
        });
        return { ...a, clocks, phaseIndex: index, step: 0 };
      }),
    setStep: (n) => patchActive((a) => ({ ...a, step: n })),
    finishSession: () => {
      const a = get().data.active;
      if (!a) return null;
      const phases = phasesForDay(a.day);
      const now = Date.now();
      const rec: SessionRecord = {
        id: a.id,
        day: a.day,
        startedAt: a.startedAt,
        completedAt: new Date().toISOString(),
        plannedMin: plannedMinutes(a.day),
        activeSec: Math.round(a.clocks.reduce((n, c) => n + clockMs(c, now), 0) / 1000),
        phases: phases.map((p, i) => ({ id: p.id, status: a.status[i] === "done" ? "done" : "skipped", sec: Math.round(clockMs(a.clocks[i], now) / 1000) })),
        attemptIds: a.attemptIds,
      };
      patch((d) => ({ ...d, sessions: [...d.sessions, rec], active: null }));
      return rec;
    },
    abandonSession: () => patch((d) => ({ ...d, active: null })),
    saveReflection: (day, answers, sessionId) =>
      patch((d) => {
        const rec: Reflection = { id: uid(), day, sessionId, at: new Date().toISOString(), answers };
        // One reflection per session: saving again replaces it.
        const rest = sessionId ? d.reflections.filter((r) => r.sessionId !== sessionId) : d.reflections;
        return { ...d, reflections: [...rest, rec] };
      }),
    deleteSession: (id) => patch((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id), reflections: d.reflections.filter((r) => r.sessionId !== id) })),
    deleteReflection: (id) => patch((d) => ({ ...d, reflections: d.reflections.filter((r) => r.id !== id) })),
    deleteAllSessions: () => patch((d) => ({ ...d, sessions: [], reflections: [], active: null })),

    importData: (incoming) => {
      void clearAudio();
      clearMemoryAudio();
      set({ data: { ...incoming, welcomed: true, active: null } });
    },
    resetAll: () => {
      void clearAudio();
      clearMemoryAudio();
      set({ data: { ...emptyData() } });
    },
    say: (text) => {
      const id = ++toastId;
      set({ toast: { id, text } });
      setTimeout(() => {
        if (get().toast?.id === id) set({ toast: null });
      }, 3200);
    },
  };
});

// Save to localStorage shortly after any change, and flush when the page is hidden.
let timer: ReturnType<typeof setTimeout> | null = null;
const flush = () => {
  if (timer) clearTimeout(timer);
  timer = null;
  const ok = saveData(useStore.getState().data);
  if (useStore.getState().saveFailed === ok) useStore.setState({ saveFailed: !ok });
};
useStore.subscribe((s, prev) => {
  if (s.data === prev.data) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, 250);
});
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush());
}
