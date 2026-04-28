import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, List, Wallet, Tag, Target,
  RefreshCcw, BarChart2, Settings, TrendingUp, LogOut, Handshake,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/transactions', icon: List, label: 'Giao dịch', end: false },
  { to: '/wallets', icon: Wallet, label: 'Ví / Tài khoản', end: false },
  { to: '/categories', icon: Tag, label: 'Danh mục', end: false },
  { to: '/budgets', icon: Target, label: 'Ngân sách', end: false },
  { to: '/recurring', icon: RefreshCcw, label: 'Chi cố định', end: false },
  { to: '/loans', icon: Handshake, label: 'Vay / Cho vay', end: false },
  { to: '/reports', icon: BarChart2, label: 'Báo cáo', end: false },
  { to: '/settings', icon: Settings, label: 'Cài đặt', end: false },
];

export function Sidebar() {
  const { user, signOut } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 p-4 gap-2">
      {/* Logo card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm leading-tight">Quản Lý Thu Chi</h1>
            <p className="text-indigo-200 text-[10px]">Tài chính cá nhân</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/20 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  isActive ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''
                }`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                </div>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="card p-3">
        <div className="flex items-center gap-3 mb-2">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="avatar" className="w-9 h-9 rounded-xl object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              {user?.displayName?.[0] || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
              {user?.displayName?.split(' ').pop() || 'Người dùng'}
            </p>
            <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-medium"
        >
          <LogOut className="w-3.5 h-3.5" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
