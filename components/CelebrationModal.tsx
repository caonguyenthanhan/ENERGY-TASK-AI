'use client';

import { motion } from 'motion/react';
import { Trophy, X } from 'lucide-react';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface Props {
  points: number;
  goal: number;
  onClose: () => void;
}

export default function CelebrationModal({ points, goal, onClose }: Props) {
  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="w-24 h-24 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center mb-6">
          <Trophy className="w-12 h-12 text-amber-500" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Chúc mừng!</h2>
        <p className="text-zinc-400 mb-6">
          Bạn đã đạt được mục tiêu <span className="text-amber-500 font-bold">{goal}</span> điểm. Tuyệt vời!
        </p>

        <div className="bg-zinc-950 rounded-2xl p-4 mb-6">
          <div className="text-sm text-zinc-500 mb-1">Tổng điểm hiện tại</div>
          <div className="text-3xl font-bold text-indigo-400">{points}</div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
        >
          Tiếp tục cố gắng
        </button>
      </motion.div>
    </div>
  );
}
