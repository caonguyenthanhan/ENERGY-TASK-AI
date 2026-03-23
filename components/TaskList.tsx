'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { RefreshCw, Calendar, Brain, Star, Link as LinkIcon, Plus, ListFilter, SortAsc, Sparkles, Loader2, FolderPlus, Trash2 } from 'lucide-react';
import { useTaskStore, Task, EnergyLevel } from '@/lib/store';
import { organizeTasksWithAI, sortTasksWithAI } from '@/lib/ai';
import { motion } from 'motion/react';

interface Props {
  onEditTask: (task: Task) => void;
  onAddManual: () => void;
  onCompleteTask: (taskId: string) => void;
  hideFilters?: boolean;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return null;
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return null;
    if (dateString.includes('T')) {
      return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('vi-VN');
  } catch {
    return null;
  }
};

const getQuotaErrorHint = (error: any) => {
  const raw = String(error?.message || '');
  const json = String(error?.error ? JSON.stringify(error.error) : '');
  const combined = `${raw}\n${json}`.toLowerCase();
  const isQuota = combined.includes('resource_exhausted') || combined.includes('quota') || combined.includes('exceeded your current quota') || combined.includes('429');
  if (!isQuota) return null;
  const m = combined.match(/retry in\s+([0-9.]+)s/);
  const retrySeconds = m ? Number(m[1]) : null;
  return { retrySeconds: Number.isFinite(retrySeconds as any) ? retrySeconds : null };
};

