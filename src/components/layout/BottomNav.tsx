import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, List, Plus, Wallet, BarChart2,
  Target, Tag, RefreshCcw, Handshake, Settings,
  MoreHorizontal, X,
} from 'lucide-react';

// Primary nav — always visible
const PRIMARY = [
  { to: '/',             icon: LayoutDashboard, label: 'Trang chủ', end: true  },
  { to: '/transactions', icon: List,            label: 'Giao dịch', end: false },
];
const PRIMARY_RIGHT = [
  { to: '/wallets', icon: Wallet, label: 'Ví', end: false },
];

// All pages shown in the "More" sheet
const MORE_ITEMS = [
  { to: '/loans',     icon: Handshake,  label: 'Vay/Cho vay', color: '#e2dfff', iconColor: '#4d44e3' },
  { to: '/budgets',   icon: Target,     label: 'Ngân sách',   color: '#ffd9e0', iconColor: '#9b3f5a' },
  { to: '/reports',   icon: BarChart2,  label: 'Báo cáo',     color: '#a4f1e3', iconColor: '#146a5f' },
  { to: '/categories',icon: Tag,        label: 'Danh mục',    color: '#ffd9e0', iconColor: '#9b3f5a' },
  { to: '/recurring', icon: RefreshCcw, label: 'Chi cố định', color: '#e2dfff', iconColor: '#4d44e3' },
  { to: '/settings',  icon: Settings,   label: 'Cài đặt',     color: '#f8f2f4', iconColor: '#877275' },
];

// Routes that belong to the More sheet (for active state detection)
const MORE_ROUTES = MORE_ITEMS.map(m => m.to);

export function BottomNav() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  const isMoreActive = MORE_ROUTES.some(r => location.pathname.startsWith(r));

  const navCls = (isActive: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 px-3 py-2 transition-all duration-200 active:scale-90 ${
      isActive ? 'text-[#9b3f5a]' : 'text-[#877275]'
    }`;

  const handleMoreNav = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <>
      {/* ── More sheet backdrop ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── More bottom sheet ── */}
      <div
        className={`lg:hidden fixed left-0 right-0 z-[70] transition-all duration-300 ease-out ${
          open ? 'bottom-0' : '-bottom-full'
        }`}
      >
        <div className="bg-white rounded-t-[2rem] shadow-[0_-8px_40px_rgba(155,63,90,0.15)] px-5 pt-5 pb-10">
          {/* Handle + header */}
          <div className="w-10 h-1 bg-[#dac0c4]/50 rounded-full mx-auto mb-5" />
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-[#1d1b1d] font-jakarta">Tất cả chức năng</h2>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-[#f8f2f4] flex items-center justify-center text-[#877275]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-3 gap-3">
            {MORE_ITEMS.map(({ to, icon: Icon, label, color, iconColor }) => {
              const isActive = location.pathname.startsWith(to);
              return (
                <button
                  key={to}
                  onClick={() => handleMoreNav(to)}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-[1.25rem] transition-all active:scale-95 border-2 ${
                    isActive
                      ? 'border-[#ff8fab] bg-[#ffd9e0]/30'
                      : 'border-transparent bg-[#f8f2f4]'
                  }`}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: color + (isActive ? '' : '80') }}
                  >
                    <Icon className="w-6 h-6" style={{ color: iconColor }} strokeWidth={2} />
                  </div>
                  <span className={`text-[11px] font-semibold leading-tight text-center ${
                    isActive ? 'text-[#9b3f5a]' : 'text-[#544245]'
                  }`}>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick add shortcut */}
          <button
            onClick={() => { setOpen(false); navigate('/add-transaction'); }}
            className="w-full mt-4 py-3.5 rounded-full text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #9b3f5a 0%, #c2547a 100%)', boxShadow: '0 6px 20px rgba(155,63,90,0.30)' }}
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            Thêm giao dịch mới
          </button>
        </div>
      </div>

      {/* ── Bottom nav pill ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50">
        <div
          className="bottom-nav-shadow mx-4 mb-4 bg-white/95 backdrop-blur-xl rounded-full border border-[#ffd9e0]/60 flex items-center justify-around h-16 px-2"
        >
          {/* Left items */}
          {PRIMARY.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => navCls(isActive)}>
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[#ffd9e0]' : ''}`}>
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className="text-[9px] font-semibold">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* FAB */}
          <button
            onClick={() => { setOpen(false); navigate('/add-transaction'); }}
            className="fab-shadow bg-[#9b3f5a] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-105 -mt-7 border-4 border-white flex-shrink-0"
            aria-label="Thêm giao dịch"
          >
            <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>

          {/* Right: Wallets */}
          {PRIMARY_RIGHT.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => navCls(isActive)}>
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[#ffd9e0]' : ''}`}>
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className="text-[9px] font-semibold">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* More button */}
          <button
            onClick={() => setOpen(prev => !prev)}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 transition-all active:scale-90 ${
              isMoreActive || open ? 'text-[#9b3f5a]' : 'text-[#877275]'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${isMoreActive || open ? 'bg-[#ffd9e0]' : ''}`}>
              <MoreHorizontal className="w-5 h-5" strokeWidth={isMoreActive || open ? 2.5 : 2} />
            </div>
            <span className="text-[9px] font-semibold">Thêm</span>
          </button>
        </div>
      </nav>
    </>
  );
}
