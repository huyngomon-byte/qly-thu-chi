import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="w-16 h-16 bg-[#f8f2f4] rounded-full flex items-center justify-center mb-4 text-2xl">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[#1d1b1d] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#877275] mb-4 max-w-xs">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} size="sm">{action.label}</Button>
      )}
    </div>
  );
}
