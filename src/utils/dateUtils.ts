import { CalendarCategory, CalendarItem } from '../types/calendar';

export function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = padZero(date.getMonth() + 1);
  const d = padZero(date.getDate());
  return `${y}-${m}-${d}`;
}

export function getTodayString(): string {
  return toDateString(new Date());
}

export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isDateToday(dateStr: string): boolean {
  return dateStr === getTodayString();
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface DayInfo {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

export function getMonthMatrix(year: number, month: number): DayInfo[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  const days: DayInfo[] = [];
  const todayStr = getTodayString();

  // Days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const d = new Date(year, month - 1, dayNum);
    const dateStr = toDateString(d);
    days.push({
      date: d,
      dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isWeekend: d.getDay() === 0 || d.getDay() === 6
    });
  }

  // Days of current month
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const d = new Date(year, month, dayNum);
    const dateStr = toDateString(d);
    days.push({
      date: d,
      dateStr,
      dayNumber: dayNum,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isWeekend: d.getDay() === 0 || d.getDay() === 6
    });
  }

  // Fill up trailing days to complete grid (usually 35 or 42 cells)
  const remainingCells = 42 - days.length >= 7 && days.length <= 35 ? 35 - days.length : 42 - days.length;
  for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
    const d = new Date(year, month + 1, dayNum);
    const dateStr = toDateString(d);
    days.push({
      date: d,
      dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isWeekend: d.getDay() === 0 || d.getDay() === 6
    });
  }

  return days;
}

export function getWeekDays(baseDate: Date): DayInfo[] {
  const dayOfWeek = baseDate.getDay();
  const startOfWeek = new Date(baseDate);
  startOfWeek.setDate(baseDate.getDate() - dayOfWeek);

  const days: DayInfo[] = [];
  const todayStr = getTodayString();

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = toDateString(d);
    days.push({
      date: d,
      dateStr,
      dayNumber: d.getDate(),
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isWeekend: d.getDay() === 0 || d.getDay() === 6
    });
  }
  return days;
}

export interface DeadlineCalculation {
  status: 'overdue' | 'today' | 'this-week' | 'upcoming';
  relativeText: string;
  badgeColor: string;
  daysRemaining: number;
  isOverdue: boolean;
}

export function calculateDeadline(dateStr: string, timeStr?: string, completed?: boolean): DeadlineCalculation {
  if (completed) {
    return {
      status: 'upcoming',
      relativeText: 'Completed',
      badgeColor: 'text-neutral-400',
      daysRemaining: 0,
      isOverdue: false
    };
  }

  const now = new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  let targetHour = 23;
  let targetMin = 59;
  if (timeStr) {
    const [h, min] = timeStr.split(':').map(Number);
    targetHour = h;
    targetMin = min;
  }
  const targetDate = new Date(y, m - 1, d, targetHour, targetMin, 0);

  const diffMs = targetDate.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const isTodayDate = dateStr === getTodayString();

  if (diffMs < 0) {
    const absDays = Math.abs(diffDays);
    const relativeText = absDays === 0 ? 'Overdue today' : `Overdue by ${absDays}d`;
    return {
      status: 'overdue',
      relativeText,
      badgeColor: 'text-[#FF3B30] dark:text-[#FF453A]',
      daysRemaining: diffDays,
      isOverdue: true
    };
  }

  if (isTodayDate) {
    let relativeText = 'Due Today';
    if (timeStr && diffHours > 0 && diffHours < 12) {
      relativeText = `In ${diffHours}h`;
    }
    return {
      status: 'today',
      relativeText,
      badgeColor: 'text-[#FF9500] dark:text-[#FF9F0A]',
      daysRemaining: 0,
      isOverdue: false
    };
  }

  if (diffDays <= 7) {
    const dayName = DAY_NAMES_SHORT[targetDate.getDay()];
    return {
      status: 'this-week',
      relativeText: `Due ${dayName} (${diffDays}d)`,
      badgeColor: 'text-[#007AFF] dark:text-[#0A84FF]',
      daysRemaining: diffDays,
      isOverdue: false
    };
  }

  return {
    status: 'upcoming',
    relativeText: `In ${diffDays} days`,
    badgeColor: 'text-neutral-500 dark:text-neutral-400',
    daysRemaining: diffDays,
    isOverdue: false
  };
}

