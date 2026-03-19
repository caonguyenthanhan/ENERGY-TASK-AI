'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { parseTaskWithAI, ParsedTask } from '@/lib/ai';

interface Props {
  onTasksAdded: (tasks: ParsedTask[]) => void;
}

export default function BrainDumpInput({ onTasksAdded }: Props) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      const parsedTasks = await parseTaskWithAI(input);
      if (parsedTasks && parsedTasks.length > 0) {
        onTasksAdded(parsedTasks);
        setInput('');
      } else {
        alert("Không tìm thấy công việc nào trong câu nói của bạn. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error(error);
      alert("Đã có lỗi xảy ra khi phân tích công việc.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-12">
      <form onSubmit={handleSubmit} className="relative">
        <div className="absolute top-4 left-4 text-zinc-500">
          <Sparkles className="w-5 h-5" />
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Đổ mọi thứ ra đây... VD: "Làm báo cáo tài chính thứ 6 nộp, mất khoảng 2 tiếng, việc này rất chán"'
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-16 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none min-h-[120px]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className="absolute bottom-4 right-4 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
      <p className="text-xs text-center text-zinc-600 mt-3">
        Nhấn Enter để gửi. AI sẽ tự động bóc tách Deadline, Thời lượng và Cảm xúc.
      </p>
    </div>
  );
}
