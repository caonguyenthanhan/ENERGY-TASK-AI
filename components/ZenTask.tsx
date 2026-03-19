'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Play, Pause, RotateCcw, SplitSquareHorizontal, Loader2 } from 'lucide-react';
import { Task } from '@/lib/store';
import { breakDownTaskWithAI } from '@/lib/ai';

interface Props {
  task: Task;
  onComplete: (taskId: string) => void;
  onSkip: (taskId: string) => void;
}

export default function ZenTask({ task, onComplete, onSkip }: Props) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins
  const [isActive, setIsActive] = useState(false);
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [subTasks, setSubTasks] = useState<string[]>([]);

  // Reset timer when task changes
  useEffect(() => {
    setTimeLeft(25 * 60);
    setIsActive(false);
    setSubTasks([]);
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
      const steps = await breakDownTaskWithAI(task.title);
      setSubTasks(steps);
    } catch (error) {
      console.error(error);
    } finally {
      setIsBreakingDown(false);
    }
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
      className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-3xl mx-auto"
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
          <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-sm font-medium">
            {task.difficulty === 'hard' ? 'Khó' : task.difficulty === 'medium' ? 'Vừa' : 'Dễ'}
          </span>
          <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-sm font-medium">
            {task.emotion === 'boring' ? 'Chán' : task.emotion === 'fun' ? 'Thích' : 'Bình thường'}
          </span>
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

        {task.difficulty === 'hard' && subTasks.length === 0 && (
          <button
            onClick={handleBreakDown}
            disabled={isBreakingDown}
            className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-medium transition-colors disabled:opacity-50"
          >
            {isBreakingDown ? <Loader2 className="w-5 h-5 animate-spin" /> : <SplitSquareHorizontal className="w-5 h-5" />}
            Chia nhỏ việc
          </button>
        )}
      </div>

      {/* Subtasks */}
      <AnimatePresence>
        {subTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="w-full max-w-xl mt-12 p-6 rounded-2xl bg-zinc-900 border border-zinc-800"
          >
            <h4 className="text-zinc-300 font-medium mb-4 flex items-center gap-2">
              <SplitSquareHorizontal className="w-4 h-4 text-indigo-400" />
              Gợi ý chia nhỏ (15 phút mỗi bước):
            </h4>
            <ul className="space-y-3">
              {subTasks.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3 text-zinc-400 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                  <span className="mt-0.5">{step}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
