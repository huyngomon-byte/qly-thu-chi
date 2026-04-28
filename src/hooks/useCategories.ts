import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Category, CategoryType } from '../types';

export interface CategoryFormData {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
}

export function useCategories(userId: string | undefined) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', userId, 'categories'),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
      setCategories(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const addCategory = async (formData: CategoryFormData) => {
    if (!userId) throw new Error('Not authenticated');
    const maxOrder = categories.filter(c => c.type === formData.type).length + 1;
    await addDoc(collection(db, 'users', userId, 'categories'), {
      ...formData,
      isDefault: false,
      isHidden: false,
      order: maxOrder,
      userId,
      createdAt: Timestamp.now(),
    });
  };

  const updateCategory = async (id: string, data: Partial<CategoryFormData & { isHidden: boolean }>) => {
    if (!userId) throw new Error('Not authenticated');
    await updateDoc(doc(db, 'users', userId, 'categories', id), data);
  };

  const visibleCategories = categories.filter(c => !c.isHidden);
  const expenseCategories = visibleCategories.filter(c => c.type === 'expense');
  const incomeCategories = visibleCategories.filter(c => c.type === 'income');

  return { categories, visibleCategories, expenseCategories, incomeCategories, loading, addCategory, updateCategory };
}
