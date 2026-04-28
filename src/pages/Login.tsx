import { useState } from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { signInWithGoogle, error } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try { await signInWithGoogle(); } catch { /* handled in context */ }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#fef8fa] flex flex-col">
      {/* Hero */}
      <div className="relative h-72 overflow-hidden flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #9b3f5a 0%, #c2547a 50%, #d4688a 100%)' }}>
        <div className="absolute top-8 right-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-12 -left-8 w-56 h-56 bg-white/5 rounded-full" />
        <div className="absolute top-24 left-16 w-20 h-20 bg-white/10 rounded-full" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white pt-8">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-4 shadow-xl">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-jakarta">Quản Lý Thu Chi</h1>
          <p className="text-[#ffd9e0]/80 text-sm mt-1">Tài chính cá nhân đơn giản</p>
        </div>
      </div>

      {/* Bottom card */}
      <div className="flex-1 -mt-8 rounded-t-[2.5rem] bg-white px-6 pt-8 pb-10"
        style={{ boxShadow: '0 -8px 32px rgba(155,63,90,0.12)' }}>
        {/* Drag handle */}
        <div className="w-10 h-1 bg-[#dac0c4]/50 rounded-full mx-auto -mt-2 mb-6" />

        <h2 className="text-2xl font-bold text-[#1d1b1d] font-jakarta mb-1">Chào mừng! 👋</h2>
        <p className="text-[#877275] text-sm mb-8">
          Đăng nhập để bắt đầu theo dõi thu chi hàng ngày
        </p>

        <div className="space-y-4 mb-8">
          {[
            { emoji: '📊', title: 'Dashboard trực quan', desc: 'Nhìn nhanh tài chính trong 5 giây' },
            { emoji: '💰', title: 'Theo dõi mọi giao dịch', desc: 'Thu nhập, chi tiêu, chuyển khoản' },
            { emoji: '🎯', title: 'Đặt ngân sách thông minh', desc: 'Cảnh báo khi sắp vượt giới hạn' },
          ].map(f => (
            <div key={f.title} className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#ffd9e0]/40 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                {f.emoji}
              </div>
              <div>
                <p className="font-semibold text-sm text-[#1d1b1d]">{f.title}</p>
                <p className="text-xs text-[#877275]">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#ffd9e0]/40 rounded-2xl text-sm text-[#9b3f5a]">{error}</div>
        )}

        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 text-white font-semibold py-4 rounded-full transition-all active:scale-95 disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, #9b3f5a 0%, #c2547a 100%)',
            boxShadow: '0 8px 24px rgba(155,63,90,0.35)',
          }}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Đăng nhập với Google
              <ArrowRight className="w-4 h-4 ml-auto" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-[#877275] mt-4">Dữ liệu được lưu riêng tư & an toàn 🔒</p>
      </div>
    </div>
  );
}
