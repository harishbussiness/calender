import { CalendarCategory, CalendarItem } from '../types/calendar';

export const INITIAL_CATEGORIES: CalendarCategory[] = [
  { id: 'cat-deadlines', name: 'Deadlines', color: '#FF3B30', visible: true, isDefault: true },
  { id: 'cat-work', name: 'Work', color: '#007AFF', visible: true },
  { id: 'cat-personal', name: 'Personal', color: '#34C759', visible: true },
];

export function getInitialItems(): CalendarItem[] {
  // Completely empty database
  return [];
}
