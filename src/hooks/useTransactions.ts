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
import { Transaction, TransactionType, PaymentMethod } from '../types';

export interface TransactionFormData {
  type: TransactionType;
  amount: number;
  date: Date;
  categoryId: string;
  walletId: string;
  toWalletId?: string;
  note: string;
  payee: string;
  paymentMethod: PaymentMethod;
  isFixed: boolean;
  isRecurring: boolean;
}

export function useTransactions(userId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', userId, 'transactions'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
        setTransactions(data);
        setLoading(false);
      },
      err => {
        console.error('Transactions error:', err);
        setError('Không thể tải giao dịch');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  const addTransaction = async (formData: TransactionFormData) => {
    if (!userId) throw new Error('Not authenticated');

    const batch = writeBatch(db);
    const txRef = doc(collection(db, 'users', userId, 'transactions'));
    const now = Timestamp.now();

    const txData: Record<string, unknown> = {
      type: formData.type,
      amount: formData.amount,
      date: Timestamp.fromDate(formData.date),
      categoryId: formData.categoryId,
      walletId: formData.walletId,
      note: formData.note,
      payee: formData.payee,
      paymentMethod: formData.paymentMethod,
      isFixed: formData.isFixed,
      isRecurring: formData.isRecurring,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    if (formData.toWalletId) txData.toWalletId = formData.toWalletId;

    batch.set(txRef, txData);

    const walletRef = doc(db, 'users', userId, 'wallets', formData.walletId);
    if (formData.type === 'income') {
      batch.update(walletRef, { currentBalance: increment(formData.amount), updatedAt: now });
    } else if (formData.type === 'expense') {
      batch.update(walletRef, { currentBalance: increment(-formData.amount), updatedAt: now });
    } else if (formData.type === 'transfer' && formData.toWalletId) {
      batch.update(walletRef, { currentBalance: increment(-formData.amount), updatedAt: now });
      const toWalletRef = doc(db, 'users', userId, 'wallets', formData.toWalletId);
      batch.update(toWalletRef, { currentBalance: increment(formData.amount), updatedAt: now });
    }

    await batch.commit();
  };

  const updateTransaction = async (id: string, formData: TransactionFormData, oldTx: Transaction) => {
    if (!userId) throw new Error('Not authenticated');

    const batch = writeBatch(db);
    const now = Timestamp.now();
    const txRef = doc(db, 'users', userId, 'transactions', id);

    const updateData: Record<string, unknown> = {
      type: formData.type,
      amount: formData.amount,
      date: Timestamp.fromDate(formData.date),
      categoryId: formData.categoryId,
      walletId: formData.walletId,
      note: formData.note,
      payee: formData.payee,
      paymentMethod: formData.paymentMethod,
      isFixed: formData.isFixed,
      isRecurring: formData.isRecurring,
      updatedAt: now,
    };
    if (formData.toWalletId) updateData.toWalletId = formData.toWalletId;

    batch.update(txRef, updateData);

    // Revert old transaction's wallet effect
    const oldWalletRef = doc(db, 'users', userId, 'wallets', oldTx.walletId);
    if (oldTx.type === 'income') {
      batch.update(oldWalletRef, { currentBalance: increment(-oldTx.amount), updatedAt: now });
    } else if (oldTx.type === 'expense') {
      batch.update(oldWalletRef, { currentBalance: increment(oldTx.amount), updatedAt: now });
    } else if (oldTx.type === 'transfer' && oldTx.toWalletId) {
      batch.update(oldWalletRef, { currentBalance: increment(oldTx.amount), updatedAt: now });
      const oldToRef = doc(db, 'users', userId, 'wallets', oldTx.toWalletId);
      batch.update(oldToRef, { currentBalance: increment(-oldTx.amount), updatedAt: now });
    }

    // Apply new transaction's wallet effect
    const newWalletRef = doc(db, 'users', userId, 'wallets', formData.walletId);
    if (formData.type === 'income') {
      batch.update(newWalletRef, { currentBalance: increment(formData.amount), updatedAt: now });
    } else if (formData.type === 'expense') {
      batch.update(newWalletRef, { currentBalance: increment(-formData.amount), updatedAt: now });
    } else if (formData.type === 'transfer' && formData.toWalletId) {
      batch.update(newWalletRef, { currentBalance: increment(-formData.amount), updatedAt: now });
      const toRef = doc(db, 'users', userId, 'wallets', formData.toWalletId);
      batch.update(toRef, { currentBalance: increment(formData.amount), updatedAt: now });
    }

    await batch.commit();
  };

  const deleteTransaction = async (tx: Transaction) => {
    if (!userId) throw new Error('Not authenticated');

    const batch = writeBatch(db);
    const now = Timestamp.now();

    batch.delete(doc(db, 'users', userId, 'transactions', tx.id));

    const walletRef = doc(db, 'users', userId, 'wallets', tx.walletId);
    if (tx.type === 'income') {
      batch.update(walletRef, { currentBalance: increment(-tx.amount), updatedAt: now });
    } else if (tx.type === 'expense') {
      batch.update(walletRef, { currentBalance: increment(tx.amount), updatedAt: now });
    } else if (tx.type === 'transfer' && tx.toWalletId) {
      batch.update(walletRef, { currentBalance: increment(tx.amount), updatedAt: now });
      const toRef = doc(db, 'users', userId, 'wallets', tx.toWalletId);
      batch.update(toRef, { currentBalance: increment(-tx.amount), updatedAt: now });
    }

    await batch.commit();
  };

  return { transactions, loading, error, addTransaction, updateTransaction, deleteTransaction };
}
