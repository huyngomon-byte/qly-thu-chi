import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

  const variants = {
    primary:   'bg-[#9b3f5a] hover:bg-[#7d2f47] text-white focus:ring-[#ff8fab] shadow-sm',
    secondary: 'bg-[#f8f2f4] hover:bg-[#f0e8ec] text-[#544245] focus:ring-[#dac0c4]',
    danger:    'bg-[#9b3f5a] hover:bg-[#7d2f47] text-white focus:ring-[#ff8fab] shadow-sm',
    ghost:     'hover:bg-[#f8f2f4] text-[#544245] focus:ring-[#dac0c4]',
    outline:   'border-2 border-[#9b3f5a] text-[#9b3f5a] hover:bg-[#ffd9e0]/30 focus:ring-[#ff8fab]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
