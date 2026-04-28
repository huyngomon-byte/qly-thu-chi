import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({ label, error, hint, leftIcon, rightIcon, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[10px] font-bold text-[#877275] uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#877275]">
            {leftIcon}
          </div>
        )}
        <input
          className={`
            w-full px-4 py-3 rounded-2xl border bg-[#f8f2f4] text-[#1d1b1d]
            placeholder-[#877275]
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error ? 'border-[#ff8fab]' : 'border-[#dac0c4]/40'}
            focus:outline-none focus:ring-2 focus:ring-[#ff8fab]/40 focus:border-[#ff8fab] focus:bg-white
            transition-all duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#877275]">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-[#9b3f5a]">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-[#877275]">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[10px] font-bold text-[#877275] uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-3 rounded-2xl border bg-[#f8f2f4] text-[#1d1b1d]
          ${error ? 'border-[#ff8fab]' : 'border-[#dac0c4]/40'}
          focus:outline-none focus:ring-2 focus:ring-[#ff8fab]/40 focus:border-[#ff8fab] focus:bg-white
          transition-all duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-[#9b3f5a]">{error}</p>}
    </div>
  );
}
