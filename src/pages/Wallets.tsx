import { useState } from 'react';
import { Plus, Pencil, Trash2, EyeOff, Eye, Wallet as WalletIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallets, WalletFormData } from '../hooks/useWallets';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatCurrency } from '../utils/currency';
import { Wallet, WalletType } from '../types';

const WALLET_TYPES = [
  { value: 'cash', label: '💵 Tiền mặt' },
  { value: 'bank', label: '🏦 Ngân hàng' },
  { value: 'ewallet', label: '📱 Ví điện tử' },
  { value: 'credit', label: '💳 Thẻ tín dụng' },
  { value: 'savings', label: '🏧 Tiết kiệm' },
  { value: 'other', label: '📦 Khác' },
];

const WALLET_COLORS = ['#22c55e', '#3b82f6', '#f97316', '#a855f7', '#ec4899', '#6366f1', '#eab308', '#14b8a6'];

const WALLET_ICONS: Record<WalletType, string> = {
  cash: '💵', bank: '🏦', ewallet: '📱', credit: '💳', savings: '🏧', other: '📦',
};

const DEFAULT_FORM: WalletFormData = {
  name: '',
  type: 'cash',
  initialBalance: 0,
  note: '',
  color: WALLET_COLORS[0],
};

export function Wallets() {
  const { user } = useAuth();
  const { wallets, loading, addWallet, updateWallet, deleteWallet, totalBalance } = useWallets(user?.uid);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Wallet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Wallet | null>(null);
  const [form, setForm] = useState<WalletFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openAdd = () => {
    setEditTarget(null);
    setForm(DEFAULT_FORM);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (wallet: Wallet) => {
    setEditTarget(wallet);
    setForm({
      name: wallet.name,
      type: wallet.type,
      initialBalance: wallet.initialBalance,
      note: wallet.note || '',
      color: wallet.color || WALLET_COLORS[0],
    });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nhập tên ví';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await updateWallet(editTarget.id, form);
      } else {
        await addWallet(form);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteWallet(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="px-4 py-5 lg:px-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-[#1d1b1d] font-jakarta">Ví / Tài khoản</h1>
        <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAdd}>
          Thêm ví
        </Button>
      </div>

      {/* Total balance */}
      <div className="bg-white rounded-[1.5rem] p-5 mb-5 border border-[#ffd9e0]/30 shadow-[0_4px_16px_rgba(255,143,171,0.12)]">
        <p className="text-[10px] font-bold text-[#877275] uppercase tracking-widest mb-1">Tổng số dư</p>
        <p className="text-3xl font-bold text-[#9b3f5a] font-jakarta">{formatCurrency(totalBalance)}</p>
        <p className="text-xs text-[#877275] mt-1">{wallets.filter(w => w.isActive).length} ví đang hoạt động</p>
      </div>

      {wallets.length === 0 ? (
        <EmptyState
          icon="👛"
          title="Chưa có ví nào"
          description="Thêm ví để bắt đầu theo dõi số dư"
          action={{ label: 'Thêm ví đầu tiên', onClick: openAdd }}
        />
      ) : (
        <div className="space-y-3">
          {wallets.map(wallet => (
            <Card key={wallet.id} className={!wallet.isActive ? 'opacity-50' : ''}>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: (wallet.color || '#6366f1') + '20' }}
                >
                  {WALLET_ICONS[wallet.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#1d1b1d]">{wallet.name}</p>
                    {!wallet.isActive && (
                      <span className="text-[10px] bg-[#f8f2f4] text-[#877275] px-1.5 py-0.5 rounded-full">Tắt</span>
                    )}
                  </div>
                  <p className="text-xs text-[#877275]">
                    {WALLET_TYPES.find(t => t.value === wallet.type)?.label.split(' ')[1] || wallet.type}
                    {wallet.note ? ` • ${wallet.note}` : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-bold text-base font-jakarta ${wallet.currentBalance >= 0 ? 'text-[#1d1b1d]' : 'text-[#9b3f5a]'}`}>
                    {formatCurrency(wallet.currentBalance)}
                  </p>
                  <p className="text-[10px] text-[#877275]">
                    Ban đầu: {formatCurrency(wallet.initialBalance)}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => updateWallet(wallet.id, { isActive: !wallet.isActive })}
                    className="p-2 rounded-full hover:bg-[#f8f2f4] text-[#877275]"
                    title={wallet.isActive ? 'Tắt ví' : 'Bật ví'}
                  >
                    {wallet.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(wallet)}
                    className="p-2 rounded-full hover:bg-[#ffd9e0]/40 text-[#877275] hover:text-[#9b3f5a]"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(wallet)}
                    className="p-2 rounded-full hover:bg-[#ffd9e0]/40 text-[#877275] hover:text-[#9b3f5a]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editTarget ? 'Sửa ví' : 'Thêm ví mới'}>
        <div className="p-5 space-y-4">
          <Input
            label="Tên ví"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="VD: Tiền mặt, VCB, Momo..."
            error={errors.name}
          />

          <Select
            label="Loại ví"
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value as WalletType }))}
            options={WALLET_TYPES}
          />

          {!editTarget && (
            <Input
              label="Số dư ban đầu"
              type="number"
              value={form.initialBalance}
              onChange={e => setForm(f => ({ ...f, initialBalance: parseFloat(e.target.value) || 0 }))}
              placeholder="0"
              hint="Số tiền hiện có trong ví/tài khoản"
            />
          )}

          <div>
            <label className="block text-[10px] font-bold text-[#877275] uppercase tracking-wider mb-1.5">Màu</label>
            <div className="flex gap-2 flex-wrap">
              {WALLET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setForm(f => ({ ...f, color }))}
                  className={`w-7 h-7 rounded-full transition-all ${form.color === color ? 'ring-2 ring-offset-2 ring-[#9b3f5a] scale-110' : ''}`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>

          <Input
            label="Ghi chú"
            value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            placeholder="Tùy chọn..."
          />

          <Button fullWidth onClick={handleSave} loading={saving}>
            {editTarget ? 'Lưu thay đổi' : 'Thêm ví'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xoá ví"
        message={`Xoá ví "${deleteTarget?.name}"? Các giao dịch liên quan sẽ không bị xoá nhưng số dư sẽ không chính xác.`}
        loading={deleting}
      />
    </div>
  );
}
