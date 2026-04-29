import { useState, useMemo } from 'react';

import { ChevronLeft, ChevronRight, Save } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

import { useBudgets } from '../hooks/useBudgets';

import { useTransactions } from '../hooks/useTransactions';

import { useCategories } from '../hooks/useCategories';

import { Card } from '../components/ui/Card';

import { Button } from '../components/ui/Button';

import { LoadingSpinner } from '../components/ui/LoadingSpinner';

import { formatCurrency, parseAmount, formatAmount } from '../utils/currency';

import { getCurrentMonth, getMonthLabel, getPrevMonth, getNextMonth, getMonthRange } from '../utils/date';

import { filterByDateRange, getBudgetUsage } from '../utils/calculations';

import { CategoryBudget } from '../types';



export function Budgets() {

  const { user } = useAuth();

  const [month, setMonth] = useState(getCurrentMonth());

  const { budget, loading, saveBudget } = useBudgets(user?.uid, month);

  const { transactions } = useTransactions(user?.uid);

  const { expenseCategories } = useCategories(user?.uid);



  const [totalBudgetStr, setTotalBudgetStr] = useState('');

  const [catBudgets, setCatBudgets] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(false);



  const { start, end } = useMemo(() => getMonthRange(month), [month]);

  const monthTx = useMemo(() => filterByDateRange(transactions, start, end), [transactions, start, end]);



  const spentByCategory = useMemo(() => {

    const map: Record<string, number> = {};

    monthTx.filter(t => t.type === 'expense').forEach(t => {

      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;

    });

    return map;

  }, [monthTx]);



  const totalSpent = useMemo(() =>

    monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),

    [monthTx]

  );



  const startEdit = () => {

    setTotalBudgetStr(budget?.totalBudget ? formatAmount(budget.totalBudget) : '');

    const catMap: Record<string, string> = {};

    budget?.categoryBudgets.forEach(cb => {

      catMap[cb.categoryId] = formatAmount(cb.amount);

    });

    setCatBudgets(catMap);

    setEditing(true);

  };



  const handleSave = async () => {

    setSaving(true);

    try {

      const total = parseAmount(totalBudgetStr);

      const categoryBudgets: CategoryBudget[] = Object.entries(catBudgets)

        .filter(([, v]) => parseAmount(v) > 0)

        .map(([categoryId, v]) => ({ categoryId, amount: parseAmount(v) }));

      await saveBudget(total, categoryBudgets);

      setEditing(false);

    } catch (err) {

      console.error(err);

    } finally {

      setSaving(false);

    }

  };



  if (loading) return <LoadingSpinner fullScreen />;



  const totalBudget = budget?.totalBudget || 0;

  const totalUsage = getBudgetUsage(totalSpent, totalBudget);



  const getStatusColor = (status: 'safe' | 'warning' | 'over') => {

    if (status === 'over') return 'bg-[#9b3f5a]';

    if (status === 'warning') return 'bg-amber-500';

    return 'bg-[#146a5f]';

  };



  return (

    <div className="px-4 py-5 lg:px-6 max-w-3xl mx-auto">

      <div className="flex items-center justify-between mb-5">

        <h1 className="text-xl font-bold text-[#1d1b1d]">Ngân sách</h1>

        <div className="flex items-center gap-2">

          <div className="flex items-center gap-1 bg-white border border-[#ffd9e0]/20 rounded-xl p-1">

            <button onClick={() => { setMonth(getPrevMonth(month)); setEditing(false); }} className="p-1.5 rounded-lg hover:bg-[#f8f2f4] text-[#877275]">

              <ChevronLeft className="w-4 h-4" />

            </button>

            <span className="text-xs font-medium text-[#544245] px-1">{getMonthLabel(month)}</span>

            <button onClick={() => { setMonth(getNextMonth(month)); setEditing(false); }} className="p-1.5 rounded-lg hover:bg-[#f8f2f4] text-[#877275]">

              <ChevronRight className="w-4 h-4" />

            </button>

          </div>

          {!editing ? (

            <Button size="sm" variant="outline" onClick={startEdit}>

              {budget ? 'Chỉnh sửa' : 'Đặt ngân sách'}

            </Button>

          ) : (

            <Button size="sm" icon={<Save className="w-4 h-4" />} onClick={handleSave} loading={saving}>

              Lưu

            </Button>

          )}

        </div>

      </div>



      {/* Total budget overview */}

      <Card className="mb-5">

        <div className="flex items-start justify-between mb-3">

          <div>

            <p className="text-xs text-[#877275] uppercase tracking-wide">Tổng ngân sách tháng</p>

            {editing ? (

              <input

                type="text"

                inputMode="numeric"

                value={totalBudgetStr}

                onChange={e => {

                  const raw = e.target.value.replace(/[^\d]/g, '');

                  setTotalBudgetStr(raw ? formatAmount(parseInt(raw)) : '');

                }}

                placeholder="0"

                className="text-2xl font-bold bg-transparent border-b-2 border-[#9b3f5a] focus:outline-none text-[#1d1b1d] w-full mt-1"

              />

            ) : (

              <p className="text-2xl font-bold text-[#1d1b1d]">

                {totalBudget > 0 ? formatCurrency(totalBudget) : 'Chưa đặt'}

              </p>

            )}

          </div>

          <div className="text-right">

            <p className="text-xs text-[#877275]">Đã chi</p>

            <p className="text-lg font-bold text-[#9b3f5a]">{formatCurrency(totalSpent)}</p>

          </div>

        </div>



        {totalBudget > 0 && (

          <>

            <div className="h-2.5 bg-[#f8f2f4] rounded-full overflow-hidden mb-2">

              <div

                className={`h-full rounded-full transition-all duration-500 ${getStatusColor(totalUsage.status)}`}

                style={{ width: `${Math.min(100, totalUsage.percentage)}%` }}

              />

            </div>

            <div className="flex justify-between text-xs">

              <span className={`font-medium ${totalUsage.status === 'over' ? 'text-[#9b3f5a]' : totalUsage.status === 'warning' ? 'text-amber-500' : 'text-[#877275]'}`}>

                {totalUsage.percentage.toFixed(0)}% đã dùng

                {totalUsage.status === 'over' && ' ⚠️ Vượt ngân sách!'}

                {totalUsage.status === 'warning' && ' ⚠️ Sắp hết'}

              </span>

              <span className="text-[#877275]">Còn: {formatCurrency(Math.max(0, totalBudget - totalSpent))}</span>

            </div>

          </>

        )}

      </Card>



      {/* Category budgets */}

      <h2 className="text-sm font-semibold text-[#544245] mb-3">Ngân sách theo danh mục</h2>

      <div className="space-y-3">

        {expenseCategories.map(cat => {

          const catBudgetAmount = budget?.categoryBudgets.find(cb => cb.categoryId === cat.id)?.amount || 0;

          const spent = spentByCategory[cat.id] || 0;

          const usage = getBudgetUsage(spent, catBudgetAmount);



          return (

            <Card key={cat.id}>

              <div className="flex items-center gap-3 mb-2">

                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: cat.color + '20' }}>

                  {cat.icon}

                </div>

                <div className="flex-1 min-w-0">

                  <p className="text-sm font-medium text-[#1d1b1d]">{cat.name}</p>

                </div>

                <div className="text-right">

                  <p className="text-sm font-semibold text-[#9b3f5a]">{spent > 0 ? formatCurrency(spent) : '—'}</p>

                  {editing ? (

                    <input

                      type="text"

                      inputMode="numeric"

                      value={catBudgets[cat.id] || ''}

                      onChange={e => {

                        const raw = e.target.value.replace(/[^\d]/g, '');

                        setCatBudgets(prev => ({ ...prev, [cat.id]: raw ? formatAmount(parseInt(raw)) : '' }));

                      }}

                      placeholder="Chưa đặt"

                      className="text-xs text-right bg-transparent border-b border-[#9b3f5a] focus:outline-none text-[#544245] w-24"

                    />

                  ) : (

                    <p className="text-xs text-[#877275]">

                      {catBudgetAmount > 0 ? `/ ${formatCurrency(catBudgetAmount)}` : 'Chưa đặt'}

                    </p>

                  )}

                </div>

              </div>

              {catBudgetAmount > 0 && (

                <>

                  <div className="h-1.5 bg-[#f8f2f4] rounded-full overflow-hidden">

                    <div

                      className={`h-full rounded-full transition-all ${getStatusColor(usage.status)}`}

                      style={{ width: `${Math.min(100, usage.percentage)}%` }}

                    />

                  </div>

                  <p className={`text-[10px] mt-1 ${usage.status === 'over' ? 'text-[#9b3f5a]' : usage.status === 'warning' ? 'text-amber-500' : 'text-[#877275]'}`}>

                    {usage.percentage.toFixed(0)}%

                    {usage.status === 'over' && ' — Đã vượt!'}

                    {usage.status === 'warning' && ' — Sắp hết!'}

                  </p>

                </>

              )}

            </Card>

          );

        })}

      </div>

    </div>

  );

}





