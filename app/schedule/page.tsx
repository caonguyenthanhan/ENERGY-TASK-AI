'use client';

import { useState } from 'react';
import { useTaskStore, Task } from '@/lib/store';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ArrowLeft, Calendar as CalendarIcon, Clock, AlertCircle, Zap, RefreshCw, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { AnimatePresence } from 'motion/react';
import EditTaskModal from '@/components/EditTaskModal';

export default function SchedulePage() {
  const { tasks, updateTask } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => {
      if (task.isRoutine) return true; // Routine tasks show up every day
      if (!task.deadline) return false;
      try {
        const taskDate = parseISO(task.deadline);
        return isSameDay(taskDate, date);
      } catch {
        return false;
      }
    }).sort((a, b) => {
      // Sort by time if available, then by importance
      if (a.deadline && b.deadline) {
        return parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime();
      }
      return (b.isImportant ? 1 : 0) - (a.isImportant ? 1 : 0);
    });
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '';
    try {
      const date = parseISO(isoString);
      // Check if it has time component (not just YYYY-MM-DD)
      if (isoString.includes('T')) {
        return format(date, 'HH:mm');
      }
      return 'Cả ngày';
    } catch {
      return '';
    }
  };

  return (
    <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-500" />
              Thời khóa biểu
            </h1>
            <p className="text-xs text-zinc-500">Lịch trình công việc trong tuần</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentDate(addDays(currentDate, -7))}
            className="px-3 py-1.5 text-sm bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800"
          >
            Tuần trước
          </button>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-sm bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800"
          >
            Hôm nay
          </button>
          <button 
            onClick={() => setCurrentDate(addDays(currentDate, 7))}
            className="px-3 py-1.5 text-sm bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800"
          >
            Tuần sau
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dayTasks = getTasksForDay(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div 
              key={index} 
              className={`flex flex-col bg-zinc-900/50 border rounded-2xl overflow-hidden min-h-[400px] ${
                isToday ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'border-zinc-800'
              }`}
            >
              <div className={`p-3 text-center border-b ${isToday ? 'bg-emerald-500/10 border-emerald-500/20' : 'border-zinc-800'}`}>
                <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  {format(day, 'EEEE', { locale: vi })}
                </div>
                <div className={`text-xl font-semibold mt-1 ${isToday ? 'text-emerald-400' : 'text-zinc-200'}`}>
                  {format(day, 'dd/MM')}
                </div>
              </div>
              
              <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto">
                {dayTasks.length === 0 ? (
                  <div className="text-center text-zinc-600 text-xs py-4">Trống</div>
                ) : (
                  dayTasks.map(task => (
                    <div 
                      key={task.id} 
                      onClick={() => setEditingTask(task)}
                      className={`p-2 rounded-xl border text-sm flex flex-col gap-1 cursor-pointer transition-colors hover:bg-zinc-800 ${
                        task.status === 'done' ? 'bg-zinc-900/30 border-zinc-800/50 opacity-50' :
                        task.isRoutine ? 'bg-blue-500/10 border-blue-500/20' :
                        task.isImportant && task.isUrgent ? 'bg-rose-500/10 border-rose-500/20' :
                        'bg-zinc-800/50 border-zinc-700/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`font-medium line-clamp-2 ${task.status === 'done' ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                          {task.title}
                        </span>
                        <div className="flex items-center gap-1 shrink-0 mt-0.5">
                          {task.resources && task.resources.length > 0 && <LinkIcon className="w-3 h-3 text-indigo-400" />}
                          {task.isRoutine && <RefreshCw className="w-3 h-3 text-blue-400" />}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                        {task.deadline && !task.isRoutine && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(task.deadline)}
                          </span>
                        )}
                        {task.durationMinutes > 0 && (
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {task.durationMinutes}p
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {editingTask && (
          <EditTaskModal
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onSave={updateTask}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
