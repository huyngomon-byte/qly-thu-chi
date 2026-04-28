import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, List, Wallet, Tag, Target,
  RefreshCcw, BarChart2, Settings, TrendingUp, LogOut, Handshake,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard',     end: true  },
  { to: '/transactions', icon: List,           label: 'Giao dịch',    end: false },
  { to: '/wallets',    icon: Wallet,           label: 'Ví / Tài khoản', end: false },
  { to: '/categories', icon: Tag,              label: 'Danh mục',     end: false },
  { to: '/budgets',    icon: Target,           label: 'Ngân sách',    end: false },
  { to: '/recurring',  icon: RefreshCcw,       label: 'Chi cố định',  end: false },
  { to: '/loans',      icon: Handshake,        label: 'Vay / Cho vay', end: false },
  { to: '/reports',    icon: BarChart2,        label: 'Báo cáo',      end: false },
  { to: '/settings',   icon: Settings,         label: 'Cài đặt',      end: false },
];

export function Sidebar() {
  const { user, signOut } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 p-4 gap-2 bg-white border-r border-[#ffd9e0]/40"
      style={{ boxShadow: '4px 0 24px rgba(255,143,171,0.07)' }}>

      {/* Logo */}
      <div className="bg-gradient-to-br from-[#9b3f5a] to-[#c2547a] rounded-2xl p-4 mb-2"
        style={{ boxShadow: '0 8px 24px rgba(155,63,90,0.25)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm leading-tight font-jakarta">Quản Lý Thu Chi</h1>
            <p className="text-[#ffd9e0]/80 text-[10px]">Tài chính cá nhân</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#ffd9e0]/50 text-[#9b3f5a]'
                  : 'text-[#877275] hover:bg-[#f8f2f4] hover:text-[#544245]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  isActive ? 'bg-[#ffd9e0]' : ''
                }`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#9b3f5a]' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={isActive ? 'font-semibold' : ''}>{label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#9b3f5a]" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User profile */}
      <div className="bg-[#f8f2f4] rounded-2xl p-3">
        <div className="flex items-center gap-3 mb-2">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="avatar" className="w-9 h-9 rounded-xl object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#9b3f5a] to-[#c2547a] flex items-center justify-center text-white font-bold text-sm">
              {user?.displayName?.[0] || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1d1b1d] truncate">
              {user?.displayName?.split(' ').pop() || 'Người dùng'}
            </p>
            <p className="text-[10px] text-[#877275] truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#877275] hover:text-[#9b3f5a] hover:bg-[#ffd9e0]/40 rounded-xl transition-colors font-medium"
        >
          <LogOut className="w-3.5 h-3.5" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
