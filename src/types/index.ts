import { Timestamp } from 'firebase/firestore';

export type TransactionType = 'income' | 'expense' | 'transfer';
export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'ewallet';
export type WalletType = 'cash' | 'bank' | 'ewallet' | 'credit' | 'savings' | 'other';
export type CategoryType = 'income' | 'expense';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  date: Timestamp;
  categoryId: string;
  walletId: string;
  toWalletId?: string;
  note: string;
  payee: string;
  paymentMethod: PaymentMethod;
  isFixed: boolean;
  isRecurring: boolean;
  recurringId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isDefault: boolean;
  isHidden: boolean;
  order: number;
}

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  type: WalletType;
  initialBalance: number;
  currentBalance: number;
  note: string;
  isActive: boolean;
  color: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CategoryBudget {
  categoryId: string;
  amount: number;
}

export interface Budget {
  id: string;
  userId: string;
  month: string;
  totalBudget: number;
  categoryBudgets: CategoryBudget[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RecurringExpense {
  id: string;
  userId: string;
  name: string;
  amount: number;
  categoryId: string;
  walletId: string;
  dayOfMonth: number;
  isActive: boolean;
  note: string;
  lastCreated?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type LoanType = 'borrow' | 'lend';
export type LoanStatus = 'active' | 'paid';

export interface LoanPayment {
  id: string;
  amount: number;
  date: Timestamp;
  note: string;
}

export interface Loan {
  id: string;
  userId: string;
  type: LoanType;
  personName: string;
  amount: number;
  paidAmount: number;
  date: Timestamp;
  dueDate?: Timestamp;
  status: LoanStatus;
  walletId: string;
  note: string;
  payments: LoanPayment[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserSettings {
  currency: string;
  darkMode: boolean;
  budgetAlertThreshold: number;
}

export interface DailyData {
  day: string;
  income: number;
  expense: number;
}

export interface CategoryData {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
}
