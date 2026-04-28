import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Bell, Settings } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { useWallets } from '../hooks/useWallets';
import { useCategories } from '../hooks/useCategories';
import { useBudgets } from '../hooks/useBudgets';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import {
  getTotalIncome, getTotalExpense, getDailyData,
  getCategoryData, getTopCategories, getBudgetUsage, filterByDateRange,
} from '../utils/calculations';
import { formatCurrency, formatCompact } from '../utils/currency';
import {
  getCurrentMonth, getMonthRange, getMonthLabel,
  getPrevMonth, getNextMonth, getTodayRange, getWeekRange, formatDate,
} from '../utils/date';

const CHART_COLORS = ['#6366f1', '#f97316', '#ec4899', '#10b981', '#eab308', '#3b82f6', '#14b8a6', '#a855f7'];

const WALLET_ICONS: Record<string, string> = {
  cash: '💵', bank: '🏦', ewallet: '📱', credit: '💳', savings: '🏧', other: '📦',
};

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [month, setMonth] = useState(getCurrentMonth());

  const { transactions, loading } = useTransactions(user?.uid);
  const { wallets, totalBalance } = useWallets(user?.uid);
  const { categories } = useCategories(user?.uid);
  const { budget } = useBudgets(user?.uid, month);

  const { start, end } = useMemo(() => getMonthRange(month), [month]);
  const monthTx = useMemo(() => filterByDateRange(transactions, start, end), [transactions, start, end]);

  const todayTx = useMemo(() => {
    const { start: s, end: e } = getTodayRange();
    return filterByDateRange(transactions, s, e);
  }, [transactions]);

  const weekTx = useMemo(() => {
    const { start: s, end: e } = getWeekRange();
    return filterByDateRange(transactions, s, e);
  }, [transactions]);

  const totalIncome = useMemo(() => getTotalIncome(monthTx), [monthTx]);
  const totalExpense = useMemo(() => getTotalExpense(monthTx), [monthTx]);
  const todayExpense = useMemo(() => getTotalExpense(todayTx), [todayTx]);
  const weekExpense = useMemo(() => getTotalExpense(weekTx), [weekTx]);

  const dailyData = useMemo(() => getDailyData(monthTx, month), [monthTx, month]);
  const categoryData = useMemo(() => getCategoryData(monthTx, categories), [monthTx, categories]);
  const topCategories = useMemo(() => getTopCategories(categoryData, 5), [categoryData]);

  const budgetUsage = useMemo(() => {
    if (!budget?.totalBudget) return null;
    return getBudgetUsage(totalExpense, budget.totalBudget);
  }, [budget, totalExpense]);

  if (loading) return <LoadingSpinner fullScreen text="Đang tải..." />;

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-xl border border-gray-100 dark:border-gray-700 text-xs">
        <p className="font-semibold text-gray-600 dark:text-gray-300 mb-1">Ngày {label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
            {p.dataKey === 'income' ? '↑ Thu' : '↓ Chi'}: {formatCompact(p.value)}
          </p>
        ))}
      </div>
    );
  };

  const firstName = user?.displayName?.split(' ').pop() || 'bạn';

  return (
    <div className="px-4 pt-5 pb-4 lg:px-6 max-w-xl mx-auto lg:max-w-5xl space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium">Xin chào 👋</p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{firstName}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/settings')}
            className="w-9 h-9 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-500 shadow-sm"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Budget alert */}
      {budgetUsage && budgetUsage.status !== 'safe' && (
        <div className={`flex items-center gap-3 p-4 rounded-3xl animate-slide-up ${
          budgetUsage.status === 'over'
            ? 'bg-red-500'
            : 'bg-amber-500'
        } text-white`}>
          <Bell className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">
              {budgetUsage.status === 'over' ? 'Đã vượt ngân sách tháng!' : 'Sắp chạm ngân sách!'}
            </p>
            <p className="text-xs opacity-80">
              Đã chi {budgetUsage.percentage.toFixed(0)}% — {formatCompact(totalExpense)} / {formatCompact(budget!.totalBudget)}
            </p>
          </div>
        </div>
      )}

      {/* Hero balance card */}
      <div className="hero-gradient rounded-[2rem] p-6 relative overflow-hidden text-white animate-slide-up"
        style={{ boxShadow: '0 16px 48px rgba(99,102,241,0.35)' }}>
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -left-6 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 right-12 w-20 h-20 bg-white/5 rounded-full" />

        {/* Month nav */}
        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur rounded-2xl p-1">
            <button onClick={() => setMonth(getPrevMonth(month))} className="p-1 rounded-xl hover:bg-white/20 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2">{getMonthLabel(month)}</span>
            <button onClick={() => setMonth(getNextMonth(month))} className="p-1 rounded-xl hover:bg-white/20 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-xs text-indigo-200 font-medium">Số dư ví</span>
        </div>

        {/* Balance */}
        <div className="relative mb-5">
          <p className="text-indigo-200 text-xs font-medium mb-0.5">Tổng số dư</p>
          <p className="text-4xl font-bold tracking-tight">{formatCurrency(totalBalance)}</p>
        </div>

        {/* Income / Expense pills */}
        <div className="relative flex gap-3">
          <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 bg-emerald-400/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-3 h-3 text-emerald-300" />
              </div>
              <span className="text-indigo-200 text-[11px] font-medium">Thu nhập</span>
            </div>
            <p className="font-bold text-sm">{formatCompact(totalIncome)}</p>
          </div>
          <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 bg-rose-400/30 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-3 h-3 text-rose-300" />
              </div>
              <span className="text-indigo-200 text-[11px] font-medium">Chi tiêu</span>
            </div>
            <p className="font-bold text-sm">{formatCompact(totalExpense)}</p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs text-gray-400 mb-1">Chi hôm nay</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCompact(todayExpense)}</p>
          <div className="w-8 h-1 bg-gradient-to-r from-rose-400 to-orange-400 rounded-full mt-2" />
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-400 mb-1">Chi tuần này</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCompact(weekExpense)}</p>
          <div className="w-8 h-1 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full mt-2" />
        </div>
      </div>

      {/* Budget progress */}
      {budget?.totalBudget && budgetUsage && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Ngân sách tháng</p>
            <button onClick={() => navigate('/budgets')} className="text-xs text-indigo-500 font-medium">Xem chi tiết</button>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>{formatCompact(totalExpense)} đã chi</span>
            <span>còn {formatCompact(Math.max(0, budget.totalBudget - totalExpense))}</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                budgetUsage.status === 'over' ? 'bg-gradient-to-r from-red-400 to-red-600'
                : budgetUsage.status === 'warning' ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                : 'bg-gradient-to-r from-indigo-400 to-purple-500'
              }`}
              style={{ width: `${Math.min(100, budgetUsage.percentage)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5 text-right">{budgetUsage.percentage.toFixed(0)}% / {formatCompact(budget.totalBudget)}</p>
        </div>
      )}

      {/* Spending chart */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-gray-900 dark:text-white">Chi tiêu theo ngày</p>
          <div className="flex gap-3">
            <div className="flex items-center gap-1 text-[10px] text-gray-400"><div className="w-2 h-2 rounded-sm bg-indigo-400" />Thu</div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400"><div className="w-2 h-2 rounded-sm bg-orange-400" />Chi</div>
          </div>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} barGap={1} barCategoryGap="30%">
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="income" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={10} />
              <Bar dataKey="expense" fill="#fb923c" radius={[4, 4, 0, 0]} maxBarSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top categories */}
      {topCategories.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-900 dark:text-white">Top danh mục</p>
            <button onClick={() => navigate('/reports')} className="text-xs text-indigo-500 font-medium">Xem báo cáo</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {topCategories.map((cat, i) => (
              <div key={cat.categoryId} className="flex items-center gap-3">
                <div
                  className="icon-circle flex-shrink-0"
                  style={{ background: CHART_COLORS[i % CHART_COLORS.length] + '18' }}
                >
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{cat.name}</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white ml-2 flex-shrink-0">{formatCompact(cat.amount)}</p>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${cat.percentage}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-4 pb-2">
          <p className="text-sm font-bold text-gray-900 dark:text-white">Giao dịch gần đây</p>
          <button onClick={() => navigate('/transactions')} className="text-xs text-indigo-500 font-medium">Xem tất cả</button>
        </div>

        {transactions.length === 0 ? (
          <div className="py-10 text-center px-4">
            <p className="text-3xl mb-2">💸</p>
            <p className="text-sm text-gray-500">Chưa có giao dịch nào</p>
            <button onClick={() => navigate('/add-transaction')} className="mt-2 text-sm text-indigo-500 font-semibold">
              + Thêm giao dịch đầu tiên
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50 px-2 pb-2">
            {transactions.slice(0, 6).map(tx => {
              const cat = categories.find(c => c.id === tx.categoryId);
              const wallet = wallets.find(w => w.id === tx.walletId);
              const d = tx.date instanceof Timestamp ? tx.date.toDate() : tx.date;
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';

              return (
                <div key={tx.id} className="flex items-center gap-3 px-2 py-3">
                  <div
                    className="icon-circle"
                    style={{ background: isIncome ? '#10b98118' : isTransfer ? '#3b82f618' : (cat?.color || '#6366f1') + '18' }}
                  >
                    {isTransfer ? '↔️' : cat?.icon || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {tx.payee || cat?.name || 'Giao dịch'}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {cat?.name && !isTransfer ? cat.name : isTransfer ? 'Chuyển khoản' : ''} · {wallet?.name} · {formatDate(d)}
                    </p>
                  </div>
                  <p className={`text-sm font-bold flex-shrink-0 ${isIncome ? 'text-emerald-500' : isTransfer ? 'text-blue-500' : 'text-rose-500'}`}>
                    {isIncome ? '+' : isTransfer ? '↔' : '-'}{formatCompact(tx.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Wallets */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-900 dark:text-white">Ví / Tài khoản</p>
          <button onClick={() => navigate('/wallets')} className="text-xs text-indigo-500 font-medium">Quản lý</button>
        </div>
        {wallets.filter(w => w.isActive).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Chưa có ví nào</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {wallets.filter(w => w.isActive).map(wallet => (
              <div
                key={wallet.id}
                className="flex-shrink-0 rounded-2xl p-3 min-w-[130px]"
                style={{ background: (wallet.color || '#6366f1') + '15' }}
              >
                <div className="text-2xl mb-2">{WALLET_ICONS[wallet.type] || '📦'}</div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{wallet.name}</p>
                <p className={`text-sm font-bold ${wallet.currentBalance >= 0 ? 'text-gray-900 dark:text-white' : 'text-rose-500'}`}>
                  {formatCompact(wallet.currentBalance)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
