import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, List, Plus, Wallet, BarChart2 } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Trang chủ', end: true },
  { to: '/transactions', icon: List, label: 'Giao dịch', end: false },
];

const NAV_ITEMS_RIGHT = [
  { to: '/wallets', icon: Wallet, label: 'Ví', end: false },
  { to: '/reports', icon: BarChart2, label: 'Báo cáo', end: false },
];

export function BottomNav() {
  const navigate = useNavigate();

  return (
    <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
      <div className="bottom-nav-shadow bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-[2.5rem] border border-gray-100/80 dark:border-gray-800/80 px-2 py-2 flex items-center justify-around">

        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-indigo-600'
                  : 'text-gray-400 dark:text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/40' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-semibold transition-all ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}

        {/* FAB */}
        <button
          onClick={() => navigate('/add-transaction')}
          className="fab-shadow bg-gradient-to-br from-indigo-500 to-purple-600 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-105 -mt-6"
          aria-label="Thêm giao dịch"
        >
          <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
        </button>

        {NAV_ITEMS_RIGHT.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all duration-200 ${
                isActive ? 'text-indigo-600' : 'text-gray-400 dark:text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/40' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-semibold transition-all ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
