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
  { value: 'all',      label: 'Tất cả' },
  { value: 'expense',  label: '↓ Chi' },
  { value: 'income',   label: '↑ Thu' },
  { value: 'transfer', label: '↔ Chuyển' },
];

const todayStr    = () => new Date().toISOString().slice(0, 10);
const monthStart  = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; };

export function Transactions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { transactions, loading, deleteTransaction } = useTransactions(user?.uid);
  const { wallets }    = useWallets(user?.uid);
  const { categories } = useCategories(user?.uid);

  const [dateMode,    setDateMode]    = useState<'month' | 'range'>('month');
  const [month,       setMonth]       = useState(getCurrentMonth());
  const [rangeFrom,   setRangeFrom]   = useState(monthStart);
  const [rangeTo,     setRangeTo]     = useState(todayStr);
  const [search,      setSearch]      = useState('');
  const [filterType,  setFilterType]  = useState<'all' | TransactionType>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterWallet,   setFilterWallet]   = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState<Transaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { start, end } = useMemo(() => {
    if (dateMode === 'range') return { start: new Date(rangeFrom + 'T00:00:00'), end: new Date(rangeTo + 'T23:59:59') };
    return getMonthRange(month);
  }, [dateMode, month, rangeFrom, rangeTo]);

  const filtered = useMemo(() => {
    let list = filterByDateRange(transactions, start, end);
    if (filterType !== 'all')     list = list.filter(t => t.type === filterType);
    if (filterCategory !== 'all') list = list.filter(t => t.categoryId === filterCategory);
    if (filterWallet   !== 'all') list = list.filter(t => t.walletId === filterWallet);
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

  const totalIncome  = useMemo(() => getTotalIncome(filtered),  [filtered]);
  const totalExpense = useMemo(() => getTotalExpense(filtered), [filtered]);

  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach(tx => {
      const d   = tx.date instanceof Timestamp ? tx.date.toDate() : tx.date as Date;
      const key = d.toDateString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [filtered]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try { await deleteTransaction(deleteTarget); setDeleteTarget(null); }
    finally { setDeleteLoading(false); }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const activeFilters = (filterType !== 'all' ? 1 : 0) + (filterCategory !== 'all' ? 1 : 0) + (filterWallet !== 'all' ? 1 : 0);

  return (
    <div className="px-4 py-5 lg:px-6 max-w-2xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[#1d1b1d] font-jakarta">Giao dịch</h1>
        <div className="flex items-center gap-2">
          {/* Date mode toggle */}
          <div className="flex items-center gap-0.5 bg-white rounded-full shadow-pink-sm border border-[#ffd9e0]/30 px-1 py-1">
            <button
              onClick={() => setDateMode('month')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${dateMode === 'month' ? 'bg-[#9b3f5a] text-white' : 'text-[#877275]'}`}
            >Tháng</button>
            <button
              onClick={() => setDateMode('range')}
              className={`px-2.5 py-1.5 rounded-full transition-colors ${dateMode === 'range' ? 'bg-[#9b3f5a] text-white' : 'text-[#877275]'}`}
            ><CalendarDays className="w-3.5 h-3.5" /></button>
          </div>

          {/* Month nav (month mode only) */}
          {dateMode === 'month' && (
            <div className="flex items-center gap-0.5 bg-white rounded-full shadow-pink-sm border border-[#ffd9e0]/30 px-1 py-1">
              <button onClick={() => setMonth(getPrevMonth(month))} className="p-1.5 rounded-full hover:bg-[#ffd9e0]/40 text-[#877275] transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-bold text-[#544245] px-1.5">{getMonthLabel(month)}</span>
              <button onClick={() => setMonth(getNextMonth(month))} className="p-1.5 rounded-full hover:bg-[#ffd9e0]/40 text-[#877275] transition-colors">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Date range picker ── */}
      {dateMode === 'range' && (
        <div className="flex items-center gap-2 mb-4 bg-white rounded-2xl shadow-pink-sm p-3 border border-[#ffd9e0]/30">
          <CalendarDays className="w-4 h-4 text-[#9b3f5a] flex-shrink-0" />
          <input type="date" value={rangeFrom} max={rangeTo} onChange={e => setRangeFrom(e.target.value)}
            className="flex-1 text-xs text-[#544245] bg-transparent focus:outline-none" />
          <span className="text-[#dac0c4] text-xs">→</span>
          <input type="date" value={rangeTo} min={rangeFrom} max={todayStr()} onChange={e => setRangeTo(e.target.value)}
            className="flex-1 text-xs text-[#544245] bg-transparent focus:outline-none" />
        </div>
      )}

      {/* ── Summary bento ── */}
      <div className="bg-white rounded-[1.5rem] p-4 shadow-pink-md border border-[#ffd9e0]/20 mb-4">
        <div className="flex gap-3">
          <div className="flex-1 bg-[#a4f1e3]/20 rounded-2xl p-3.5 flex items-center gap-3">
            <span className="material-symbols-outlined text-[#146a5f] text-base">↑</span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#1e7065]">Thu nhập</p>
              <p className="text-sm font-bold text-[#146a5f] font-jakarta">+{formatCompact(totalIncome)}</p>
            </div>
          </div>
          <div className="flex-1 bg-[#ffd9e0]/30 rounded-2xl p-3.5 flex items-center gap-3">
            <span className="text-[#9b3f5a] text-base">↓</span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#79243f]">Chi tiêu</p>
              <p className="text-sm font-bold text-[#9b3f5a] font-jakarta">-{formatCompact(totalExpense)}</p>
            </div>
          </div>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-[#f8f2f4] flex justify-between items-center">
          <p className="text-[10px] text-[#877275] font-medium">Còn lại</p>
          <p className={`text-sm font-bold font-jakarta ${totalIncome - totalExpense >= 0 ? 'text-[#146a5f]' : 'text-[#9b3f5a]'}`}>
            {totalIncome - totalExpense >= 0 ? '+' : ''}{formatCompact(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      {/* ── Type filter chips ── */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {TYPE_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilterType(value as any)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              filterType === value
                ? 'bg-[#9b3f5a] text-white shadow-pink-fab'
                : 'bg-white text-[#877275] shadow-pink-sm border border-[#ffd9e0]/30'
            }`}
          >{label}</button>
        ))}
      </div>

      {/* ── Search + filter button ── */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#877275]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full pl-10 pr-10 py-3 rounded-full bg-white text-sm text-[#1d1b1d] placeholder-[#877275] shadow-pink-sm focus:outline-none focus:ring-2 focus:ring-[#ff8fab]/40 border border-[#ffd9e0]/30"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#dac0c4]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`relative w-11 h-11 rounded-full flex items-center justify-center shadow-pink-sm transition-colors ${
            showFilters || activeFilters > 0 ? 'bg-[#9b3f5a] text-white' : 'bg-white text-[#877275] border border-[#ffd9e0]/30'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeFilters > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff8fab] text-white text-[9px] rounded-full flex items-center justify-center font-bold">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="bg-white rounded-[1.5rem] p-4 mb-4 shadow-pink-md border border-[#ffd9e0]/20 space-y-4 animate-slide-up">
          <div>
            <p className="text-[10px] font-bold text-[#877275] uppercase tracking-wider mb-2">Danh mục</p>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl border border-[#dac0c4]/40 bg-[#f8f2f4] text-sm text-[#1d1b1d] focus:outline-none focus:ring-2 focus:ring-[#ff8fab]/40">
              <option value="all">Tất cả danh mục</option>
              {categories.filter(c => !c.isHidden).map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#877275] uppercase tracking-wider mb-2">Ví</p>
            <select value={filterWallet} onChange={e => setFilterWallet(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl border border-[#dac0c4]/40 bg-[#f8f2f4] text-sm text-[#1d1b1d] focus:outline-none focus:ring-2 focus:ring-[#ff8fab]/40">
              <option value="all">Tất cả ví</option>
              {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          {activeFilters > 0 && (
            <button onClick={() => { setFilterType('all'); setFilterCategory('all'); setFilterWallet('all'); }}
              className="text-xs text-[#9b3f5a] font-bold">
              Xoá tất cả bộ lọc
            </button>
          )}
        </div>
      )}

      {/* ── Transaction groups ── */}
      {grouped.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Không có giao dịch"
          description={search ? `Không tìm thấy "${search}"` : 'Chưa có giao dịch nào trong khoảng thời gian này'}
          action={{ label: '+ Thêm giao dịch', onClick: () => navigate('/add-transaction') }}
        />
      ) : (
        <div className="space-y-5">
          {grouped.map(([dateKey, txs]) => {
            const date   = new Date(dateKey);
            const dayNet = txs.reduce((s, t) => s + (t.type === 'expense' ? -t.amount : t.type === 'income' ? t.amount : 0), 0);
            return (
              <div key={dateKey}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-bold text-[#544245]">{formatDateFull(date)}</span>
                  <span className={`text-xs font-bold ${dayNet >= 0 ? 'text-[#146a5f]' : 'text-[#9b3f5a]'}`}>
                    {dayNet >= 0 ? '+' : ''}{formatCompact(dayNet)}
                  </span>
                </div>

                <div className="bg-white rounded-[1.5rem] shadow-pink-sm overflow-hidden border border-[#ffd9e0]/20">
                  {txs.map((tx, i) => {
                    const cat        = categories.find(c => c.id === tx.categoryId);
                    const wallet     = wallets.find(w => w.id === tx.walletId);
                    const isIncome   = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';
                    const iconBg     = isIncome ? '#a4f1e330' : isTransfer ? '#e2dfff40' : '#ffd9e040';

                    return (
                      <div key={tx.id}
                        className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-[#f8f2f4]' : ''}`}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                          style={{ background: iconBg }}>
                          {isTransfer ? '↔️' : cat?.icon || '📦'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1d1b1d] truncate">
                            {tx.payee || cat?.name || 'Giao dịch'}
                          </p>
                          <p className="text-[11px] text-[#877275] truncate">
                            {!isTransfer && cat?.name ? `${cat.name} · ` : ''}{wallet?.name}
                            {tx.note ? ` · ${tx.note}` : ''}
                            {tx.isFixed ? ' · 📌' : ''}
                          </p>
                        </div>

                        <p className={`text-sm font-bold flex-shrink-0 ${isIncome ? 'text-[#146a5f]' : isTransfer ? 'text-[#4d44e3]' : 'text-[#9b3f5a]'}`}>
                          {isIncome ? '+' : isTransfer ? '↔' : '-'}{formatCompact(tx.amount)}
                        </p>

                        <div className="flex items-center gap-0.5 ml-1">
                          <button onClick={() => navigate('/add-transaction', { state: { transaction: tx } })}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[#dac0c4] hover:text-[#9b3f5a] hover:bg-[#ffd9e0]/40 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(tx)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[#dac0c4] hover:text-[#9b3f5a] hover:bg-[#ffd9e0]/40 transition-colors">
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
