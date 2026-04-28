import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, List, Plus, Wallet, BarChart2 } from 'lucide-react';

const NAV_LEFT  = [
  { to: '/', icon: LayoutDashboard, label: 'Trang chủ', end: true },
  { to: '/transactions', icon: List, label: 'Giao dịch', end: false },
];
const NAV_RIGHT = [
  { to: '/wallets', icon: Wallet, label: 'Ví', end: false },
  { to: '/reports', icon: BarChart2, label: 'Báo cáo', end: false },
];

export function BottomNav() {
  const navigate = useNavigate();

  const navCls = (isActive: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 px-4 py-2 transition-all duration-200 active:scale-90 ${
      isActive ? 'text-[#9b3f5a]' : 'text-[#877275] hover:text-[#c2547a]'
    }`;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 pb-safe">
      {/* floating pill */}
      <div className="bottom-nav-shadow mx-4 mb-4 bg-white/95 backdrop-blur-xl rounded-full border border-[#ffd9e0]/60 flex items-center justify-around h-16 px-2">

        {NAV_LEFT.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => navCls(isActive)}>
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[#ffd9e0]' : ''}`}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[9px] font-semibold ${isActive ? 'text-[#9b3f5a]' : 'text-[#877275]'}`}>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* FAB */}
        <button
          onClick={() => navigate('/add-transaction')}
          className="fab-shadow bg-[#9b3f5a] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-105 -mt-7 border-4 border-white"
          aria-label="Thêm giao dịch"
        >
          <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
        </button>

        {NAV_RIGHT.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => navCls(isActive)}>
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[#ffd9e0]' : ''}`}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[9px] font-semibold ${isActive ? 'text-[#9b3f5a]' : 'text-[#877275]'}`}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
