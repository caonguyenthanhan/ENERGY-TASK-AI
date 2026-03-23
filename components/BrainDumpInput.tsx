'use client';

import { useState } from 'react';
import { Send, Loader2, Sparkles, Merge, X } from 'lucide-react';
import { parseTaskWithAI, ParsedTask } from '@/lib/ai';
import { useTaskStore, Task } from '@/lib/store';

interface Props {
  onTasksAdded: (tasks: ParsedTask[]) => void;
}

export default function BrainDumpInput({ onTasksAdded }: Props) {
  const { apiKeys, customPrompt, tasks, updateTask } = useTaskStore();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<ParsedTask[] | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{parsed: ParsedTask, existing: Task}[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const formatDeadlinePreview = (deadline: string | null | undefined) => {
    if (!deadline) return 'Không có hạn chót';
    try {
      const d = new Date(deadline);
      if (isNaN(d.getTime())) return 'Hạn chót không hợp lệ';
      return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    } catch {
      return 'Hạn chót không hợp lệ';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      const parsedTasks = await parseTaskWithAI(input, apiKeys, customPrompt, tasks);
      if (parsedTasks && parsedTasks.length > 0) {
        // Check for duplicates
        const duplicates: {parsed: ParsedTask, existing: Task}[] = [];
        for (const pt of parsedTasks) {
          const existing = tasks.find(t => t.title.toLowerCase().includes(pt.title.toLowerCase()) || pt.title.toLowerCase().includes(t.title.toLowerCase()));
          if (existing) {
            duplicates.push({ parsed: pt, existing });
          }
        }

        if (duplicates.length > 0) {
          setDuplicateWarning(duplicates);
          setPendingTasks(parsedTasks);
          setIsProcessing(false);
          return;
        }

        setPendingTasks(parsedTasks);
        setShowConfirmation(true);
      } else {
        setPendingTasks(null);
        setDuplicateWarning([]);
        setShowConfirmation(false);
        alert('AI không tìm thấy công việc nào trong nội dung bạn nhập. Vui lòng thử lại với nội dung rõ ràng hơn.');
      }
    } catch (error: any) {
      console.error(error);
      setPendingTasks(null);
      setDuplicateWarning([]);
      setShowConfirmation(false);
      alert('Có lỗi xảy ra khi phân tích công việc. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmAdd = () => {
    if (pendingTasks) {
      onTasksAdded(pendingTasks);
      setInput('');
      setPendingTasks(null);
      setDuplicateWarning([]);
      setShowConfirmation(false);
    }
  };

  const handleMerge = () => {
    if (pendingTasks && duplicateWarning.length > 0) {
      // Merge duplicates
      for (const { parsed, existing } of duplicateWarning) {
        updateTask(existing.id, {
          durationMinutes: existing.durationMinutes + parsed.durationMinutes,
          isImportant: existing.isImportant || parsed.isImportant,
          isUrgent: existing.isUrgent || parsed.isUrgent,
          deadline: parsed.deadline || existing.deadline,
          resources: [...(existing.resources || []), ...(parsed.resources || [])],
        });
      }
      
      // Add non-duplicates
      const nonDuplicates = pendingTasks.filter(pt => !duplicateWarning.some(d => d.parsed === pt));
      if (nonDuplicates.length > 0) {
        onTasksAdded(nonDuplicates);
      }
      
      setInput('');
      setPendingTasks(null);
      setDuplicateWarning([]);
      setShowConfirmation(false);
    }
  };

  const cancelAdd = () => {
    setPendingTasks(null);
    setDuplicateWarning([]);
    setShowConfirmation(false);
  };

  const removePendingTask = (index: number) => {
    if (!pendingTasks) return;
    const next = pendingTasks.filter((_, i) => i !== index);
    setPendingTasks(next.length > 0 ? next : null);
    if (next.length === 0) setShowConfirmation(false);
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
          placeholder='Đổ mọi thứ ra đây... VD: "Làm báo cáo tài chính thứ 6 nộp, mất khoảng 2 tiếng, việc này rất quan trọng và gấp"'
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
        Nhấn Enter để gửi. AI sẽ tự động bóc tách Deadline, Thời lượng và phân loại Quan trọng/Gấp.
      </p>

      {duplicateWarning.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-amber-500 mb-2">Cảnh báo trùng lặp</h3>
            <p className="text-sm text-zinc-300 mb-4">
              Có vẻ bạn đang thêm công việc đã tồn tại:
            </p>
            <ul className="list-disc pl-5 mb-6 text-sm text-zinc-400">
              {duplicateWarning.map((d, i) => (
                <li key={i}>{d.parsed.title} (Trùng với: {d.existing.title})</li>
              ))}
            </ul>
            <p className="text-sm text-zinc-300 mb-6">
              Bạn có chắc chắn muốn thêm không? (Bạn có thể xem xét hợp nhất hoặc bỏ qua)
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                onClick={cancelAdd}
                className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-800 text-zinc-300 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleMerge}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-500 transition-colors"
              >
                <Merge className="w-4 h-4" /> Hợp nhất
              </button>
              <button
                onClick={confirmAdd}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Vẫn thêm
              </button>
            </div>
          </div>
        </div>
      )}
      {showConfirmation && pendingTasks && duplicateWarning.length === 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Xác nhận thêm công việc</h3>
            <p className="text-sm text-zinc-300 mb-4">
              AI đã tìm thấy {pendingTasks.length} công việc:
            </p>
            <div className="mb-6 space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {pendingTasks.map((t, i) => (
                <div key={i} className="flex items-start justify-between gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-zinc-200 truncate">{t.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                      <span>{Math.round(Number(t.durationMinutes || 0)) || 30}p</span>
                      <span>•</span>
                      <span>{formatDeadlinePreview(t.deadline)}</span>
                      {t.isImportant && <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Quan trọng</span>}
                      {t.isUrgent && <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">Gấp</span>}
                      {t.isRoutine && <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Thường nhật</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => removePendingTask(i)}
                    className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-colors"
                    aria-label="Bỏ task này"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                onClick={cancelAdd}
                className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-800 text-zinc-300 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmAdd}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Xác nhận thêm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
