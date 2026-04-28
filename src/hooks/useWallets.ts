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
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Wallet, WalletType } from '../types';

export interface WalletFormData {
  name: string;
  type: WalletType;
  initialBalance: number;
  note: string;
  color: string;
}

export function useWallets(userId: string | undefined) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', userId, 'wallets'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Wallet));
        setWallets(data);
        setLoading(false);
      },
      err => {
        console.error('Wallets error:', err);
        setError('Không thể tải ví');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  const addWallet = async (formData: WalletFormData) => {
    if (!userId) throw new Error('Not authenticated');
    const now = Timestamp.now();
    await addDoc(collection(db, 'users', userId, 'wallets'), {
      ...formData,
      currentBalance: formData.initialBalance,
      isActive: true,
      userId,
      createdAt: now,
      updatedAt: now,
    });
  };

  const updateWallet = async (id: string, data: Partial<WalletFormData & { isActive: boolean }>) => {
    if (!userId) throw new Error('Not authenticated');
    await updateDoc(doc(db, 'users', userId, 'wallets', id), {
      ...data,
      updatedAt: Timestamp.now(),
    });
  };

  const deleteWallet = async (id: string) => {
    if (!userId) throw new Error('Not authenticated');
    await deleteDoc(doc(db, 'users', userId, 'wallets', id));
  };

  const totalBalance = wallets
    .filter(w => w.isActive)
    .reduce((sum, w) => sum + w.currentBalance, 0);

  return { wallets, loading, error, addWallet, updateWallet, deleteWallet, totalBalance };
}
