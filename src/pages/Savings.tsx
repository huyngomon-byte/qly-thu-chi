import { useState } from 'react';
import { Plus, Pencil, Trash2, PiggyBank } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useSavingsGoals, SavingsGoalFormData } from '../hooks/useSavingsGoals';
import { useWallets } from '../hooks/useWallets';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatCurrency, formatCompact, formatAmount, parseAmount } from '../utils/currency';
import { formatDate } from '../utils/date';
import { SavingsGoal } from '../types';

const GOAL_ICONS = ['🎯', '🏠', '✈️', '🚗', '📱', '💻', '💍', '🎓', '👶', '🏖️', '🎮', '💰', '🏋️', '🐾', '🛒'];

const GOAL_COLORS = [
  '#9b3f5a', '#146a5f', '#4d44e3', '#f59e0b',
  '#10b981', '#ef4444', '#8b5cf6', '#ec4899',
];

const DEFAULT_FORM: SavingsGoalFormData = {
  name: '',
  icon: '🎯',
  targetAmount: 0,
  walletId: '',
  color: '#9b3f5a',
  note: '',
  deadline: '',
};

export function Savings() {
  const { user } = useAuth();
  const { goals, loading, addGoal, updateGoal, deleteGoal, contribute, withdraw } = useSavingsGoals(user?.uid);
  const { wallets } = useWallets(user?.uid);

  const activeWallets = wallets.filter(w => w.isActive);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<SavingsGoal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavingsGoal | null>(null);
  const [contributeTarget, setContributeTarget] = useState<SavingsGoal | null>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<SavingsGoal | null>(null);

  const [form, setForm] = useState<SavingsGoalFormData>(DEFAULT_FORM);
  const [contributeAmountStr, setContributeAmountStr] = useState('');
  const [withdrawAmountStr, setWithdrawAmountStr] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [contributing, setContributing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

  const openAdd = () => {
    setForm({ ...DEFAULT_FORM, walletId: activeWallets[0]?.id || '' });
    setEditTarget(null);
    setErrors({});
    setShowAddModal(true);
  };

  const openEdit = (goal: SavingsGoal) => {
    setEditTarget(goal);
    const deadlineStr = goal.deadline
      ? (() => {
          const d = goal.deadline instanceof Timestamp ? goal.deadline.toDate() : goal.deadline;
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        })()
      : '';
    setForm({
      name: goal.name,
      icon: goal.icon,
      targetAmount: goal.targetAmount,
      walletId: goal.walletId,
      color: goal.color,
      note: goal.note,
      deadline: deadlineStr,
    });
    setErrors({});
    setShowAddModal(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nhập tên mục tiêu';
    if (!form.targetAmount || form.targetAmount <= 0) errs.targetAmount = 'Nhập số tiền mục tiêu';
    if (!form.walletId) errs.walletId = 'Chọn ví';
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await updateGoal(editTarget.id, form);
      } else {
        await addGoal(form);
      }
      setShowAddModal(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const openContribute = (goal: SavingsGoal) => {
    setContributeTarget(goal);
    setContributeAmountStr('');
    setContributing(false);
  };

  const handleContribute = async () => {
    if (!contributeTarget) return;
    const amt = parseAmount(contributeAmountStr);
    if (!amt || amt <= 0) return;
    setContributing(true);
    try {
      await contribute(contributeTarget, amt);
      setContributeTarget(null);
    } catch (e) { console.error(e); }
    finally { setContributing(false); }
  };

  const openWithdraw = (goal: SavingsGoal) => {
    setWithdrawTarget(goal);
    setWithdrawAmountStr('');
    setWithdrawing(false);
  };

  const handleWithdraw = async () => {
    if (!withdrawTarget) return;
    const amt = parseAmount(withdrawAmountStr);
    if (!amt || amt <= 0) return;
    setWithdrawing(true);
    try {
      await withdraw(withdrawTarget, amt);
      setWithdrawTarget(null);
    } catch (e) { console.error(e); }
    finally { setWithdrawing(false); }
  };

  const getDeadlineCountdown = (goal: SavingsGoal) => {
    if (!goal.deadline) return null;
    const due = goal.deadline instanceof Timestamp ? goal.deadline.toDate() : goal.deadline;
    const diff = Math.ceil((due.getTime() - Date.now()) / 86400000);
    if (diff < 0) return { label: `Quá hạn ${Math.abs(diff)} ngày`, isOverdue: true };
    if (diff === 0) return { label: 'Hôm nay là hạn!', isOverdue: true };
    return { label: `Còn ${diff} ngày`, isOverdue: false };
  };

  const getWalletBalance = (walletId: string) => {
    return wallets.find(w => w.id === walletId)?.currentBalance ?? 0;
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="px-4 py-5 lg:px-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[#1d1b1d] font-jakarta">Muc tieu tiet kiem</h1>
        <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openAdd}>
          Them
        </Button>
      </div>

      {/* Summary card */}
      {goals.length > 0 && (
        <div
          className="rounded-[1.5rem] p-5 text-white mb-5"
          style={{ background: 'linear-gradient(135deg, #9b3f5a 0%, #c2547a 100%)', boxShadow: '0 8px 24px rgba(155,63,90,0.30)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <PiggyBank className="w-5 h-5 opacity-70" />
            <p className="text-sm opacity-80 font-medium">Tong quan tiet kiem</p>
          </div>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-2xl font-bold">{formatCompact(totalSaved)}</p>
              <p className="text-xs opacity-60 mt-0.5">/ {formatCompact(totalTarget)} muc tieu</p>
            </div>
            <p className="text-2xl font-bold opacity-80">{overallProgress.toFixed(0)}%</p>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="text-xs opacity-60 mt-2">{goals.length} muc tieu · {goals.filter(g => g.isCompleted).length} da dat</p>
        </div>
      )}

      {/* Goal list */}
      {goals.length === 0 ? (
        <EmptyState
          icon="🏦"
          title="Chua co muc tieu nao"
          description="Them muc tieu tiet kiem de bat dau hanh trinh tai chinh cua ban"
          action={{ label: '+ Them muc tieu', onClick: openAdd }}
        />
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            const progress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
            const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
            const countdown = getDeadlineCountdown(goal);
            const wallet = wallets.find(w => w.id === goal.walletId);

            return (
              <div
                key={goal.id}
                className="bg-white rounded-[1.5rem] p-5 shadow-pink-md border border-[#ffd9e0]/20"
                style={{ boxShadow: '0 4px 20px rgba(155,63,90,0.08)' }}
              >
                {/* Goal header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ background: goal.color + '20' }}
                    >
                      {goal.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#1d1b1d] font-jakarta">{goal.name}</p>
                        {goal.isCompleted && (
                          <span className="text-[10px] font-semibold text-[#146a5f] bg-[#a4f1e3]/30 px-2 py-0.5 rounded-full">
                            🎉 Da dat!
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#877275]">
                        {wallet ? wallet.name : ''}
                        {countdown && (
                          <span className={` · ${countdown.isOverdue ? 'text-[#9b3f5a]' : 'text-[#877275]'}`}>
                            {countdown.label}
                          </span>
                        )}
                        {goal.deadline && !countdown && (
                          <span> · HH: {formatDate(goal.deadline instanceof Timestamp ? goal.deadline.toDate() : goal.deadline as unknown as Date)}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Edit + Delete */}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openEdit(goal)}
                      className="w-8 h-8 rounded-xl border-2 border-[#dac0c4]/40 flex items-center justify-center text-[#877275] hover:border-[#9b3f5a]/40 hover:text-[#9b3f5a] transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(goal)}
                      className="w-8 h-8 rounded-xl border-2 border-[#dac0c4]/40 flex items-center justify-center text-[#877275] hover:border-red-200 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="h-2.5 bg-[#f8f2f4] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${progress}%`, background: goal.isCompleted ? '#146a5f' : goal.color }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <p className="text-xs text-[#877275]">
                      {formatCompact(goal.currentAmount)} / {formatCompact(goal.targetAmount)}
                    </p>
                    <p className="text-xs font-semibold" style={{ color: goal.color }}>
                      {progress.toFixed(0)}%
                    </p>
                  </div>
                </div>

                {goal.note ? (
                  <p className="text-xs text-[#877275] italic mb-3">"{goal.note}"</p>
                ) : null}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openContribute(goal)}
                    className="flex-1 py-2 rounded-[1.25rem] text-xs font-semibold border-2 border-[#ffd9e0] text-[#9b3f5a] hover:bg-[#ffd9e0]/30 transition-all active:scale-95"
                  >
                    💰 Nap tien
                  </button>
                  {goal.currentAmount > 0 && (
                    <button
                      onClick={() => openWithdraw(goal)}
                      className="flex-1 py-2 rounded-[1.25rem] text-xs font-semibold border-2 border-[#a4f1e3]/60 text-[#146a5f] hover:bg-[#a4f1e3]/20 transition-all active:scale-95"
                    >
                      🏧 Rut tien
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editTarget ? '✏️ Sua muc tieu' : '🎯 Them muc tieu tiet kiem'}
      >
        <div className="p-5 space-y-4">
          {/* Icon picker */}
          <div>
            <label className="block text-sm font-medium text-[#544245] mb-2">Bieu tuong</label>
            <div className="flex flex-wrap gap-2">
              {GOAL_ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setForm(f => ({ ...f, icon }))}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all active:scale-90 ${
                    form.icon === icon
                      ? 'bg-[#ffd9e0] ring-2 ring-[#9b3f5a]'
                      : 'bg-[#f8f2f4] hover:bg-[#ffd9e0]/50'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Ten muc tieu"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Vi du: Mua nha, Du lich Nhat..."
            error={errors.name}
          />

          {/* Target amount */}
          <div>
            <label className="block text-sm font-medium text-[#544245] mb-1.5">So tien muc tieu</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.targetAmount ? formatAmount(form.targetAmount) : ''}
              onChange={e => {
                const raw = e.target.value.replace(/[^\d]/g, '');
                setForm(f => ({ ...f, targetAmount: parseInt(raw) || 0 }));
              }}
              placeholder="0"
              className="input-modern"
            />
            {errors.targetAmount && <p className="mt-1 text-xs text-[#9b3f5a]">{errors.targetAmount}</p>}
          </div>

          <Select
            label="Vi nguon"
            value={form.walletId}
            onChange={e => setForm(f => ({ ...f, walletId: e.target.value }))}
            options={activeWallets.map(w => ({ value: w.id, label: `${w.name} (${formatCompact(w.currentBalance)})` }))}
            error={errors.walletId}
          />

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-[#544245] mb-2">Mau sac</label>
            <div className="flex gap-2 flex-wrap">
              {GOAL_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setForm(f => ({ ...f, color }))}
                  className={`w-8 h-8 rounded-full transition-all active:scale-90 ${
                    form.color === color ? 'ring-2 ring-offset-2 ring-[#9b3f5a] scale-110' : ''
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-[#544245] mb-1.5">Han chot (tuy chon)</label>
            <input
              type="date"
              value={form.deadline || ''}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              className="input-modern"
            />
          </div>

          <Input
            label="Ghi chu"
            value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            placeholder="Tuy chon..."
          />

          <Button fullWidth onClick={handleSave} loading={saving}>
            {editTarget ? 'Luu thay doi' : 'Them muc tieu'}
          </Button>
        </div>
      </Modal>

      {/* Contribute Modal */}
      <Modal
        isOpen={!!contributeTarget}
        onClose={() => setContributeTarget(null)}
        title="💰 Nap tien tiet kiem"
        size="sm"
      >
        <div className="p-5 space-y-4">
          {contributeTarget && (
            <div className="bg-[#f8f2f4] rounded-[1.25rem] p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{contributeTarget.icon}</span>
                <p className="text-sm font-semibold text-[#544245]">{contributeTarget.name}</p>
              </div>
              <p className="text-xs text-[#877275]">
                Con thieu: {formatCurrency(Math.max(contributeTarget.targetAmount - contributeTarget.currentAmount, 0))}
              </p>
              <p className="text-xs text-[#877275]">
                So du vi: {formatCurrency(getWalletBalance(contributeTarget.walletId))}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[#544245] mb-1.5">So tien nap</label>
            <input
              type="text"
              inputMode="numeric"
              value={contributeAmountStr}
              onChange={e => {
                const raw = e.target.value.replace(/[^\d]/g, '');
                setContributeAmountStr(raw ? formatAmount(parseInt(raw)) : '');
              }}
              placeholder="0"
              className="input-modern text-xl font-bold"
              autoFocus
            />
          </div>
          <Button fullWidth onClick={handleContribute} loading={contributing}>
            Xac nhan nap tien
          </Button>
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        isOpen={!!withdrawTarget}
        onClose={() => setWithdrawTarget(null)}
        title="🏧 Rut tien tiet kiem"
        size="sm"
      >
        <div className="p-5 space-y-4">
          {withdrawTarget && (
            <div className="bg-[#f8f2f4] rounded-[1.25rem] p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{withdrawTarget.icon}</span>
                <p className="text-sm font-semibold text-[#544245]">{withdrawTarget.name}</p>
              </div>
              <p className="text-xs text-[#877275]">
                Dang tiet kiem: {formatCurrency(withdrawTarget.currentAmount)}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[#544245] mb-1.5">So tien rut</label>
            <input
              type="text"
              inputMode="numeric"
              value={withdrawAmountStr}
              onChange={e => {
                const raw = e.target.value.replace(/[^\d]/g, '');
                setWithdrawAmountStr(raw ? formatAmount(parseInt(raw)) : '');
              }}
              placeholder="0"
              className="input-modern text-xl font-bold"
              autoFocus
            />
          </div>
          <Button fullWidth onClick={handleWithdraw} loading={withdrawing}>
            Xac nhan rut tien
          </Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          await deleteGoal(deleteTarget).catch(console.error);
          setDeleteTarget(null);
          setDeleting(false);
        }}
        title="Xoa muc tieu tiet kiem"
        message="So tien da tiet kiem se duoc hoan lai vao vi. Chac chan xoa?"
        loading={deleting}
      />
    </div>
  );
}
