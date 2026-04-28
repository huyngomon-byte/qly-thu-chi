import { useState } from 'react';
import { Plus, Pencil, EyeOff, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCategories, CategoryFormData } from '../hooks/useCategories';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Category } from '../types';

const CATEGORY_ICONS = ['🍜','🚗','🛍️','🏠','💡','📱','🏥','💄','🎮','✈️','👨‍👩‍👧','💼','📚','🎁','📦','💰','🏪','🎯','💸','💳','🍕','☕','🎵','⚽','🐶','💊','🚌','⛽','🛒','🏋️','🎬','📷','🌍','🏖️'];

const COLORS = ['#f97316','#3b82f6','#ec4899','#22c55e','#eab308','#06b6d4','#ef4444','#a855f7','#6366f1','#14b8a6','#f43f5e','#64748b','#8b5cf6','#f59e0b','#9ca3af'];

const DEFAULT_FORM: CategoryFormData = {
  name: '',
  type: 'expense',
  icon: '📦',
  color: COLORS[0],
};

export function Categories() {
  const { user } = useAuth();
  const { categories, loading, addCategory, updateCategory } = useCategories(user?.uid);

  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const filtered = categories.filter(c => c.type === activeTab);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...DEFAULT_FORM, type: activeTab });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setForm({ name: cat.name, type: cat.type, icon: cat.icon, color: cat.color });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nhập tên danh mục';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await updateCategory(editTarget.id, form);
      } else {
        await addCategory(form);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="px-4 py-5 lg:px-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Danh mục</h1>
        <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAdd}>
          Thêm
        </Button>
      </div>

      {/* Tab */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-5">
        {(['expense', 'income'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {tab === 'expense' ? '💸 Chi tiêu' : '💰 Thu nhập'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map(cat => (
          <div
            key={cat.id}
            className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3 ${cat.isHidden ? 'opacity-40' : ''}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: cat.color + '20' }}
              >
                {cat.icon}
              </div>
              <div className="flex gap-0.5">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-400 hover:text-indigo-600"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateCategory(cat.id, { isHidden: !cat.isHidden })}
                  className="p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400"
                  title={cat.isHidden ? 'Hiện' : 'Ẩn'}
                >
                  {cat.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">{cat.name}</p>
            {cat.isDefault && <p className="text-[10px] text-gray-400 mt-0.5">Mặc định</p>}
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editTarget ? 'Sửa danh mục' : 'Thêm danh mục'}>
        <div className="p-5 space-y-4">
          <Select
            label="Loại"
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value as 'expense' | 'income' }))}
            options={[{ value: 'expense', label: '💸 Chi tiêu' }, { value: 'income', label: '💰 Thu nhập' }]}
          />

          <Input
            label="Tên danh mục"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="VD: Ăn uống, Đi lại..."
            error={errors.name}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Icon</label>
            <div className="grid grid-cols-8 gap-1.5 max-h-32 overflow-y-auto">
              {CATEGORY_ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setForm(f => ({ ...f, icon }))}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                    form.icon === icon ? 'bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-500' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Màu</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setForm(f => ({ ...f, color }))}
                  className={`w-7 h-7 rounded-full transition-all ${form.color === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''}`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>

          <Button fullWidth onClick={handleSave} loading={saving}>
            {editTarget ? 'Lưu' : 'Thêm danh mục'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
