'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ParsedTask } from './ai';
import { supabase } from './supabase';

export type EnergyLevel = 'high' | 'normal' | 'low';

export type Chronotype = 'lion' | 'bear' | 'wolf' | 'dolphin';

export type Subtask = {
  id: string;
  title: string;
  isCompleted: boolean;
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
  subtasks: Subtask[];
  createdAt: string;
  completedAt: string | null;
  status: 'todo' | 'done' | 'skipped';
  score?: number;
  scoreBreakdown?: {
    chronotypeBonus?: number;
    chronotypeFit?: boolean;
  };
  timerStatus?: 'idle' | 'running' | 'paused';
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
  points: number;
  pointGoal: number;
  pointSettings: { base: number, importantBonus: number, urgentBonus: number };
  apiKeys: string[];
  customPrompt: string;
  chronotype: Chronotype | null;
  chronotypeUpdatedAt: string | null;
  backgroundType?: 'color' | 'image' | 'video';
  backgroundValue?: string;
  backgroundIsPublic?: boolean;
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
  points: 0,
  pointGoal: 100,
  pointSettings: { base: 10, importantBonus: 20, urgentBonus: 10 },
  apiKeys: [],
  customPrompt: '',
  chronotype: null,
  chronotypeUpdatedAt: null,
  backgroundType: 'color',
  backgroundValue: '#f3f4f6', // Tailwind gray-100
  backgroundIsPublic: false,
  mentalHealth: 50,
};

function useTaskStoreInternal() {
  const [state, setState] = useState<AppState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const isRemoteUpdate = React.useRef(false);

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
    if (!user) return;

    const fetchInitial = async () => {
      const { data } = await supabase.from('user_data').select('state').eq('user_id', user.id).single();
      if (data?.state) {
        isRemoteUpdate.current = true;
        const parsedRemote = typeof data.state === 'string' ? JSON.parse(data.state) : data.state;
        setState(prev => ({ ...prev, ...parsedRemote }));
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
            isRemoteUpdate.current = true;
            const newState = (payload.new as any).state;
            const parsedRemote = typeof newState === 'string' ? JSON.parse(newState) : newState;
            setState(prev => ({ ...prev, ...parsedRemote }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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

  const setApiKeys = (keys: string[]) => setState(prev => ({ ...prev, apiKeys: keys }));
  const setCustomPrompt = (prompt: string) => setState(prev => ({ ...prev, customPrompt: prompt }));
  const setChronotype = (chronotype: Chronotype | null) => setState(prev => ({ ...prev, chronotype, chronotypeUpdatedAt: new Date().toISOString() }));
  const setBackground = (type: 'color' | 'image' | 'video', value: string, isPublic: boolean = false) => setState(prev => ({ ...prev, backgroundType: type, backgroundValue: value, backgroundIsPublic: isPublic }));
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
      id: uuidv4(),
      subtasks: [],
      createdAt: new Date().toISOString(),
      completedAt: null,
      status: 'todo',
    }));
    setState(prev => ({ ...prev, tasks: [...prev.tasks, ...newTasks] }));
  };

  const completeTask = (taskId: string) => {
    setState(prev => {
      const task = prev.tasks.find(t => t.id === taskId);
      if (!task || task.status === 'done') return prev;

      let pointsEarned = prev.pointSettings.base;
      if (task.isImportant) pointsEarned += prev.pointSettings.importantBonus;
      if (task.isUrgent) pointsEarned += prev.pointSettings.urgentBonus;

      // Bonus points based on mental health and energy level
      if (prev.mentalHealth && prev.mentalHealth < 40) pointsEarned += 5; // Extra reward when mental health is low
      if (prev.energyLevel === 'low') pointsEarned += 5; // Extra reward when energy is low

      return {
        ...prev,
        points: prev.points + pointsEarned,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: 'done', completedAt: new Date().toISOString() } : t),
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

  const getTopTask = (): Task | null => {
    if (!state.energyLevel) return null;
    const activeTasks = state.tasks.filter(t => t.status === 'todo');
    if (activeTasks.length === 0) return null;

    const scoredTasks = activeTasks.map(task => {
      let score = 0;
      const now = new Date().getTime();
      let chronotypeBonus = 0;
      let chronotypeFit: boolean | undefined = undefined;
      
      if (task.deadline) {
        try {
          const d = new Date(task.deadline);
          if (!isNaN(d.getTime())) {
            const deadlineTime = d.getTime();
            const hoursLeft = (deadlineTime - now) / (1000 * 60 * 60);
            if (hoursLeft < 0) score += 100;
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

      return { ...task, score, scoreBreakdown: { chronotypeBonus, chronotypeFit } };
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

      let mergedState = { ...state };

      if (remoteData?.state) {
        // Simple merge: remote takes precedence for now, or we can just use remote if it's newer
        // For simplicity, we'll just overwrite local state with remote if remote exists
        // A better approach would be to merge tasks by ID, but this works for a basic sync
        const parsedRemote = typeof remoteData.state === 'string' ? JSON.parse(remoteData.state) : remoteData.state;
        mergedState = { ...mergedState, ...parsedRemote };
        setState(mergedState);
      }

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
    setEnergyLevel,
    setApiKeys,
    setCustomPrompt,
    setChronotype,
    setBackground,
    setMentalHealth,
    setPointSettings,
    setPointGoal,
    addList,
    updateList,
    deleteList,
    clearAllData,
    addTasks,
    completeTask,
    skipTask,
    resetSkippedTasks,
    updateTask,
    reorderTasks,
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
