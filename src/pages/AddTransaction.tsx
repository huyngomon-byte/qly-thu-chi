import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, ArrowLeftRight, Check, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions, TransactionFormData } from '../hooks/useTransactions';
import { useWallets } from '../hooks/useWallets';
import { useCategories } from '../hooks/useCategories';
import { formatInputDate } from '../utils/date';
import { parseAmount, formatAmount } from '../utils/currency';
import { Transaction, TransactionType, PaymentMethod } from '../types';

const TYPE_CONFIG = {
  expense: {
    label: 'Chi tiêu',
    gradient: 'from-rose-500 to-red-600',
    lightBg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-400',
    text: 'text-rose-600',
    icon: TrendingDown,
    iconBg: 'bg-rose-500',
  },
  income: {
    label: 'Thu nhập',
    gradient: 'from-emerald-500 to-green-600',
    lightBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-400',
    text: 'text-emerald-600',
    icon: TrendingUp,
    iconBg: 'bg-emerald-500',
  },
  transfer: {
    label: 'Chuyển khoản',
    gradient: 'from-blue-500 to-indigo-600',
    lightBg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-400',
    text: 'text-blue-600',
    icon: ArrowLeftRight,
    iconBg: 'bg-blue-500',
  },
};

const PAYMENT_METHODS: { value: PaymentMethod; label: string; emoji: string }[] = [
  { value: 'cash', label: 'Tiền mặt', emoji: '💵' },
  { value: 'transfer', label: 'Chuyển khoản', emoji: '🏦' },
  { value: 'card', label: 'Thẻ', emoji: '💳' },
  { value: 'ewallet', label: 'Ví điện tử', emoji: '📱' },
];

