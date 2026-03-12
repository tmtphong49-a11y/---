import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatThaiDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
};

export const DAYS_OF_WEEK = [
  { label: 'จันทร์', value: 'Monday', index: 1 },
  { label: 'อังคาร', value: 'Tuesday', index: 2 },
  { label: 'พุธ', value: 'Wednesday', index: 3 },
  { label: 'พฤหัสบดี', value: 'Thursday', index: 4 },
  { label: 'ศุกร์', value: 'Friday', index: 5 },
  { label: 'เสาร์', value: 'Saturday', index: 6 },
  { label: 'อาทิตย์', value: 'Sunday', index: 0 },
];
