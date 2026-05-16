import { useState, useEffect } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  doc, Timestamp, writeBatch, increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SavingsGoal } from '../types';

export interface SavingsGoalFormData {
  name: string;
  icon: string;
  targetAmount: number;
  walletId: string;
  color: string;
  note: string;
  deadline?: string; // 'yyyy-MM-dd' or empty
}

export function useSavingsGoals(userId: string | undefined) {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const q = query(
      collection(db, 'users', userId, 'savingsGoals'),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(q, snap => {
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() } as SavingsGoal)));
      setLoading(false);
    });
  }, [userId]);

  const addGoal = async (data: SavingsGoalFormData) => {
    if (!userId) throw new Error('Not authenticated');
    const now = Timestamp.now();
    const goalRef = doc(collection(db, 'users', userId, 'savingsGoals'));

    const payload: Record<string, unknown> = {
      userId,
      name: data.name,
      icon: data.icon,
      targetAmount: data.targetAmount,
      currentAmount: 0,
      walletId: data.walletId,
      isCompleted: false,
      note: data.note,
      color: data.color,
      createdAt: now,
      updatedAt: now,
    };

    if (data.deadline) {
      payload.deadline = Timestamp.fromDate(new Date(data.deadline + 'T00:00:00'));
    }

    const batch = writeBatch(db);
    batch.set(goalRef, payload);
    await batch.commit();
  };

  const updateGoal = async (id: string, data: Partial<SavingsGoalFormData>) => {
    if (!userId) throw new Error('Not authenticated');
    const goalRef = doc(db, 'users', userId, 'savingsGoals', id);
    const now = Timestamp.now();

    const payload: Record<string, unknown> = { updatedAt: now };
    if (data.name !== undefined) payload.name = data.name;
    if (data.icon !== undefined) payload.icon = data.icon;
    if (data.targetAmount !== undefined) payload.targetAmount = data.targetAmount;
    if (data.walletId !== undefined) payload.walletId = data.walletId;
    if (data.color !== undefined) payload.color = data.color;
    if (data.note !== undefined) payload.note = data.note;
    if (data.deadline !== undefined) {
      if (data.deadline) {
        payload.deadline = Timestamp.fromDate(new Date(data.deadline + 'T00:00:00'));
      }
    }

    const batch = writeBatch(db);
    batch.update(goalRef, payload);
    await batch.commit();
  };

  const deleteGoal = async (goal: SavingsGoal) => {
    if (!userId) throw new Error('Not authenticated');
    const batch = writeBatch(db);
    const now = Timestamp.now();

    // Delete the goal
    batch.delete(doc(db, 'users', userId, 'savingsGoals', goal.id));

    // Reverse: add back currentAmount to wallet
    if (goal.currentAmount > 0) {
      const walletRef = doc(db, 'users', userId, 'wallets', goal.walletId);
      batch.update(walletRef, {
        currentBalance: increment(goal.currentAmount),
        updatedAt: now,
      });
    }

    await batch.commit();
  };

  const contribute = async (goal: SavingsGoal, amount: number) => {
    if (!userId) throw new Error('Not authenticated');
    const batch = writeBatch(db);
    const now = Timestamp.now();

    const newCurrentAmount = goal.currentAmount + amount;
    const isCompleted = newCurrentAmount >= goal.targetAmount;

    // Update goal
    const goalRef = doc(db, 'users', userId, 'savingsGoals', goal.id);
    batch.update(goalRef, {
      currentAmount: increment(amount),
      isCompleted,
      updatedAt: now,
    });

    // Deduct from wallet
    const walletRef = doc(db, 'users', userId, 'wallets', goal.walletId);
    batch.update(walletRef, {
      currentBalance: increment(-amount),
      updatedAt: now,
    });

    // Create transaction record
    const txRef = doc(collection(db, 'users', userId, 'transactions'));
    batch.set(txRef, {
      userId,
      type: 'expense',
      amount,
      date: now,
      categoryId: 'savings-goal',
      walletId: goal.walletId,
      payee: goal.name,
      note: 'Tiet kiem: ' + goal.name,
      paymentMethod: 'transfer',
      isFixed: false,
      isRecurring: false,
      createdAt: now,
      updatedAt: now,
    });

    await batch.commit();
  };

  const withdraw = async (goal: SavingsGoal, amount: number) => {
    if (!userId) throw new Error('Not authenticated');
    const batch = writeBatch(db);
    const now = Timestamp.now();

    const newCurrentAmount = goal.currentAmount - amount;
    const isCompleted = newCurrentAmount >= goal.targetAmount;

    // Update goal
    const goalRef = doc(db, 'users', userId, 'savingsGoals', goal.id);
    batch.update(goalRef, {
      currentAmount: increment(-amount),
      isCompleted,
      updatedAt: now,
    });

    // Add back to wallet
    const walletRef = doc(db, 'users', userId, 'wallets', goal.walletId);
    batch.update(walletRef, {
      currentBalance: increment(amount),
      updatedAt: now,
    });

    // Create transaction record
    const txRef = doc(collection(db, 'users', userId, 'transactions'));
    batch.set(txRef, {
      userId,
      type: 'income',
      amount,
      date: now,
      categoryId: 'savings-goal',
      walletId: goal.walletId,
      payee: goal.name,
      note: 'Rut tiet kiem: ' + goal.name,
      paymentMethod: 'transfer',
      isFixed: false,
      isRecurring: false,
      createdAt: now,
      updatedAt: now,
    });

    await batch.commit();
  };

  return { goals, loading, addGoal, updateGoal, deleteGoal, contribute, withdraw };
}
