'use client';

import { useState } from 'react';
import { useTaskStore, Task, SessionType } from '@/lib/store';
import { format, addDays, startOfWeek, isSameDay, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ArrowLeft, Calendar as CalendarIcon, Clock, Zap, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { AnimatePresence } from 'motion/react';
import EditTaskModal from '@/components/EditTaskModal';
import TaskList from '@/components/TaskList';

type ViewMode = 'month' | 'week' | '4day' | 'day';

export default function SchedulePage() {
  const { tasks, updateTask, completeTask, addManualTask } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [showLateNight, setShowLateNight] = useState(false);

  const createTaskAt = (date: Date, hour: number, minute: number = 0) => {
    const d = new Date(date);
    d.setHours(hour, minute, 0, 0);
    const task = addManualTask({ title: 'Công việc mới', deadline: d.toISOString(), durationMinutes: 30 });
    setEditingTask(task);
  };

  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, -1));
    if (viewMode === '4day') setCurrentDate(addDays(currentDate, -4));
    if (viewMode === 'week') setCurrentDate(addDays(currentDate, -7));
    if (viewMode === 'month') {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setCurrentDate(newDate);
    }
  };

  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    if (viewMode === '4day') setCurrentDate(addDays(currentDate, 4));
    if (viewMode === 'week') setCurrentDate(addDays(currentDate, 7));
    if (viewMode === 'month') {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setCurrentDate(newDate);
    }
  };

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
      if (isoString.includes('T')) {
        return format(date, 'HH:mm');
      }
      return 'Cả ngày';
    } catch {
      return '';
    }
  };

  const sessions: { id: SessionType; label: string; start: number; end: number; hidden?: boolean }[] = [
    { id: 'morning', label: 'Sáng', start: 6, end: 12 },
    { id: 'afternoon', label: 'Chiều', start: 12, end: 18 },
    { id: 'evening', label: 'Tối', start: 18, end: 24 },
    { id: 'late_night', label: 'Khuya', start: 0, end: 6, hidden: !showLateNight },
  ];

  const renderDayView = () => {
    const dayTasks = getTasksForDay(currentDate);
    
    return (
      <div className="flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pr-2">
        {sessions.filter(s => !s.hidden).map(session => {
          const inSession = (t: Task) => {
            if (t.isRoutine) return session.id === 'morning';
            if (!t.deadline) return false;
            try {
              const date = parseISO(t.deadline);
              if (!t.deadline.includes('T')) return session.id === 'morning';
              const hour = date.getHours();
              return hour >= session.start && hour < session.end;
            } catch {
              return false;
            }
          };

          const sessionTasks = dayTasks.filter(inSession);
          const hours = Array.from({ length: session.end - session.start }).map((_, i) => session.start + i);

          return (
            <div key={session.id} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                {session.label} ({String(session.start).padStart(2, '0')}:00 - {String(session.end % 24).padStart(2, '0')}:00)
              </h3>
              <div className="space-y-2">
                {hours.map(h => {
                  const hourTasks = sessionTasks.filter(t => {
                    if (!t.deadline || !t.deadline.includes('T')) return false;
                    try {
                      return parseISO(t.deadline).getHours() === h;
                    } catch {
                      return false;
                    }
                  });

                  return (
                    <div
                      key={h}
                      onClick={() => createTaskAt(currentDate, h, 0)}
                      className="cursor-pointer p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/40 hover:border-indigo-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-zinc-500 font-medium w-14">
                          {String(h).padStart(2, '0')}:00
                        </div>
                        <div className="flex-1 min-w-0">
                          {hourTasks.length > 0 ? (
                            <div className="space-y-2">
                              {hourTasks.map(task => (
                                <div key={task.id} onClick={(e) => { e.stopPropagation(); setEditingTask(task); }} className="p-2 bg-zinc-900/60 rounded-lg border border-zinc-800/80 hover:border-indigo-500/50 transition-colors">
                                  <div className="flex items-center justify-between gap-3">
                                    <span className={`text-sm truncate ${task.status === 'done' ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                                      {task.title}
                                    </span>
                                    {task.status === 'todo' && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); completeTask(task.id); }}
                                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                      </button>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    {task.isImportant && <Star className="w-3 h-3 text-amber-500" />}
                                    {task.isUrgent && <Zap className="w-3 h-3 text-rose-500" />}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-zinc-500 italic">Trống • click để thêm</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {sessionTasks.filter(t => !t.deadline || !t.deadline.includes('T')).length > 0 && session.id === 'morning' && (
                  <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
                    <div className="text-xs text-zinc-500 font-medium mb-2">Cả ngày</div>
                    <div className="space-y-2">
                      {sessionTasks.filter(t => !t.deadline || !t.deadline.includes('T')).map(task => (
                        <div key={task.id} onClick={() => setEditingTask(task)} className="cursor-pointer p-2 bg-zinc-950/60 rounded-lg border border-zinc-800 hover:border-indigo-500/50 transition-colors">
                          <span className={`text-sm ${task.status === 'done' ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>{task.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const render4DayView = () => {
    const days = Array.from({ length: 4 }).map((_, i) => addDays(currentDate, i));

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-full overflow-y-auto custom-scrollbar pr-2">
        {days.map((day, i) => {
          const dayTasks = getTasksForDay(day);
          const isToday = isSameDay(day, new Date());
          return (
            <div key={i} className={`bg-zinc-900/50 border rounded-2xl p-4 flex flex-col ${isToday ? 'border-indigo-500/50' : 'border-zinc-800/50'}`}>
              <h3 className={`text-sm font-medium mb-3 text-center pb-2 border-b border-zinc-800 ${isToday ? 'text-indigo-400' : 'text-zinc-300'}`}>
                {format(day, 'EEEE, d MMM', { locale: vi })}
              </h3>
              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                {sessions.filter(s => !s.hidden).map(s => {
                  const sessionTasks = dayTasks.filter(t => {
                    if (t.isRoutine) return s.id === 'morning';
                    if (!t.deadline) return false;
                    try {
                      const date = parseISO(t.deadline);
                      if (!t.deadline.includes('T')) return s.id === 'morning';
                      const hour = date.getHours();
                      return hour >= s.start && hour < s.end;
                    } catch {
                      return false;
                    }
                  });

                  return (
                    <div key={s.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-zinc-400">{s.label}</div>
                        <button
                          onClick={() => createTaskAt(day, s.start, 0)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          + Thêm
                        </button>
                      </div>
                      {sessionTasks.length > 0 ? (
                        <div className="space-y-2">
                          {sessionTasks.map(task => (
                            <div key={task.id} onClick={() => setEditingTask(task)} className="cursor-pointer p-2 bg-zinc-900/60 rounded-lg text-xs hover:border-indigo-500/50 border border-zinc-800 transition-colors">
                              <div className="flex items-center justify-between gap-2">
                                <span className={task.status === 'done' ? 'line-through text-zinc-500' : 'text-zinc-200'}>
                                  {task.title}
                                </span>
                                <span className="text-[10px] text-zinc-500">{formatTime(task.deadline)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-zinc-600 italic">Trống</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 h-full overflow-y-auto custom-scrollbar pr-2">
        {weekDays.map((day, index) => {
          const dayTasks = getTasksForDay(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div 
              key={index} 
              className={`flex flex-col bg-zinc-900/50 border rounded-2xl overflow-hidden min-h-[400px] ${
                isToday ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : 'border-zinc-800'
              }`}
            >
              <div className={`p-3 text-center border-b ${isToday ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-zinc-900 border-zinc-800'}`}>
                <div className={`text-xs font-medium uppercase tracking-wider ${isToday ? 'text-indigo-400' : 'text-zinc-500'}`}>
                  {format(day, 'EEEE', { locale: vi })}
                </div>
                <div className={`text-2xl font-light mt-1 ${isToday ? 'text-indigo-300' : 'text-zinc-300'}`}>
                  {format(day, 'd')}
                </div>
              </div>
              
              <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                {sessions.filter(s => !s.hidden).map(s => {
                  const sessionTasks = dayTasks.filter(t => {
                    if (t.isRoutine) return s.id === 'morning';
                    if (!t.deadline) return false;
                    try {
                      const date = parseISO(t.deadline);
                      if (!t.deadline.includes('T')) return s.id === 'morning';
                      const hour = date.getHours();
                      return hour >= s.start && hour < s.end;
                    } catch {
                      return false;
                    }
                  });

                  return (
                    <div key={s.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] font-medium text-zinc-500">{s.label}</div>
                        <button
                          onClick={() => createTaskAt(day, s.start, 0)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          + Thêm
                        </button>
                      </div>
                      {sessionTasks.length > 0 ? (
                        <div className="space-y-2">
                          {sessionTasks.map(task => (
                            <div
                              key={task.id}
                              onClick={() => setEditingTask(task)}
                              className={`p-2 rounded-lg text-xs cursor-pointer border transition-colors hover:border-indigo-500/50 ${
                                task.status === 'done' ? 'bg-zinc-900 border-zinc-800 opacity-50' :
                                task.isImportant ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' :
                                task.isRoutine ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' :
                                'bg-zinc-900 border-zinc-800 text-zinc-300'
                              }`}
                            >
                              <div className="font-medium line-clamp-2">{task.title}</div>
                              {formatTime(task.deadline) && (
                                <div className="mt-1 text-[10px] text-zinc-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(task.deadline)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10px] text-zinc-600 italic">Trống</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = addDays(startDate, 41); // 6 weeks to cover all possibilities
    
    const days = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return (
      <div className="h-full flex flex-col">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-zinc-500 py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 flex-1 overflow-y-auto custom-scrollbar pr-1">
          {days.map((day, i) => {
            const dayTasks = getTasksForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            
            return (
              <div key={i} className={`bg-zinc-900/50 border rounded-lg p-1.5 flex flex-col min-h-[80px] ${isToday ? 'border-indigo-500/50' : 'border-zinc-800/50'} ${!isCurrentMonth ? 'opacity-40' : ''}`}>
                <span className={`text-xs font-medium mb-1 ${isToday ? 'text-indigo-400' : 'text-zinc-400'}`}>
                  {day.getDate()}
                </span>
                <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
                  {dayTasks.slice(0, 3).map(task => (
                    <div key={task.id} onClick={() => setEditingTask(task)} className={`text-[10px] truncate px-1 rounded cursor-pointer ${task.status === 'done' ? 'bg-zinc-800 text-zinc-500 line-through' : task.isImportant ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800 text-zinc-300'}`} title={task.title}>
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-[9px] text-center text-zinc-500">+{dayTasks.length - 3}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
            Lịch trình
          </h1>
        </div>
        
        <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-xl">
          {(['day', '4day', 'week', 'month'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewMode === mode ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              {mode === 'day' ? 'Ngày' : mode === '4day' ? '4 Ngày' : mode === 'week' ? 'Tuần' : 'Tháng'}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left: Quick View Sidebar */}
        <div className="w-80 border-r border-zinc-800/50 bg-zinc-950/30 p-4 hidden lg:flex flex-col">
          <h2 className="text-sm font-medium text-zinc-300 mb-4">Danh sách nhanh</h2>
          <div className="flex-1 overflow-hidden">
            <TaskList onEditTask={setEditingTask} onAddManual={() => createTaskAt(currentDate, 9, 0)} onCompleteTask={completeTask} hideFilters />
          </div>
        </div>

        {/* Right: Calendar View */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-zinc-100 capitalize">
              {viewMode === 'day' && format(currentDate, 'EEEE, d MMMM, yyyy', { locale: vi })}
              {viewMode === '4day' && `${format(currentDate, 'd MMM', { locale: vi })} - ${format(addDays(currentDate, 3), 'd MMM', { locale: vi })}`}
              {viewMode === 'week' && `Tuần ${format(currentDate, 'd MMM', { locale: vi })}`}
              {viewMode === 'month' && format(currentDate, 'MMMM, yyyy', { locale: vi })}
            </h2>
            <div className="flex items-center gap-2">
              {viewMode !== 'month' && (
                <button
                  onClick={() => setShowLateNight(v => !v)}
                  className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-medium transition-colors"
                >
                  Khuya: {showLateNight ? 'Hiện' : 'Ẩn'}
                </button>
              )}
              <button onClick={handlePrev} className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-medium transition-colors">
                Hôm nay
              </button>
              <button onClick={handleNext} className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {viewMode === 'day' && renderDayView()}
            {viewMode === '4day' && render4DayView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'month' && renderMonthView()}
          </div>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {editingTask && (
          <EditTaskModal
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onSave={(taskId, updatedTask) => {
              updateTask(taskId, updatedTask);
              setEditingTask(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
