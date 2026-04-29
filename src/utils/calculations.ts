import { Transaction, Category, DailyData, CategoryData } from '../types';
import { Timestamp } from 'firebase/firestore';
import { getDaysInMonth } from './date';

export function getTotalIncome(transactions: Transaction[]): number {
  return transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getTotalExpense(transactions: Transaction[]): number {
  return transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getBalance(income: number, expense: number): number {
  return income - expense;
}

export function getSavingsRate(income: number, expense: number): number {
  if (income === 0) return 0;
  return Math.max(0, ((income - expense) / income) * 100);
}

export function filterByDateRange(
  transactions: Transaction[],
  start: Date,
  end: Date
): Transaction[] {
  return transactions.filter(t => {
    const date = t.date instanceof Timestamp ? t.date.toDate() : t.date;
    return date >= start && date <= end;
  });
}

export function getDailyData(transactions: Transaction[], month: string): DailyData[] {
  const days = getDaysInMonth(month);
  const [year, mon] = month.split('-').map(Number);

  const data: DailyData[] = Array.from({ length: days }, (_, i) => ({
    day: String(i + 1).padStart(2, '0'),
    income: 0,
    expense: 0,
  }));

  transactions.forEach(t => {
    const date = t.date instanceof Timestamp ? t.date.toDate() : t.date;
    if (date.getFullYear() === year && date.getMonth() + 1 === mon) {
      const dayIndex = date.getDate() - 1;
      if (dayIndex >= 0 && dayIndex < days) {
        if (t.type === 'income') {
          data[dayIndex].income += t.amount;
        } else if (t.type === 'expense') {
          data[dayIndex].expense += t.amount;
        }
      }
    }
  });

  return data;
}

export function getCategoryData(
  transactions: Transaction[],
  categories: Category[]
): CategoryData[] {
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  const categoryMap: Record<string, number> = {};
  expenseTransactions.forEach(t => {
    categoryMap[t.categoryId] = (categoryMap[t.categoryId] || 0) + t.amount;
  });

  return Object.entries(categoryMap)
    .map(([categoryId, amount]) => {
      const cat = categories.find(c => c.id === categoryId);
      return {
        categoryId,
        name: cat?.name || 'Không rõ',
        icon: cat?.icon || '📦',
        color: cat?.color || '#6366f1',
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export function getBudgetUsage(
  spent: number,
  budget: number
): { percentage: number; status: 'safe' | 'warning' | 'over' } {
  if (budget === 0) return { percentage: 0, status: 'safe' };
  const percentage = (spent / budget) * 100;
  return {
    percentage,
    status: percentage >= 100 ? 'over' : percentage >= 80 ? 'warning' : 'safe',
  };
}

export function getTopCategories(data: CategoryData[], limit = 5): CategoryData[] {
  return data.slice(0, limit);
}

// Chart data for an arbitrary date range (groups by day label, max 90 days)
export function getDailyRangeData(transactions: Transaction[], start: Date, end: Date): DailyData[] {
  const msPerDay = 86_400_000;
  const days = Math.min(Math.round((end.getTime() - start.getTime()) / msPerDay) + 1, 90);

  const data: DailyData[] = Array.from({ length: days }, (_, i) => {
    const d = new Date(start.getTime() + i * msPerDay);
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    return { day: label, income: 0, expense: 0 };
  });

  transactions.forEach(t => {
    const date = t.date instanceof Timestamp ? t.date.toDate() : (t.date as Date);
    const idx = Math.round((date.getTime() - start.getTime()) / msPerDay);
    if (idx >= 0 && idx < days) {
      if (t.type === 'income')  data[idx].income  += t.amount;
      if (t.type === 'expense') data[idx].expense += t.amount;
    }
  });

  return data;
}
