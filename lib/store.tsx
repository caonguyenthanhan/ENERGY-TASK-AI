'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ParsedTask } from './ai';

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

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const today = new Date().toDateString();
        if (parsed.lastCheckInDate !== today) {
          parsed.energyLevel = null;
        }
        // Ensure arrays exist for older versions
        parsed.apiKeys = parsed.apiKeys || [];
        parsed.customPrompt = parsed.customPrompt || '';
        parsed.tasks = (parsed.tasks || []).map((t: any) => ({
          ...t,
          subtasks: t.subtasks || [],
          isImportant: t.isImportant ?? false,
          isUrgent: t.isUrgent ?? false,
        }));
        
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState(parsed);
      } catch (e) {
        console.error('Failed to parse state', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

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

  return {
    ...state,
    isLoaded,
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
