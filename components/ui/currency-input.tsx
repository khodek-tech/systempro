'use client';

import { useState, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = '0 Kč',
  className,
}: CurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format number with spaces as thousand separators
  const formatNumber = (num: number): string => {
    if (num === 0) return '';
    return num.toLocaleString('cs-CZ').replace(/\u00a0/g, ' ');
  };

  // Parse formatted string back to number
  const parseNumber = (str: string): number => {
    const cleaned = str.replace(/[^\d]/g, '');
    return parseInt(cleaned, 10) || 0;
  };

  // Compute display value based on focus state
  const displayValue = useMemo(() => {
    if (isFocused && localValue !== null) {
      return localValue;
    }
    return value ? `${formatNumber(value)} Kč` : '';
  }, [value, isFocused, localValue]);

  const handleFocus = () => {
    setIsFocused(true);
    setLocalValue(value ? formatNumber(value) : '');
  };

  const handleBlur = () => {
    setIsFocused(false);
    setLocalValue(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    // Only allow digits and spaces
    const cleaned = rawValue.replace(/[^\d\s]/g, '');
    const numericValue = parseNumber(cleaned);

    // Update the numeric value
    onChange(numericValue);

    // Update local display value
    setLocalValue(numericValue ? formatNumber(numericValue) : '');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, arrows
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'Escape' ||
      e.key === 'Enter' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) ||
      (e.metaKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()))
    ) {
      return;
    }

    // Block non-numeric keys
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={cn(
        'bg-white p-4 rounded-lg text-right font-bold text-xl outline-none shadow-sm border border-slate-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all',
        className
      )}
    />
  );
}
