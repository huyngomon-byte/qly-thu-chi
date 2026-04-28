import React from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-[#F4F6FF] dark:bg-[#0C0C1A]">
      <Sidebar />

      <main className="flex-1 min-w-0 pb-32 lg:pb-10">
        {children}
      </main>

      {/* Desktop FAB */}
      <button
        onClick={() => navigate('/add-transaction')}
        className="hidden lg:flex fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl items-center justify-center fab-shadow transition-all hover:scale-105 active:scale-95 z-30"
        title="Thêm giao dịch"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      <BottomNav />
    </div>
  );
}
