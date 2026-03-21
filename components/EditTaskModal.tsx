'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, Clock, Activity, AlertCircle, AlertTriangle, RefreshCw, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import { Task } from '@/lib/store';

interface Props {
  task: Task;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => void;
}

export default function EditTaskModal({ task, onClose, onSave }: Props) {
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
        }
      } catch {
        parsedDeadline = null;
      }
    }

    onSave(task.id, {
      title,
      deadline: parsedDeadline,
      status,
      durationMinutes: duration,
      isImportant,
      isUrgent,
      isRoutine,
      resources,
    });
    onClose();
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
                onChange={e => setDuration(Number(e.target.value))}
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
