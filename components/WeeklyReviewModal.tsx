'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { X, HeartPulse, Brain } from 'lucide-react';
import { useTaskStore } from '@/lib/store';

function getWeekStartISO(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

interface Props {
  onClose: () => void;
}

export default function WeeklyReviewModal({ onClose }: Props) {
  const { upsertWeeklyReview, weeklyReviews } = useTaskStore();
  const weekStart = useMemo(() => getWeekStartISO(), []);
  const existing = useMemo(() => weeklyReviews.find(r => r.weekStart === weekStart) || null, [weeklyReviews, weekStart]);

  const [healthPercent, setHealthPercent] = useState(existing?.healthPercent ?? 60);
  const [mentalPercent, setMentalPercent] = useState(existing?.mentalPercent ?? 60);
  const [lastWeekNote, setLastWeekNote] = useState(existing?.lastWeekNote ?? '');
  const [nextWeekNote, setNextWeekNote] = useState(existing?.nextWeekNote ?? '');

  const save = () => {
    upsertWeeklyReview({
      weekStart,
      healthPercent,
      mentalPercent,
      lastWeekNote: lastWeekNote.trim(),
      nextWeekNote: nextWeekNote.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
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
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Đánh giá tuần</h2>
            <p className="text-xs text-zinc-500 mt-1">Tuần bắt đầu: {new Date(weekStart).toLocaleDateString('vi-VN')}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <HeartPulse className="w-4 h-4 text-rose-400" />
                Sức khoẻ tuần qua
              </div>
              <div className="text-xs text-zinc-500">{healthPercent}%</div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={healthPercent}
              onChange={(e) => setHealthPercent(Number(e.target.value))}
              className="w-full accent-rose-500 mt-3"
            />
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Brain className="w-4 h-4 text-indigo-400" />
                Tâm lý tuần qua
              </div>
              <div className="text-xs text-zinc-500">{mentalPercent}%</div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={mentalPercent}
              onChange={(e) => setMentalPercent(Number(e.target.value))}
              className="w-full accent-indigo-500 mt-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Cảm nhận tuần qua</label>
            <textarea
              value={lastWeekNote}
              onChange={(e) => setLastWeekNote(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[90px]"
              placeholder="Điều gì đã ổn / chưa ổn? Điều gì làm bạn kiệt sức hoặc có động lực?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Tuần tới bạn muốn thế nào?</label>
            <textarea
              value={nextWeekNote}
              onChange={(e) => setNextWeekNote(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[90px]"
              placeholder="Mục tiêu chính, nhịp làm việc mong muốn, điều cần tránh, điều cần ưu tiên."
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
          >
            Để sau
          </button>
          <button
            onClick={save}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            Lưu đánh giá
          </button>
        </div>
      </motion.div>
    </div>
  );
}

