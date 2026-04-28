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
    <div className="flex min-h-screen bg-[#fef8fa]">
      <Sidebar />

      <main className="flex-1 min-w-0 pb-32 lg:pb-10">
        {children}
      </main>

      {/* Desktop FAB */}
      <button
        onClick={() => navigate('/add-transaction')}
        className="hidden lg:flex fixed bottom-8 right-8 w-14 h-14 bg-[#9b3f5a] text-white rounded-full items-center justify-center transition-all hover:scale-105 active:scale-95 z-30"
        style={{ boxShadow: '0 8px 24px rgba(155,63,90,0.35)' }}
        title="Thêm giao dịch"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      <BottomNav />
    </div>
  );
}
