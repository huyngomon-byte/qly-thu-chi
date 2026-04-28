import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Sector,
} from 'recharts';
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Lightbulb, Handshake, Settings } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { useWallets } from '../hooks/useWallets';
import { useCategories } from '../hooks/useCategories';
import { useBudgets } from '../hooks/useBudgets';
import { useLoans } from '../hooks/useLoans';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import {
  getTotalIncome, getTotalExpense, getDailyData,
  getCategoryData, getTopCategories, getBudgetUsage, filterByDateRange,
} from '../utils/calculations';
import { formatCurrency, formatCompact } from '../utils/currency';
import {
  getCurrentMonth, getMonthRange, getMonthLabel,
  getPrevMonth, getNextMonth, getTodayRange, getWeekRange,
  formatDate, getDaysInMonth, getPrevMonth as getPrev,
} from '../utils/date';

const PIE_COLORS = ['#9b3f5a', '#146a5f', '#4d44e3', '#f97316', '#ec4899', '#eab308', '#3b82f6', '#14b8a6', '#a855f7'];

const WALLET_ICONS: Record<string, string> = {
  cash: '💵', bank: '🏦', ewallet: '📱', credit: '💳', savings: '🏧', other: '📦',
};

function getInsights(totalIncome: number, totalExpense: number, month: string, prevExpense: number) {
  const days = getDaysInMonth(month);
  const now = new Date();
  const [y, m] = month.split('-').map(Number);
  const isCurrentMonth = now.getFullYear() === y && now.getMonth() + 1 === m;
  const daysElapsed = isCurrentMonth ? now.getDate() : days;

  const avgDaily = daysElapsed > 0 ? totalExpense / daysElapsed : 0;
  const projected = avgDaily * days;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  const monthChange = prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : null;
  const daysLeft = isCurrentMonth ? days - now.getDate() : 0;
  const budgetPerDay = daysLeft > 0 && totalIncome > 0 ? (totalIncome - totalExpense) / daysLeft : 0;

  return { avgDaily, projected, savingsRate, monthChange, daysLeft, budgetPerDay };
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [month, setMonth] = useState(getCurrentMonth());
  const [activePieIndex, setActivePieIndex] = useState<number | undefined>(undefined);

  const { transactions, loading } = useTransactions(user?.uid);
  const { wallets, totalBalance } = useWallets(user?.uid);
  const { categories } = useCategories(user?.uid);
  const { budget } = useBudgets(user?.uid, month);
  const { totalBorrow, totalLend } = useLoans(user?.uid);

  const { start, end } = useMemo(() => getMonthRange(month), [month]);
  const monthTx = useMemo(() => filterByDateRange(transactions, start, end), [transactions, start, end]);

  const prevMonthRange = useMemo(() => getMonthRange(getPrev(month)), [month]);
  const prevMonthTx = useMemo(() => filterByDateRange(transactions, prevMonthRange.start, prevMonthRange.end), [transactions, prevMonthRange]);

  const todayTx = useMemo(() => { const { start: s, end: e } = getTodayRange(); return filterByDateRange(transactions, s, e); }, [transactions]);
  const weekTx  = useMemo(() => { const { start: s, end: e } = getWeekRange();  return filterByDateRange(transactions, s, e); }, [transactions]);

  const totalIncome  = useMemo(() => getTotalIncome(monthTx),   [monthTx]);
  const totalExpense = useMemo(() => getTotalExpense(monthTx),  [monthTx]);
  const prevExpense  = useMemo(() => getTotalExpense(prevMonthTx), [prevMonthTx]);
  const todayExpense = useMemo(() => getTotalExpense(todayTx),  [todayTx]);
  const weekExpense  = useMemo(() => getTotalExpense(weekTx),   [weekTx]);

  const dailyData    = useMemo(() => getDailyData(monthTx, month),          [monthTx, month]);
  const categoryData = useMemo(() => getCategoryData(monthTx, categories),  [monthTx, categories]);
  const topCategories= useMemo(() => getTopCategories(categoryData, 6),     [categoryData]);

  const budgetUsage  = useMemo(() => budget?.totalBudget ? getBudgetUsage(totalExpense, budget.totalBudget) : null, [budget, totalExpense]);
  const insights     = useMemo(() => getInsights(totalIncome, totalExpense, month, prevExpense), [totalIncome, totalExpense, month, prevExpense]);

  if (loading) return <LoadingSpinner fullScreen text="Đang tải..." />;

  const firstName = user?.displayName?.split(' ').pop() || 'bạn';

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return <g><Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} /></g>;
  };

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white rounded-2xl p-3 shadow-lg border border-[#ffd9e0]/40 text-xs">
        <p className="font-semibold text-[#544245] mb-1">Ngày {label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
            {p.dataKey === 'income' ? '↑ Thu' : '↓ Chi'}: {formatCompact(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="pb-4 max-w-xl mx-auto lg:max-w-5xl space-y-4">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-[#fef8fa]/90 backdrop-blur-md px-4 pt-5 pb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-[#877275] font-medium">Xin chào 👋</p>
          <h1 className="text-xl font-bold text-[#1d1b1d] font-jakarta">{firstName}</h1>
        </div>
        <button onClick={() => navigate('/settings')} className="w-9 h-9 bg-white rounded-2xl flex items-center justify-center text-[#877275] shadow-pink-sm">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 space-y-4">

        {/* ── Hero balance card ── */}
        <div className="bg-white rounded-[1.5rem] p-5 shadow-pink-md border border-[#ffd9e0]/30">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#877275]">Tổng số dư</p>
            <div className="flex items-center gap-0.5 bg-[#f8f2f4] rounded-full px-1 py-1">
              <button onClick={() => setMonth(getPrevMonth(month))} className="p-1 rounded-full hover:bg-[#ffd9e0]/50 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5 text-[#877275]" />
              </button>
              <span className="text-[11px] font-bold text-[#544245] px-2">{getMonthLabel(month)}</span>
              <button onClick={() => setMonth(getNextMonth(month))} className="p-1 rounded-full hover:bg-[#ffd9e0]/50 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#877275]" />
              </button>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-5">
            <p className="text-3xl font-bold text-[#9b3f5a] font-jakarta">{formatCurrency(totalBalance)}</p>
            {totalBalance >= 0
              ? <TrendingUp  className="w-5 h-5 text-[#146a5f]" />
              : <TrendingDown className="w-5 h-5 text-[#9b3f5a]" />}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#a4f1e3]/20 rounded-2xl p-3.5 flex flex-col gap-1.5">
              <div className="w-8 h-8 bg-[#a4f1e3]/60 rounded-full flex items-center justify-center text-base">💰</div>
              <p className="text-[10px] text-[#1e7065] font-bold uppercase tracking-wide">Thu nhập</p>
              <p className="text-base font-bold text-[#146a5f] font-jakarta">{formatCompact(totalIncome)}</p>
            </div>
            <div className="bg-[#ffd9e0]/30 rounded-2xl p-3.5 flex flex-col gap-1.5">
              <div className="w-8 h-8 bg-[#ffd9e0]/80 rounded-full flex items-center justify-center text-base">🛒</div>
              <p className="text-[10px] text-[#79243f] font-bold uppercase tracking-wide">Chi tiêu</p>
              <p className="text-base font-bold text-[#9b3f5a] font-jakarta">{formatCompact(totalExpense)}</p>
            </div>
          </div>
        </div>

        {/* ── Budget alert ── */}
        {budgetUsage && budgetUsage.status !== 'safe' && (
          <div className={`flex items-center gap-3 p-4 rounded-[1.25rem] text-white ${budgetUsage.status === 'over' ? 'bg-[#9b3f5a]' : 'bg-amber-500'}`}
            style={{ boxShadow: budgetUsage.status === 'over' ? '0 8px 24px rgba(155,63,90,0.3)' : '0 8px 24px rgba(245,158,11,0.3)' }}>
            <span className="text-xl flex-shrink-0">{budgetUsage.status === 'over' ? '🚨' : '⚠️'}</span>
            <div>
              <p className="text-sm font-bold">{budgetUsage.status === 'over' ? 'Đã vượt ngân sách!' : 'Sắp chạm ngân sách'}</p>
              <p className="text-xs opacity-80">Đã chi {budgetUsage.percentage.toFixed(0)}% — {formatCompact(totalExpense)} / {formatCompact(budget!.totalBudget)}</p>
            </div>
          </div>
        )}

        {/* ── Quick stats ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-[1.25rem] p-4 shadow-pink-sm border border-[#ffd9e0]/20">
            <p className="text-[10px] text-[#877275] font-semibold uppercase tracking-wide mb-1">Chi hôm nay</p>
            <p className="text-xl font-bold text-[#1d1b1d] font-jakarta">{formatCompact(todayExpense)}</p>
            <div className="w-8 h-1 bg-[#ff8fab] rounded-full mt-2 opacity-60" />
          </div>
          <div className="bg-white rounded-[1.25rem] p-4 shadow-pink-sm border border-[#ffd9e0]/20">
            <p className="text-[10px] text-[#877275] font-semibold uppercase tracking-wide mb-1">Chi tuần này</p>
            <p className="text-xl font-bold text-[#1d1b1d] font-jakarta">{formatCompact(weekExpense)}</p>
            <div className="w-8 h-1 bg-[#89d4c7] rounded-full mt-2 opacity-60" />
          </div>
        </div>

        {/* ── Loans shortcut ── */}
        {(totalBorrow > 0 || totalLend > 0) && (
          <button onClick={() => navigate('/loans')}
            className="w-full bg-[#e2dfff]/40 border-2 border-[#aaa8ff]/40 rounded-[1.25rem] p-4 flex items-center gap-3 active:scale-[0.98] transition-all text-left">
            <div className="w-11 h-11 bg-[#aaa8ff]/50 rounded-2xl flex items-center justify-center">
              <Handshake className="w-5 h-5 text-[#4d44e3]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#1d1b1d]">Vay / Cho vay</p>
              <p className="text-xs text-[#877275]">Xem chi tiết các khoản</p>
            </div>
            <div className="text-right">
              {totalBorrow > 0 && <p className="text-xs font-semibold text-[#9b3f5a]">Nợ {formatCompact(totalBorrow)}</p>}
              {totalLend  > 0 && <p className="text-xs font-semibold text-[#146a5f]">Cho vay {formatCompact(totalLend)}</p>}
            </div>
          </button>
        )}

        {/* ── Budget bar ── */}
        {budget?.totalBudget && budgetUsage && (
          <div className="bg-white rounded-[1.25rem] p-4 shadow-pink-sm border border-[#ffd9e0]/20">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#1d1b1d]">Ngân sách tháng</p>
              <button onClick={() => navigate('/budgets')} className="text-xs text-[#9b3f5a] font-semibold">Chi tiết →</button>
            </div>
            <div className="flex justify-between text-xs text-[#877275] mb-2">
              <span>{formatCompact(totalExpense)} đã chi</span>
              <span>còn {formatCompact(Math.max(0, budget.totalBudget - totalExpense))}</span>
            </div>
            <div className="h-2 bg-[#f8f2f4] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, budgetUsage.percentage)}%`,
                  background: budgetUsage.status === 'over' ? '#9b3f5a' : budgetUsage.status === 'warning' ? '#f97316' : '#146a5f',
                }}
              />
            </div>
            <p className="text-xs text-[#877275] mt-1.5 text-right">{budgetUsage.percentage.toFixed(0)}% / {formatCompact(budget.totalBudget)}</p>
          </div>
        )}

        {/* ── Spending Analysis (bar chart) ── */}
        <div className="bg-white rounded-[1.5rem] p-5 shadow-pink-md border border-[#ffd9e0]/20">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-[#1d1b1d] font-jakarta">Phân tích chi tiêu</h2>
            <div className="flex gap-3 text-[10px] text-[#877275]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#89d4c7' }} />Thu</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#ff8fab' }} />Chi</span>
            </div>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} barGap={1} barCategoryGap="30%">
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#877275' }} tickLine={false} axisLine={false} interval={4} />
                <YAxis hide />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="income"  fill="#89d4c7" radius={[4, 4, 0, 0]} maxBarSize={10} />
                <Bar dataKey="expense" fill="#ff8fab" radius={[4, 4, 0, 0]} maxBarSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-3 border-t border-[#f8f2f4] flex justify-between text-[10px] text-[#877275] mt-1">
            <span>Tổng danh mục: {topCategories.length}</span>
            <span className="flex items-center gap-1">
              {insights.savingsRate >= 20 ? '✨ Chi tiêu lành mạnh' : '📊 Theo dõi chi tiêu'}
            </span>
          </div>
        </div>

        {/* ── PIE chart — Category breakdown ── */}
        {topCategories.length > 0 && (
          <div className="bg-white rounded-[1.5rem] p-5 shadow-pink-md border border-[#ffd9e0]/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#1d1b1d] font-jakarta">Chi tiêu theo danh mục</h2>
              <button onClick={() => navigate('/reports')} className="text-xs text-[#9b3f5a] font-semibold">Báo cáo →</button>
            </div>

            <div className="lg:flex lg:gap-6 lg:items-center">
              <div className="h-52 lg:w-52 lg:flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topCategories}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={85}
                      dataKey="amount" paddingAngle={3}
                      activeIndex={activePieIndex}
                      activeShape={renderActiveShape}
                      onMouseEnter={(_, i) => setActivePieIndex(i)}
                      onMouseLeave={() => setActivePieIndex(undefined)}
                    >
                      {topCategories.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, _: any, props: any) => [formatCurrency(value), props.payload.name]}
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 20px rgba(155,63,90,0.12)', fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 space-y-2 mt-2 lg:mt-0">
                {topCategories.map((cat, i) => (
                  <div key={cat.categoryId} className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="w-6 text-center text-sm">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <p className="text-xs font-semibold text-[#1d1b1d] truncate">{cat.name}</p>
                        <p className="text-xs font-bold text-[#544245] ml-2 flex-shrink-0">{cat.percentage.toFixed(0)}%</p>
                      </div>
                      <div className="h-1.5 bg-[#f8f2f4] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${cat.percentage}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      </div>
                    </div>
                    <p className="text-[11px] font-semibold text-[#877275] flex-shrink-0 w-16 text-right">{formatCompact(cat.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Insights bento ── */}
        <div className="space-y-3">
          {/* Savings goal row */}
          <div className="bg-[#a4f1e3]/20 border-2 border-[#a4f1e3]/40 rounded-[1.25rem] p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#a4f1e3] rounded-2xl flex items-center justify-center text-xl flex-shrink-0">
              ✨
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1d1b1d]">
                {insights.savingsRate >= 20 ? 'Chi tiêu tốt!' : 'Nhận xét tháng này'}
              </h3>
              <p className="text-xs text-[#544245]">
                {insights.savingsRate >= 20
                  ? `Tiết kiệm ${insights.savingsRate.toFixed(0)}% thu nhập — tiếp tục phát huy!`
                  : insights.avgDaily > 0 ? `Chi trung bình ${formatCompact(insights.avgDaily)}/ngày` : 'Chưa có dữ liệu tháng này'}
              </p>
            </div>
          </div>

          {/* 2-col grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#e2dfff]/40 border border-[#aaa8ff]/30 rounded-[1.25rem] p-4">
              <span className="text-xl block mb-1">💼</span>
              <p className="text-[10px] font-bold text-[#544245] uppercase tracking-wide">Trung bình/ngày</p>
              <p className="text-base font-bold text-[#4d44e3] font-jakarta mt-0.5">{formatCompact(insights.avgDaily)}</p>
            </div>
            <div className={`border rounded-[1.25rem] p-4 ${insights.monthChange !== null && insights.monthChange > 0
              ? 'bg-[#ffd9e0]/30 border-[#ff8fab]/30' : 'bg-[#a4f1e3]/20 border-[#89d4c7]/30'}`}>
              <span className="text-xl block mb-1">{insights.monthChange !== null && insights.monthChange > 0 ? '📈' : '📉'}</span>
              <p className="text-[10px] font-bold text-[#544245] uppercase tracking-wide">So tháng trước</p>
              <p className={`text-base font-bold font-jakarta mt-0.5 ${insights.monthChange !== null && insights.monthChange > 0 ? 'text-[#9b3f5a]' : 'text-[#146a5f]'}`}>
                {insights.monthChange !== null ? `${insights.monthChange > 0 ? '+' : ''}${insights.monthChange.toFixed(0)}%` : '—'}
              </p>
            </div>
          </div>

          {/* Text insights */}
          {(topCategories[0] || (insights.daysLeft > 0 && insights.budgetPerDay > 0)) && (
            <div className="space-y-2">
              {topCategories[0] && (
                <div className="bg-white rounded-2xl px-4 py-3 shadow-pink-sm border border-[#ffd9e0]/20 flex items-center gap-3 text-xs text-[#544245]">
                  <span className="text-base">{topCategories[0].icon}</span>
                  <span>Chi nhiều nhất: <strong>{topCategories[0].name}</strong> — {formatCompact(topCategories[0].amount)} ({topCategories[0].percentage.toFixed(0)}%)</span>
                </div>
              )}
              {insights.daysLeft > 0 && insights.budgetPerDay > 0 && (
                <div className="bg-white rounded-2xl px-4 py-3 shadow-pink-sm border border-[#ffd9e0]/20 flex items-center gap-3 text-xs text-[#544245]">
                  <span>📅</span>
                  <span>Còn <strong>{insights.daysLeft} ngày</strong> — có thể chi <strong>{formatCompact(insights.budgetPerDay)}/ngày</strong></span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Lightbulb insights card ── */}
        <div className="bg-white rounded-[1.5rem] p-5 shadow-pink-md border border-[#ffd9e0]/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-sm font-bold text-[#1d1b1d]">Nhận xét chi tiết</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#e2dfff]/30 rounded-2xl p-3">
              <p className="text-[10px] text-[#4d44e3] font-semibold uppercase tracking-wide mb-1">Tỷ lệ tiết kiệm</p>
              <p className="text-base font-bold text-[#4d44e3] font-jakarta">{insights.savingsRate.toFixed(1)}%
                <span className="text-sm ml-1">{insights.savingsRate >= 30 ? '🎉' : insights.savingsRate >= 20 ? '👍' : '😬'}</span>
              </p>
            </div>
            {insights.avgDaily > 0 && (
              <div className="bg-[#ffd9e0]/30 rounded-2xl p-3">
                <p className="text-[10px] text-[#9b3f5a] font-semibold uppercase tracking-wide mb-1">Dự kiến cả tháng</p>
                <p className="text-base font-bold text-[#9b3f5a] font-jakarta">{formatCompact(insights.projected)}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Recent transactions ── */}
        <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-pink-md border border-[#ffd9e0]/20">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="text-base font-bold text-[#1d1b1d] font-jakarta">Giao dịch gần đây</h2>
            <button onClick={() => navigate('/transactions')} className="text-xs text-[#9b3f5a] font-semibold">Xem tất cả →</button>
          </div>
          {transactions.length === 0 ? (
            <div className="py-10 text-center px-4">
              <p className="text-3xl mb-2">💸</p>
              <p className="text-sm text-[#877275]">Chưa có giao dịch nào</p>
              <button onClick={() => navigate('/add-transaction')} className="mt-2 text-sm text-[#9b3f5a] font-semibold">+ Thêm giao dịch đầu tiên</button>
            </div>
          ) : (
            <div className="divide-y divide-[#f8f2f4] px-3 pb-3">
              {transactions.slice(0, 6).map(tx => {
                const cat = categories.find(c => c.id === tx.categoryId);
                const wallet = wallets.find(w => w.id === tx.walletId);
                const d = tx.date instanceof Timestamp ? tx.date.toDate() : tx.date as Date;
                const isIncome   = tx.type === 'income';
                const isTransfer = tx.type === 'transfer';
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-2 py-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: isIncome ? '#a4f1e320' : isTransfer ? '#e2dfff40' : '#ffd9e040' }}>
                      {isTransfer ? '↔️' : cat?.icon || '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1d1b1d] truncate">{tx.payee || cat?.name || 'Giao dịch'}</p>
                      <p className="text-[11px] text-[#877275] truncate">
                        {cat?.name && !isTransfer ? `${cat.name} · ` : isTransfer ? 'Chuyển khoản · ' : ''}{wallet?.name} · {formatDate(d)}
                      </p>
                    </div>
                    <p className={`text-sm font-bold flex-shrink-0 ${isIncome ? 'text-[#146a5f]' : isTransfer ? 'text-[#4d44e3]' : 'text-[#9b3f5a]'}`}>
                      {isIncome ? '+' : isTransfer ? '↔' : '-'}{formatCompact(tx.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Wallets ── */}
        <div className="bg-white rounded-[1.5rem] p-5 shadow-pink-md border border-[#ffd9e0]/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#1d1b1d] font-jakarta">Ví / Tài khoản</h2>
            <button onClick={() => navigate('/wallets')} className="text-xs text-[#9b3f5a] font-semibold">Quản lý →</button>
          </div>
          {wallets.filter(w => w.isActive).length === 0 ? (
            <p className="text-sm text-[#877275] text-center py-4">Chưa có ví nào</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {wallets.filter(w => w.isActive).map(wallet => (
                <div key={wallet.id} className="flex-shrink-0 rounded-2xl p-3.5 min-w-[120px]"
                  style={{ background: (wallet.color || '#9b3f5a') + '15' }}>
                  <div className="text-2xl mb-2">{WALLET_ICONS[wallet.type] || '📦'}</div>
                  <p className="text-[11px] text-[#877275]">{wallet.name}</p>
                  <p className={`text-sm font-bold font-jakarta ${wallet.currentBalance >= 0 ? 'text-[#1d1b1d]' : 'text-[#9b3f5a]'}`}>
                    {formatCompact(wallet.currentBalance)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
