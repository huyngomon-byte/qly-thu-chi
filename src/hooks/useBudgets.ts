import { useState, useEffect } from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Budget, CategoryBudget } from '../types';

export function useBudgets(userId: string | undefined, month: string) {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const ref = doc(db, 'users', userId, 'budgets', month);
    const unsubscribe = onSnapshot(ref, snapshot => {
      if (snapshot.exists()) {
        setBudget({ id: snapshot.id, ...snapshot.data() } as Budget);
      } else {
        setBudget(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [userId, month]);

  const saveBudget = async (totalBudget: number, categoryBudgets: CategoryBudget[]) => {
    if (!userId) throw new Error('Not authenticated');
    const now = Timestamp.now();
    const ref = doc(db, 'users', userId, 'budgets', month);
    await setDoc(ref, {
      userId,
      month,
      totalBudget,
      categoryBudgets,
      createdAt: budget?.createdAt || now,
      updatedAt: now,
    });
  };

  return { budget, loading, saveBudget };
}
