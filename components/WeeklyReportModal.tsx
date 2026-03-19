import { motion } from 'motion/react';
import { X, BarChart2, Activity } from 'lucide-react';
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
  const { tasks, energyHistory } = useTaskStore();

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
        </div>
      </motion.div>
    </div>
  );
}
