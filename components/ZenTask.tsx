'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { v4 as uuidv4 } from 'uuid';
import { CheckCircle2, XCircle, Play, Pause, RotateCcw, SplitSquareHorizontal, Loader2, Plus, Check, Circle, Sparkles } from 'lucide-react';
import { Task, useTaskStore } from '@/lib/store';
import { breakDownTaskWithAI } from '@/lib/ai';

interface Props {
  task: Task;
  onComplete: (taskId: string) => void;
  onSkip: (taskId: string) => void;
}

export default function ZenTask({ task, onComplete, onSkip }: Props) {
  const { apiKeys, customPrompt, tasks: allTasks, updateTask } = useTaskStore();
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins
  const [isActive, setIsActive] = useState(false);
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');

  // Reset timer when task changes
  useEffect(() => {
    setTimeLeft(25 * 60);
    setIsActive(false);
  }, [task.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play sound or notify
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const handleComplete = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#3B82F6', '#F59E0B']
    });
    onComplete(task.id);
  };

  const handleBreakDown = async () => {
    setIsBreakingDown(true);
    try {
      const steps = await breakDownTaskWithAI(task.title, apiKeys, customPrompt, allTasks);
      const newSubtasks = steps.map(s => ({ id: uuidv4(), title: s, isCompleted: false }));
      updateTask(task.id, { subtasks: [...(task.subtasks || []), ...newSubtasks] });
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Lỗi khi chia nhỏ công việc.");
    } finally {
      setIsBreakingDown(false);
    }
  };

  const handleAddManualSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    const sub = { id: uuidv4(), title: newSubtask, isCompleted: false };
    updateTask(task.id, { subtasks: [...(task.subtasks || []), sub] });
    setNewSubtask('');
  };

  const toggleSubtask = (subId: string) => {
    const updated = task.subtasks.map(s => s.id === subId ? { ...s, isCompleted: !s.isCompleted } : s);
    updateTask(task.id, { subtasks: updated });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="flex flex-col items-center justify-center h-full min-h-[400px] w-full max-w-2xl mx-auto py-8"
    >
      <div className="text-center mb-12">
        <h3 className="text-sm font-medium tracking-widest text-zinc-500 uppercase mb-4">
          Nhiệm vụ hiện tại của bạn
        </h3>
        <h1 className="text-4xl md:text-5xl font-bold text-zinc-100 tracking-tight leading-tight">
          {task.title}
        </h1>
        
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {task.deadline && (
            <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-sm font-medium">
              Hạn: {new Date(task.deadline).toLocaleDateString('vi-VN')}
            </span>
          )}
          <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-sm font-medium">
            {task.durationMinutes} phút
          </span>
          {task.isImportant && (
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-sm font-medium">
              Quan trọng
            </span>
          )}
          {task.isUrgent && (
            <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-sm font-medium">
              Gấp
            </span>
          )}
        </div>
      </div>

      {/* Timer */}
      <div className="flex flex-col items-center mb-12">
        <div className="text-7xl font-mono font-light text-zinc-100 mb-6 tracking-tighter">
          {formatTime(timeLeft)}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTimer}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </button>
          <button
            onClick={resetTimer}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-4 w-full">
        <button
          onClick={handleComplete}
          className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold transition-colors"
        >
          <CheckCircle2 className="w-5 h-5" />
          Hoàn thành
        </button>

        <button
          onClick={() => onSkip(task.id)}
          className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
        >
          <XCircle className="w-5 h-5" />
          Bỏ qua
        </button>

        {(!task.subtasks || task.subtasks.length === 0) && (
          <button
            onClick={handleBreakDown}
            disabled={isBreakingDown}
            className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-medium transition-colors disabled:opacity-50"
          >
            {isBreakingDown ? <Loader2 className="w-5 h-5 animate-spin" /> : <SplitSquareHorizontal className="w-5 h-5" />}
            AI Chia nhỏ
          </button>
        )}
      </div>

      {/* Subtasks */}
      <div className="w-full max-w-xl mt-12">
        <h4 className="text-zinc-300 font-medium mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <SplitSquareHorizontal className="w-4 h-4 text-indigo-400" />
            Các bước thực hiện:
          </span>
          {task.subtasks?.length > 0 && (
            <button
              onClick={handleBreakDown}
              disabled={isBreakingDown}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              {isBreakingDown ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              AI Thêm bước
            </button>
          )}
        </h4>
        
        <ul className="space-y-2 mb-4">
          <AnimatePresence>
            {task.subtasks?.map((step) => (
              <motion.li 
                key={step.id} 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-3 text-sm p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                onClick={() => toggleSubtask(step.id)}
              >
                <button className={`mt-0.5 flex-shrink-0 ${step.isCompleted ? 'text-emerald-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  {step.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>
                <span className={`mt-0.5 ${step.isCompleted ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                  {step.title}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <form onSubmit={handleAddManualSubtask} className="relative">
          <input
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            placeholder="Thêm bước nhỏ thủ công..."
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-4 pr-12 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          <button
            type="submit"
            disabled={!newSubtask.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}
