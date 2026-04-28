import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RecurringExpense } from '../types';
import { getCurrentMonth } from '../utils/date';

export interface RecurringFormData {
  name: string;
  amount: number;
  categoryId: string;
  walletId: string;
  dayOfMonth: number;
  note: string;
}

export function useRecurring(userId: string | undefined) {
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', userId, 'recurringExpenses'),
      orderBy('dayOfMonth', 'asc')
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RecurringExpense));
      setRecurring(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const addRecurring = async (formData: RecurringFormData) => {
    if (!userId) throw new Error('Not authenticated');
    const now = Timestamp.now();
    await addDoc(collection(db, 'users', userId, 'recurringExpenses'), {
      ...formData,
      isActive: true,
      userId,
      createdAt: now,
      updatedAt: now,
    });
  };

  const updateRecurring = async (id: string, data: Partial<RecurringFormData & { isActive: boolean }>) => {
    if (!userId) throw new Error('Not authenticated');
    await updateDoc(doc(db, 'users', userId, 'recurringExpenses', id), {
      ...data,
      updatedAt: Timestamp.now(),
    });
  };

  const deleteRecurring = async (id: string) => {
    if (!userId) throw new Error('Not authenticated');
    await deleteDoc(doc(db, 'users', userId, 'recurringExpenses', id));
  };

  const createTransaction = async (item: RecurringExpense) => {
    if (!userId) throw new Error('Not authenticated');
    const currentMonth = getCurrentMonth();
    if (item.lastCreated === currentMonth) throw new Error('Đã tạo giao dịch tháng này rồi');

    const batch = writeBatch(db);
    const now = Timestamp.now();

    const [year, mon] = currentMonth.split('-').map(Number);
    const day = Math.min(item.dayOfMonth, new Date(year, mon, 0).getDate());
    const txDate = new Date(year, mon - 1, day);

    const txRef = doc(collection(db, 'users', userId, 'transactions'));
    batch.set(txRef, {
      type: 'expense',
      amount: item.amount,
      date: Timestamp.fromDate(txDate),
      categoryId: item.categoryId,
      walletId: item.walletId,
      note: item.note || item.name,
      payee: item.name,
      paymentMethod: 'transfer',
      isFixed: true,
      isRecurring: true,
      recurringId: item.id,
      userId,
      createdAt: now,
      updatedAt: now,
    });

    const walletRef = doc(db, 'users', userId, 'wallets', item.walletId);
    batch.update(walletRef, { currentBalance: increment(-item.amount), updatedAt: now });

    const recurringRef = doc(db, 'users', userId, 'recurringExpenses', item.id);
    batch.update(recurringRef, { lastCreated: currentMonth, updatedAt: now });

    await batch.commit();
  };

  return { recurring, loading, addRecurring, updateRecurring, deleteRecurring, createTransaction };
}
