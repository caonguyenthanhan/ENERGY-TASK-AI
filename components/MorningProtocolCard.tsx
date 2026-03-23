'use client';

import { useMemo } from 'react';
import { CheckCircle2, Circle, Sunrise } from 'lucide-react';
import { Chronotype, useTaskStore } from '@/lib/store';

type Item = { id: string; label: string };

function getItems(chronotype: Chronotype | null): Item[] {
  const common: Item[] = [
    { id: 'water', label: 'Uống nước (1 ly)' },
    { id: 'light', label: 'Ra ánh sáng 5–10 phút' },
    { id: 'no_phone', label: 'Tránh mạng xã hội 30 phút đầu' },
  ];

  if (chronotype === 'lion') return [...common, { id: 'frog', label: 'Làm “con ếch” 10 phút' }];
  if (chronotype === 'bear') return [...common, { id: 'plan', label: 'Chốt 3 ưu tiên hôm nay' }];
  if (chronotype === 'wolf') return [...common, { id: 'warmup', label: 'Khởi động nhẹ 5 phút' }];
  if (chronotype === 'dolphin') return [...common, { id: 'move', label: 'Vận động mạnh 3–5 phút' }];
  return [...common, { id: 'breathe', label: 'Thở chậm 2 phút' }];
}

export default function MorningProtocolCard() {
  const { chronotype, morningProtocolPrefs, getMorningAdherenceForToday, toggleMorningProtocolItem } = useTaskStore();
  const items = useMemo(() => getItems(chronotype), [chronotype]);
  const today = getMorningAdherenceForToday();

  if (!morningProtocolPrefs?.enabled) return null;

  return (
    <div className="w-full p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          <Sunrise className="w-4 h-4 text-amber-400" />
          Buổi sáng hôm nay
        </div>
        <div className="text-xs text-zinc-500">
          {today.completed.length}/{items.length}
        </div>
      </div>

      <div className="space-y-2">
        {items.map((it) => {
          const done = today.completed.includes(it.id);
          return (
            <button
              key={it.id}
              onClick={() => toggleMorningProtocolItem(it.id)}
              className="w-full flex items-start gap-3 p-3 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors text-left"
            >
              <span className={done ? 'text-emerald-400' : 'text-zinc-600'}>
                {done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </span>
              <span className={`text-sm ${done ? 'text-zinc-400 line-through' : 'text-zinc-200'}`}>
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

