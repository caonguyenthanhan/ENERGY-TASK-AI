'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, LogOut, RefreshCw, User, Key, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTaskStore } from '@/lib/store';

interface Props {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: Props) {
  const { syncData, isSyncing } = useTaskStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin,
          }
        });
        if (error) throw error;
        setSuccess('Vui lòng kiểm tra email để xác nhận tài khoản!');
      }
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setSuccess('Đổi mật khẩu thành công!');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Lỗi khi đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setActiveTab('profile');
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
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-100">
              {user ? 'Trang cá nhân' : 'Đăng nhập'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pr-2 -mr-2">
          {!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ? (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500 mb-6 text-sm">
              <p className="font-semibold mb-1">Chưa cấu hình Supabase</p>
              <p>Vui lòng thêm <code>NEXT_PUBLIC_SUPABASE_URL</code> và <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> vào biến môi trường (Environment Variables) trên Vercel hoặc AI Studio Secrets.</p>
            </div>
          ) : null}

          {error && (
            <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-sm flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {user ? (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex space-x-2 border-b border-zinc-800 pb-2">
                <button
                  onClick={() => { setActiveTab('profile'); setError(''); setSuccess(''); }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
                >
                  Thông tin
                </button>
                <button
                  onClick={() => { setActiveTab('password'); setError(''); setSuccess(''); }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'password' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
                >
                  Đổi mật khẩu
                </button>
              </div>

              {activeTab === 'profile' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                    <p className="text-zinc-500 text-xs font-medium mb-1 uppercase tracking-wider">Email đăng nhập</p>
                    <p className="text-zinc-200 font-medium truncate">{user.email}</p>
                  </div>

                  <div className="flex flex-col space-y-3">
                    <button
                      onClick={() => syncData()}
                      disabled={isSyncing}
                      className="flex items-center justify-center space-x-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ dữ liệu ngay'}</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center space-x-2 w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'password' && (
                <form onSubmit={handleChangePassword} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Mật khẩu mới</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                        <Key className="w-5 h-5" />
                      </div>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Ít nhất 6 ký tự"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !newPassword}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 mt-2"
                  >
                    {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 mt-2"
              >
                {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
              </button>

              <p className="text-center text-sm text-zinc-500 mt-4">
                {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
                  className="ml-1 text-blue-500 hover:text-blue-400 font-medium"
                >
                  {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
                </button>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
