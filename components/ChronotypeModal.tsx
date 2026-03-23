'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { X, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Chronotype, useTaskStore } from '@/lib/store';

type ChoiceKey = 'A' | 'B' | 'C' | 'D';

type Question = {
  title: string;
  choices: { key: ChoiceKey; text: string }[];
};

const questions: Question[] = [
  {
    title: 'Khi nào bạn cảm thấy tỉnh táo và làm việc hiệu quả nhất?',
    choices: [
      { key: 'A', text: 'Sáng sớm' },
      { key: 'B', text: 'Giữa buổi sáng đến đầu chiều' },
      { key: 'C', text: 'Chiều muộn đến tối' },
      { key: 'D', text: 'Theo từng đợt ngắn, khó đoán' },
    ],
  },
  {
    title: 'Bạn thường thức dậy như thế nào?',
    choices: [
      { key: 'A', text: 'Dậy sớm, vào guồng nhanh' },
      { key: 'B', text: 'Dậy ổn định, cần chút thời gian để ấm máy' },
      { key: 'C', text: 'Dậy muộn hoặc buổi sáng ì ạch' },
      { key: 'D', text: 'Dậy không đều, dễ mệt hoặc lo âu' },
    ],
  },
  {
    title: 'Bạn thấy thời điểm nào dễ “deep work” nhất?',
    choices: [
      { key: 'A', text: 'Trước trưa' },
      { key: 'B', text: 'Cuối sáng / đầu chiều' },
      { key: 'C', text: 'Sau 14h đến tối' },
      { key: 'D', text: 'Chỉ có vài khung ngắn 10–12h hoặc 14–16h' },
    ],
  },
  {
    title: 'Nhịp sinh hoạt của bạn gần giống mô tả nào nhất?',
    choices: [
      { key: 'A', text: 'Kỷ luật, ưa làm việc sớm' },
      { key: 'B', text: 'Cân bằng, hợp lịch phổ thông' },
      { key: 'C', text: 'Thiên về đêm, hiệu suất tăng dần về chiều' },
      { key: 'D', text: 'Nhạy cảm, dễ bị xao nhãng/lo âu, năng lượng phân mảnh' },
    ],
  },
];

function labelChronotype(c: Chronotype): string {
  if (c === 'lion') return 'Sư tử';
  if (c === 'bear') return 'Gấu';
  if (c === 'wolf') return 'Sói';
  return 'Cá heo';
}

function chronotypeWindow(c: Chronotype): string {
  if (c === 'lion') return '05:00–12:00';
  if (c === 'bear') return '09:00–15:00';
  if (c === 'wolf') return '12:00–21:00';
  return '10:00–12:00, 14:00–16:00';
}

function choiceToChronotype(choice: ChoiceKey): Chronotype {
  if (choice === 'A') return 'lion';
  if (choice === 'B') return 'bear';
  if (choice === 'C') return 'wolf';
  return 'dolphin';
}

function resolveChronotype(answers: ChoiceKey[]): Chronotype {
  const counts: Record<ChoiceKey, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const a of answers) counts[a] += 1;
  const top = (Object.keys(counts) as ChoiceKey[]).sort((k1, k2) => counts[k2] - counts[k1])[0];
  return choiceToChronotype(top);
}

interface Props {
  onClose: () => void;
}

export default function ChronotypeModal({ onClose }: Props) {
  const { chronotype, chronotypeUpdatedAt, setChronotype } = useTaskStore();
  const [step, setStep] = useState<'survey' | 'result'>(chronotype ? 'result' : 'survey');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(ChoiceKey | null)[]>(Array.from({ length: questions.length }).map(() => null));

  const allAnswered = useMemo(() => answers.every(a => a !== null), [answers]);
  const computed = useMemo(() => {
    const filled = answers.filter(Boolean) as ChoiceKey[];
    return filled.length === questions.length ? resolveChronotype(filled) : null;
  }, [answers]);

  const current = computed ?? chronotype;

  const setAnswer = (key: ChoiceKey) => {
    setAnswers(prev => prev.map((v, i) => (i === index ? key : v)));
  };

  const goNext = () => {
    if (index < questions.length - 1) setIndex(i => i + 1);
    else if (allAnswered) setStep('result');
  };

  const goBack = () => {
    if (step === 'result') setStep('survey');
    else if (index > 0) setIndex(i => i - 1);
  };

  const restart = () => {
    setStep('survey');
    setIndex(0);
    setAnswers(Array.from({ length: questions.length }).map(() => null));
  };

  const save = () => {
    if (!current) return;
    setChronotype(current);
    onClose();
  };

  const q = questions[index];
  const selected = answers[index];

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
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Khảo sát Chronotype</h2>
            <p className="text-xs text-zinc-500 mt-1">4 câu hỏi nhanh để cá nhân hoá gợi ý công việc</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'survey' ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-zinc-300">
                Câu {index + 1}/{questions.length}
              </div>
              <div className="text-xs text-zinc-500">
                {answers.filter(Boolean).length}/{questions.length} đã trả lời
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
              <div className="text-zinc-100 font-medium">{q.title}</div>
              <div className="mt-4 grid grid-cols-1 gap-2">
                {q.choices.map(c => {
                  const active = selected === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setAnswer(c.key)}
                      className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                        active
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-xs font-semibold mr-2 text-zinc-500">{c.key}.</span>
                      {c.text}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={goBack}
                disabled={index === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Quay lại
              </button>

              <button
                onClick={goNext}
                disabled={answers[index] === null || (!allAnswered && index === questions.length - 1)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {index === questions.length - 1 ? 'Xem kết quả' : 'Tiếp tục'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {current ? (
              <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Kết quả</div>
                    <div className="text-2xl font-semibold text-zinc-100 mt-1">{labelChronotype(current)}</div>
                    <div className="text-sm text-zinc-400 mt-2">
                      Cửa sổ năng lượng gợi ý: <span className="text-zinc-200 font-medium">{chronotypeWindow(current)}</span>
                    </div>
                    {chronotypeUpdatedAt && chronotype && current === chronotype && (
                      <div className="text-[11px] text-zinc-600 mt-2">
                        Cập nhật: {new Date(chronotypeUpdatedAt).toLocaleString('vi-VN')}
                      </div>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap justify-end gap-3">
              <button
                onClick={restart}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
              >
                Làm lại
              </button>
              <button
                onClick={save}
                disabled={!current}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                Lưu kết quả
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

