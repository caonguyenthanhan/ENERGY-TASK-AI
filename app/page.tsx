'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, ListTodo, Trophy, RefreshCw } from 'lucide-react';
import { useTaskStore } from '@/lib/store';
import EnergyCheckIn from '@/components/EnergyCheckIn';
import ZenTask from '@/components/ZenTask';
import BrainDumpInput from '@/components/BrainDumpInput';

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
  } = useTaskStore();

  const [showList, setShowList] = useState(false);

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
  const activeTasksCount = tasks.filter(t => t.status === 'todo').length;
  const skippedTasksCount = tasks.filter(t => t.status === 'skipped').length;

  return (
    <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-6 py-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-12">
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
            onClick={() => setShowList(!showList)}
            className="p-2 rounded-full hover:bg-zinc-900 text-zinc-400 transition-colors"
            title="Xem danh sách công việc"
          >
            <ListTodo className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center relative">
        <AnimatePresence mode="wait">
          {showList ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-3xl mx-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Tất cả công việc</h2>
                {skippedTasksCount > 0 && (
                  <button
                    onClick={resetSkippedTasks}
                    className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Khôi phục {skippedTasksCount} việc đã bỏ qua
                  </button>
                )}
              </div>
              
              {tasks.length === 0 ? (
                <p className="text-zinc-500 text-center py-12">Chưa có công việc nào. Hãy nhập ở bên dưới.</p>
              ) : (
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div key={task.id} className={`p-4 rounded-xl border ${task.status === 'done' ? 'bg-emerald-500/5 border-emerald-500/20' : task.status === 'skipped' ? 'bg-zinc-900/50 border-zinc-800/50 opacity-50' : 'bg-zinc-900 border-zinc-800'} flex items-center justify-between`}>
                      <div>
                        <h4 className={`font-medium ${task.status === 'done' ? 'text-emerald-400 line-through' : 'text-zinc-200'}`}>{task.title}</h4>
                        <div className="flex gap-2 mt-2 text-xs text-zinc-500">
                          <span>{task.durationMinutes}p</span>
                          <span>•</span>
                          <span>{task.difficulty}</span>
                          <span>•</span>
                          <span>{task.emotion}</span>
                        </div>
                      </div>
                      <div className="text-xs font-medium uppercase tracking-wider text-zinc-600">
                        {task.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : !energyLevel ? (
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
              {skippedTasksCount > 0 && (
                <button
                  onClick={resetSkippedTasks}
                  className="mt-8 px-6 py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  Thử lại các việc đã bỏ qua ({skippedTasksCount})
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Input */}
      {!showList && (
        <div className="mt-auto pt-12">
          <BrainDumpInput onTasksAdded={addTasks} />
        </div>
      )}
    </main>
  );
}
