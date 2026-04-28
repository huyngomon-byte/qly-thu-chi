import { useState } from 'react';
import { Download, Trash2, LogOut, Database, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { useWallets } from '../hooks/useWallets';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';
import { createDemoData } from '../utils/defaultData';
import { Timestamp } from 'firebase/firestore';

export function Settings() {
  const { user, signOut } = useAuth();
  const { settings, loading, updateSettings } = useSettings(user?.uid);
  const { transactions } = useTransactions(user?.uid);
  const { categories } = useCategories(user?.uid);
  const { wallets } = useWallets(user?.uid);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [creatingDemo, setCreatingDemo] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleExportCSV = () => {
    if (transactions.length === 0) { showToast('Không có dữ liệu để xuất'); return; }
    const rows = [
      ['Ngày', 'Loại', 'Số tiền', 'Danh mục', 'Ví', 'Người nhận', 'Ghi chú', 'Phương thức'].join(','),
      ...transactions.map(tx => {
        const cat    = categories.find(c => c.id === tx.categoryId);
        const wallet = wallets.find(w => w.id === tx.walletId);
        const date   = tx.date instanceof Timestamp ? tx.date.toDate() : tx.date;
        return [formatDate(date), tx.type === 'income' ? 'Thu' : tx.type === 'expense' ? 'Chi' : 'Chuyển khoản',
          tx.amount, cat?.name || '', wallet?.name || '', `"${tx.payee || ''}"`, `"${tx.note || ''}"`, tx.paymentMethod].join(',');
      }),
    ];
    const blob = new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `qly-thu-chi-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file CSV thành công!');
  };

  const handleCreateDemo = async () => {
    if (!user) return;
    setCreatingDemo(true);
    try { await createDemoData(user.uid); showToast('Đã tạo dữ liệu demo!'); }
    catch (err) { console.error(err); showToast('Có lỗi xảy ra'); }
    finally { setCreatingDemo(false); }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="px-4 py-5 lg:px-6 max-w-2xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-[#1d1b1d] font-jakarta">Cài đặt</h1>

      {toast && (
        <div className="p-3 bg-[#a4f1e3]/30 border border-[#89d4c7]/40 rounded-2xl text-sm text-[#146a5f]">
          ✓ {toast}
        </div>
      )}

      {/* Profile */}
      <Card>
        <p className="text-[10px] font-bold text-[#877275] uppercase tracking-wider mb-3">Tài khoản</p>
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="avatar" className="w-12 h-12 rounded-2xl" />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#9b3f5a] to-[#c2547a] flex items-center justify-center text-white font-bold text-lg">
              {user?.displayName?.[0] || 'U'}
            </div>
          )}
          <div>
            <p className="font-semibold text-[#1d1b1d]">{user?.displayName}</p>
            <p className="text-sm text-[#877275]">{user?.email}</p>
          </div>
        </div>
      </Card>

      {/* Appearance — dark mode removed */}
      <Card>
        <p className="text-[10px] font-bold text-[#877275] uppercase tracking-wider mb-3">Giao diện</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sun className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1d1b1d]">Chế độ sáng</p>
            <p className="text-xs text-[#877275]">Luôn dùng giao diện sáng</p>
          </div>
        </div>
      </Card>

      {/* Budget threshold */}
      <Card>
        <p className="text-[10px] font-bold text-[#877275] uppercase tracking-wider mb-3">Cảnh báo ngân sách</p>
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#544245]">Cảnh báo khi chi vượt</p>
          <div className="flex items-center gap-2">
            <input
              type="range" min={50} max={95} step={5}
              value={settings.budgetAlertThreshold}
              onChange={e => updateSettings({ budgetAlertThreshold: parseInt(e.target.value) })}
              className="w-24 accent-[#9b3f5a]"
            />
            <span className="text-sm font-semibold text-[#1d1b1d] w-8">{settings.budgetAlertThreshold}%</span>
          </div>
        </div>
      </Card>

      {/* Data */}
      <Card>
        <p className="text-[10px] font-bold text-[#877275] uppercase tracking-wider mb-3">Dữ liệu</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-[#544245]">Tổng giao dịch</p>
              <p className="text-xs text-[#877275]">{transactions.length} giao dịch</p>
            </div>
          </div>

          <button onClick={handleExportCSV}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-[#dac0c4]/40 bg-[#f8f2f4] hover:bg-[#ffd9e0]/30 transition-colors text-left">
            <Download className="w-5 h-5 text-[#9b3f5a]" />
            <div>
              <p className="text-sm font-semibold text-[#1d1b1d]">Xuất dữ liệu CSV</p>
              <p className="text-xs text-[#877275]">Tải về file Excel-compatible</p>
            </div>
          </button>

          <button onClick={handleCreateDemo} disabled={creatingDemo}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-[#dac0c4]/40 bg-[#f8f2f4] hover:bg-[#a4f1e3]/20 transition-colors text-left disabled:opacity-50">
            <Database className="w-5 h-5 text-[#146a5f]" />
            <div>
              <p className="text-sm font-semibold text-[#1d1b1d]">{creatingDemo ? 'Đang tạo...' : 'Tạo dữ liệu demo'}</p>
              <p className="text-xs text-[#877275]">Thêm giao dịch mẫu để xem thử</p>
            </div>
          </button>
        </div>
      </Card>

      {/* About */}
      <Card>
        <p className="text-[10px] font-bold text-[#877275] uppercase tracking-wider mb-3">Thông tin</p>
        <div className="space-y-1 text-sm text-[#544245]">
          <p className="font-semibold text-[#1d1b1d]">Quản Lý Thu Chi v1.0.0</p>
          <p className="text-xs text-[#877275]">Tài chính cá nhân · React + Firebase</p>
        </div>
      </Card>

      {/* Sign out */}
      <button onClick={signOut}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-full border-2 border-[#ffd9e0] text-[#9b3f5a] hover:bg-[#ffd9e0]/30 transition-colors font-semibold">
        <LogOut className="w-4 h-4" />
        Đăng xuất
      </button>
    </div>
  );
}
