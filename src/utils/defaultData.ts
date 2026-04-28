import {
  collection,
  doc,
  setDoc,
  getDocs,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Ăn uống', icon: '🍜', color: '#f97316', order: 1 },
  { name: 'Đi lại', icon: '🚗', color: '#3b82f6', order: 2 },
  { name: 'Mua sắm', icon: '🛍️', color: '#ec4899', order: 3 },
  { name: 'Nhà cửa', icon: '🏠', color: '#22c55e', order: 4 },
  { name: 'Điện/Nước', icon: '💡', color: '#eab308', order: 5 },
  { name: 'Điện thoại/Internet', icon: '📱', color: '#06b6d4', order: 6 },
  { name: 'Sức khoẻ', icon: '🏥', color: '#ef4444', order: 7 },
  { name: 'Làm đẹp', icon: '💄', color: '#a855f7', order: 8 },
  { name: 'Giải trí', icon: '🎮', color: '#6366f1', order: 9 },
  { name: 'Du lịch', icon: '✈️', color: '#14b8a6', order: 10 },
  { name: 'Gia đình', icon: '👨‍👩‍👧', color: '#f43f5e', order: 11 },
  { name: 'Công việc', icon: '💼', color: '#64748b', order: 12 },
  { name: 'Học tập', icon: '📚', color: '#8b5cf6', order: 13 },
  { name: 'Quà tặng', icon: '🎁', color: '#f59e0b', order: 14 },
  { name: 'Khác', icon: '📦', color: '#9ca3af', order: 15 },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Lương', icon: '💰', color: '#22c55e', order: 1 },
  { name: 'Kinh doanh', icon: '🏪', color: '#3b82f6', order: 2 },
  { name: 'Thưởng', icon: '🎯', color: '#eab308', order: 3 },
  { name: 'Hoàn tiền', icon: '💸', color: '#f97316', order: 4 },
  { name: 'Được tặng', icon: '🎁', color: '#ec4899', order: 5 },
  { name: 'Thu nhập khác', icon: '📦', color: '#9ca3af', order: 6 },
];

export async function initializeUserData(userId: string): Promise<void> {
  const categoriesRef = collection(db, 'users', userId, 'categories');
  const existingCats = await getDocs(categoriesRef);
  if (!existingCats.empty) return;

  const batch = writeBatch(db);
  const now = Timestamp.now();

  DEFAULT_EXPENSE_CATEGORIES.forEach(cat => {
    const ref = doc(categoriesRef);
    batch.set(ref, {
      ...cat,
      type: 'expense',
      userId,
      isDefault: true,
      isHidden: false,
      createdAt: now,
    });
  });

  DEFAULT_INCOME_CATEGORIES.forEach(cat => {
    const ref = doc(categoriesRef);
    batch.set(ref, {
      ...cat,
      type: 'income',
      userId,
      isDefault: true,
      isHidden: false,
      createdAt: now,
    });
  });

  const walletsRef = collection(db, 'users', userId, 'wallets');
  const walletRef = doc(walletsRef);
  batch.set(walletRef, {
    name: 'Tiền mặt',
    type: 'cash',
    initialBalance: 0,
    currentBalance: 0,
    note: '',
    isActive: true,
    color: '#22c55e',
    userId,
    createdAt: now,
    updatedAt: now,
  });

  const settingsRef = doc(db, 'users', userId, 'settings', 'default');
  batch.set(settingsRef, {
    currency: 'VND',
    darkMode: false,
    budgetAlertThreshold: 80,
  });

  await batch.commit();
}

export async function createDemoData(userId: string): Promise<void> {
  const categoriesRef = collection(db, 'users', userId, 'categories');
  const cats = await getDocs(categoriesRef);
  const categoryMap: Record<string, string> = {};
  cats.forEach(d => {
    categoryMap[d.data().name] = d.id;
  });

  const walletsRef = collection(db, 'users', userId, 'wallets');
  const walletsDocs = await getDocs(walletsRef);
  const defaultWalletId = walletsDocs.docs[0]?.id;
  if (!defaultWalletId) return;

  const batch = writeBatch(db);
  const now = new Date();
  const txRef = collection(db, 'users', userId, 'transactions');

  const demoTransactions = [
    { type: 'income', amount: 15000000, categoryName: 'Lương', note: 'Lương tháng', payee: 'Công ty ABC', daysAgo: 1 },
    { type: 'expense', amount: 85000, categoryName: 'Ăn uống', note: 'Cơm trưa', payee: 'Quán cơm', daysAgo: 0 },
    { type: 'expense', amount: 45000, categoryName: 'Đi lại', note: 'Grab', payee: 'Grab', daysAgo: 0 },
    { type: 'expense', amount: 320000, categoryName: 'Mua sắm', note: 'Áo mới', payee: 'Zara', daysAgo: 1 },
    { type: 'expense', amount: 120000, categoryName: 'Ăn uống', note: 'Ăn tối gia đình', payee: 'Nhà hàng', daysAgo: 2 },
    { type: 'expense', amount: 250000, categoryName: 'Điện/Nước', note: 'Tiền điện', payee: 'EVN', daysAgo: 3 },
    { type: 'expense', amount: 199000, categoryName: 'Điện thoại/Internet', note: 'Internet tháng', payee: 'Viettel', daysAgo: 5 },
    { type: 'expense', amount: 3500000, categoryName: 'Nhà cửa', note: 'Tiền thuê nhà', payee: 'Chủ nhà', daysAgo: 7 },
    { type: 'expense', amount: 65000, categoryName: 'Giải trí', note: 'Netflix', payee: 'Netflix', daysAgo: 8 },
    { type: 'expense', amount: 180000, categoryName: 'Sức khoẻ', note: 'Khám bệnh', payee: 'Phòng khám', daysAgo: 10 },
  ];

  let totalExpense = 0;

  demoTransactions.forEach(tx => {
    const ref = doc(txRef);
    const date = new Date(now);
    date.setDate(date.getDate() - tx.daysAgo);
    const ts = Timestamp.fromDate(date);
    const catId = categoryMap[tx.categoryName] || '';

    if (tx.type === 'expense') totalExpense += tx.amount;

    batch.set(ref, {
      type: tx.type,
      amount: tx.amount,
      date: ts,
      categoryId: catId,
      walletId: defaultWalletId,
      note: tx.note,
      payee: tx.payee,
      paymentMethod: 'cash',
      isFixed: false,
      isRecurring: false,
      userId,
      createdAt: ts,
      updatedAt: ts,
    });
  });

  const walletRef = doc(db, 'users', userId, 'wallets', defaultWalletId);
  batch.update(walletRef, {
    initialBalance: 15000000,
    currentBalance: 15000000 - totalExpense,
    updatedAt: Timestamp.now(),
  });

  await batch.commit();
}