export function AddTransaction() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editTx: Transaction | undefined = location.state?.transaction;

  const { addTransaction, updateTransaction } = useTransactions(user?.uid);
  const { wallets } = useWallets(user?.uid);
  const { expenseCategories, incomeCategories } = useCategories(user?.uid);

  const [type, setType] = useState<TransactionType>(editTx?.type || 'expense');
  const [amountStr, setAmountStr] = useState(editTx ? formatAmount(editTx.amount) : '');
  const [date, setDate] = useState(editTx ? formatInputDate((editTx.date as any).toDate()) : formatInputDate(new Date()));
  const [categoryId, setCategoryId] = useState(editTx?.categoryId || '');
  const [walletId, setWalletId] = useState(editTx?.walletId || '');
  const [toWalletId, setToWalletId] = useState(editTx?.toWalletId || '');
  const [note, setNote] = useState(editTx?.note || '');
  const [payee, setPayee] = useState(editTx?.payee || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(editTx?.paymentMethod || 'cash');
  const [isFixed, setIsFixed] = useState(editTx?.isFixed || false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = type === 'income' ? incomeCategories : expenseCategories;
  const activeWallets = wallets.filter(w => w.isActive);
  const cfg = TYPE_CONFIG[type];

  useEffect(() => {
    if (!editTx) setCategoryId(categories[0]?.id || '');
  }, [type, categories.length]);

  useEffect(() => {
    if (!editTx && activeWallets.length > 0 && !walletId) setWalletId(activeWallets[0].id);
  }, [activeWallets.length]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!parseAmount(amountStr)) errs.amount = 'Nhập số tiền';
    if (!categoryId && type !== 'transfer') errs.category = 'Chọn danh mục';
    if (!walletId) errs.wallet = 'Chọn ví';
    if (type === 'transfer') {
      if (!toWalletId) errs.toWallet = 'Chọn ví đích';
      else if (toWalletId === walletId) errs.toWallet = 'Ví đích phải khác ví nguồn';
    }
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    const formData: TransactionFormData = {
      type,
      amount: parseAmount(amountStr),
      date: new Date(date),
      categoryId: type === 'transfer' ? 'transfer' : categoryId,
      walletId,
      toWalletId: type === 'transfer' ? toWalletId : undefined,
      note, payee, paymentMethod,
      isFixed, isRecurring: false,
    };
    try {
      if (editTx) await updateTransaction(editTx.id, formData, editTx);
      else await addTransaction(formData);
      navigate(-1);
    } catch (err) {
      setErrors({ submit: 'Có lỗi, thử lại nhé!' });
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    setAmountStr(raw ? formatAmount(parseInt(raw)) : '');
  };

  return (
    <div className="min-h-screen bg-[#F4F6FF] dark:bg-[#0C0C1A]">
      {/* Colored header */}
      <div className={`bg-gradient-to-br ${cfg.gradient} px-4 pt-5 pb-20 relative overflow-hidden`}
        style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}>
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full -translate-x-1/2 translate-y-1/2" />

        {/* Back + Title */}
        <div className="relative flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-white font-bold text-lg">{editTx ? 'Sửa giao dịch' : 'Thêm giao dịch'}</h1>
        </div>

        {/* Type selector */}
        <div className="relative grid grid-cols-3 gap-2 mb-6 bg-black/15 rounded-2xl p-1">
          {(Object.entries(TYPE_CONFIG) as [TransactionType, typeof cfg][]).map(([key, c]) => {
            const Icon = c.icon;
            const isActive = type === key;
            return (
              <button
                key={key}
                onClick={() => setType(key)}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive ? 'bg-white text-gray-800 shadow' : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Amount */}
        <div className="relative text-center">
          <p className="text-white/60 text-xs mb-2 font-medium">SỐ TIỀN</p>
          <div className="flex items-center justify-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={amountStr}
              onChange={handleAmountChange}
              placeholder="0"
              className="amount-input text-white placeholder-white/40 max-w-[240px]"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            />
            <span className="text-white/60 text-xl font-bold">₫</span>
          </div>
          {errors.amount && <p className="text-white/80 text-xs mt-1">{errors.amount}</p>}
        </div>
      </div>

      {/* Form card */}
      <div className="px-4 -mt-12 pb-8 max-w-lg mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-xl p-5 space-y-5"
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.10)' }}>

          {/* Category grid */}
          {type !== 'transfer' && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Danh mục</p>
              {errors.category && <p className="text-xs text-red-500 mb-2">{errors.category}</p>}
              <div className="grid grid-cols-4 gap-2">
                {categories.map(cat => {
                  const isActive = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 transition-all duration-150 active:scale-95 ${
                        isActive ? `${cfg.border} ${cfg.lightBg}` : 'border-transparent bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <span className="text-2xl">{cat.icon}</span>
                      <span className={`text-[10px] font-semibold text-center leading-tight ${isActive ? cfg.text : 'text-gray-500 dark:text-gray-400'}`}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ngày</p>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="input-modern"
            />
          </div>

          {/* Wallet */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              {type === 'transfer' ? 'Ví nguồn' : 'Ví / Tài khoản'}
            </p>
            {errors.wallet && <p className="text-xs text-red-500 mb-1">{errors.wallet}</p>}
            <div className="flex gap-2 flex-wrap">
              {activeWallets.map(w => (
                <button
                  key={w.id}
                  onClick={() => setWalletId(w.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold border-2 transition-all ${
                    walletId === w.id ? `${cfg.border} ${cfg.lightBg} ${cfg.text}` : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500'
                  }`}
                >
                  {w.type === 'cash' ? '💵' : w.type === 'bank' ? '🏦' : w.type === 'ewallet' ? '📱' : '💳'}
                  {w.name}
                </button>
              ))}
            </div>
          </div>

          {/* To wallet (transfer) */}
          {type === 'transfer' && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ví đích</p>
              {errors.toWallet && <p className="text-xs text-red-500 mb-1">{errors.toWallet}</p>}
              <div className="flex gap-2 flex-wrap">
                {activeWallets.filter(w => w.id !== walletId).map(w => (
                  <button
                    key={w.id}
                    onClick={() => setToWalletId(w.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold border-2 transition-all ${
                      toWalletId === w.id ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500'
                    }`}
                  >
                    {w.type === 'cash' ? '💵' : '🏦'} {w.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payment method */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Phương thức</p>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setPaymentMethod(m.value)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-2xl text-xs font-semibold border-2 transition-all ${
                    paymentMethod === m.value ? `${cfg.border} ${cfg.lightBg} ${cfg.text}` : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500'
                  }`}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payee + Note */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nơi chi / Người nhận</p>
              <input
                value={payee}
                onChange={e => setPayee(e.target.value)}
                placeholder="VD: Quán cơm, Grab, Siêu thị..."
                className="input-modern"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ghi chú</p>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                placeholder="Ghi chú thêm..."
                className="input-modern resize-none"
              />
            </div>
          </div>

          {/* Fixed expense toggle */}
          <label className="flex items-center gap-3 py-3 px-4 rounded-2xl bg-gray-50 dark:bg-gray-800 cursor-pointer">
            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isFixed ? `${cfg.iconBg} border-transparent` : 'border-gray-300 dark:border-gray-600'}`}
              onClick={() => setIsFixed(!isFixed)}>
              {isFixed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Chi tiêu cố định</p>
              <p className="text-[11px] text-gray-400">Khoản lặp lại hàng tháng</p>
            </div>
          </label>

          {errors.submit && <p className="text-red-500 text-sm text-center">{errors.submit}</p>}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r ${cfg.gradient} transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2`}
            style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" strokeWidth={2.5} />
                {editTx ? 'Cập nhật giao dịch' : 'Lưu giao dịch'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