export default function TaskList({ onEditTask, onAddManual, onCompleteTask, hideFilters = false }: Props) {
  const [activeTab, setActiveTab] = useState<'todo' | 'done'>('todo');
  const [filterImportant, setFilterImportant] = useState(false);
  const [filterUrgent, setFilterUrgent] = useState(false);
  const [filterEnergy, setFilterEnergy] = useState<EnergyLevel | 'all'>('all');
  const [filterList, setFilterList] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'deadline' | 'importance' | 'urgency'>('createdAt');
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const [showListManager, setShowListManager] = useState(false);
  const [newListName, setNewListName] = useState('');

  const { tasks, resetSkippedTasks, lists, addList, updateTask, deleteTask, deleteList, apiKeys, customPrompt, reorderTasks } = useTaskStore();
  const nowRef = useRef<number>(0);

  useEffect(() => {
    nowRef.current = Date.now();
  }, [tasks]);

  const handleAddList = () => {
    if (newListName.trim()) {
      addList(newListName.trim());
      setNewListName('');
    }
  };

  const handleOrganizeAI = async () => {
    setIsOrganizing(true);
    try {
      const result = await organizeTasksWithAI(tasks.filter(t => t.status !== 'done'), lists, apiKeys, customPrompt);
      
      // Create new lists
      const newListMap: Record<string, string> = {};
      for (const listName of result.newLists) {
        const newId = addList(listName);
        newListMap[listName] = newId;
      }

      // Update tasks
      for (const update of result.tasksToUpdate) {
        const task = tasks.find(t => t.id === update.taskId);
        if (task) {
          const finalListId = newListMap[update.listId || ''] || update.listId;
          updateTask(task.id, { listId: finalListId });
        }
      }
    } catch (error) {
      console.error("Failed to organize tasks:", error);
      const hint = getQuotaErrorHint(error);
      if (hint) {
        alert(
          `Không thể dùng AI lúc này do đã vượt quota/rate limit của Gemini API (tính theo project, không theo từng API key).\n` +
          `Quota có các ngưỡng RPM/TPM/RPD; nếu vượt sẽ bị chặn và có thể cần chờ reset.\n` +
          `Gợi ý: bật billing/upgrade tier trong Google AI Studio, hoặc thử lại sau${hint.retrySeconds ? ` ~${hint.retrySeconds}s` : ''}.`
        );
      } else {
        alert("Có lỗi xảy ra khi sắp xếp công việc bằng AI.");
      }
    } finally {
      setIsOrganizing(false);
    }
  };

  const handleSortAI = async () => {
    setIsSorting(true);
    try {
      const activeTasks = tasks.filter(t => t.status === 'todo');
      if (activeTasks.length === 0) return;
      
      const sortedIds = await sortTasksWithAI(activeTasks, apiKeys, customPrompt);
      if (sortedIds && sortedIds.length > 0) {
        reorderTasks(sortedIds);
        setSortBy('createdAt'); // Ensure we are sorting by createdAt to see the new order
      }
    } catch (error) {
      console.error("Failed to sort tasks:", error);
      const hint = getQuotaErrorHint(error);
      const activeTasks = tasks.filter(t => t.status === 'todo');
      if (hint && activeTasks.length > 0) {
        const offline = [...activeTasks].sort((a, b) => {
          const ad = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
          const bd = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
          if (ad !== bd) return ad - bd;
          if (a.isImportant !== b.isImportant) return a.isImportant ? -1 : 1;
          if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        reorderTasks(offline.map(t => t.id));
        setSortBy('createdAt');
        alert(
          `AI bị chặn do quota/rate limit của Gemini API (tính theo project).\n` +
          `Đã sắp xếp offline theo hạn chót → quan trọng → gấp.\n` +
          `Gợi ý: bật billing/upgrade tier trong Google AI Studio để dùng lại AI.`
        );
      } else {
        alert("Có lỗi xảy ra khi sắp xếp ưu tiên bằng AI.");
      }
    } finally {
      setIsSorting(false);
    }
  };

  const skippedTasksCount = tasks.filter(t => t.status === 'skipped').length;

  const filteredTasks = useMemo(() => {
    let result = tasks.filter(task => {
      if (activeTab === 'todo' && task.status !== 'todo' && task.status !== 'skipped') return false;
      if (activeTab === 'done' && task.status !== 'done') return false;
      if (filterImportant && !task.isImportant) return false;
      if (filterUrgent && !task.isUrgent) return false;
      if (filterEnergy !== 'all' && task.energyRequired !== filterEnergy) return false;
      if (filterList !== 'all' && task.listId !== filterList) return false;
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'deadline') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (sortBy === 'importance') {
        return (a.isImportant === b.isImportant) ? 0 : a.isImportant ? -1 : 1;
      }
      if (sortBy === 'urgency') {
        return (a.isUrgent === b.isUrgent) ? 0 : a.isUrgent ? -1 : 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [tasks, activeTab, filterImportant, filterUrgent, filterEnergy, filterList, sortBy]);

  return (
    <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 h-[calc(100vh-10rem)] sticky top-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Danh sách công việc</h2>
        <div className="flex items-center gap-2">
          {skippedTasksCount > 0 && (
            <button
              onClick={resetSkippedTasks}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Khôi phục ({skippedTasksCount})
            </button>
          )}
          <button
            onClick={handleOrganizeAI}
            disabled={isOrganizing}
            className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors disabled:opacity-50"
            title="AI Phân loại danh sách"
          >
            {isOrganizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
          </button>
          <button
            onClick={handleSortAI}
            disabled={isSorting}
            className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
            title="AI Sắp xếp ưu tiên"
          >
            {isSorting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </button>
          <button
            onClick={onAddManual}
            className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
            title="Thêm thủ công"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-800/50 p-1 rounded-xl mb-4">
        <button
          onClick={() => setActiveTab('todo')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'todo' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-300'}`}
        >
          Chưa hoàn thành
        </button>
        <button
          onClick={() => setActiveTab('done')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'done' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-300'}`}
        >
          Đã hoàn thành
        </button>
      </div>

      {/* Filters & Sort */}
      {!hideFilters && (
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            <button onClick={() => setFilterImportant(!filterImportant)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${filterImportant ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}>Quan trọng</button>
            <button onClick={() => setFilterUrgent(!filterUrgent)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${filterUrgent ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}>Gấp</button>
            
            <select 
              value={filterEnergy} 
              onChange={(e) => setFilterEnergy(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500"
            >
              <option value="all">Mọi năng lượng</option>
              <option value="high">Năng lượng cao</option>
              <option value="normal">Năng lượng TB</option>
              <option value="low">Năng lượng thấp</option>
            </select>

            <select 
              value={filterList} 
              onChange={(e) => setFilterList(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500"
            >
              <option value="all">Tất cả danh sách</option>
              {lists.map(list => (
                <option key={list.id} value={list.id}>{list.name}</option>
              ))}
            </select>
            
            <button 
              onClick={() => setShowListManager(!showListManager)}
              className={`p-1.5 rounded-lg transition-colors ${showListManager ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
              title="Quản lý danh sách"
            >
              <FolderPlus className="w-4 h-4" />
            </button>

            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500"
            >
              <option value="createdAt">Mới nhất</option>
              <option value="deadline">Hạn chót</option>
              <option value="importance">Quan trọng</option>
              <option value="urgency">Gấp</option>
            </select>
          </div>
        </div>
      )}

      {/* List Manager */}
      {showListManager && !hideFilters && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50"
        >
          <div className="flex gap-2 mb-3">
            <input 
              type="text" 
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddList()}
              placeholder="Tên danh sách mới..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-indigo-500"
            />
            <button 
              onClick={handleAddList}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Thêm
            </button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
            {lists.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-2">Chưa có danh sách nào.</p>
            ) : (
              lists.map(list => (
                <div key={list.id} className="flex items-center justify-between group px-2 py-1.5 rounded-lg hover:bg-zinc-800">
                  <span className="text-sm text-zinc-300">{list.name}</span>
                  <button 
                    onClick={() => deleteList(list.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {filteredTasks.length === 0 ? (
          <p className="text-zinc-500 text-center py-10 text-sm">Không có công việc nào phù hợp.</p>
        ) : (
          <div className="flex flex-col gap-3 pb-4">
            {filteredTasks.map((task) => {
              const listName = lists.find(l => l.id === task.listId)?.name;
              const prereq = task.prerequisiteTaskId ? tasks.find(t => t.id === task.prerequisiteTaskId) : null;
              const prereqBlocked = prereq ? prereq.status !== 'done' : false;
              const deadlineTime = task.deadline ? new Date(task.deadline).getTime() : NaN;
              const isOverdue = task.status === 'todo' && Number.isFinite(deadlineTime) && deadlineTime < nowRef.current;
              return (
                <div
                  key={task.id}
                  onClick={() => onEditTask(task)}
                  className={`relative cursor-pointer p-4 rounded-2xl border transition-all hover:border-indigo-500/50 hover:bg-zinc-800/80 flex flex-col justify-between ${
                    task.status === 'done' ? 'bg-emerald-500/5 border-emerald-500/20' :
                    task.status === 'skipped' ? 'bg-zinc-900/50 border-zinc-800/50 opacity-60' :
                    'bg-zinc-900 border-zinc-800'
                  }`}
                >
                  <h4 className={`font-medium text-sm mb-2 flex items-start justify-between gap-2 ${task.status === 'done' ? 'text-emerald-400 line-through' : 'text-zinc-200'}`}>
                    <span className="line-clamp-2 flex items-center gap-2">
                      {task.deadline && <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      {task.isRoutine && <Brain className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      {task.isImportant && <Star className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      {task.title}
                    </span>
                    {task.resources && task.resources.length > 0 && (
                      <LinkIcon className="w-3 h-3 text-indigo-400 shrink-0 mt-1" />
                    )}
                  </h4>
                  <div className="flex flex-wrap gap-2 text-[11px] text-zinc-500 mt-2">
                    {listName && (
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                        {listName}
                      </span>
                    )}
                    {isOverdue && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400">
                        Quá hạn
                      </span>
                    )}
                    {prereq && (
                      <span className={`px-2 py-0.5 rounded ${prereqBlocked ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        Tiền đề: {prereqBlocked ? 'chưa xong' : 'đã xong'}
                      </span>
                    )}
                    {formatDate(task.deadline) && (
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        Hạn: {formatDate(task.deadline)}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-zinc-800">{task.durationMinutes}p</span>
                    {task.isImportant && <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">Quan trọng</span>}
                    {task.isUrgent && <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500">Gấp</span>}
                    <span className="px-2 py-0.5 rounded bg-zinc-800">
                      {task.status === 'todo' ? 'Cần làm' : task.status === 'done' ? 'Xong' : 'Bỏ qua'}
                    </span>
                  </div>
                  {isOverdue && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const d = task.deadline ? new Date(task.deadline) : new Date();
                        const base = isNaN(d.getTime()) ? new Date() : d;
                        base.setDate(base.getDate() + 1);
                        updateTask(task.id, { deadline: base.toISOString() });
                      }}
                      className="absolute bottom-4 right-12 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-colors text-xs font-medium"
                      title="Gia hạn 1 ngày"
                    >
                      Gia hạn +1d
                    </button>
                  )}
                  {task.status !== 'done' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const ok = window.confirm('Xoá công việc này? Hành động không thể hoàn tác.');
                        if (!ok) return;
                        deleteTask(task.id);
                      }}
                      className="absolute bottom-4 left-4 p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                      title="Xoá"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {task.status === 'todo' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCompleteTask(task.id);
                      }}
                      className="absolute bottom-4 right-4 p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
