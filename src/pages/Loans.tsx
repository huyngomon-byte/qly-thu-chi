import { useState, useMemo } from 'react';

import { Plus, Trash2, CheckCircle, DollarSign, Clock, Users, TrendingDown, TrendingUp } from 'lucide-react';

import { Timestamp } from 'firebase/firestore';

import { useAuth } from '../contexts/AuthContext';

import { useLoans, LoanFormData } from '../hooks/useLoans';

import { useWallets } from '../hooks/useWallets';

import { Modal } from '../components/ui/Modal';

import { Input, Select } from '../components/ui/Input';

import { Button } from '../components/ui/Button';

import { ConfirmDialog } from '../components/ui/ConfirmDialog';

import { EmptyState } from '../components/ui/EmptyState';

import { LoadingSpinner } from '../components/ui/LoadingSpinner';

import { formatCurrency, formatCompact, parseAmount, formatAmount } from '../utils/currency';

import { formatDate, formatInputDate } from '../utils/date';

import { Loan } from '../types';



const DEFAULT_FORM: LoanFormData = {

  type: 'borrow',

  personName: '',

  amount: 0,

  date: new Date(),

  walletId: '',

  note: '',

};



export function Loans() {

  const { user } = useAuth();

  const { loans, loading, addLoan, recordPayment, markAsPaid, deleteLoan, totalBorrow, totalLend } = useLoans(user?.uid);

  const { wallets } = useWallets(user?.uid);



  const [tab, setTab] = useState<'borrow' | 'lend' | 'paid'>('borrow');

  const [showAddModal, setShowAddModal] = useState(false);

  const [showPayModal, setShowPayModal] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Loan | null>(null);

  const [payTarget, setPayTarget] = useState<Loan | null>(null);

  const [form, setForm] = useState<LoanFormData>(DEFAULT_FORM);

  const [payAmountStr, setPayAmountStr] = useState('');

  const [payNote, setPayNote] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [paying, setPaying] = useState(false);

  const [hasDueDate, setHasDueDate] = useState(false);



  const activeWallets = wallets.filter(w => w.isActive);



  const displayed = useMemo(() => {

    if (tab === 'paid') return loans.filter(l => l.status === 'paid');

    return loans.filter(l => l.type === tab && l.status === 'active');

  }, [loans, tab]);



  const openAdd = (type: 'borrow' | 'lend') => {

    setForm({ ...DEFAULT_FORM, type, walletId: activeWallets[0]?.id || '' });

    setHasDueDate(false);

    setErrors({});

    setShowAddModal(true);

  };



  const validate = () => {

    const errs: Record<string, string> = {};

    if (!form.personName.trim()) errs.personName = 'Nhập tên người';

    if (!form.amount || form.amount <= 0) errs.amount = 'Nhập số tiền';

    if (!form.walletId) errs.walletId = 'Chọn ví';

    setErrors(errs);

    return !Object.keys(errs).length;

  };



  const handleSave = async () => {

    if (!validate()) return;

    setSaving(true);

    try {

      await addLoan(form);

      setShowAddModal(false);

    } catch (e) { console.error(e); }

    finally { setSaving(false); }

  };



  const openPay = (loan: Loan) => {

    setPayTarget(loan);

    setPayAmountStr('');

    setPayNote('');

    setShowPayModal(true);

  };



  const handlePay = async () => {

    if (!payTarget) return;

    const amt = parseAmount(payAmountStr);

    if (!amt || amt <= 0) return;

    setPaying(true);

    try {

      await recordPayment(payTarget, amt, payNote);

      setShowPayModal(false);

    } catch (e) { console.error(e); }

    finally { setPaying(false); }

  };



  const isOverdue = (loan: Loan) => {

    if (!loan.dueDate) return false;

    const due = loan.dueDate instanceof Timestamp ? loan.dueDate.toDate() : loan.dueDate;

    return due < new Date();

  };



  const daysUntilDue = (loan: Loan) => {

    if (!loan.dueDate) return null;

    const due = loan.dueDate instanceof Timestamp ? loan.dueDate.toDate() : loan.dueDate;

    const diff = Math.ceil((due.getTime() - Date.now()) / 86400000);

    return diff;

  };



  if (loading) return <LoadingSpinner fullScreen />;



  return (

    <div className="px-4 py-5 lg:px-6 max-w-2xl mx-auto">

      <div className="flex items-center justify-between mb-4">

        <h1 className="text-xl font-bold text-[#1d1b1d]">Vay / Cho vay</h1>

        <div className="flex gap-2">

          <Button size="sm" variant="secondary" icon={<TrendingUp className="w-3.5 h-3.5" />} onClick={() => openAdd('lend')}>

            Cho vay

          </Button>

          <Button size="sm" icon={<TrendingDown className="w-3.5 h-3.5" />} onClick={() => openAdd('borrow')}>

            Tôi vay

          </Button>

        </div>

      </div>



      {/* Summary */}

      <div className="grid grid-cols-2 gap-3 mb-5">

        <div className="rounded-[1.5rem] p-4 text-white" style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)', boxShadow: '0 8px 24px rgba(244,63,94,0.3)' }}>

          <div className="flex items-center gap-2 mb-1">

            <TrendingDown className="w-4 h-4 opacity-70" />

            <p className="text-sm opacity-80 font-medium">Tôi đang nợ</p>

          </div>

          <p className="text-2xl font-bold">{formatCompact(totalBorrow)}</p>

          <p className="text-xs opacity-60 mt-0.5">{loans.filter(l => l.type === 'borrow' && l.status === 'active').length} khoản</p>

        </div>

        <div className="rounded-[1.5rem] p-4 text-white" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>

          <div className="flex items-center gap-2 mb-1">

            <TrendingUp className="w-4 h-4 opacity-70" />

            <p className="text-sm opacity-80 font-medium">Người nợ tôi</p>

          </div>

          <p className="text-2xl font-bold">{formatCompact(totalLend)}</p>

          <p className="text-xs opacity-60 mt-0.5">{loans.filter(l => l.type === 'lend' && l.status === 'active').length} khoản</p>

        </div>

      </div>



      {/* Tabs */}

      <div className="flex gap-1 bg-white p-1 rounded-[1.25rem] shadow-sm mb-4">

        {[

          { value: 'borrow', label: '💸 Tôi vay' },

          { value: 'lend', label: '🤝 Cho vay' },

          { value: 'paid', label: '✅ Đã xong' },

        ].map(t => (

          <button

            key={t.value}

            onClick={() => setTab(t.value as any)}

            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${

              tab === t.value ? 'bg-[#9b3f5a] text-white shadow' : 'text-[#877275]'

            }`}

          >

            {t.label}

          </button>

        ))}

      </div>



      {/* Loan list */}

      {displayed.length === 0 ? (

        <EmptyState

          icon={tab === 'paid' ? '✅' : tab === 'borrow' ? '💸' : '🤝'}

          title={tab === 'paid' ? 'Chưa có khoản nào hoàn thành' : tab === 'borrow' ? 'Không có khoản đang vay' : 'Không có ai đang nợ bạn'}

          action={tab !== 'paid' ? { label: `+ ${tab === 'borrow' ? 'Thêm khoản vay' : 'Thêm khoản cho vay'}`, onClick: () => openAdd(tab as 'borrow' | 'lend') } : undefined}

        />

      ) : (

        <div className="space-y-3">

          {displayed.map(loan => {

            const remaining = loan.amount - loan.paidAmount;

            const progress = loan.amount > 0 ? (loan.paidAmount / loan.amount) * 100 : 0;

            const overdue = isOverdue(loan);

            const days = daysUntilDue(loan);

            const wallet = wallets.find(w => w.id === loan.walletId);

            const d = loan.date instanceof Timestamp ? loan.date.toDate() : loan.date;

            const isBorrow = loan.type === 'borrow';



            return (

              <div key={loan.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-50">

                {/* Header */}

                <div className="flex items-start justify-between mb-3">

                  <div className="flex items-center gap-3">

                    <div className={`w-11 h-11 rounded-[1.25rem] flex items-center justify-center text-2xl ${isBorrow ? 'bg-[#ffd9e0]/20' : 'bg-[#a4f1e3]/20'}`}>

                      {isBorrow ? '💸' : '🤝'}

                    </div>

                    <div>

                      <p className="font-bold text-[#1d1b1d]">{loan.personName}</p>

                      <p className="text-xs text-[#877275]">

                        {isBorrow ? 'Vay từ' : 'Cho'} · {formatDate(d)}

                        {wallet ? ` · ${wallet.name}` : ''}

                      </p>

                    </div>

                  </div>

                  <div className="text-right">

                    <p className={`font-bold text-base ${isBorrow ? 'text-[#9b3f5a]' : 'text-[#146a5f]'}`}>

                      {formatCompact(remaining)}

                    </p>

                    <p className="text-[10px] text-[#877275]">/ {formatCompact(loan.amount)}</p>

                  </div>

                </div>



                {/* Progress */}

                <div className="mb-3">

                  <div className="h-2 bg-[#f8f2f4] rounded-full overflow-hidden">

                    <div

                      className={`h-full rounded-full transition-all duration-500 ${isBorrow ? 'bg-gradient-to-r from-rose-400 to-red-500' : 'bg-gradient-to-r from-emerald-400 to-green-500'}`}

                      style={{ width: `${progress}%` }}

                    />

                  </div>

                  <div className="flex justify-between mt-1">

                    <p className="text-[10px] text-[#877275]">Đã trả {progress.toFixed(0)}%</p>

                    {loan.dueDate && (

                      <p className={`text-[10px] font-semibold ${overdue ? 'text-[#9b3f5a]' : days !== null && days <= 7 ? 'text-amber-500' : 'text-[#877275]'}`}>

                        {overdue ? `Quá hạn ${Math.abs(days!)} ngày ⚠️` : days !== null ? `Còn ${days} ngày` : ''}

                      </p>

                    )}

                  </div>

                </div>



                {loan.note && (

                  <p className="text-xs text-[#877275] italic mb-3">"{loan.note}"</p>

                )}



                {/* Actions */}

                {loan.status === 'active' && (

                  <div className="flex gap-2">

                    <button

                      onClick={() => openPay(loan)}

                      className={`flex-1 py-2 rounded-[1.25rem] text-xs font-semibold border-2 transition-all active:scale-95 ${

                        isBorrow ? 'border-rose-200 text-[#9b3f5a] hover:bg-[#ffd9e0]/30' : 'border-emerald-200 text-[#146a5f] hover:bg-[#a4f1e3]/20'

                      }`}

                    >

                      {isBorrow ? '💳 Trả tiền' : '💵 Nhận tiền'}

                    </button>

                    <button

                      onClick={() => markAsPaid(loan)}

                      className="flex-1 py-2 rounded-[1.25rem] text-xs font-semibold border-2 border-indigo-200 text-[#9b3f5a] hover:bg-[#ffd9e0]/30 transition-all active:scale-95"

                    >

                      ✅ Xong hẳn

                    </button>

                    <button

                      onClick={() => setDeleteTarget(loan)}

                      className="w-9 h-9 rounded-[1.25rem] border-2 border-[#dac0c4]/40 flex items-center justify-center text-[#877275] hover:border-red-200 hover:text-[#9b3f5a] transition-all"

                    >

                      <Trash2 className="w-3.5 h-3.5" />

                    </button>

                  </div>

                )}



                {loan.status === 'paid' && (

                  <div className="flex items-center justify-between">

                    <span className="text-xs text-[#146a5f] font-semibold bg-[#a4f1e3]/20 px-3 py-1 rounded-xl">✅ Đã hoàn thành</span>

                    <button onClick={() => setDeleteTarget(loan)} className="text-[#dac0c4] hover:text-red-400 transition-colors">

                      <Trash2 className="w-3.5 h-3.5" />

                    </button>

                  </div>

                )}

              </div>

            );

          })}

        </div>

      )}



      {/* Add Modal */}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={form.type === 'borrow' ? '💸 Thêm khoản vay' : '🤝 Thêm khoản cho vay'}>

        <div className="p-5 space-y-4">

          <div className="flex gap-2 bg-[#f8f2f4] rounded-[1.25rem] p-1">

            {[{ v: 'borrow', l: '💸 Tôi vay' }, { v: 'lend', l: '🤝 Tôi cho vay' }].map(({ v, l }) => (

              <button

                key={v}

                onClick={() => setForm(f => ({ ...f, type: v as 'borrow' | 'lend' }))}

                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${form.type === v ? 'bg-[#9b3f5a] text-white' : 'text-[#877275]'}`}

              >

                {l}

              </button>

            ))}

          </div>



          <Input

            label={form.type === 'borrow' ? 'Vay từ ai?' : 'Cho ai vay?'}

            value={form.personName}

            onChange={e => setForm(f => ({ ...f, personName: e.target.value }))}

            placeholder="Tên người..."

            error={errors.personName}

          />



          <div>

            <label className="block text-sm font-medium text-[#544245] mb-1.5">Số tiền</label>

            <input

              type="text"

              inputMode="numeric"

              value={form.amount ? formatAmount(form.amount) : ''}

              onChange={e => {

                const raw = e.target.value.replace(/[^\d]/g, '');

                setForm(f => ({ ...f, amount: parseInt(raw) || 0 }));

              }}

              placeholder="0"

              className="input-modern"

            />

            {errors.amount && <p className="mt-1 text-xs text-[#9b3f5a]">{errors.amount}</p>}

          </div>



          <Input label="Ngày" type="date" value={formatInputDate(form.date)} onChange={e => setForm(f => ({ ...f, date: new Date(e.target.value) }))} />



          <label className="flex items-center gap-2 cursor-pointer">

            <input type="checkbox" checked={hasDueDate} onChange={e => setHasDueDate(e.target.checked)} className="rounded text-[#9b3f5a]" />

            <span className="text-sm text-[#544245]">Có ngày đến hạn</span>

          </label>



          {hasDueDate && (

            <Input

              label="Ngày đến hạn"

              type="date"

              value={form.dueDate ? formatInputDate(form.dueDate) : ''}

              onChange={e => setForm(f => ({ ...f, dueDate: new Date(e.target.value) }))}

            />

          )}



          <Select

            label="Ví liên quan"

            value={form.walletId}

            onChange={e => setForm(f => ({ ...f, walletId: e.target.value }))}

            options={activeWallets.map(w => ({ value: w.id, label: w.name }))}

            error={errors.walletId}

          />



          <Input

            label="Ghi chú"

            value={form.note}

            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}

            placeholder="Tùy chọn..."

          />



          <Button fullWidth onClick={handleSave} loading={saving}>

            {form.type === 'borrow' ? 'Lưu khoản vay' : 'Lưu khoản cho vay'}

          </Button>

        </div>

      </Modal>



      {/* Pay Modal */}

      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title={payTarget?.type === 'borrow' ? '💳 Trả tiền' : '💵 Nhận tiền'} size="sm">

        <div className="p-5 space-y-4">

          {payTarget && (

            <div className="bg-[#f8f2f4] rounded-[1.25rem] p-3">

              <p className="text-sm font-semibold text-[#544245]">{payTarget.personName}</p>

              <p className="text-xs text-[#877275]">Còn lại: {formatCurrency(payTarget.amount - payTarget.paidAmount)}</p>

            </div>

          )}

          <div>

            <label className="block text-sm font-medium text-[#544245] mb-1.5">Số tiền</label>

            <input

              type="text"

              inputMode="numeric"

              value={payAmountStr}

              onChange={e => {

                const raw = e.target.value.replace(/[^\d]/g, '');

                setPayAmountStr(raw ? formatAmount(parseInt(raw)) : '');

              }}

              placeholder="0"

              className="input-modern text-xl font-bold"

              autoFocus

            />

          </div>

          <Input label="Ghi chú" value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="Tùy chọn..." />

          <Button fullWidth onClick={handlePay} loading={paying}>Xác nhận</Button>

        </div>

      </Modal>



      <ConfirmDialog

        isOpen={!!deleteTarget}

        onClose={() => setDeleteTarget(null)}

        onConfirm={async () => {

          if (!deleteTarget) return;

          setDeleting(true);

          await deleteLoan(deleteTarget).catch(console.error);

          setDeleteTarget(null);

          setDeleting(false);

        }}

        title="Xoá khoản vay"

        message="Số dư ví sẽ được hoàn lại theo trạng thái hiện tại. Chắc chắn xoá?"

        loading={deleting}

      />

    </div>

  );

}



