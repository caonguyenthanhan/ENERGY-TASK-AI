'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ParsedTask } from './ai';
import { supabase } from './supabase';

export type EnergyLevel = 'high' | 'normal' | 'low';

export type Chronotype = 'lion' | 'bear' | 'wolf' | 'dolphin';

export type Mood = 'excited' | 'neutral' | 'anxious' | 'sad' | 'angry';

export type Subtask = {
  id: string;
  title: string;
  isCompleted: boolean;
};

export type WeeklyReview = {
  weekStart: string;
  healthPercent: number;
  mentalPercent: number;
  lastWeekNote: string;
  nextWeekNote: string;
  createdAt: string;
};

export type MoodRecord = {
  date: string;
  mood: Mood;
};

export type MorningAdherenceRecord = {
  date: string;
  completed: string[];
};

export type MorningProtocolPrefs = {
  enabled: boolean;
};

export type DailyTopSixRecord = {
  date: string;
  taskIds: string[];
};

export type StreakReason = 'important' | 'ivy1' | 'both';

export type StreakRecord = {
  date: string;
  reason: StreakReason;
};

export type Task = {
  id: string;
  title: string;
  deadline: string | null;
  durationMinutes: number;
  isImportant: boolean;
  isUrgent: boolean;
  isRoutine?: boolean;
  resources?: string[];
  listId?: string | null;
  energyRequired?: EnergyLevel;
  prerequisiteTaskId?: string | null;
  startAfterPrerequisiteDays?: 0 | 1;
  subtasks: Subtask[];
  createdAt: string;
  completedAt: string | null;
  status: 'todo' | 'done' | 'skipped';
  score?: number;
  scoreBreakdown?: {
    chronotypeBonus?: number;
    chronotypeFit?: boolean;
    moodBonus?: number;
    mood?: Mood | null;
    ivyLeeRank?: number;
  };
  timerStatus?: 'idle' | 'running' | 'paused';
  timerPhase?: 'focus' | 'break';
  timerStartedAt?: string | null;
  timerRemaining?: number;
};

export type SessionType = 'morning' | 'noon' | 'afternoon' | 'evening' | 'late_night';

export type EnergyRecord = {
  date: string; // YYYY-MM-DD
  session?: SessionType;
  level: EnergyLevel;
};

export type TaskList = {
  id: string;
  name: string;
};

type AppState = {
  tasks: Task[];
  lists: TaskList[];
  energyLevel: EnergyLevel | null;
  lastCheckInDate: string | null;
  lastCheckInSession: SessionType | null;
  energyHistory: EnergyRecord[];
  mood: Mood | null;
  lastMoodDate: string | null;
  moodHistory: MoodRecord[];
  dailyTopSix: DailyTopSixRecord[];
  streakHistory: StreakRecord[];
  points: number;
  pointGoal: number;
  pointSettings: { base: number, importantBonus: number, urgentBonus: number };
  apiKeys: string[];
  customPrompt: string;
  chronotype: Chronotype | null;
  chronotypeUpdatedAt: string | null;
  weeklyReviews: WeeklyReview[];
  morningProtocolPrefs: MorningProtocolPrefs;
  morningAdherenceHistory: MorningAdherenceRecord[];
  backgroundType?: 'color' | 'image' | 'video';
  backgroundValue?: string;
  backgroundIsPublic?: boolean;
  backgroundOverlayOpacity: number;
  backgroundOverlayColor: string;
  mentalHealth?: number;
};

const STORAGE_KEY = 'energy_task_ai_state_v2';

function normalizeDeadline(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  const s = value.trim();
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return s;
}

function normalizeDurationForNewTask(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return fallback;
  const int = Math.round(n);
  return int >= 1 ? int : fallback;
}

function normalizeDurationPatch(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return undefined;
  const int = Math.round(n);
  if (int < 1) return 1;
  return int;
}

function normalizeTaskPatch(patch: Partial<Task>): Partial<Task> {
  const out: Partial<Task> = { ...patch };

  if ('title' in out) {
    out.title = typeof out.title === 'string' ? out.title.trim() || 'Công việc không tên' : 'Công việc không tên';
  }

  if ('deadline' in out) {
    out.deadline = out.deadline === null ? null : normalizeDeadline(out.deadline);
  }

  if ('durationMinutes' in out) {
    const normalized = normalizeDurationPatch(out.durationMinutes);
    if (normalized === undefined) delete (out as any).durationMinutes;
    else out.durationMinutes = normalized;
  }

  if ('isImportant' in out) out.isImportant = Boolean(out.isImportant);
  if ('isUrgent' in out) out.isUrgent = Boolean(out.isUrgent);
  if ('isRoutine' in out) out.isRoutine = Boolean(out.isRoutine);

  if ('resources' in out) {
    out.resources = Array.isArray(out.resources)
      ? out.resources.map(r => String(r).trim()).filter(Boolean)
      : [];
  }

  if ('status' in out) {
    const s = out.status;
    out.status = s === 'todo' || s === 'done' || s === 'skipped' ? s : 'todo';
  }

  if ('listId' in out) {
    out.listId = out.listId ? String(out.listId) : null;
  }

  if ('prerequisiteTaskId' in out) {
    out.prerequisiteTaskId = out.prerequisiteTaskId ? String(out.prerequisiteTaskId) : null;
  }

  if ('startAfterPrerequisiteDays' in out) {
    const n = Number(out.startAfterPrerequisiteDays);
    out.startAfterPrerequisiteDays = n === 1 ? 1 : 0;
  }

  if ('timerPhase' in out) {
    const p = out.timerPhase;
    out.timerPhase = p === 'break' || p === 'focus' ? p : 'focus';
  }

  return out;
}

