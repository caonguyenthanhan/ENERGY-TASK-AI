'use client';

import { motion } from 'motion/react';
import { Lock, X } from 'lucide-react';

interface Props {
  title: string;
  requiredPoints: number;
  currentPoints: number;
  onClose: () => void;
}

export default function LockedFeatureModal({ title, requiredPoints, currentPoints, onClose }: Props) {
  const remaining = Math.max(0, requiredPoints - currentPoints);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="w-20 h-20 mx-auto bg-indigo-500/15 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-indigo-400" />
        </div>

        <h2 className="text-xl font-semibold text-white text-center mb-2">Chưa mở khóa</h2>
        <p className="text-zinc-400 text-center mb-6">
          <span className="text-zinc-200 font-medium">{title}</span> mở ở mốc <span className="text-indigo-400 font-semibold">{requiredPoints}</span> điểm.
        </p>

        <div className="bg-zinc-950 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <span>Điểm hiện tại</span>
            <span className="text-zinc-200 font-medium">{currentPoints}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-zinc-500 mt-2">
            <span>Còn thiếu</span>
            <span className="text-amber-400 font-medium">{remaining}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
        >
          Đã hiểu
        </button>
      </motion.div>
    </div>
  );
}

