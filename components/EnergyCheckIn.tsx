'use client';

import { motion } from 'motion/react';
import { Battery, BatteryMedium, BatteryWarning } from 'lucide-react';
import { EnergyLevel } from '@/lib/store';

interface Props {
  onSelect: (level: EnergyLevel) => void;
}

export default function EnergyCheckIn({ onSelect }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-8 py-8"
    >
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-100">
          Chào buổi sáng, năng lượng của bạn hôm nay thế nào?
        </h2>
        <p className="text-zinc-400">
          Hãy chọn mức năng lượng hiện tại để tôi sắp xếp công việc phù hợp nhất.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
        <button
          onClick={() => onSelect('high')}
          className="flex flex-col items-center p-8 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800/50 transition-all group"
        >
          <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-500 mb-4 group-hover:scale-110 transition-transform">
            <Battery className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-medium text-zinc-200 mb-2">Đầy năng lượng</h3>
          <p className="text-sm text-zinc-500 text-center">
            Sẵn sàng &quot;ăn con ếch&quot;. Xử lý việc khó và chán nhất.
          </p>
        </button>

        <button
          onClick={() => onSelect('normal')}
          className="flex flex-col items-center p-8 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800/50 transition-all group"
        >
          <div className="p-4 rounded-full bg-blue-500/10 text-blue-500 mb-4 group-hover:scale-110 transition-transform">
            <BatteryMedium className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-medium text-zinc-200 mb-2">Bình thường</h3>
          <p className="text-sm text-zinc-500 text-center">
            Duy trì nhịp độ. Làm các việc vừa sức theo tiến độ.
          </p>
        </button>

        <button
          onClick={() => onSelect('low')}
          className="flex flex-col items-center p-8 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-rose-500/50 hover:bg-zinc-800/50 transition-all group"
        >
          <div className="p-4 rounded-full bg-rose-500/10 text-rose-500 mb-4 group-hover:scale-110 transition-transform">
            <BatteryWarning className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-medium text-zinc-200 mb-2">Cạn kiệt / Lười biếng</h3>
          <p className="text-sm text-zinc-500 text-center">
            Cần lấy lại đà. Bắt đầu bằng việc nhỏ, dễ hoặc thú vị.
          </p>
        </button>
      </div>
    </motion.div>
  );
}
