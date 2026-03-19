'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ParsedTask } from './ai';
import { supabase } from './supabase';

export type EnergyLevel = 'high' | 'normal' | 'low';

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
  subtasks: Subtask[];
  createdAt: string;
  completedAt: string | null;
  status: 'todo' | 'done' | 'skipped';
  score?: number;
};

type AppState = {
  tasks: Task[];
  energyLevel: EnergyLevel | null;
  lastCheckInDate: string | null;
  points: number;
  apiKeys: string[];
  customPrompt: string;
};

const STORAGE_KEY = 'energy_task_ai_state_v2';

const initialState: AppState = {
  tasks: [],
  energyLevel: null,
  lastCheckInDate: null,
  points: 0,
  apiKeys: [],
  customPrompt: '',
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
            if (parsed.lastCheckInDate !== today) {
              parsed.energyLevel = null;
            }
            // Ensure arrays exist for older versions
            parsed.apiKeys = Array.isArray(parsed.apiKeys) ? parsed.apiKeys : [];
            parsed.customPrompt = typeof parsed.customPrompt === 'string' ? parsed.customPrompt : '';
            parsed.tasks = Array.isArray(parsed.tasks) ? parsed.tasks.map((t: any) => ({
              ...t,
              subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
              isImportant: t.isImportant ?? false,
              isUrgent: t.isUrgent ?? false,
            })) : [];
            
            // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const setEnergyLevel = (level: EnergyLevel) => {
    setState(prev => ({ ...prev, energyLevel: level, lastCheckInDate: new Date().toDateString() }));
  };

  const setApiKeys = (keys: string[]) => setState(prev => ({ ...prev, apiKeys: keys }));
  const setCustomPrompt = (prompt: string) => setState(prev => ({ ...prev, customPrompt: prompt }));
  
  const clearAllData = () => {
    setState(initialState);
    localStorage.removeItem(STORAGE_KEY);
  };

  const addTasks = (parsedTasks: ParsedTask[]) => {
    const newTasks: Task[] = parsedTasks.map(pt => ({
      ...pt,
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
      let pointsEarned = 10;
      if (task?.isImportant) pointsEarned += 20;
      if (task?.isUrgent) pointsEarned += 10;

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
    setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t) }));
  };

  const getTopTask = (): Task | null => {
    if (!state.energyLevel) return null;
    const activeTasks = state.tasks.filter(t => t.status === 'todo');
    if (activeTasks.length === 0) return null;

    const scoredTasks = activeTasks.map(task => {
      let score = 0;
      const now = new Date().getTime();
      
      if (task.deadline) {
        const deadlineTime = new Date(task.deadline).getTime();
        const hoursLeft = (deadlineTime - now) / (1000 * 60 * 60);
        if (hoursLeft < 0) score += 100;
        else if (hoursLeft < 24) score += 50;
        else if (hoursLeft < 72) score += 20;
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

      return { ...task, score };
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
    clearAllData,
    addTasks,
    completeTask,
    skipTask,
    resetSkippedTasks,
    updateTask,
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