function normalizeChronotype(value: unknown): Chronotype | null {
  if (value === null || value === undefined) return null;
  if (value === 'lion' || value === 'bear' || value === 'wolf' || value === 'dolphin') return value;
  return null;
}

function normalizeUpdatedAt(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  const s = value.trim();
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function normalizeMood(value: unknown): Mood | null {
  if (value === null || value === undefined) return null;
  if (value === 'excited' || value === 'neutral' || value === 'anxious' || value === 'sad' || value === 'angry') return value;
  return null;
}

function clamp01(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function normalizeOverlayColor(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const s = value.trim();
  if (!s) return fallback;
  const hex3 = /^#([0-9a-fA-F]{3})$/;
  const hex6 = /^#([0-9a-fA-F]{6})$/;
  const m3 = s.match(hex3);
  if (m3) {
    const [r, g, b] = m3[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  const m6 = s.match(hex6);
  if (m6) return `#${m6[1].toLowerCase()}`;
  return fallback;
}

function getWeekStartISO(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function getChronotypeFitNow(chronotype: Chronotype): { fit: boolean; windowLabel: string } {
  const hour = new Date().getHours();
  if (chronotype === 'lion') {
    const fit = hour >= 5 && hour < 12;
    return { fit, windowLabel: '05:00–12:00' };
  }
  if (chronotype === 'bear') {
    const fit = hour >= 9 && hour < 15;
    return { fit, windowLabel: '09:00–15:00' };
  }
  if (chronotype === 'wolf') {
    const fit = hour >= 12 && hour < 21;
    return { fit, windowLabel: '12:00–21:00' };
  }
  const fit = (hour >= 10 && hour < 12) || (hour >= 14 && hour < 16);
  return { fit, windowLabel: '10:00–12:00, 14:00–16:00' };
}

const initialState: AppState = {
  tasks: [],
  lists: [],
  energyLevel: null,
  lastCheckInDate: null,
  lastCheckInSession: null,
  energyHistory: [],
  mood: null,
  lastMoodDate: null,
  moodHistory: [],
  dailyTopSix: [],
  streakHistory: [],
  points: 0,
  pointGoal: 100,
  pointSettings: { base: 10, importantBonus: 20, urgentBonus: 10 },
  apiKeys: [],
  customPrompt: '',
  chronotype: null,
  chronotypeUpdatedAt: null,
  weeklyReviews: [],
  morningProtocolPrefs: { enabled: true },
  morningAdherenceHistory: [],
  backgroundType: 'color',
  backgroundValue: '#f3f4f6', // Tailwind gray-100
  backgroundIsPublic: false,
  backgroundOverlayOpacity: 0.7,
  backgroundOverlayColor: '#000000',
  mentalHealth: 50,
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function mergeUniqueStrings(a: unknown, b: unknown): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of [...asArray<unknown>(a), ...asArray<unknown>(b)]) {
    const s = String(v || '').trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function mergeByKey<T>(
  local: unknown,
  remote: unknown,
  getKey: (item: T) => string,
  pick: (localItem: T, remoteItem: T) => T
): T[] {
  const map = new Map<string, T>();
  for (const item of asArray<T>(local)) {
    const key = getKey(item);
    if (!key) continue;
    map.set(key, item);
  }
  for (const item of asArray<T>(remote)) {
    const key = getKey(item);
    if (!key) continue;
    const existing = map.get(key);
    map.set(key, existing ? pick(existing, item) : item);
  }
  return Array.from(map.values());
}

function isoToTime(value: unknown): number {
  if (typeof value !== 'string') return Number.NaN;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : Number.NaN;
}

function weeklyReviewEquals(a: WeeklyReview, b: WeeklyReview): boolean {
  return (
    a.weekStart === b.weekStart &&
    a.healthPercent === b.healthPercent &&
    a.mentalPercent === b.mentalPercent &&
    a.lastWeekNote === b.lastWeekNote &&
    a.nextWeekNote === b.nextWeekNote &&
    a.createdAt === b.createdAt
  );
}

function mergeWeeklyReviews(local: unknown, remote: unknown): { merged: WeeklyReview[]; differsFromRemote: boolean } {
  const merged = mergeByKey<WeeklyReview>(
    local,
    remote,
    (r) => (r?.weekStart ? String(r.weekStart) : ''),
    (l, r) => {
      const lt = isoToTime(l.createdAt);
      const rt = isoToTime(r.createdAt);
      if (Number.isFinite(lt) && Number.isFinite(rt)) return rt >= lt ? r : l;
      if (Number.isFinite(rt)) return r;
      if (Number.isFinite(lt)) return l;
      return r;
    }
  ).filter((r) => typeof r?.weekStart === 'string');

  const remoteArr = asArray<WeeklyReview>(remote).filter((r) => typeof r?.weekStart === 'string');
  const remoteMap = new Map<string, WeeklyReview>();
  for (const r of remoteArr) remoteMap.set(r.weekStart, r);
  let differsFromRemote = merged.length !== remoteArr.length;
  if (!differsFromRemote) {
    for (const m of merged) {
      const rr = remoteMap.get(m.weekStart);
      if (!rr || !weeklyReviewEquals(m, rr)) {
        differsFromRemote = true;
        break;
      }
    }
  }
  return { merged, differsFromRemote };
}

function mergeAppState(local: AppState, remote: any): { merged: AppState; shouldPushRemote: boolean } {
  const base: AppState = { ...local, ...(remote && typeof remote === 'object' ? remote : {}) };

  const tasks = mergeByKey<Task>(local.tasks, remote?.tasks, (t) => String(t?.id || ''), (_l, r) => r);
  const lists = mergeByKey<TaskList>(local.lists, remote?.lists, (l) => String(l?.id || ''), (_l, r) => r);
  const energyHistory = mergeByKey<EnergyRecord>(
    local.energyHistory,
    remote?.energyHistory,
    (r) => `${String(r?.date || '')}__${String(r?.session || '')}`,
    (_l, r) => r
  );
  const moodHistory = mergeByKey<MoodRecord>(local.moodHistory, remote?.moodHistory, (r) => String(r?.date || ''), (_l, r) => r);
  const dailyTopSix = mergeByKey<DailyTopSixRecord>(
    local.dailyTopSix,
    remote?.dailyTopSix,
    (r) => String(r?.date || ''),
    (_l, r) => r
  );
  const streakHistory = mergeByKey<StreakRecord>(local.streakHistory, remote?.streakHistory, (r) => String(r?.date || ''), (_l, r) => r);
  const morningAdherenceHistory = mergeByKey<MorningAdherenceRecord>(
    local.morningAdherenceHistory,
    remote?.morningAdherenceHistory,
    (r) => String(r?.date || ''),
    (_l, r) => r
  );
  const weekly = mergeWeeklyReviews(local.weeklyReviews, remote?.weeklyReviews);

  const merged: AppState = {
    ...base,
    tasks,
    lists,
    energyHistory,
    moodHistory,
    dailyTopSix,
    streakHistory,
    morningAdherenceHistory,
    weeklyReviews: weekly.merged,
    apiKeys: mergeUniqueStrings(local.apiKeys, remote?.apiKeys),
  };

  return { merged, shouldPushRemote: weekly.differsFromRemote };
}

function useTaskStoreInternal() {
  const [state, setState] = useState<AppState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const isRemoteUpdate = React.useRef(false);
  const stateRef = React.useRef<AppState>(initialState);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const upsertRemoteState = async (userId: string, nextState: AppState) => {
    await supabase
      .from('user_data')
      .upsert(
        {
          user_id: userId,
          state: nextState,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
  };

  // Load initial state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            const today = new Date().toDateString();
            const currentHour = new Date().getHours();
            let currentSession: SessionType = 'morning';
            if (currentHour >= 11 && currentHour < 14) currentSession = 'noon';
            else if (currentHour >= 14 && currentHour < 18) currentSession = 'afternoon';
            else if (currentHour >= 18 && currentHour < 22) currentSession = 'evening';
            else if (currentHour >= 22 || currentHour < 5) currentSession = 'late_night';

            if (parsed.lastCheckInDate !== today || parsed.lastCheckInSession !== currentSession) {
              parsed.energyLevel = null;
            }
            // Ensure arrays exist for older versions
            parsed.apiKeys = Array.isArray(parsed.apiKeys) ? parsed.apiKeys : [];
            parsed.lists = Array.isArray(parsed.lists) ? parsed.lists : [];
            parsed.pointSettings = parsed.pointSettings || { base: 10, importantBonus: 20, urgentBonus: 10 };
            parsed.pointGoal = parsed.pointGoal || 100;
            parsed.customPrompt = typeof parsed.customPrompt === 'string' ? parsed.customPrompt : '';
            parsed.chronotype = normalizeChronotype(parsed.chronotype);
            parsed.chronotypeUpdatedAt = normalizeUpdatedAt(parsed.chronotypeUpdatedAt);
            const todayISO = new Date().toISOString().split('T')[0];
            parsed.lastMoodDate = typeof parsed.lastMoodDate === 'string' ? parsed.lastMoodDate : null;
            parsed.mood = normalizeMood(parsed.mood);
            if (parsed.lastMoodDate !== todayISO) parsed.mood = null;
            parsed.moodHistory = Array.isArray(parsed.moodHistory) ? parsed.moodHistory.map((r: any) => ({
              date: typeof r?.date === 'string' ? r.date : todayISO,
              mood: normalizeMood(r?.mood) ?? 'neutral',
            })).filter((r: any) => typeof r?.date === 'string' && typeof r?.mood === 'string') : [];
            parsed.dailyTopSix = Array.isArray(parsed.dailyTopSix) ? parsed.dailyTopSix.map((r: any) => ({
              date: typeof r?.date === 'string' ? r.date : todayISO,
              taskIds: Array.isArray(r?.taskIds) ? r.taskIds.map((x: any) => String(x)).filter(Boolean).slice(0, 6) : [],
            })).filter((r: any) => typeof r?.date === 'string' && Array.isArray(r?.taskIds)) : [];
            parsed.streakHistory = Array.isArray(parsed.streakHistory) ? parsed.streakHistory.map((r: any) => ({
              date: typeof r?.date === 'string' ? r.date : todayISO,
              reason: r?.reason === 'both' || r?.reason === 'important' || r?.reason === 'ivy1' ? r.reason : 'important',
            })).filter((r: any) => typeof r?.date === 'string') : [];
            parsed.weeklyReviews = Array.isArray(parsed.weeklyReviews) ? parsed.weeklyReviews.map((r: any) => ({
              weekStart: typeof r?.weekStart === 'string' ? r.weekStart : getWeekStartISO(),
              healthPercent: Math.max(0, Math.min(100, Number(r?.healthPercent ?? 50))),
              mentalPercent: Math.max(0, Math.min(100, Number(r?.mentalPercent ?? 50))),
              lastWeekNote: typeof r?.lastWeekNote === 'string' ? r.lastWeekNote : '',
              nextWeekNote: typeof r?.nextWeekNote === 'string' ? r.nextWeekNote : '',
              createdAt: typeof r?.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
            })) : [];
            parsed.morningProtocolPrefs = parsed.morningProtocolPrefs && typeof parsed.morningProtocolPrefs === 'object'
              ? { enabled: Boolean((parsed.morningProtocolPrefs as any).enabled ?? true) }
              : { enabled: true };
            parsed.morningAdherenceHistory = Array.isArray(parsed.morningAdherenceHistory) ? parsed.morningAdherenceHistory.map((r: any) => ({
              date: typeof r?.date === 'string' ? r.date : todayISO,
              completed: Array.isArray(r?.completed) ? r.completed.map((x: any) => String(x)).filter(Boolean) : [],
            })) : [];
            parsed.backgroundOverlayOpacity = clamp01(parsed.backgroundOverlayOpacity, 0.7);
            parsed.backgroundOverlayColor = normalizeOverlayColor(parsed.backgroundOverlayColor, '#000000');
            parsed.tasks = Array.isArray(parsed.tasks) ? parsed.tasks.map((t: any) => ({
              ...t,
              title: typeof t.title === 'string' ? t.title : 'Công việc không tên',
              deadline: normalizeDeadline(t.deadline),
              durationMinutes: normalizeDurationForNewTask(t.durationMinutes, 30),
              subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
              resources: Array.isArray(t.resources) ? t.resources : [],
              isImportant: t.isImportant ?? false,
              isUrgent: t.isUrgent ?? false,
              isRoutine: t.isRoutine ?? false,
              prerequisiteTaskId: t.prerequisiteTaskId ? String(t.prerequisiteTaskId) : null,
              startAfterPrerequisiteDays: Number(t.startAfterPrerequisiteDays) === 1 ? 1 : 0,
              timerPhase: t.timerPhase === 'break' ? 'break' : 'focus',
              status: t.status === 'todo' || t.status === 'done' || t.status === 'skipped' ? t.status : 'todo',
            })) : [];
            
            setState({ ...initialState, ...parsed });
          }
        } catch (e) {
          console.error('Failed to parse state', e);
        }
      }
    } catch (e) {
      console.error('localStorage access denied', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error('localStorage setItem failed', e);
      }
    }
  }, [state, isLoaded]);

  // Handle Auth State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Real-time Supabase Subscription
  useEffect(() => {
    if (!user || !isLoaded) return;

    const fetchInitial = async () => {
      const { data } = await supabase.from('user_data').select('state').eq('user_id', user.id).single();
      if (data?.state) {
        const parsedRemote = typeof data.state === 'string' ? JSON.parse(data.state) : data.state;
        const { merged, shouldPushRemote } = mergeAppState(stateRef.current, parsedRemote);
        isRemoteUpdate.current = true;
        setState(merged);
        if (shouldPushRemote) {
          try {
            await upsertRemoteState(user.id, merged);
          } catch (e) {
            console.error('Remote merge upsert failed:', e);
          }
        }
      }
    };
    fetchInitial();

    const channel = supabase
      .channel('user_data_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_data',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).state) {
            const newState = (payload.new as any).state;
            const parsedRemote = typeof newState === 'string' ? JSON.parse(newState) : newState;
            const { merged, shouldPushRemote } = mergeAppState(stateRef.current, parsedRemote);
            isRemoteUpdate.current = true;
            setState(merged);
            if (shouldPushRemote) {
              upsertRemoteState(user.id, merged).catch((e) => console.error('Remote merge upsert failed:', e));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isLoaded]);

  // Auto-sync to Supabase
  useEffect(() => {
    if (!isLoaded || !user) return;

    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return; // Skip pushing if the change came from remote
    }

    const timeoutId = setTimeout(async () => {
      try {
        await supabase
          .from('user_data')
          .upsert({ 
            user_id: user.id, 
            state: state,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      } catch (e) {
        console.error('Auto-sync failed:', e);
      }
    }, 1500); // Debounce 1.5s

    return () => clearTimeout(timeoutId);
  }, [state, isLoaded, user]);

  const setEnergyLevel = (level: EnergyLevel, session: SessionType = 'morning') => {
    setState(prev => {
      const today = new Date().toISOString().split('T')[0];
      const existingIndex = prev.energyHistory?.findIndex(r => r.date === today && r.session === session) ?? -1;
      let newHistory = prev.energyHistory ? [...prev.energyHistory] : [];
      
      if (existingIndex >= 0) {
        newHistory[existingIndex] = { date: today, session, level };
      } else {
        newHistory.push({ date: today, session, level });
      }

      return { 
        ...prev, 
        energyLevel: level, 
        lastCheckInDate: new Date().toDateString(),
        lastCheckInSession: session,
        energyHistory: newHistory
      };
    });
  };

  const setMood = (mood: Mood | null) => {
    setState(prev => {
      const todayISO = new Date().toISOString().split('T')[0];
      const moodHistory = Array.isArray(prev.moodHistory) ? [...prev.moodHistory] : [];
      const idx = moodHistory.findIndex(r => r.date === todayISO);
      if (mood) {
        const nextRecord: MoodRecord = { date: todayISO, mood };
        if (idx >= 0) moodHistory[idx] = nextRecord;
        else moodHistory.push(nextRecord);
      }
      return { ...prev, mood, lastMoodDate: todayISO, moodHistory };
    });
  };

  const setApiKeys = (keys: string[]) => setState(prev => ({ ...prev, apiKeys: keys }));
  const setCustomPrompt = (prompt: string) => setState(prev => ({ ...prev, customPrompt: prompt }));
  const setChronotype = (chronotype: Chronotype | null) => setState(prev => ({ ...prev, chronotype, chronotypeUpdatedAt: new Date().toISOString() }));
  const setBackground = (type: 'color' | 'image' | 'video', value: string, isPublic: boolean = false) => setState(prev => ({ ...prev, backgroundType: type, backgroundValue: value, backgroundIsPublic: isPublic }));
  const setBackgroundOverlayOpacity = (opacity: number) => setState(prev => ({ ...prev, backgroundOverlayOpacity: clamp01(opacity, prev.backgroundOverlayOpacity) }));
  const setBackgroundOverlayColor = (color: string) => setState(prev => ({ ...prev, backgroundOverlayColor: normalizeOverlayColor(color, prev.backgroundOverlayColor) }));
  const setMentalHealth = (value: number) => setState(prev => ({ ...prev, mentalHealth: value }));
  const setPointSettings = (settings: { base: number, importantBonus: number, urgentBonus: number }) => setState(prev => ({ ...prev, pointSettings: settings }));
  const setPointGoal = (goal: number) => setState(prev => ({ ...prev, pointGoal: goal }));

  const addList = (name: string) => {
    const newList = { id: uuidv4(), name };
    setState(prev => ({ ...prev, lists: [...prev.lists, newList] }));
    return newList.id;
  };
  const updateList = (id: string, name: string) => setState(prev => ({ ...prev, lists: prev.lists.map(l => l.id === id ? { ...l, name } : l) }));
  const deleteList = (id: string) => setState(prev => ({ ...prev, lists: prev.lists.filter(l => l.id !== id), tasks: prev.tasks.map(t => t.listId === id ? { ...t, listId: null } : t) }));
  
  const clearAllData = () => {
    setState(initialState);
    localStorage.removeItem(STORAGE_KEY);
  };

  const addTasks = (parsedTasks: ParsedTask[]) => {
    const newTasks: Task[] = parsedTasks.map(pt => ({
      title: typeof pt.title === 'string' ? pt.title.trim() || 'Công việc không tên' : 'Công việc không tên',
      deadline: pt.deadline === null ? null : normalizeDeadline(pt.deadline),
      durationMinutes: normalizeDurationForNewTask(pt.durationMinutes, 30),
      isImportant: Boolean(pt.isImportant),
      isUrgent: Boolean(pt.isUrgent),
      isRoutine: Boolean(pt.isRoutine),
      resources: Array.isArray(pt.resources) ? pt.resources.map(r => String(r).trim()).filter(Boolean) : [],
      prerequisiteTaskId: null,
      startAfterPrerequisiteDays: 0,
      id: uuidv4(),
      subtasks: [],
      createdAt: new Date().toISOString(),
      completedAt: null,
      status: 'todo',
    }));
    setState(prev => ({ ...prev, tasks: [...prev.tasks, ...newTasks] }));
  };

  const addManualTask = (seed: Partial<Task> = {}) => {
    const task: Task = {
      id: uuidv4(),
      title: typeof seed.title === 'string' ? seed.title.trim() || 'Công việc không tên' : 'Công việc không tên',
      deadline: seed.deadline === null ? null : normalizeDeadline(seed.deadline ?? null),
      durationMinutes: normalizeDurationForNewTask(seed.durationMinutes, 30),
      isImportant: Boolean(seed.isImportant),
      isUrgent: Boolean(seed.isUrgent),
      isRoutine: Boolean(seed.isRoutine),
      resources: Array.isArray(seed.resources) ? seed.resources.map(r => String(r).trim()).filter(Boolean) : [],
      listId: seed.listId ? String(seed.listId) : null,
      energyRequired: seed.energyRequired as any,
      prerequisiteTaskId: seed.prerequisiteTaskId ? String(seed.prerequisiteTaskId) : null,
      startAfterPrerequisiteDays: Number(seed.startAfterPrerequisiteDays) === 1 ? 1 : 0,
      subtasks: Array.isArray(seed.subtasks) ? seed.subtasks : [],
      createdAt: new Date().toISOString(),
      completedAt: null,
      status: 'todo',
    };
    setState(prev => ({ ...prev, tasks: [...prev.tasks, task] }));
    return task;
  };

  const completeTask = (taskId: string) => {
    setState(prev => {
      const task = prev.tasks.find(t => t.id === taskId);
      if (!task || task.status === 'done') return prev;

      const completedAt = new Date().toISOString();
      const dayISO = completedAt.split('T')[0];
      const ivyToday = prev.dailyTopSix.find(r => r.date === dayISO);
      const isIvy1 = ivyToday?.taskIds?.[0] === taskId;
      const isImportant = Boolean(task.isImportant);

      let pointsEarned = prev.pointSettings.base;
      if (task.isImportant) pointsEarned += prev.pointSettings.importantBonus;
      if (task.isUrgent) pointsEarned += prev.pointSettings.urgentBonus;

      // Bonus points based on mental health and energy level
      if (prev.mentalHealth && prev.mentalHealth < 40) pointsEarned += 5; // Extra reward when mental health is low
      if (prev.energyLevel === 'low') pointsEarned += 5; // Extra reward when energy is low

      let streakHistory = prev.streakHistory;
      if (isImportant || isIvy1) {
        const reason: StreakReason = isImportant && isIvy1 ? 'both' : isImportant ? 'important' : 'ivy1';
        const idx = prev.streakHistory.findIndex(r => r.date === dayISO);
        if (idx >= 0) {
          const current = prev.streakHistory[idx];
          const merged: StreakReason =
            current.reason === reason ? current.reason :
            current.reason === 'both' || reason === 'both' ? 'both' :
            'both';
          streakHistory = prev.streakHistory.map((r, i) => (i === idx ? { ...r, reason: merged } : r));
        } else {
          streakHistory = [...prev.streakHistory, { date: dayISO, reason }];
        }
      }

      return {
        ...prev,
        points: prev.points + pointsEarned,
        streakHistory,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: 'done', completedAt } : t),
      };
    });
  };

  const skipTask = (taskId: string) => {
    setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: 'skipped' } : t) }));
  };

  const resetSkippedTasks = () => {
    setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.status === 'skipped' ? { ...t, status: 'todo' } : t) }));
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const normalized = normalizeTaskPatch(updates);
    setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, ...normalized } : t) }));
  };

  const deleteTask = (taskId: string) => {
    setState(prev => {
      const tasks = prev.tasks
        .filter(t => t.id !== taskId)
        .map(t => (t.prerequisiteTaskId === taskId ? { ...t, prerequisiteTaskId: null, startAfterPrerequisiteDays: 0 as 0 } : t));
      const dailyTopSix = prev.dailyTopSix.map(r => ({ ...r, taskIds: r.taskIds.filter(id => id !== taskId) }));
      return { ...prev, tasks, dailyTopSix };
    });
  };

  const reorderTasks = (sortedTaskIds: string[]) => {
    setState(prev => {
      const now = Date.now();
      const updatedTasks = prev.tasks.map(t => {
        const index = sortedTaskIds.indexOf(t.id);
        if (index !== -1) {
          // The first item should have the newest createdAt
          // so we subtract index from now
          return { ...t, createdAt: new Date(now - index * 1000).toISOString() };
        }
        return t;
      });
      return { ...prev, tasks: updatedTasks };
    });
  };

  const setDailyTopSixForToday = (taskIds: string[]) => {
    setState(prev => {
      const todayISO = new Date().toISOString().split('T')[0];
      const seen = new Set<string>();
      const normalized = taskIds
        .map(x => String(x))
        .filter(Boolean)
        .filter(id => {
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        })
        .slice(0, 6);

      const idx = prev.dailyTopSix.findIndex(r => r.date === todayISO);
      const next: DailyTopSixRecord = { date: todayISO, taskIds: normalized };
      const dailyTopSix = idx >= 0
        ? prev.dailyTopSix.map((r, i) => (i === idx ? next : r))
        : [...prev.dailyTopSix, next];
      return { ...prev, dailyTopSix };
    });
  };

  const clearDailyTopSixForToday = () => setDailyTopSixForToday([]);

  const getDailyTopSixForToday = () => {
    const todayISO = new Date().toISOString().split('T')[0];
    return state.dailyTopSix.find(r => r.date === todayISO) || { date: todayISO, taskIds: [] };
  };

  const getIvyLeeRankForToday = (taskId: string) => {
    const todayISO = new Date().toISOString().split('T')[0];
    const record = state.dailyTopSix.find(r => r.date === todayISO);
    if (!record) return null;
    const idx = record.taskIds.indexOf(taskId);
    return idx >= 0 ? idx + 1 : null;
  };

  const toggleMorningProtocolItem = (itemId: string) => {
    setState(prev => {
      const todayISO = new Date().toISOString().split('T')[0];
      const history = Array.isArray(prev.morningAdherenceHistory) ? [...prev.morningAdherenceHistory] : [];
      const idx = history.findIndex(r => r.date === todayISO);
      const current = idx >= 0 ? history[idx] : { date: todayISO, completed: [] };
      const set = new Set(current.completed);
      if (set.has(itemId)) set.delete(itemId);
      else set.add(itemId);
      const next: MorningAdherenceRecord = { date: todayISO, completed: Array.from(set) };
      if (idx >= 0) history[idx] = next;
      else history.push(next);
      return { ...prev, morningAdherenceHistory: history };
    });
  };

  const getMorningAdherenceForToday = () => {
    const todayISO = new Date().toISOString().split('T')[0];
    return state.morningAdherenceHistory.find(r => r.date === todayISO) || { date: todayISO, completed: [] };
  };

  const upsertWeeklyReview = (payload: Omit<WeeklyReview, 'createdAt'>) => {
    setState(prev => {
      const next: WeeklyReview = {
        ...payload,
        healthPercent: Math.max(0, Math.min(100, payload.healthPercent)),
        mentalPercent: Math.max(0, Math.min(100, payload.mentalPercent)),
        lastWeekNote: payload.lastWeekNote ?? '',
        nextWeekNote: payload.nextWeekNote ?? '',
        createdAt: new Date().toISOString(),
      };
      const idx = prev.weeklyReviews.findIndex(r => r.weekStart === payload.weekStart);
      const weeklyReviews = idx >= 0
        ? prev.weeklyReviews.map((r, i) => (i === idx ? next : r))
        : [...prev.weeklyReviews, next];
      return { ...prev, weeklyReviews };
    });
  };

  const hasWeeklyReviewForCurrentWeek = () => {
    const weekStart = getWeekStartISO();
    return state.weeklyReviews.some(r => r.weekStart === weekStart);
  };

  const getLatestWeeklyReview = () => {
    if (state.weeklyReviews.length === 0) return null;
    const sorted = [...state.weeklyReviews].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
    return sorted[0] || null;
  };

  const getStreakForDate = (dateISO: string) => {
    return state.streakHistory.find(r => r.date === dateISO) || null;
  };

  const getCurrentStreak = () => {
    if (!state.streakHistory || state.streakHistory.length === 0) return 0;
    const set = new Set(state.streakHistory.map(r => r.date));
    let d = new Date();
    d.setHours(0, 0, 0, 0);
    let count = 0;
    while (true) {
      const iso = d.toISOString().split('T')[0];
      if (!set.has(iso)) break;
      count += 1;
      d.setDate(d.getDate() - 1);
    }
    return count;
  };

  const getTopTask = (): Task | null => {
    if (!state.energyLevel) return null;
    const activeTasks = state.tasks.filter(t => t.status === 'todo');
    if (activeTasks.length === 0) return null;

    const isBlocked = (task: Task) => {
      if (!task.prerequisiteTaskId) return false;
      const prereq = state.tasks.find(t => t.id === task.prerequisiteTaskId);
      if (!prereq) return false;
      if (prereq.status !== 'done') return true;
      if (task.startAfterPrerequisiteDays !== 1) return false;
      if (!prereq.completedAt) return false;
      const done = new Date(prereq.completedAt);
      done.setHours(0, 0, 0, 0);
      const available = new Date(done);
      available.setDate(available.getDate() + 1);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return now.getTime() < available.getTime();
    };

    const todayISO = new Date().toISOString().split('T')[0];
    const ivy = state.dailyTopSix.find(r => r.date === todayISO);
    if (ivy && ivy.taskIds.length > 0) {
      for (let i = 0; i < ivy.taskIds.length; i += 1) {
        const id = ivy.taskIds[i];
        const t = activeTasks.find(x => x.id === id);
        if (t && !isBlocked(t)) {
          return { ...t, scoreBreakdown: { ...(t.scoreBreakdown || {}), ivyLeeRank: i + 1 } };
        }
      }
    }

    const scoredTasks = activeTasks.filter(t => !isBlocked(t)).map(task => {
      let score = 0;
      const now = new Date().getTime();
      let chronotypeBonus = 0;
      let chronotypeFit: boolean | undefined = undefined;
      let moodBonus = 0;
      const mood = state.mood ?? null;
      let ivyLeeRank: number | undefined = undefined;
      let overdueHours: number | undefined = undefined;
      
      if (task.deadline) {
        try {
          const d = new Date(task.deadline);
          if (!isNaN(d.getTime())) {
            const deadlineTime = d.getTime();
            const hoursLeft = (deadlineTime - now) / (1000 * 60 * 60);
            if (hoursLeft < 0) {
              overdueHours = Math.round(-hoursLeft);
              const daysOverdue = Math.floor((overdueHours || 0) / 24);
              score += 100 + Math.min(120, daysOverdue * 20);
            }
            else if (hoursLeft < 24) score += 50;
            else if (hoursLeft < 72) score += 20;
          }
        } catch {
          // Ignore invalid dates
        }
      }

      // Eisenhower Matrix
      if (task.isImportant && task.isUrgent) score += 80; // Q1
      else if (task.isImportant && !task.isUrgent) score += 60; // Q2
      else if (!task.isImportant && task.isUrgent) score += 40; // Q3
      else score += 10; // Q4

      // Energy Match
      if (state.energyLevel === 'high') {
        if (task.isImportant) score += 30;
      } else if (state.energyLevel === 'low') {
        if (!task.isImportant && !task.isUrgent) score += 40;
        if (task.isUrgent && !task.isImportant) score += 20;
      }

      if (state.chronotype) {
        const fitNow = getChronotypeFitNow(state.chronotype);
        chronotypeFit = fitNow.fit;
        if (fitNow.fit) chronotypeBonus = task.isImportant ? 25 : 10;
        score += chronotypeBonus;
      }

      if (mood) {
        const title = (task.title || '').toLowerCase();
        const hasAny = (keys: string[]) => keys.some(k => title.includes(k));
        if (mood === 'anxious' || mood === 'sad') {
          if (task.isUrgent || hasAny(['review', 'kiểm', 'check', 'soát', 'audit', 'đối chiếu', 'phân tích', 'analysis', 'tính', 'calc'])) moodBonus += 15;
          if (task.durationMinutes <= 30) moodBonus += 5;
        } else if (mood === 'excited') {
          if (hasAny(['brainstorm', 'design', 'viết', 'write', 'idea', 'ý tưởng', 'sáng tạo', 'meet', 'call', 'gặp', 'trao đổi'])) moodBonus += 15;
          if (task.isImportant && !task.isUrgent) moodBonus += 5;
        } else if (mood === 'angry') {
          if (task.isUrgent) moodBonus += 10;
          if (task.durationMinutes <= 20) moodBonus += 5;
        } else if (mood === 'neutral') {
          moodBonus += 0;
        }
        score += moodBonus;
      }

      if (ivy) {
        const idx = ivy.taskIds.indexOf(task.id);
        if (idx >= 0) ivyLeeRank = idx + 1;
      }

      return { ...task, score, scoreBreakdown: { chronotypeBonus, chronotypeFit, moodBonus, mood, ivyLeeRank, overdueHours } };
    });

    scoredTasks.sort((a, b) => (b.score || 0) - (a.score || 0));
    return scoredTasks[0] || null;
  };

  const syncData = async () => {
    if (!isLoaded) return;
    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsSyncing(false);
        return;
      }

      const userId = session.user.id;
      
      // Fetch remote data
      const { data: remoteData, error: fetchError } = await supabase
        .from('user_data')
        .select('state')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching remote data:', fetchError);
        throw fetchError;
      }

      const parsedRemote = remoteData?.state
        ? (typeof remoteData.state === 'string' ? JSON.parse(remoteData.state) : remoteData.state)
        : null;
      const { merged: mergedState } = mergeAppState(stateRef.current, parsedRemote);
      setState(mergedState);

      // Save merged state back to remote
      const { error: upsertError } = await supabase
        .from('user_data')
        .upsert({ 
          user_id: userId, 
          state: mergedState,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('Error saving to remote:', upsertError);
        throw upsertError;
      }

      alert('Đồng bộ dữ liệu thành công!');
    } catch (e: any) {
      console.error('Sync failed:', e);
      alert('Đồng bộ thất bại: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    ...state,
    isLoaded,
    isSyncing,
    user,
    setEnergyLevel,
    setMood,
    setApiKeys,
    setCustomPrompt,
    setChronotype,
    setBackground,
    setBackgroundOverlayOpacity,
    setBackgroundOverlayColor,
    setMentalHealth,
    setPointSettings,
    setPointGoal,
    addList,
    updateList,
    deleteList,
    clearAllData,
    addTasks,
    addManualTask,
    completeTask,
    skipTask,
    resetSkippedTasks,
    updateTask,
    deleteTask,
    reorderTasks,
    setDailyTopSixForToday,
    clearDailyTopSixForToday,
    getDailyTopSixForToday,
    getIvyLeeRankForToday,
    toggleMorningProtocolItem,
    getMorningAdherenceForToday,
    upsertWeeklyReview,
    hasWeeklyReviewForCurrentWeek,
    getLatestWeeklyReview,
    getStreakForDate,
    getCurrentStreak,
    getTopTask,
    syncData,
  };
}

const StoreContext = createContext<ReturnType<typeof useTaskStoreInternal> | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const store = useTaskStoreInternal();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useTaskStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useTaskStore must be used within a StoreProvider');
  }
  return context;
}
