import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserSettings } from '../types';

const DEFAULT_SETTINGS: UserSettings = {
  currency: 'VND',
  darkMode: false,
  budgetAlertThreshold: 80,
};

export function useSettings(userId: string | undefined) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const ref = doc(db, 'users', userId, 'settings', 'default');
    return onSnapshot(ref, snapshot => {
      if (snapshot.exists()) setSettings(snapshot.data() as UserSettings);
      setLoading(false);
    });
  }, [userId]);

  // Dark mode permanently disabled
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!userId) return;
    const ref = doc(db, 'users', userId, 'settings', 'default');
    await setDoc(ref, { ...settings, ...updates }, { merge: true });
  };

  return { settings, loading, updateSettings };
}
