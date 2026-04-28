import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: boolean;
}

export function Card({ children, className = '', onClick, padding = true }: CardProps) {
  const base = 'bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm';
  const interactive = onClick ? 'cursor-pointer hover:shadow-md transition-shadow duration-150 active:scale-[0.99]' : '';
  const pad = padding ? 'p-4' : '';

  return (
    <div className={`${base} ${interactive} ${pad} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  iconBg?: string;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatCard({ label, value, icon, iconBg = 'bg-indigo-100 dark:bg-indigo-900', trend, trendUp, className = '' }: StatCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 font-medium ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        {icon && (
          <div className={`ml-3 flex-shrink-0 w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
