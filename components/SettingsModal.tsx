'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Key, MessageSquare, Trash2, ExternalLink } from 'lucide-react';
import { useTaskStore } from '@/lib/store';

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const { apiKeys, setApiKeys, customPrompt, setCustomPrompt, clearAllData } = useTaskStore();
  
  const [keysInput, setKeysInput] = useState(apiKeys.join('\n'));
  const [promptInput, setPromptInput] = useState(customPrompt);

  const handleSave = () => {
    const keys = keysInput.split('\n').map(k => k.trim()).filter(k => k);
    setApiKeys(keys);
    setCustomPrompt(promptInput);
    onClose();
  };

  const handleClear = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu? Hành động này không thể hoàn tác.")) {
      clearAllData();
      onClose();
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
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-zinc-100">Cài đặt hệ thống</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* API Keys */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
              <Key className="w-4 h-4" /> Gemini API Keys (Mỗi key 1 dòng)
            </label>
            <textarea
              value={keysInput}
              onChange={e => setKeysInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px] font-mono text-sm"
              placeholder="AIzaSy..."
            />
            <a 
              href="https://aistudio.google.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-2"
            >
              Lấy API Key tại Google AI Studio <ExternalLink className="w-3 h-3" />
            </a>
            <p className="text-xs text-zinc-500 mt-1">
              Hệ thống sẽ tự động thử nghiệm quay vòng (round-robin) nếu có nhiều key. Nếu để trống, sẽ dùng key mặc định của hệ thống (nếu có).
            </p>
          </div>

          {/* Custom Prompt */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Prompt tùy chỉnh đối tượng (System Instruction)
            </label>
            <textarea
              value={promptInput}
              onChange={e => setPromptInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px]"
              placeholder="VD: Bạn là một chuyên gia quản lý thời gian khắt khe dành cho sinh viên..."
            />
          </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-zinc-800">
            <h3 className="text-sm font-medium text-rose-400 mb-3">Khu vực nguy hiểm</h3>
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" /> Xóa toàn bộ dữ liệu cá nhân
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors">
            Hủy
          </button>
          <button onClick={handleSave} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors">
            Lưu cài đặt
          </button>
        </div>
      </motion.div>
    </div>
  );
}
