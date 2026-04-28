import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight, X, CalendarDays } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { useWallets } from '../hooks/useWallets';
import { useCategories } from '../hooks/useCategories';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { formatCompact } from '../utils/currency';
import { formatDateFull, getCurrentMonth, getMonthRange, getMonthLabel, getPrevMonth, getNextMonth } from '../utils/date';
import { filterByDateRange, getTotalIncome, getTotalExpense } from '../utils/calculations';
import { Transaction, TransactionType } from '../types';

const TYPE_FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'expense', label: '↓ Chi' },
  { value: 'income', label: '↑ Thu' },
  { value: 'transfer', label: '↔ Chuyển' },
];

const todayStr = () => new Date().toISOString().slice(0, 10);
const monthStartStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

export function Transactions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { transactions, loading, deleteTransaction } = useTransactions(user?.uid);
  const { wallets } = useWallets(user?.uid);
  const { categories } = useCategories(user?.uid);

  const [dateMode, setDateMode] = useState<'month' | 'range'>('month');
  const [month, setMonth] = useState(getCurrentMonth());
  const [rangeFrom, setRangeFrom] = useState(monthStartStr);
  const [rangeTo, setRangeTo] = useState(todayStr);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterWallet, setFilterWallet] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { start, end } = useMemo(() => {
    if (dateMode === 'range') {
      return { start: new Date(rangeFrom + 'T00:00:00'), end: new Date(rangeTo + 'T23:59:59') };
    }
    return getMonthRange(month);
  }, [dateMode, month, rangeFrom, rangeTo]);

  const filtered = useMemo(() => {
    let list = filterByDateRange(transactions, start, end);
    if (filterType !== 'all') list = list.filter(t => t.type === filterType);
    if (filterCategory !== 'all') list = list.filter(t => t.categoryId === filterCategory);
    if (filterWallet !== 'all') list = list.filter(t => t.walletId === filterWallet);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.note?.toLowerCase().includes(q) ||
        t.payee?.toLowerCase().includes(q) ||
        categories.find(c => c.id === t.categoryId)?.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [transactions, start, end, filterType, filterCategory, filterWallet, search, categories]);

  const totalIncome = useMemo(() => getTotalIncome(filtered), [filtered]);
  const totalExpense = useMemo(() => getTotalExpense(filtered), [filtered]);

  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach(tx => {
      const d = tx.date instanceof Timestamp ? tx.date.toDate() : tx.date as Date;
      const key = d.toDateString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [filtered]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteTransaction(deleteTarget);
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const activeFilters = (filterType !== 'all' ? 1 : 0) + (filterCategory !== 'all' ? 1 : 0) + (filterWallet !== 'all' ? 1 : 0);

  return (
    <div className="px-4 py-5 lg:px-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Giao dịch</h1>
        <div className="flex items-center gap-2">
          {/* Date mode toggle */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-gray-900 rounded-2xl shadow-sm px-1 py-1">
            <button
              onClick={() => setDateMode('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${dateMode === 'month' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              Tháng
            </button>
            <button
              onClick={() => setDateMode('range')}
              className={`px-2 py-1.5 rounded-xl transition-colors ${dateMode === 'range' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Month navigator (only in month mode) */}
          {dateMode === 'month' && (
            <div className="flex items-center gap-1 bg-white dark:bg-gray-900 rounded-2xl shadow-sm px-1 py-1">
              <button onClick={() => setMonth(getPrevMonth(month))} className="p-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 px-1">{getMonthLabel(month)}</span>
              <button onClick={() => setMonth(getNextMonth(month))} className="p-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Date range picker (only in range mode) */}
      {dateMode === 'range' && (
        <div className="flex items-center gap-2 mb-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-3 border border-gray-100 dark:border-gray-800">
          <CalendarDays className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <input
            type="date"
            value={rangeFrom}
            max={rangeTo}
            onChange={e => setRangeFrom(e.target.value)}
            className="flex-1 text-xs text-gray-700 dark:text-gray-300 bg-transparent focus:outline-none"
          />
          <span className="text-gray-300 text-xs">→</span>
          <input
            type="date"
            value={rangeTo}
            min={rangeFrom}
            max={todayStr()}
            onChange={e => setRangeTo(e.target.value)}
            className="flex-1 text-xs text-gray-700 dark:text-gray-300 bg-transparent focus:outline-none"
          />
        </div>
      )}

      {/* Month summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-emerald-500 rounded-2xl p-3.5 text-white">
          <p className="text-emerald-100 text-[10px] font-semibold mb-0.5">THU</p>
          <p className="font-bold text-sm">{formatCompact(totalIncome)}</p>
        </div>
        <div className="bg-rose-500 rounded-2xl p-3.5 text-white">
          <p className="text-rose-100 text-[10px] font-semibold mb-0.5">CHI</p>
          <p className="font-bold text-sm">{formatCompact(totalExpense)}</p>
        </div>
        <div className={`${totalIncome - totalExpense >= 0 ? 'bg-indigo-600' : 'bg-orange-500'} rounded-2xl p-3.5 text-white`}>
          <p className="text-indigo-100 text-[10px] font-semibold mb-0.5">CÒN LẠI</p>
          <p className="font-bold text-sm">{formatCompact(totalIncome - totalExpense)}</p>
        </div>
      </div>

      {/* Type filter pills */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {TYPE_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilterType(value as any)}
            className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
              filterType === value
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 shadow-sm'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 border border-gray-100 dark:border-gray-800"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`relative w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm transition-colors ${
            showFilters || activeFilters > 0
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-gray-900 text-gray-500 border border-gray-100 dark:border-gray-800'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeFilters > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-4 mb-4 shadow-sm space-y-4 border border-gray-100 dark:border-gray-800 animate-slide-up">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Danh mục</p>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.filter(c => !c.isHidden).map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Ví</p>
            <select
              value={filterWallet}
              onChange={e => setFilterWallet(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="all">Tất cả ví</option>
              {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          {activeFilters > 0 && (
            <button
              onClick={() => { setFilterType('all'); setFilterCategory('all'); setFilterWallet('all'); }}
              className="text-xs text-rose-500 font-semibold"
            >
              Xoá tất cả bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Transaction groups */}
      {grouped.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Không có giao dịch"
          description={search ? `Không tìm thấy "${search}"` : 'Chưa có giao dịch nào trong tháng này'}
          action={{ label: '+ Thêm giao dịch', onClick: () => navigate('/add-transaction') }}
        />
      ) : (
        <div className="space-y-5">
          {grouped.map(([dateKey, txs]) => {
            const date = new Date(dateKey);
            const dayNet = txs.reduce((s, t) => s + (t.type === 'expense' ? -t.amount : t.type === 'income' ? t.amount : 0), 0);
            return (
              <div key={dateKey}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{formatDateFull(date)}</span>
                  <span className={`text-xs font-bold ${dayNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {dayNet >= 0 ? '+' : ''}{formatCompact(dayNet)}
                  </span>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm overflow-hidden border border-gray-50 dark:border-gray-800">
                  {txs.map((tx, i) => {
                    const cat = categories.find(c => c.id === tx.categoryId);
                    const wallet = wallets.find(w => w.id === tx.walletId);
                    const isIncome = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';
                    const iconBg = isIncome ? '#10b98118' : isTransfer ? '#3b82f618' : (cat?.color || '#6366f1') + '18';

                    return (
                      <div
                        key={tx.id}
                        className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-gray-50 dark:border-gray-800' : ''}`}
                      >
                        <div className="icon-circle" style={{ background: iconBg }}>
                          {isTransfer ? '↔️' : cat?.icon || '📦'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                            {tx.payee || cat?.name || 'Giao dịch'}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {!isTransfer && cat?.name ? `${cat.name} · ` : ''}{wallet?.name}
                            {tx.note ? ` · ${tx.note}` : ''}
                            {tx.isFixed ? ' · 📌' : ''}
                          </p>
                        </div>

                        <p className={`text-sm font-bold flex-shrink-0 ${isIncome ? 'text-emerald-500' : isTransfer ? 'text-blue-500' : 'text-rose-500'}`}>
                          {isIncome ? '+' : isTransfer ? '↔' : '-'}{formatCompact(tx.amount)}
                        </p>

                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            onClick={() => navigate('/add-transaction', { state: { transaction: tx } })}
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(tx)}
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xoá giao dịch"
        message="Giao dịch sẽ bị xoá và số dư ví được hoàn lại. Chắc chắn chưa?"
        loading={deleteLoading}
      />
    </div>
  );
}