// Convert 24h to 12h formatted time (e.g., "14:30" -> "2:30 PM")
export function formatTime12h(timeStr?: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${padZero(m)} ${period}`;
}

// Natural language quick parse helper (e.g. "Meeting tomorrow at 3pm !high #Work")
export function parseQuickEntry(text: string): Partial<CalendarItem> {
  const result: Partial<CalendarItem> = {
    title: text,
    type: 'task',
    priority: 'none',
    date: getTodayString()
  };

  const lower = text.toLowerCase();
  const today = new Date();

  // Priority check
  if (lower.includes('!high') || lower.includes('!!!')) {
    result.priority = 'high';
  } else if (lower.includes('!med') || lower.includes('!!')) {
    result.priority = 'medium';
  } else if (lower.includes('!low') || lower.includes('!')) {
    result.priority = 'low';
  }

  // Type check
  if (lower.includes('meeting') || lower.includes('event') || lower.includes('call') || lower.includes('sync')) {
    result.type = 'event';
  } else if (lower.includes('deadline') || lower.includes('due') || lower.includes('submit')) {
    result.type = 'deadline';
  }

  // Date parsing
  if (lower.includes('tomorrow')) {
    const tom = new Date(today);
    tom.setDate(today.getDate() + 1);
    result.date = toDateString(tom);
  } else if (lower.includes('next week')) {
    const nw = new Date(today);
    nw.setDate(today.getDate() + 7);
    result.date = toDateString(nw);
  }

  // Time parsing (e.g., 2pm, 14:00, 9:30am)
  const timeRegex = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
  const timeMatch = text.match(timeRegex);
  if (timeMatch && (timeMatch[3] || timeMatch[2])) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();

    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      result.startTime = `${padZero(hour)}:${padZero(minute)}`;
      const endHour = (hour + 1) % 24;
      result.endTime = `${padZero(endHour)}:${padZero(minute)}`;
    }
  }

  // Clean title by removing tags and tokens
  const cleanTitle = text
    .replace(/\b(tomorrow|today|next week)\b/gi, '')
    .replace(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/gi, '')
    .replace(/(!high|!med|!low|!!!|!!|!)/g, '')
    .trim();

  if (cleanTitle) {
    result.title = cleanTitle;
  }

  return result;
}

// Generate Apple iCalendar (.ics) format and trigger download
export function exportToICS(items: CalendarItem[], categories: CalendarCategory[]): void {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Apple Inc.//Apple Calendar & Deadlines//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Apple Calendar & Deadlines'
  ];

  items.forEach(item => {
    const catName = categoryMap.get(item.calendarId) || 'General';
    const dateNoHyphen = item.date.replace(/-/g, '');
    let dtStart = `${dateNoHyphen}`;
    let dtEnd = `${dateNoHyphen}`;

    if (item.startTime) {
      const timeNoColon = item.startTime.replace(':', '') + '00';
      dtStart = `${dateNoHyphen}T${timeNoColon}`;
      if (item.endTime) {
        const endTimeNoColon = item.endTime.replace(':', '') + '00';
        dtEnd = `${dateNoHyphen}T${endTimeNoColon}`;
      } else {
        dtEnd = dtStart;
      }
    }

    ics.push('BEGIN:VEVENT');
    ics.push(`UID:${item.id}@applecalendar.app`);
    ics.push(`SUMMARY:${item.title.replace(/[,;]/g, ' ')}`);
    if (item.notes) {
      ics.push(`DESCRIPTION:${item.notes.replace(/\n/g, '\\n')}`);
    }
    ics.push(`CATEGORIES:${catName}`);
    if (item.isAllDay || !item.startTime) {
      ics.push(`DTSTART;VALUE=DATE:${dateNoHyphen}`);
      ics.push(`DTEND;VALUE=DATE:${dateNoHyphen}`);
    } else {
      ics.push(`DTSTART:${dtStart}`);
      ics.push(`DTEND:${dtEnd}`);
    }
    if (item.completed) {
      ics.push('STATUS:COMPLETED');
    }
    ics.push('END:VEVENT');
  });

  ics.push('END:VCALENDAR');
  const blob = new Blob([ics.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Apple-Calendar-Export-${getTodayString()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
