'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Battery, BatteryMedium, BatteryWarning, HeartPulse } from 'lucide-react';
import { EnergyLevel, SessionType, useTaskStore } from '@/lib/store';

interface Props {
  onSelect: (level: EnergyLevel, session: SessionType) => void;
}

export default function EnergyCheckIn({ onSelect }: Props) {
  const { mentalHealth, setMentalHealth } = useTaskStore();
  const [sliderValue, setSliderValue] = useState(mentalHealth || 50);
  const currentHour = new Date().getHours();
  let session: SessionType = 'morning';
  let greeting = 'Chào buổi sáng';
  let tip = 'Bắt đầu ngày mới bằng việc khó nhất để tạo đà chiến thắng.';

  if (currentHour >= 11 && currentHour < 14) {
    session = 'noon';
    greeting = 'Chào buổi trưa';
    tip = 'Dành thời gian nghỉ ngơi ngắn hoặc làm các việc nhẹ nhàng để nạp lại năng lượng.';
  } else if (currentHour >= 14 && currentHour < 18) {
    session = 'afternoon';
    greeting = 'Chào buổi chiều';
    tip = 'Tập trung giải quyết các công việc còn dang dở. Đừng quên uống nước nhé!';
  } else if (currentHour >= 18 && currentHour < 22) {
    session = 'evening';
    greeting = 'Chào buổi tối';
    tip = 'Thời gian tuyệt vời để lập kế hoạch cho ngày mai hoặc học thêm điều mới.';
  } else if (currentHour >= 22 || currentHour < 5) {
    session = 'late_night';
    greeting = 'Chào buổi khuya';
    tip = 'Đã muộn rồi, hãy ưu tiên nghỉ ngơi để đảm bảo sức khỏe cho ngày mai nhé.';
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-8 py-8"
    >
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-100">
          {greeting}, năng lượng của bạn hiện tại thế nào?
        </h2>
        <p className="text-zinc-400 max-w-lg mx-auto">
          {tip}
        </p>
      </div>

      <div className="w-full max-w-3xl bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-zinc-200 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-400" />
            Sức khỏe tinh thần
          </h3>
          <span className="text-sm font-bold text-rose-400">{sliderValue}/100</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={(e) => {
            setSliderValue(Number(e.target.value));
            setMentalHealth(Number(e.target.value));
          }}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
        />
        <div className="flex justify-between text-xs text-zinc-500 mt-2">
          <span>Căng thẳng / Mệt mỏi</span>
          <span>Thoải mái / Tích cực</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
        <button
          onClick={() => onSelect('high', session)}
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
          onClick={() => onSelect('normal', session)}
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
          onClick={() => onSelect('low', session)}
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
