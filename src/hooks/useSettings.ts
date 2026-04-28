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
    if (!userId) {
      setLoading(false);
      return;
    }

    const ref = doc(db, 'users', userId, 'settings', 'default');
    const unsubscribe = onSnapshot(ref, snapshot => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as UserSettings);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!userId) return;
    const ref = doc(db, 'users', userId, 'settings', 'default');
    await setDoc(ref, { ...settings, ...updates }, { merge: true });
  };

  return { settings, loading, updateSettings };
}
