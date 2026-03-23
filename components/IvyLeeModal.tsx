'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { X, ChevronUp, ChevronDown, Check, ListTodo, Trash2 } from 'lucide-react';
import { useTaskStore } from '@/lib/store';

interface Props {
  onClose: () => void;
}

export default function IvyLeeModal({ onClose }: Props) {
  const { tasks, getDailyTopSixForToday, setDailyTopSixForToday, clearDailyTopSixForToday } = useTaskStore();
  const today = getDailyTopSixForToday();
  const [selected, setSelected] = useState<string[]>(today.taskIds);

  const todoTasks = useMemo(() => {
    return tasks
      .filter(t => t.status === 'todo')
      .sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, [tasks]);

  const selectedTasks = useMemo(() => {
    const map = new Map(tasks.map(t => [t.id, t]));
    return selected.map(id => map.get(id)).filter(Boolean);
  }, [selected, tasks]);

  const toggle = (taskId: string) => {
    setSelected(prev => {
      const exists = prev.includes(taskId);
      if (exists) return prev.filter(id => id !== taskId);
      if (prev.length >= 6) return prev;
      return [...prev, taskId];
    });
  };

  const move = (from: number, dir: -1 | 1) => {
    setSelected(prev => {
      const to = from + dir;
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const tmp = next[from];
      next[from] = next[to];
      next[to] = tmp;
      return next;
    });
  };

  const save = () => {
    setDailyTopSixForToday(selected);
    onClose();
  };

  const clear = () => {
    clearDailyTopSixForToday();
    setSelected([]);
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
        className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 sm:p-8 border-b border-zinc-800 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Ivy Lee: 6 việc hôm nay</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Chọn tối đa 6 việc và đặt thứ tự ưu tiên. Việc #1 sẽ được ưu tiên trong Zen mode.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <ListTodo className="w-4 h-4 text-indigo-400" />
                Danh sách todo
              </div>
              <div className="text-xs text-zinc-500">
                {selected.length}/6 đã chọn
              </div>
            </div>
            <div className="max-h-[420px] overflow-y-auto custom-scrollbar pr-1 space-y-2">
              {todoTasks.map(t => {
                const active = selected.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggle(t.id)}
                    className={`w-full flex items-start justify-between gap-3 p-3 rounded-xl border text-left transition-colors ${
                      active ? 'bg-indigo-500/10 border-indigo-500/40' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className={`text-sm font-medium truncate ${active ? 'text-indigo-200' : 'text-zinc-200'}`}>
                        {t.title}
                      </div>
                      <div className="mt-1 text-[11px] text-zinc-500">
                        {t.durationMinutes}p
                        {t.isImportant ? ' • Quan trọng' : ''}
                        {t.isUrgent ? ' • Gấp' : ''}
                      </div>
                    </div>
                    <div className={`shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center ${active ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200' : 'border-zinc-700 text-zinc-600'}`}>
                      <Check className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
              {todoTasks.length === 0 && (
                <div className="text-sm text-zinc-500">Không có task todo.</div>
              )}
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-zinc-200">Ưu tiên 1–6</div>
              <button
                onClick={clear}
                className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Xoá hôm nay
              </button>
            </div>

            <div className="space-y-2">
              {selectedTasks.map((t: any, idx: number) => (
                <div
                  key={t.id}
                  className={`flex items-start justify-between gap-3 p-3 rounded-xl border ${
                    idx === 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-zinc-900 border-zinc-800'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs text-zinc-500 font-medium">#{idx + 1}</div>
                    <div className="text-sm font-medium text-zinc-200 truncate">{t.title}</div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 disabled:opacity-40 transition-colors"
                      aria-label="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => move(idx, 1)}
                      disabled={idx === selected.length - 1}
                      className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 disabled:opacity-40 transition-colors"
                      aria-label="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggle(t.id)}
                      className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                    >
                      Bỏ
                    </button>
                  </div>
                </div>
              ))}

              {selectedTasks.length === 0 && (
                <div className="text-sm text-zinc-500">Chưa chọn 6 việc cho hôm nay.</div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 border-t border-zinc-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={save}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            Lưu 6 việc
          </button>
        </div>
      </motion.div>
    </div>
  );
}

