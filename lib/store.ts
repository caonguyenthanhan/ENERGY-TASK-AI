import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ParsedTask } from './ai';

export type EnergyLevel = 'high' | 'normal' | 'low';

export type Task = ParsedTask & {
  id: string;
  createdAt: string;
  completedAt: string | null;
  status: 'todo' | 'done' | 'skipped';
  score?: number; // Calculated dynamically
};

type AppState = {
  tasks: Task[];
  energyLevel: EnergyLevel | null;
  lastCheckInDate: string | null;
  points: number;
};

const STORAGE_KEY = 'energy_task_ai_state';

const initialState: AppState = {
  tasks: [],
  energyLevel: null,
  lastCheckInDate: null,
  points: 0,
};

export function useTaskStore() {
  const [state, setState] = useState<AppState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // Reset energy if it's a new day
        const today = new Date().toDateString();
        if (parsed.lastCheckInDate !== today) {
          parsed.energyLevel = null;
        }
        
        // eslint-disable-next-line
        setState(parsed);
      } catch (e) {
        console.error('Failed to parse state', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const setEnergyLevel = (level: EnergyLevel) => {
    setState(prev => ({
      ...prev,
      energyLevel: level,
      lastCheckInDate: new Date().toDateString(),
    }));
  };

  const addTasks = (parsedTasks: ParsedTask[]) => {
    const newTasks: Task[] = parsedTasks.map(pt => ({
      ...pt,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      completedAt: null,
      status: 'todo',
    }));

    setState(prev => ({
      ...prev,
      tasks: [...prev.tasks, ...newTasks],
    }));
  };

  const completeTask = (taskId: string) => {
    setState(prev => {
      const task = prev.tasks.find(t => t.id === taskId);
      let pointsEarned = 10;
      
      // Bonus points for boring/hard tasks
      if (task?.emotion === 'boring') pointsEarned += 20;
      if (task?.difficulty === 'hard') pointsEarned += 20;

      return {
        ...prev,
        points: prev.points + pointsEarned,
        tasks: prev.tasks.map(t => 
          t.id === taskId 
            ? { ...t, status: 'done', completedAt: new Date().toISOString() } 
            : t
        ),
      };
    });
  };

  const skipTask = (taskId: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => 
        t.id === taskId ? { ...t, status: 'skipped' } : t
      ),
    }));
  };

  const resetSkippedTasks = () => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => 
        t.status === 'skipped' ? { ...t, status: 'todo' } : t
      ),
    }));
  };

  const getTopTask = (): Task | null => {
    if (!state.energyLevel) return null;

    const activeTasks = state.tasks.filter(t => t.status === 'todo');
    if (activeTasks.length === 0) return null;

    // Scoring Algorithm
    const scoredTasks = activeTasks.map(task => {
      let score = 0;
      const now = new Date().getTime();
      
      // 1. Deadline Factor
      if (task.deadline) {
        const deadlineTime = new Date(task.deadline).getTime();
        const hoursLeft = (deadlineTime - now) / (1000 * 60 * 60);
        
        if (hoursLeft < 0) score += 100; // Overdue!
        else if (hoursLeft < 24) score += 50; // Due today
        else if (hoursLeft < 72) score += 20; // Due soon
      }

      // 2. Energy & Emotion Match
      if (state.energyLevel === 'high') {
        // Eat the frog: Prioritize hard/boring tasks
        if (task.difficulty === 'hard') score += 30;
        if (task.emotion === 'boring') score += 30;
        if (task.emotion === 'fun') score -= 10;
      } else if (state.energyLevel === 'low') {
        // Build momentum: Prioritize easy/fun tasks OR punish hard tasks
        if (task.difficulty === 'hard') score -= 30;
        if (task.emotion === 'boring') score -= 20;
        if (task.emotion === 'fun') score += 40;
        if (task.difficulty === 'easy') score += 30;
      } else {
        // Normal energy: Balanced
        if (task.difficulty === 'medium') score += 10;
      }

      return { ...task, score };
    });

    // Sort by score descending
    scoredTasks.sort((a, b) => (b.score || 0) - (a.score || 0));

    return scoredTasks[0] || null;
  };

  return {
    ...state,
    isLoaded,
    setEnergyLevel,
    addTasks,
    completeTask,
    skipTask,
    resetSkippedTasks,
    getTopTask,
  };
}
