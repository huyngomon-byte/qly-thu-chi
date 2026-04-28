import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  parseISO,
  isToday,
  isYesterday,
  getDaysInMonth as getDaysInMonthFns,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function getMonthLabel(month: string): string {
  const [year, mon] = month.split('-');
  return `Tháng ${parseInt(mon)}, ${year}`;
}

export function getMonthRange(month: string): { start: Date; end: Date } {
  const date = parseISO(`${month}-01`);
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function getWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  };
}

export function getTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfDay(now),
    end: endOfDay(now),
  };
}

export function formatDate(date: Date | Timestamp): string {
  const d = date instanceof Timestamp ? date.toDate() : date;
  return format(d, 'dd/MM/yyyy');
}

export function formatDateShort(date: Date | Timestamp): string {
  const d = date instanceof Timestamp ? date.toDate() : date;
  return format(d, 'dd/MM');
}

export function formatDateFull(date: Date | Timestamp): string {
  const d = date instanceof Timestamp ? date.toDate() : date;
  if (isToday(d)) return 'Hôm nay';
  if (isYesterday(d)) return 'Hôm qua';
  return format(d, "EEEE, dd/MM/yyyy", { locale: vi });
}

export function formatDateTime(date: Date | Timestamp): string {
  const d = date instanceof Timestamp ? date.toDate() : date;
  return format(d, 'HH:mm dd/MM/yyyy');
}

export function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

export function getDaysInMonth(month: string): number {
  const [year, mon] = month.split('-').map(Number);
  return getDaysInMonthFns(new Date(year, mon - 1));
}

export function getPrevMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  const date = new Date(year, mon - 2, 1);
  return format(date, 'yyyy-MM');
}

export function getNextMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  const date = new Date(year, mon, 1);
  return format(date, 'yyyy-MM');
}

export function getLast6Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(format(date, 'yyyy-MM'));
  }
  return months;
}

export function formatInputDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
