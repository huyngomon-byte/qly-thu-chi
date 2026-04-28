import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatCurrency, formatCompact } from '../utils/currency';
import { getLast6Months, getMonthRange, getMonthLabel, getCurrentMonth } from '../utils/date';
import { filterByDateRange, getTotalIncome, getTotalExpense, getCategoryData, getSavingsRate } from '../utils/calculations';

const CHART_COLORS = ['#6366f1', '#f97316', '#ec4899', '#22c55e', '#eab308', '#3b82f6', '#14b8a6', '#a855f7'];

export function Reports() {
  const { user } = useAuth();
  const { transactions, loading } = useTransactions(user?.uid);
  const { categories } = useCategories(user?.uid);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const months = useMemo(() => getLast6Months(), []);

  const monthlyData = useMemo(() => {
    return months.map(month => {
      const { start, end } = getMonthRange(month);
      const txs = filterByDateRange(transactions, start, end);
      const income = getTotalIncome(txs);
      const expense = getTotalExpense(txs);
      return {
        month: getMonthLabel(month).replace(', ', '\n'),
        shortMonth: getMonthLabel(month).split(', ')[0],
        income,
        expense,
        savings: income - expense,
      };
    });
  }, [transactions, months]);

  const selectedMonthData = useMemo(() => {
    const { start, end } = getMonthRange(selectedMonth);
    const txs = filterByDateRange(transactions, start, end);
    const income = getTotalIncome(txs);
    const expense = getTotalExpense(txs);
    return {
      income,
      expense,
      savings: income - expense,
      savingsRate: getSavingsRate(income, expense),
      categoryData: getCategoryData(txs, categories),
    };
  }, [transactions, categories, selectedMonth]);

  const prevMonth = useMemo(() => {
    const idx = months.indexOf(selectedMonth);
    if (idx <= 0) return null;
    const { start, end } = getMonthRange(months[idx - 1]);
    const txs = filterByDateRange(transactions, start, end);
    return { expense: getTotalExpense(txs), categoryData: getCategoryData(txs, categories) };
  }, [transactions, categories, selectedMonth, months]);

  const categoryComparison = useMemo(() => {
    if (!prevMonth) return [];
    return selectedMonthData.categoryData
      .slice(0, 5)
      .map(cat => {
        const prev = prevMonth.categoryData.find(c => c.categoryId === cat.categoryId);
        const change = prev ? ((cat.amount - prev.amount) / prev.amount) * 100 : 100;
        return { ...cat, prevAmount: prev?.amount || 0, change };
      })
      .sort((a, b) => b.change - a.change);
  }, [selectedMonthData, prevMonth]);

  if (loading) return <LoadingSpinner fullScreen />;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 shadow-lg text-xs">
        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.dataKey === 'income' ? 'Thu' : p.dataKey === 'expense' ? 'Chi' : 'Tiết kiệm'}: {formatCompact(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="px-4 py-5 lg:px-6 max-w-4xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Báo cáo</h1>

      {/* Month selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {months.map(m => (
          <button
            key={m}
            onClick={() => setSelectedMonth(m)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              selectedMonth === m
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-800'
            }`}
          >
            {getMonthLabel(m).split(', ')[0]}
          </button>
        ))}
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4">
          <p className="text-xs text-emerald-600 font-medium mb-1">Tổng thu</p>
          <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">{formatCompact(selectedMonthData.income)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4">
          <p className="text-xs text-red-500 font-medium mb-1">Tổng chi</p>
          <p className="text-base font-bold text-red-600">{formatCompact(selectedMonthData.expense)}</p>
        </div>
        <div className={`${selectedMonthData.savings >= 0 ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-orange-50 dark:bg-orange-900/20'} rounded-2xl p-4`}>
          <p className={`text-xs font-medium mb-1 ${selectedMonthData.savings >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>Tiết kiệm</p>
          <p className={`text-base font-bold ${selectedMonthData.savings >= 0 ? 'text-indigo-700 dark:text-indigo-300' : 'text-orange-600'}`}>
            {formatCompact(selectedMonthData.savings)}
          </p>
          <p className="text-[10px] text-gray-400">{selectedMonthData.savingsRate.toFixed(0)}% tỷ lệ TK</p>
        </div>
      </div>

      {/* 6-month trend */}
      <Card padding={false}>
        <div className="p-4 pb-0">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Xu hướng 6 tháng</h3>
        </div>
        <div className="h-52 px-2 py-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} barGap={4}>
              <XAxis dataKey="shortMonth" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={20} />
              <Bar dataKey="expense" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 px-4 pb-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Thu</div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><div className="w-2.5 h-2.5 rounded-sm bg-orange-500" /> Chi</div>
        </div>
      </Card>

      {/* Savings trend */}
      <Card padding={false}>
        <div className="p-4 pb-0">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Tiết kiệm hàng tháng</h3>
        </div>
        <div className="h-36 px-2 py-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="shortMonth" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip formatter={(v: number) => formatCompact(v)} />
              <Line type="monotone" dataKey="savings" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Category breakdown */}
      {selectedMonthData.categoryData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card padding={false}>
            <div className="p-4 pb-0">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Chi tiêu theo danh mục</h3>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={selectedMonthData.categoryData.slice(0, 8)}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="amount"
                    label={({ name, percentage }) => `${percentage?.toFixed(0)}%`}
                    labelLine={false}
                  >
                    {selectedMonthData.categoryData.slice(0, 8).map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="px-4 pb-4 space-y-1.5">
              {selectedMonthData.categoryData.slice(0, 5).map((cat, i) => (
                <div key={cat.categoryId} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="flex-1 truncate text-gray-600 dark:text-gray-400">{cat.icon} {cat.name}</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{formatCompact(cat.amount)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Month comparison */}
          <Card>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
              So sánh với tháng trước
            </h3>
            {prevMonth ? (
              <>
                <div className="flex items-center justify-between mb-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <span className="text-xs text-gray-500">Tổng chi tháng này</span>
                  <span className={`text-sm font-bold ${selectedMonthData.expense > prevMonth.expense ? 'text-red-500' : 'text-emerald-600'}`}>
                    {selectedMonthData.expense > prevMonth.expense ? '↑' : '↓'}
                    {' '}{formatCompact(Math.abs(selectedMonthData.expense - prevMonth.expense))}
                    {' '}({prevMonth.expense > 0 ? ((selectedMonthData.expense - prevMonth.expense) / prevMonth.expense * 100).toFixed(0) : '100'}%)
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-medium">Danh mục tăng mạnh nhất:</p>
                  {categoryComparison.filter(c => c.change > 0).slice(0, 3).map((cat, i) => (
                    <div key={cat.categoryId} className="flex items-center gap-2 text-xs">
                      <span>{cat.icon}</span>
                      <span className="flex-1 truncate text-gray-700 dark:text-gray-300">{cat.name}</span>
                      <span className="text-red-500 font-medium">+{cat.change.toFixed(0)}%</span>
                    </div>
                  ))}
                  {categoryComparison.filter(c => c.change > 0).length === 0 && (
                    <p className="text-xs text-emerald-600">🎉 Chi tiêu giảm so với tháng trước!</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Chưa có dữ liệu tháng trước</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
