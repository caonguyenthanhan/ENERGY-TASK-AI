'use client';

import { Activity, AlertCircle, AlertTriangle, Smile, Frown, Flame } from 'lucide-react';
import { Mood, useTaskStore } from '@/lib/store';

type Option = {
  mood: Mood;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
};

const options: Option[] = [
  { mood: 'excited', label: 'Hưng phấn', icon: Smile, className: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' },
  { mood: 'neutral', label: 'Bình thường', icon: Activity, className: 'bg-zinc-800 border-zinc-700 text-zinc-200' },
  { mood: 'anxious', label: 'Lo âu', icon: AlertTriangle, className: 'bg-amber-500/10 border-amber-500/40 text-amber-300' },
  { mood: 'sad', label: 'Buồn', icon: Frown, className: 'bg-blue-500/10 border-blue-500/40 text-blue-300' },
  { mood: 'angry', label: 'Tức giận', icon: Flame, className: 'bg-rose-500/10 border-rose-500/40 text-rose-300' },
];

export default function MoodCheckIn() {
  const { mood, setMood } = useTaskStore();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <AlertCircle className="w-4 h-4 text-indigo-400" />
          Check-in cảm xúc
        </div>
        {mood && (
          <button
            onClick={() => setMood(null)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Bỏ chọn
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {options.map((o) => {
          const active = mood === o.mood;
          const Icon = o.icon;
          return (
            <button
              key={o.mood}
              onClick={() => setMood(o.mood)}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                active ? o.className : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

