import { useState, useEffect } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc,
  Timestamp, writeBatch, increment, arrayUnion,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loan, LoanType, LoanPayment } from '../types';

export interface LoanFormData {
  type: LoanType;
  personName: string;
  amount: number;
  date: Date;
  dueDate?: Date;
  walletId: string;
  note: string;
}

export function useLoans(userId: string | undefined) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const q = query(collection(db, 'users', userId, 'loans'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() } as Loan)));
      setLoading(false);
    });
  }, [userId]);

  const addLoan = async (data: LoanFormData) => {
    if (!userId) throw new Error('Not authenticated');
    const batch = writeBatch(db);
    const now = Timestamp.now();
    const loanRef = doc(collection(db, 'users', userId, 'loans'));

    batch.set(loanRef, {
      ...data,
      date: Timestamp.fromDate(data.date),
      dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null,
      paidAmount: 0,
      status: 'active',
      payments: [],
      userId,
      createdAt: now,
      updatedAt: now,
    });

    // Update wallet balance
    const walletRef = doc(db, 'users', userId, 'wallets', data.walletId);
    // borrow = money comes in, lend = money goes out
    batch.update(walletRef, {
      currentBalance: increment(data.type === 'borrow' ? data.amount : -data.amount),
      updatedAt: now,
    });

    await batch.commit();
  };

  const recordPayment = async (loan: Loan, paymentAmount: number, note = '') => {
    if (!userId) throw new Error('Not authenticated');
    const batch = writeBatch(db);
    const now = Timestamp.now();

    const newPaidAmount = loan.paidAmount + paymentAmount;
    const isFullyPaid = newPaidAmount >= loan.amount;

    const payment: LoanPayment = {
      id: Math.random().toString(36).slice(2),
      amount: paymentAmount,
      date: now,
      note,
    };

    const loanRef = doc(db, 'users', userId, 'loans', loan.id);
    batch.update(loanRef, {
      paidAmount: newPaidAmount,
      status: isFullyPaid ? 'paid' : 'active',
      payments: arrayUnion(payment),
      updatedAt: now,
    });

    // Update wallet: borrow repayment = money goes out, lend repayment = money comes in
    const walletRef = doc(db, 'users', userId, 'wallets', loan.walletId);
    batch.update(walletRef, {
      currentBalance: increment(loan.type === 'borrow' ? -paymentAmount : paymentAmount),
      updatedAt: now,
    });

    await batch.commit();
  };

  const markAsPaid = async (loan: Loan) => {
    if (!userId) throw new Error('Not authenticated');
    const remaining = loan.amount - loan.paidAmount;
    const batch = writeBatch(db);
    const now = Timestamp.now();
    batch.update(doc(db, 'users', userId, 'loans', loan.id), {
      status: 'paid',
      paidAmount: loan.amount,
      updatedAt: now,
    });
    // Settle wallet for any remaining unpaid balance
    if (remaining > 0) {
      const walletRef = doc(db, 'users', userId, 'wallets', loan.walletId);
      // borrow: paying off remainder → money leaves wallet
      // lend: receiving remainder → money enters wallet
      batch.update(walletRef, {
        currentBalance: increment(loan.type === 'borrow' ? -remaining : remaining),
        updatedAt: now,
      });
    }
    await batch.commit();
  };

  const deleteLoan = async (loan: Loan) => {
    if (!userId) throw new Error('Not authenticated');
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', userId, 'loans', loan.id));

    // Revert wallet effect (reverse original transaction + any payments)
    const walletRef = doc(db, 'users', userId, 'wallets', loan.walletId);
    const now = Timestamp.now();
    if (loan.type === 'borrow') {
      // Reverse: remove the borrowed amount, add back what was repaid
      batch.update(walletRef, {
        currentBalance: increment(-loan.amount + loan.paidAmount),
        updatedAt: now,
      });
    } else {
      // Reverse: add back the lent amount, remove what was received
      batch.update(walletRef, {
        currentBalance: increment(loan.amount - loan.paidAmount),
        updatedAt: now,
      });
    }

    await batch.commit();
  };

  const activeBorrow = loans.filter(l => l.type === 'borrow' && l.status === 'active');
  const activeLend = loans.filter(l => l.type === 'lend' && l.status === 'active');
  const totalBorrow = activeBorrow.reduce((s, l) => s + (l.amount - l.paidAmount), 0);
  const totalLend = activeLend.reduce((s, l) => s + (l.amount - l.paidAmount), 0);

  return { loans, loading, addLoan, recordPayment, markAsPaid, deleteLoan, totalBorrow, totalLend, activeBorrow, activeLend };
}
