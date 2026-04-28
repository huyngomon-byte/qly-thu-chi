import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: boolean;
}

export function Card({ children, className = '', onClick, padding = true }: CardProps) {
  const base = 'bg-white rounded-[1.25rem] border border-[#ffd9e0]/20 shadow-[0_4px_12px_rgba(255,143,171,0.08)]';
  const interactive = onClick ? 'cursor-pointer hover:shadow-[0_4px_16px_rgba(255,143,171,0.14)] transition-shadow duration-150 active:scale-[0.99]' : '';
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

export function StatCard({ label, value, icon, iconBg = 'bg-[#ffd9e0]', trend, trendUp, className = '' }: StatCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-[#877275] uppercase tracking-wide mb-1">{label}</p>
          <p className="text-xl font-bold text-[#1d1b1d] truncate font-jakarta">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 font-medium ${trendUp ? 'text-[#146a5f]' : 'text-[#9b3f5a]'}`}>
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
