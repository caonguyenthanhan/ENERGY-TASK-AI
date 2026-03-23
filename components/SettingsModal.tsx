'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { X, Key, MessageSquare, Trash2, ExternalLink, Image as ImageIcon, Palette, Video, Star, Loader2, Activity } from 'lucide-react';
import { useTaskStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import ChronotypeModal from '@/components/ChronotypeModal';
import LockedFeatureModal from '@/components/LockedFeatureModal';
import { FeatureKey, getFeatureLabel, getRequiredPoints, isFeatureUnlocked } from '@/lib/features';

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const { apiKeys, setApiKeys, customPrompt, setCustomPrompt, clearAllData, backgroundType, backgroundValue, backgroundIsPublic, setBackground, backgroundOverlayOpacity, setBackgroundOverlayOpacity, backgroundOverlayColor, setBackgroundOverlayColor, pointSettings, setPointSettings, chronotype, chronotypeUpdatedAt, points, user } = useTaskStore();
  
  const [keysInput, setKeysInput] = useState(apiKeys.join('\n'));
  const [promptInput, setPromptInput] = useState(customPrompt);
  const [bgType, setBgType] = useState(backgroundType || 'color');
  const [bgValue, setBgValue] = useState(backgroundValue || '#f3f4f6');
  const [bgIsPublic, setBgIsPublic] = useState(backgroundIsPublic || false);
  const [overlayOpacity, setOverlayOpacity] = useState(backgroundOverlayOpacity ?? 0.7);
  const [overlayColor, setOverlayColor] = useState(backgroundOverlayColor || '#000000');
  const [pointDraft, setPointDraft] = useState(pointSettings);
  const [bgTab, setBgTab] = useState<'custom' | 'templates'>('custom');
  const [publicTemplates, setPublicTemplates] = useState<{id: string, type: string, value: string, name: string}[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [showChronotype, setShowChronotype] = useState(false);
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [lockedFeature, setLockedFeature] = useState<FeatureKey | null>(null);
  const email = user?.email as string | undefined;
  const backgroundMediaEnabled = isFeatureUnlocked({ feature: 'backgroundMedia', points, email });
  const backgroundPublicTemplatesEnabled = isFeatureUnlocked({ feature: 'backgroundPublicTemplates', points, email });

  const chronotypeLabel = () => {
    if (!chronotype) return 'Chưa thiết lập';
    if (chronotype === 'lion') return 'Sư tử';
    if (chronotype === 'bear') return 'Gấu';
    if (chronotype === 'wolf') return 'Sói';
    return 'Cá heo';
  };

  const defaultTemplates = useMemo(() => [
    { id: 't1', type: 'image', value: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop', name: 'Bãi biển' },
    { id: 't2', type: 'image', value: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1000&auto=format&fit=crop', name: 'Núi non' },
    { id: 't3', type: 'image', value: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1000&auto=format&fit=crop', name: 'Thiên nhiên' },
    { id: 't4', type: 'color', value: '#1e1e2e', name: 'Dark Mode' },
    { id: 't5', type: 'color', value: '#fdf6e3', name: 'Light Mode' },
  ], []);

  const fetchPublicTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('state')
        .eq('state->>backgroundIsPublic', 'true');

      if (error) throw error;

      if (data) {
        const normalize = (rowState: any) => {
          const s = typeof rowState === 'string' ? (() => { try { return JSON.parse(rowState); } catch { return null; } })() : rowState;
          if (!s || typeof s !== 'object') return null;
          const type = typeof (s as any).backgroundType === 'string' ? (s as any).backgroundType : null;
          const value = typeof (s as any).backgroundValue === 'string' ? (s as any).backgroundValue : null;
          if (!type || !value) return null;
          if (type !== 'color' && type !== 'image' && type !== 'video') return null;
          if (type === 'color') return { type, value };
          if (!value.startsWith('http')) return null;
          return { type, value };
        };

        const fetched = data
          .map((d: any) => normalize(d.state))
          .filter(Boolean)
          .map((d: any, i: number) => ({
            id: `pub_${i}`,
            type: d.type as string,
            value: d.value as string,
            name: `Mẫu cộng đồng ${i + 1}`,
          }));
        
        // Remove duplicates based on value
        const uniqueFetched = Array.from(new Map(fetched.map(item => [item.value, item])).values());
        setPublicTemplates([...defaultTemplates, ...uniqueFetched]);
      } else {
        setPublicTemplates(defaultTemplates);
      }
    } catch (e) {
      console.error("Failed to fetch public templates:", e);
      setPublicTemplates(defaultTemplates);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [defaultTemplates]);

  useEffect(() => {
    if (bgTab === 'templates') {
      fetchPublicTemplates();
    }
  }, [bgTab, fetchPublicTemplates]);

  const readAsDataURL = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsDataURL(file);
    });
  };

  const getRecommendedOverlayColor = async (type: 'color' | 'image' | 'video', value: string) => {
    if (type !== 'image') return '#000000';
    if (!value) return '#000000';
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const loaded = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image load failed'));
      });
      img.src = value;
      await loaded;

      const canvas = document.createElement('canvas');
      const w = 24;
      const h = 24;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return '#000000';
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a === 0) continue;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count += 1;
      }
      if (count === 0) return '#000000';
      const rr = r / count;
      const gg = g / count;
      const bb = b / count;
      const luma = (0.2126 * rr + 0.7152 * gg + 0.0722 * bb) / 255;
      return luma > 0.6 ? '#000000' : '#ffffff';
    } catch {
      return '#000000';
    }
  };

  const uploadBackgroundToStorage = async (file: File) => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return null;

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const safeExt = ext && ext.length <= 8 ? ext : 'bin';
    const path = `${userId}/${Date.now()}.${safeExt}`;
    const { error: uploadError } = await supabase
      .storage
      .from('backgrounds')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) return null;

    const { data } = supabase.storage.from('backgrounds').getPublicUrl(path);
    return data?.publicUrl || null;
  };

  const handleSave = () => {
    const isHexColor = typeof bgValue === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(bgValue);
    const finalBgType = bgType !== 'color' && !backgroundMediaEnabled ? 'color' : bgType;
    const finalBgValue = finalBgType === 'color' ? (isHexColor ? bgValue : '#f3f4f6') : bgValue;
    const keys = keysInput.split('\n').map(k => k.trim()).filter(k => k);
    setApiKeys(keys);
    setCustomPrompt(promptInput);
    setBackground(finalBgType as any, finalBgValue, bgIsPublic);
    setBackgroundOverlayOpacity(finalBgType === 'color' ? 0.7 : overlayOpacity);
    setBackgroundOverlayColor(finalBgType === 'color' ? '#000000' : overlayColor);
    setPointSettings(pointDraft);
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

          {/* Point Settings */}
          <div className="pt-6 border-t border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4" /> Cài đặt điểm thưởng
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Điểm cơ bản</label>
                <input type="number" value={pointDraft.base} onChange={e => setPointDraft({...pointDraft, base: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Thưởng quan trọng</label>
                <input type="number" value={pointDraft.importantBonus} onChange={e => setPointDraft({...pointDraft, importantBonus: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Thưởng gấp</label>
                <input type="number" value={pointDraft.urgentBonus} onChange={e => setPointDraft({...pointDraft, urgentBonus: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 text-sm" />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Nhịp sinh học
            </h3>
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-medium text-zinc-200 truncate">Chronotype: {chronotypeLabel()}</div>
                <div className="text-xs text-zinc-500 mt-1">
                  {chronotypeUpdatedAt ? `Cập nhật: ${new Date(chronotypeUpdatedAt).toLocaleString('vi-VN')}` : 'Làm khảo sát 4 câu để cá nhân hoá gợi ý task'}
                </div>
              </div>
              <button
                onClick={() => setShowChronotype(true)}
                className="shrink-0 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
              >
                Khảo sát
              </button>
            </div>
          </div>

          {/* Background Settings */}
          <div className="pt-6 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Hình nền ứng dụng
              </h3>
              <div className="flex bg-zinc-900 rounded-lg p-1">
                <button
                  onClick={() => setBgTab('custom')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${bgTab === 'custom' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  Tùy chỉnh
                </button>
                <button
                  onClick={() => (backgroundPublicTemplatesEnabled ? setBgTab('templates') : setLockedFeature('backgroundPublicTemplates'))}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${bgTab === 'templates' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'} ${backgroundPublicTemplatesEnabled ? '' : 'opacity-60'}`}
                >
                  Mẫu (Public)
                </button>
              </div>
            </div>
            
            {bgTab === 'custom' ? (
              <>
                <div className="flex gap-4 mb-4">
                  <button 
                    onClick={() => setBgType('color')}
                    className={`flex-1 py-2 px-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${bgType === 'color' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
                  >
                    <Palette className="w-4 h-4" /> Màu sắc
                  </button>
                  <button 
                    onClick={() => (backgroundMediaEnabled ? setBgType('image') : setLockedFeature('backgroundMedia'))}
                    className={`flex-1 py-2 px-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${bgType === 'image' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'} ${backgroundMediaEnabled ? '' : 'opacity-60'}`}
                  >
                    <ImageIcon className="w-4 h-4" /> Hình ảnh
                  </button>
                  <button 
                    onClick={() => (backgroundMediaEnabled ? setBgType('video') : setLockedFeature('backgroundMedia'))}
                    className={`flex-1 py-2 px-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${bgType === 'video' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'} ${backgroundMediaEnabled ? '' : 'opacity-60'}`}
                  >
                    <Video className="w-4 h-4" /> Video
                  </button>
                </div>

                {bgType === 'color' && (
                  <div className="flex items-center gap-4">
                    <input 
                      type="color" 
                      value={bgValue} 
                      onChange={(e) => setBgValue(e.target.value)}
                      className="w-12 h-12 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-zinc-400 text-sm">{bgValue}</span>
                  </div>
                )}

                {(bgType === 'image' || bgType === 'video') && backgroundMediaEnabled && (
                  <div>
                    <input 
                      type="file" 
                      accept={bgType === 'image' ? "image/*" : "video/mp4,video/webm"}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            alert("Vui lòng chọn file nhỏ hơn 5MB để đảm bảo hiệu suất đồng bộ.");
                            return;
                          }
                          setIsUploadingBg(true);
                          try {
                            const uploadedUrl = await uploadBackgroundToStorage(file);
                            if (uploadedUrl) {
                              setBgValue(uploadedUrl);
                              setOverlayColor(await getRecommendedOverlayColor(bgType, uploadedUrl));
                            } else {
                              const dataUrl = await readAsDataURL(file);
                              setBgValue(dataUrl);
                              setOverlayColor(await getRecommendedOverlayColor(bgType, dataUrl));
                              alert('Không thể upload lên Supabase Storage. Ứng dụng sẽ dùng ảnh cục bộ (có thể không đồng bộ giữa các trình duyệt).');
                            }
                          } finally {
                            setIsUploadingBg(false);
                          }
                        }
                      }}
                      className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 transition-colors"
                    />
                    <div className="mt-2 text-xs">
                      {isUploadingBg ? (
                        <p className="text-indigo-400">Đang tải lên...</p>
                      ) : bgValue ? (
                        <p className="text-emerald-500">Đã chọn nền.</p>
                      ) : null}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <input type="checkbox" id="bgPublic" checked={bgIsPublic} onChange={e => setBgIsPublic(e.target.checked)} className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500/50" />
                      <label htmlFor="bgPublic" className="text-sm text-zinc-400">Chia sẻ hình nền này làm mẫu công khai</label>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                {isLoadingTemplates ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {publicTemplates.map(t => (
                      <button
                        key={t.id}
                        onClick={async () => {
                          setBgType(t.type as 'color' | 'image' | 'video');
                          setBgValue(t.value);
                          setBgIsPublic(false);
                          setOverlayColor(await getRecommendedOverlayColor(t.type as any, t.value));
                        }}
                        className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${bgValue === t.value ? 'border-indigo-500' : 'border-transparent hover:border-zinc-700'}`}
                      >
                        {t.type === 'color' ? (
                          <div className="absolute inset-0" style={{ backgroundColor: t.value }} />
                        ) : t.type === 'video' ? (
                          <video src={t.value} className="absolute inset-0 w-full h-full object-cover" muted loop playsInline />
                        ) : (
                          <img src={t.value} alt={t.name} className="absolute inset-0 w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-black/50 p-2">
                          <p className="text-xs text-white font-medium truncate">{t.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(bgType === 'image' || bgType === 'video') && backgroundMediaEnabled && (
              <div className="mt-5 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                <div className="flex items-center justify-between mb-4 gap-4">
                  <div className="text-sm font-medium text-zinc-300">Màu lớp phủ</div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={async () => setOverlayColor(await getRecommendedOverlayColor(bgType, bgValue))}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                    >
                      Tự động
                    </button>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={overlayColor}
                        onChange={(e) => setOverlayColor(e.target.value)}
                        className="w-9 h-9 rounded cursor-pointer bg-transparent border-0 p-0"
                      />
                      <span className="text-xs text-zinc-500">{overlayColor.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-zinc-300">Độ mờ lớp phủ</div>
                  <div className="text-xs text-zinc-500">{Math.round(overlayOpacity * 100)}%</div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(overlayOpacity * 100)}
                  onChange={(e) => setOverlayOpacity(Math.max(0, Math.min(1, Number(e.target.value) / 100)))}
                  className="w-full accent-indigo-500"
                />
                <p className="text-xs text-zinc-500 mt-2">
                  Điều chỉnh độ tối phía trước ảnh/video để chữ dễ đọc hơn.
                </p>
              </div>
            )}
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

      {showChronotype && (
        <ChronotypeModal onClose={() => setShowChronotype(false)} />
      )}
      {lockedFeature && (
        <LockedFeatureModal
          title={getFeatureLabel(lockedFeature)}
          requiredPoints={getRequiredPoints(lockedFeature)}
          currentPoints={points}
          onClose={() => setLockedFeature(null)}
        />
      )}
    </div>
  );
}
