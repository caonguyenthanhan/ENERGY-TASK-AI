'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Trophy, RefreshCw, Settings } from 'lucide-react';
import { useTaskStore, Task } from '@/lib/store';
import EnergyCheckIn from '@/components/EnergyCheckIn';
import ZenTask from '@/components/ZenTask';
import BrainDumpInput from '@/components/BrainDumpInput';
import EditTaskModal from '@/components/EditTaskModal';
import SettingsModal from '@/components/SettingsModal';

export default function Home() {
  const {
    isLoaded,
    energyLevel,
    setEnergyLevel,
    addTasks,
    completeTask,
    skipTask,
    resetSkippedTasks,
    getTopTask,
    points,
    tasks,
    updateTask,
  } = useTaskStore();

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Zap className="w-8 h-8 text-indigo-500" />
          <p className="text-zinc-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const topTask = getTopTask();
  const skippedTasksCount = tasks.filter(t => t.status === 'skipped').length;

  return (
    <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Energy-Task AI</h1>
            <p className="text-xs text-zinc-500">Quản lý kỷ luật nhưng thấu hiểu</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-zinc-300">{points} điểm</span>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
            title="Cài đặt"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Focus Area & Input */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col justify-center min-h-[400px] bg-zinc-900/20 border border-zinc-800/50 rounded-3xl p-6 sm:p-10 relative">
            <AnimatePresence mode="wait">
              {!energyLevel ? (
                <EnergyCheckIn key="energy" onSelect={setEnergyLevel} />
              ) : topTask ? (
                <ZenTask
                  key="zen"
                  task={topTask}
                  onComplete={completeTask}
                  onSkip={skipTask}
                />
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20"
                >
                  <div className="w-20 h-20 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                    <Trophy className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h2 className="text-3xl font-semibold text-zinc-100 mb-4">Tuyệt vời!</h2>
                  <p className="text-zinc-400 max-w-md mx-auto">
                    Bạn đã hoàn thành tất cả các công việc quan trọng. Hãy nghỉ ngơi hoặc thêm công việc mới nếu cần.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8">
            <BrainDumpInput onTasksAdded={addTasks} />
          </div>
        </div>

        {/* Right Column: Task List */}
        <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 h-[calc(100vh-10rem)] sticky top-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Danh sách công việc</h2>
            {skippedTasksCount > 0 && (
              <button
                onClick={resetSkippedTasks}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Khôi phục ({skippedTasksCount})
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {tasks.length === 0 ? (
              <p className="text-zinc-500 text-center py-10 text-sm">Chưa có công việc nào. Hãy nhập ở bên dưới.</p>
            ) : (
              tasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => setEditingTask(task)}
                  className={`cursor-pointer p-4 rounded-2xl border transition-all hover:border-indigo-500/50 hover:bg-zinc-800/80 ${
                    task.status === 'done' ? 'bg-emerald-500/5 border-emerald-500/20' :
                    task.status === 'skipped' ? 'bg-zinc-900/50 border-zinc-800/50 opacity-60' :
                    'bg-zinc-900 border-zinc-800'
                  }`}
                >
                  <h4 className={`font-medium text-sm mb-2 ${task.status === 'done' ? 'text-emerald-400 line-through' : 'text-zinc-200'}`}>
                    {task.title}
                  </h4>
                  <div className="flex flex-wrap gap-2 text-[11px] text-zinc-500">
                    {task.deadline && (
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        Hạn: {new Date(task.deadline).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-zinc-800">{task.durationMinutes}p</span>
                    {task.isImportant && <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">Quan trọng</span>}
                    {task.isUrgent && <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500">Gấp</span>}
                    <span className="px-2 py-0.5 rounded bg-zinc-800">
                      {task.status === 'todo' ? 'Cần làm' : task.status === 'done' ? 'Xong' : 'Bỏ qua'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editingTask && (
          <EditTaskModal
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onSave={updateTask}
          />
        )}
        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}
