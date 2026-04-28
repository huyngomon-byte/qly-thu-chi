import { useState } from 'react';
import { Plus, Pencil, Trash2, PlayCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRecurring, RecurringFormData } from '../hooks/useRecurring';
import { useWallets } from '../hooks/useWallets';
import { useCategories } from '../hooks/useCategories';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatCurrency } from '../utils/currency';
import { getCurrentMonth, getMonthLabel } from '../utils/date';
import { RecurringExpense } from '../types';

const DEFAULT_FORM: RecurringFormData = {
  name: '',
  amount: 0,
  categoryId: '',
  walletId: '',
  dayOfMonth: 1,
  note: '',
};

export function Recurring() {
  const { user } = useAuth();
  const { recurring, loading, addRecurring, updateRecurring, deleteRecurring, createTransaction } = useRecurring(user?.uid);
  const { wallets } = useWallets(user?.uid);
  const { expenseCategories } = useCategories(user?.uid);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<RecurringExpense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringExpense | null>(null);
  const [form, setForm] = useState<RecurringFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const currentMonth = getCurrentMonth();

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...DEFAULT_FORM, categoryId: expenseCategories[0]?.id || '', walletId: wallets[0]?.id || '' });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (item: RecurringExpense) => {
    setEditTarget(item);
    setForm({ name: item.name, amount: item.amount, categoryId: item.categoryId, walletId: item.walletId, dayOfMonth: item.dayOfMonth, note: item.note || '' });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nhập tên khoản chi';
    if (!form.amount || form.amount <= 0) errs.amount = 'Số ti�n phải > 0';
    if (!form.categoryId) errs.category = 'Ch�n danh mục';
    if (!form.walletId) errs.wallet = 'Ch�n ví';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await updateRecurring(editTarget.id, form);
      } else {
        await addRecurring(form);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (item: RecurringExpense) => {
    setCreatingId(item.id);
    try {
      await createTransaction(item);
      setToast('�ã tạo giao dịch thành công!');
      setTimeout(() => setToast(''), 3000);
    } catch (err: any) {
      setToast(err.message || 'Có lỗi xảy ra');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setCreatingId(null);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="px-4 py-5 lg:px-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#1d1b1d]">Chi tiêu cố định</h1>
          <p className="text-xs text-[#877275] mt-0.5">{getMonthLabel(currentMonth)}</p>
        </div>
        <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAdd}>
          Thêm
        </Button>
      </div>

      {toast && (
        <div className="mb-4 p-3 bg-[#a4f1e3]/20 border border-emerald-200 rounded-xl text-sm text-[#146a5f]">
          {toast}
        </div>
      )}

      {recurring.length === 0 ? (
        <EmptyState
          icon="🔄"
          title="Chưa có khoản chi cố định"
          description="Thêm các khoản chi định kỳ như ti�n nhà, internet, điện thoại..."
          action={{ label: 'Thêm khoản đầu tiên', onClick: openAdd }}
        />
      ) : (
        <div className="space-y-3">
          {recurring.map(item => {
            const cat = expenseCategories.find(c => c.id === item.categoryId);
            const wallet = wallets.find(w => w.id === item.walletId);
            const alreadyCreated = item.lastCreated === currentMonth;
            const isDueSoon = new Date().getDate() >= item.dayOfMonth - 5 && !alreadyCreated;

            return (
              <Card key={item.id} className={!item.isActive ? 'opacity-50' : ''}>
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: (cat?.color || '#6366f1') + '20' }}
                  >
                    {cat?.icon || '💸'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#1d1b1d] text-sm">{item.name}</p>
                        <p className="text-xs text-[#877275]">
                          Ngày {item.dayOfMonth} hàng tháng • {wallet?.name}
                        </p>
                        {item.note && <p className="text-xs text-[#877275] mt-0.5">{item.note}</p>}
                      </div>
                      <p className="font-bold text-[#9b3f5a] text-sm flex-shrink-0">
                        -{formatCurrency(item.amount)}
                      </p>
                    </div>

                    {isDueSoon && !alreadyCreated && (
                      <div className="mt-2 text-xs text-amber-600 font-medium">
                        �� Sắp đến hạn!
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                      {alreadyCreated ? (
                        <span className="text-xs bg-[#a4f1e3]/20 text-[#146a5f] px-2 py-1 rounded-lg font-medium">
                          ✓ �ã tạo tháng này
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<PlayCircle className="w-3.5 h-3.5" />}
                          onClick={() => handleCreate(item)}
                          loading={creatingId === item.id}
                          disabled={!item.isActive}
                        >
                          Tạo giao dịch
                        </Button>
                      )}
                      <button
                        onClick={() => updateRecurring(item.id, { isActive: !item.isActive })}
                        className="text-[#877275] hover:text-[#9b3f5a]"
                        title={item.isActive ? 'Tắt' : 'Bật'}
                      >
                        {item.isActive ? <ToggleRight className="w-5 h-5 text-[#9b3f5a]" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button onClick={() => openEdit(item)} className="p-1 rounded-lg hover:bg-[#ffd9e0]/30 text-[#877275] hover:text-[#9b3f5a]">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(item)} className="p-1 rounded-lg hover:bg-[#ffd9e0]/20 text-[#877275] hover:text-[#9b3f5a]">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editTarget ? 'Sửa khoản cố định' : 'Thêm khoản cố định'}>
        <div className="p-5 space-y-4">
          <Input
            label="Tên khoản chi"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="VD: Ti�n nhà, Netflix..."
            error={errors.name}
          />

          <Input
            label="Số ti�n"
            type="number"
            value={form.amount || ''}
            onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
            placeholder="0"
            error={errors.amount}
          />

          <Select
            label="Danh mục"
            value={form.categoryId}
            onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
            options={expenseCategories.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }))}
            error={errors.category}
          />

          <Select
            label="Ví thanh toán"
            value={form.walletId}
            onChange={e => setForm(f => ({ ...f, walletId: e.target.value }))}
            options={wallets.filter(w => w.isActive).map(w => ({ value: w.id, label: w.name }))}
            error={errors.wallet}
          />

          <Input
            label="Ngày trong tháng"
            type="number"
            min={1}
            max={31}
            value={form.dayOfMonth}
            onChange={e => setForm(f => ({ ...f, dayOfMonth: parseInt(e.target.value) || 1 }))}
            hint="Ngày lặp lại hàng tháng (1-31)"
          />

          <Input
            label="Ghi chú"
            value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            placeholder="Tùy ch�n..."
          />

          <Button fullWidth onClick={handleSave} loading={saving}>
            {editTarget ? 'Lưu' : 'Thêm'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          await deleteRecurring(deleteTarget.id).catch(console.error);
          setDeleteTarget(null);
          setDeleting(false);
        }}
        title="Xoá khoản cố định"
        message={`Xoá "${deleteTarget?.name}"? Các giao dịch đã tạo sẽ không bị xoá.`}
        loading={deleting}
      />
    </div>
  );
}

