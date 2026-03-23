import { motion } from 'motion/react';
import { X, BarChart2, Activity, Sun, Moon, Coffee, Clock, Smile, Meh, Frown, Flame, AlertTriangle, SplitSquareHorizontal } from 'lucide-react';
import { useTaskStore } from '@/lib/store';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface Props {
  onClose: () => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const energyMap: Record<number, string> = {
      3: 'Cao',
      2: 'Bình thường',
      1: 'Thấp',
      0: 'Không có',
    };
    return (
      <div className="bg-zinc-800 border border-zinc-700 p-3 rounded-xl shadow-xl text-sm">
        <p className="font-medium text-zinc-200 mb-2">{label}</p>
        <p className="text-emerald-400">
          Hoàn thành: {payload[0]?.value || 0} công việc
        </p>
        <p className="text-amber-400 mt-1">
          Năng lượng: {energyMap[payload[1]?.value as number] || 'Không có'}
        </p>
      </div>
    );
  }
  return null;
};

export default function WeeklyReportModal({ onClose }: Props) {
  const { tasks, energyHistory, moodHistory, morningAdherenceHistory, chronotype } = useTaskStore();

  // Generate last 7 days data
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayStr = d.toLocaleDateString('vi-VN', { weekday: 'short' });
      days.push({ dateStr, displayStr });
    }
    return days;
  };

  const days = getLast7Days();

  const moodLabel = (mood: any) => {
    if (!mood) return '—';
    if (mood === 'excited') return 'Hưng phấn';
    if (mood === 'neutral') return 'Bình thường';
    if (mood === 'anxious') return 'Lo âu';
    if (mood === 'sad') return 'Buồn';
    if (mood === 'angry') return 'Tức giận';
    return '—';
  };

  const moodIcon = (mood: any) => {
    if (mood === 'excited') return <Smile className="w-4 h-4 text-emerald-400" />;
    if (mood === 'neutral') return <Meh className="w-4 h-4 text-zinc-400" />;
    if (mood === 'anxious') return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    if (mood === 'sad') return <Frown className="w-4 h-4 text-blue-400" />;
    if (mood === 'angry') return <Flame className="w-4 h-4 text-rose-400" />;
    return <span className="w-4 h-4" />;
  };

  const chronotypeLabel = () => {
    if (!chronotype) return '—';
    if (chronotype === 'lion') return 'Sư tử';
    if (chronotype === 'bear') return 'Gấu';
    if (chronotype === 'wolf') return 'Sói';
    return 'Cá heo';
  };

  const sessionIcon = (session: string) => {
    if (session === 'morning') return <Sun className="w-3.5 h-3.5 text-amber-400" />;
    if (session === 'noon') return <Coffee className="w-3.5 h-3.5 text-amber-300" />;
    if (session === 'afternoon') return <Clock className="w-3.5 h-3.5 text-indigo-300" />;
    if (session === 'evening') return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
    return <Moon className="w-3.5 h-3.5 text-zinc-500" />;
  };

  const energyLabel = (level: any) => {
    if (level === 'high') return 'Cao';
    if (level === 'normal') return 'TB';
    if (level === 'low') return 'Thấp';
    return '—';
  };

  const energyClass = (level: any) => {
    if (level === 'high') return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
    if (level === 'normal') return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
    if (level === 'low') return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
    return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  };

  const chartData = days.map((day) => {
    // Count tasks completed on this day
    const completedTasks = tasks.filter((t) => {
      if (t.status !== 'done' || !t.completedAt) return false;
      return t.completedAt.startsWith(day.dateStr);
    }).length;

    // Get energy level for this day
    const energyRecord = energyHistory?.find((r) => r.date === day.dateStr);
    let energyValue = 0;
    if (energyRecord?.level === 'high') energyValue = 3;
    if (energyRecord?.level === 'normal') energyValue = 2;
    if (energyRecord?.level === 'low') energyValue = 1;

    return {
      name: day.displayStr,
      tasks: completedTasks,
      energy: energyValue,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Báo cáo tuần</h2>
            <p className="text-sm text-zinc-400">Năng suất và năng lượng 7 ngày qua</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8">
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 sm:p-6">
            <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              Tổng quan 7 ngày
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                <div className="text-xs text-zinc-500">Chronotype</div>
                <div className="text-lg font-semibold text-zinc-100 mt-1">{chronotypeLabel()}</div>
              </div>
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                <div className="text-xs text-zinc-500">Mood hôm nay</div>
                <div className="mt-2 flex items-center gap-2">
                  {moodIcon(moodHistory?.find((m: any) => m.date === new Date().toISOString().split('T')[0])?.mood)}
                  <div className="text-sm text-zinc-200">
                    {moodLabel(moodHistory?.find((m: any) => m.date === new Date().toISOString().split('T')[0])?.mood)}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                <div className="text-xs text-zinc-500">Checklist buổi sáng</div>
                <div className="text-lg font-semibold text-zinc-100 mt-1">
                  {(morningAdherenceHistory?.find((r: any) => r.date === new Date().toISOString().split('T')[0])?.completed?.length ?? 0)} mục
                </div>
              </div>
            </div>
          </div>

          {/* Tasks Chart */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 sm:p-6">
            <h3 className="text-sm font-medium text-zinc-300 mb-6 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-500" />
              Công việc hoàn thành
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#27272a' }} />
                  <Bar dataKey="tasks" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Energy Chart */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 sm:p-6">
            <h3 className="text-sm font-medium text-zinc-300 mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" />
              Mức năng lượng
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="#a1a1aa" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    domain={[0, 3]} 
                    ticks={[0, 1, 2, 3]}
                    tickFormatter={(val) => {
                      if (val === 3) return 'Cao';
                      if (val === 2) return 'Bình thường';
                      if (val === 1) return 'Thấp';
                      return '';
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="energy" 
                    stroke="#f59e0b" 
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 sm:p-6">
            <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Energy/Mood/Adherence theo ngày
            </h3>
            <div className="space-y-3">
              {days.map((day) => {
                const energies = (energyHistory || []).filter((r: any) => r.date === day.dateStr);
                const mood = (moodHistory || []).find((m: any) => m.date === day.dateStr)?.mood ?? null;
                const adherence = (morningAdherenceHistory || []).find((a: any) => a.date === day.dateStr)?.completed ?? [];

                const sessions = ['morning', 'noon', 'afternoon', 'evening', 'late_night'];
                const bySession: Record<string, any> = {};
                for (const e of energies) {
                  const key = e.session || 'morning';
                  bySession[key] = e.level;
                }

                return (
                  <div key={day.dateStr} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-zinc-200">{day.dateStr}</div>
                      <div className="flex items-center gap-2">
                        {moodIcon(mood)}
                        <div className="text-xs text-zinc-400">{moodLabel(mood)}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {sessions.map(s => (
                        <div key={s} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs ${energyClass(bySession[s])}`}>
                          {sessionIcon(s)}
                          {energyLabel(bySession[s])}
                        </div>
                      ))}
                      <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg border bg-zinc-900 border-zinc-800 text-xs text-zinc-300">
                        <SplitSquareHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                        Checklist: {Array.isArray(adherence) ? adherence.length : 0}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
