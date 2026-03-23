'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Trophy, RefreshCw, Settings, Database, User, BarChart2, Calendar, Link as LinkIcon, Flame } from 'lucide-react';
import Link from 'next/link';
import { useTaskStore, Task } from '@/lib/store';
import EnergyCheckIn from '@/components/EnergyCheckIn';
import ZenTask from '@/components/ZenTask';
import BrainDumpInput from '@/components/BrainDumpInput';
import EditTaskModal from '@/components/EditTaskModal';
import SettingsModal from '@/components/SettingsModal';
import ProfileModal from '@/components/ProfileModal';
import WeeklyReportModal from '@/components/WeeklyReportModal';
import WeeklyReviewModal from '@/components/WeeklyReviewModal';
import MoodCheckIn from '@/components/MoodCheckIn';
import MorningProtocolCard from '@/components/MorningProtocolCard';
import DailyTopSixCard from '@/components/DailyTopSixCard';
import IvyLeeModal from '@/components/IvyLeeModal';
import ChatBot from '@/components/ChatBot';
import TaskList from '@/components/TaskList';
import CelebrationModal from '@/components/CelebrationModal';
import LockedFeatureModal from '@/components/LockedFeatureModal';
import { FeatureKey, getFeatureLabel, getRequiredPoints, isFeatureUnlocked } from '@/lib/features';
import { APP_NAME } from '@/lib/app-config';
import { getTextOnHex } from '@/lib/contrast';
import confetti from 'canvas-confetti';

export default function Home() {
  const {
    isLoaded,
    energyLevel,
    setEnergyLevel,
    addTasks,
    addManualTask,
    completeTask,
    skipTask,
    resetSkippedTasks,
    getTopTask,
    points,
    pointGoal,
    getCurrentStreak,
    tasks,
    updateTask,
    weeklyReviews,
    user,
    backgroundType,
    backgroundValue,
    backgroundOverlayColor,
  } = useTaskStore();

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showIvyLee, setShowIvyLee] = useState(false);
  const [lockedFeature, setLockedFeature] = useState<FeatureKey | null>(null);
  const [overdueCount, setOverdueCount] = useState(0);
  const hasCelebrated = useRef(false);
  const currentStreak = getCurrentStreak();
  const email = user?.email as string | undefined;
  const confettiEnabled = isFeatureUnlocked({ feature: 'confetti', points, email });
  const weeklyReportEnabled = isFeatureUnlocked({ feature: 'weeklyReport', points, email });
  const weeklyReviewEnabled = isFeatureUnlocked({ feature: 'weeklyReview', points, email });
  const celebrationEnabled = isFeatureUnlocked({ feature: 'celebration', points, email });
  const chatbotEnabled = isFeatureUnlocked({ feature: 'chatbot', points, email });
  const backgroundMediaEnabled = isFeatureUnlocked({ feature: 'backgroundMedia', points, email });
  const titleTextClass = getTextOnHex(
    backgroundType === 'color'
      ? (backgroundValue || '#09090b')
      : (backgroundMediaEnabled ? (backgroundOverlayColor || '#000000') : '#09090b')
  );

  useEffect(() => {
    if (isLoaded && celebrationEnabled && points >= pointGoal && !hasCelebrated.current) {
      const timer = setTimeout(() => {
        setShowCelebration(true);
      }, 0);
      hasCelebrated.current = true;
      return () => clearTimeout(timer);
    } else if (isLoaded && points < pointGoal) {
      hasCelebrated.current = false;
    }
  }, [points, pointGoal, isLoaded, celebrationEnabled]);

  useEffect(() => {
    if (!isLoaded) return;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    const weekStart = d.toISOString().split('T')[0];

    if (weeklyReviewEnabled && !weeklyReviews.some(r => r.weekStart === weekStart)) {
      const t = setTimeout(() => setShowWeeklyReview(true), 0);
      return () => clearTimeout(t);
    }
  }, [isLoaded, weeklyReviews, weeklyReviewEnabled]);

  useEffect(() => {
    if (!isLoaded) return;
    const nowTs = Date.now();
    const count = tasks.filter(t => {
      if (t.status !== 'todo') return false;
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      if (isNaN(d.getTime())) return false;
      return d.getTime() < nowTs;
    }).length;
    const timer = setTimeout(() => setOverdueCount(count), 0);
    return () => clearTimeout(timer);
  }, [tasks, isLoaded]);

  const handleAddManual = () => {
    const t = addManualTask({ title: 'Công việc mới', deadline: null, durationMinutes: 30 });
    setEditingTask(t);
  };

  const handleCompleteTask = (taskId: string) => {
    completeTask(taskId);
    if (confettiEnabled) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']
      });
    }
  };

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
            <h1 className={`text-xl font-semibold tracking-tight ${titleTextClass}`}>{APP_NAME}</h1>
            <p className="text-xs text-zinc-500">Quản lý kỷ luật nhưng thấu hiểu</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/schedule" className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-zinc-300">Lịch</span>
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-zinc-300">{points} điểm</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800">
            <Flame className="w-4 h-4 text-rose-400" />
            <span className="text-sm font-medium text-zinc-300">{currentStreak} streak</span>
          </div>
          <button
            onClick={() => (weeklyReportEnabled ? setShowReport(true) : setLockedFeature('weeklyReport'))}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
            title="Báo cáo tuần"
          >
            <BarChart2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSync(true)}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
            title="Tài khoản & Đồng bộ"
          >
            <User className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
            title="Cài đặt"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {overdueCount > 0 && (
        <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-rose-200">
              Bạn có <span className="font-semibold">{overdueCount}</span> công việc quá hạn. Hệ thống sẽ ưu tiên nhắc và đưa lên đầu.
            </div>
          </div>
        </div>
      )}

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
                  onComplete={handleCompleteTask}
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

          {energyLevel && (
            <div className="mt-6 space-y-6">
              <MoodCheckIn />
              <MorningProtocolCard />
            </div>
          )}

          <div className="mt-8">
            <BrainDumpInput onTasksAdded={addTasks} />
          </div>
        </div>

        {/* Right Column: Task List */}
        <div className="w-full lg:w-[420px] flex flex-col gap-6">
          {energyLevel && (
            <DailyTopSixCard onOpen={() => setShowIvyLee(true)} />
          )}
          <TaskList onEditTask={setEditingTask} onAddManual={handleAddManual} onCompleteTask={handleCompleteTask} />
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editingTask && (
          <EditTaskModal
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onSave={(taskId, updates) => {
              updateTask(taskId, updates);
              setEditingTask(null);
            }}
          />
        )}
        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} />
        )}
        {showSync && (
          <ProfileModal onClose={() => setShowSync(false)} />
        )}
        {showReport && (
          <WeeklyReportModal onClose={() => setShowReport(false)} />
        )}
        {showWeeklyReview && (
          <WeeklyReviewModal onClose={() => setShowWeeklyReview(false)} />
        )}
        {showIvyLee && (
          <IvyLeeModal onClose={() => setShowIvyLee(false)} />
        )}
        {showCelebration && (
          <CelebrationModal
            points={points}
            goal={pointGoal}
            onClose={() => setShowCelebration(false)}
          />
        )}
        {lockedFeature && (
          <LockedFeatureModal
            title={getFeatureLabel(lockedFeature)}
            requiredPoints={getRequiredPoints(lockedFeature)}
            currentPoints={points}
            onClose={() => setLockedFeature(null)}
          />
        )}
      </AnimatePresence>
      {chatbotEnabled && <ChatBot />}
    </main>
  );
}
