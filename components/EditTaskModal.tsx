'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, Clock, Activity, AlertCircle, AlertTriangle, RefreshCw, Link as LinkIcon, Plus, Trash2, Folder, SplitSquareHorizontal, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { Task, useTaskStore } from '@/lib/store';
import { breakDownTaskWithAI } from '@/lib/ai';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  task: Task;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => void;
}

export default function EditTaskModal({ task, onClose, onSave }: Props) {
  const toLocalInputValue = (d: Date) => {
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  };

  const getInitialDeadline = () => {
    if (!task.deadline) return '';
    try {
      const d = new Date(task.deadline);
      if (isNaN(d.getTime())) return '';
      // Return YYYY-MM-DDThh:mm format for datetime-local input
      return d.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const [title, setTitle] = useState(task.title);
  const [deadline, setDeadline] = useState(getInitialDeadline());
  const [status, setStatus] = useState(task.status);
  const [duration, setDuration] = useState(task.durationMinutes);
  const [isImportant, setIsImportant] = useState(task.isImportant);
  const [isUrgent, setIsUrgent] = useState(task.isUrgent);
  const [isRoutine, setIsRoutine] = useState(task.isRoutine || false);
  const [resources, setResources] = useState<string[]>(task.resources || []);
  const [newResource, setNewResource] = useState('');
  const [listId, setListId] = useState<string | null>(task.listId || null);
  const [prerequisiteTaskId, setPrerequisiteTaskId] = useState<string | null>(task.prerequisiteTaskId || null);
  const [startAfterPrereq, setStartAfterPrereq] = useState(task.startAfterPrerequisiteDays === 1);
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [isBreakingDown, setIsBreakingDown] = useState(false);

  const { lists, tasks: allTasks, apiKeys, customPrompt, deleteTask } = useTaskStore();

  const suggestions = useMemo(() => {
    const t = (title || '').toLowerCase();
    const hasAny = (keys: string[]) => keys.some(k => t.includes(k));

    const durationCandidates: number[] = [];
    if (hasAny(['call', 'meet', 'họp', 'meeting'])) durationCandidates.push(30);
    if (hasAny(['đọc', 'read', 'review', 'soát', 'kiểm'])) durationCandidates.push(45);
    if (hasAny(['code', 'dev', 'fix', 'bug', 'sửa'])) durationCandidates.push(60);
    if (durationCandidates.length === 0) durationCandidates.push(30, 60);

    const now = new Date();
    const today1700 = new Date(now);
    today1700.setHours(17, 0, 0, 0);
    const tomorrow0900 = new Date(now);
    tomorrow0900.setDate(tomorrow0900.getDate() + 1);
    tomorrow0900.setHours(9, 0, 0, 0);

    return {
      durations: Array.from(new Set(durationCandidates)).slice(0, 3),
      deadlines: [
        { label: 'Hôm nay 17:00', value: toLocalInputValue(today1700) },
        { label: 'Mai 09:00', value: toLocalInputValue(tomorrow0900) },
      ],
    };
  }, [title]);

  const handleAddResource = () => {
    if (newResource.trim()) {
      setResources([...resources, newResource.trim()]);
      setNewResource('');
    }
  };

  const handleRemoveResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    let parsedDeadline = null;
    if (deadline) {
      try {
        const d = new Date(deadline);
        if (!isNaN(d.getTime())) {
          parsedDeadline = d.toISOString();
        } else {
          alert('Định dạng hạn chót không hợp lệ. Vui lòng kiểm tra lại.');
          return;
        }
      } catch {
        alert('Định dạng hạn chót không hợp lệ. Vui lòng kiểm tra lại.');
        return;
      }
    }

    const parsedDuration = Math.round(Number(duration));
    if (!Number.isFinite(parsedDuration) || parsedDuration < 1) {
      alert('Thời lượng phải là một số nguyên dương.');
      return;
    }

    onSave(task.id, {
      title: title.trim() || 'Công việc không tên',
      deadline: parsedDeadline,
      status,
      durationMinutes: parsedDuration,
      isImportant,
      isUrgent,
      isRoutine,
      resources,
      listId,
      prerequisiteTaskId,
      startAfterPrerequisiteDays: prerequisiteTaskId ? (startAfterPrereq ? 1 : 0) : 0,
      subtasks,
    });
    onClose();
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    setSubtasks(prev => [...prev, { id: uuidv4(), title: newSubtask.trim(), isCompleted: false }]);
    setNewSubtask('');
  };

  const toggleSubtask = (subId: string) => {
    setSubtasks(prev => prev.map(s => s.id === subId ? { ...s, isCompleted: !s.isCompleted } : s));
  };

  const removeSubtask = (subId: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== subId));
  };

  const handleBreakDown = async () => {
    setIsBreakingDown(true);
    try {
      const steps = await breakDownTaskWithAI(title.trim() || task.title, apiKeys, customPrompt, allTasks);
      setSubtasks(prev => {
        const existing = new Set(prev.map(s => s.title.trim().toLowerCase()));
        const next = [...prev];
        for (const step of steps) {
          const t = String(step || '').trim();
          if (!t) continue;
          const key = t.toLowerCase();
          if (existing.has(key)) continue;
          existing.add(key);
          next.push({ id: uuidv4(), title: t, isCompleted: false });
        }
        return next;
      });
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Lỗi khi chia nhỏ công việc.');
    } finally {
      setIsBreakingDown(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
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
          <h2 className="text-xl font-semibold text-zinc-100">Chỉnh sửa công việc</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nội dung công việc</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              placeholder="Nhập tên công việc..."
            />
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
            <div className="text-sm font-medium text-zinc-300 mb-3">Gợi ý nhanh</div>
            <div className="flex flex-wrap gap-2">
              {suggestions.durations.map(d => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium hover:border-zinc-700 transition-colors"
                >
                  {d}p
                </button>
              ))}
              {suggestions.deadlines.map(x => (
                <button
                  key={x.label}
                  onClick={() => setDeadline(x.value)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium hover:border-zinc-700 transition-colors"
                >
                  {x.label}
                </button>
              ))}
              <button
                onClick={() => setIsImportant(true)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                  isImportant ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                Quan trọng
              </button>
              <button
                onClick={() => setIsUrgent(true)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                  isUrgent ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                Gấp
              </button>
              <button
                onClick={() => setIsRoutine(true)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                  isRoutine ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                Thường nhật
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Hạn chót
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Thời lượng (phút)
              </label>
              <input
                type="number"
                value={duration}
                min={1}
                step={5}
                onChange={e => setDuration(e.target.value === '' ? NaN : Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setIsImportant(!isImportant)}
              className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl border transition-colors text-sm ${
                isImportant 
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' 
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
              }`}
            >
              <AlertCircle className="w-4 h-4" /> Quan trọng
            </button>
            <button
              onClick={() => setIsUrgent(!isUrgent)}
              className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl border transition-colors text-sm ${
                isUrgent 
                  ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' 
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
              }`}
            >
              <AlertTriangle className="w-4 h-4" /> Gấp
            </button>
            <button
              onClick={() => setIsRoutine(!isRoutine)}
              className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl border transition-colors text-sm ${
                isRoutine 
                  ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' 
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
              }`}
            >
              <RefreshCw className="w-4 h-4" /> Thường nhật
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> Tài liệu đính kèm (Link/Path)
            </label>
            <div className="space-y-2 mb-2">
              {resources.map((res, idx) => (
                <div key={idx} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
                  <span className="text-sm text-zinc-300 truncate max-w-[300px]">{res}</span>
                  <button onClick={() => handleRemoveResource(idx)} className="text-zinc-500 hover:text-rose-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newResource}
                onChange={e => setNewResource(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddResource()}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                placeholder="Thêm link tài liệu..."
              />
              <button onClick={handleAddResource} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-300">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <SplitSquareHorizontal className="w-4 h-4 text-indigo-400" />
                Chia nhỏ (subtasks)
              </div>
              <button
                onClick={handleBreakDown}
                disabled={isBreakingDown}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                {isBreakingDown ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SplitSquareHorizontal className="w-3.5 h-3.5" />}
                AI chia nhỏ
              </button>
            </div>

            {subtasks.length > 0 ? (
              <div className="space-y-2 mb-3">
                {subtasks.map(s => (
                  <div key={s.id} className="flex items-start justify-between gap-3 p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                    <button onClick={() => toggleSubtask(s.id)} className={`mt-0.5 ${s.isCompleted ? 'text-emerald-400' : 'text-zinc-600 hover:text-zinc-300'} transition-colors`}>
                      {s.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </button>
                    <div className={`text-sm flex-1 min-w-0 ${s.isCompleted ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                      {s.title}
                    </div>
                    <button onClick={() => removeSubtask(s.id)} className="text-zinc-500 hover:text-rose-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-zinc-500 italic mb-3">Chưa có bước nào.</div>
            )}

            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Thêm bước nhỏ thủ công..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
              />
              <button
                type="submit"
                disabled={!newSubtask.trim()}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition-colors disabled:opacity-50"
              >
                Thêm
              </button>
            </form>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5 flex items-center gap-2">
              <Folder className="w-4 h-4" /> Danh sách
            </label>
            <select
              value={listId || ''}
              onChange={e => setListId(e.target.value || null)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
            >
              <option value="">Không có danh sách</option>
              {lists.map(list => (
                <option key={list.id} value={list.id}>{list.name}</option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
            <div className="text-sm font-medium text-zinc-300 mb-3">Task tiền đề</div>
            <select
              value={prerequisiteTaskId || ''}
              onChange={e => setPrerequisiteTaskId(e.target.value || null)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
            >
              <option value="">Không có</option>
              {allTasks
                .filter(t => t.id !== task.id)
                .sort((a, b) => (a.status === b.status ? a.title.localeCompare(b.title) : a.status === 'done' ? -1 : 1))
                .map(t => (
                  <option key={t.id} value={t.id}>
                    {t.status === 'done' ? '✓ ' : ''}
                    {t.title}
                  </option>
                ))}
            </select>

            <div className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                checked={startAfterPrereq}
                disabled={!prerequisiteTaskId}
                onChange={(e) => setStartAfterPrereq(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500/50 disabled:opacity-50"
              />
              <span className="text-sm text-zinc-400">Bắt đầu ngày sau khi tiền đề hoàn thành</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Trạng thái
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
            >
              <option value="todo">Cần làm</option>
              <option value="done">Đã hoàn thành</option>
              <option value="skipped">Bỏ qua / Dời lại</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={() => {
              const ok = window.confirm('Xoá công việc này? Hành động không thể hoàn tác.');
              if (!ok) return;
              deleteTask(task.id);
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium transition-colors"
          >
            Xoá
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            Lưu thay đổi
          </button>
        </div>
      </motion.div>
    </div>
  );
}
