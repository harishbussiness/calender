export type ItemType = 'event' | 'task' | 'deadline';
export type PriorityLevel = 'none' | 'low' | 'medium' | 'high';

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface CalendarItem {
  id: string;
  title: string;
  type: ItemType;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD for multi-day events
  startTime?: string; // HH:mm in 24h
  endTime?: string; // HH:mm in 24h
  isAllDay?: boolean;
  completed: boolean;
  completedAt?: string;
  priority: PriorityLevel;
  calendarId: string;
  notes?: string;
  location?: string;
  url?: string;
  isFlagged?: boolean;
  subtasks: SubTask[];
  createdAt: string;
}

export interface CalendarCategory {
  id: string;
  name: string;
  color: string; // Hex color code
  visible: boolean;
  isDefault?: boolean;
}

export type ViewMode = 'day' | 'week' | 'month' | 'deadlines' | 'reminders';
export type SmartListType = 'all' | 'today' | 'scheduled' | 'deadlines' | 'flagged' | 'completed';
