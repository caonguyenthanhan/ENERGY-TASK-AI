'use client';

import { useMemo } from 'react';
import { Sparkles, ListChecks } from 'lucide-react';
import { useTaskStore } from '@/lib/store';

interface Props {
  onOpen: () => void;
}

export default function DailyTopSixCard({ onOpen }: Props) {
  const { tasks, getDailyTopSixForToday } = useTaskStore();
  const record = getDailyTopSixForToday();

  const selected = useMemo(() => {
    const map = new Map(tasks.map(t => [t.id, t]));
    return record.taskIds.map(id => map.get(id)).filter(Boolean);
  }, [record.taskIds, tasks]);

  return (
    <div className="w-full p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Ivy Lee (6 việc/ngày)
        </div>
        <button
          onClick={onOpen}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
        >
          <ListChecks className="w-4 h-4" />
          Chọn 6 việc
        </button>
      </div>

      {selected.length > 0 ? (
        <div className="space-y-2">
          {selected.map((t: any, idx: number) => (
            <div
              key={t.id}
              className={`flex items-start justify-between gap-3 p-3 rounded-2xl border ${
                idx === 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-zinc-950 border-zinc-800'
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs text-zinc-500 font-medium">#{idx + 1}</div>
                <div className="text-sm font-medium text-zinc-200 truncate">{t.title}</div>
              </div>
              {idx === 0 && (
                <div className="shrink-0 text-[11px] px-2 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Ưu tiên #1
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-zinc-500">
          Chưa chọn 6 việc cho hôm nay.
        </div>
      )}
    </div>
  );
}

