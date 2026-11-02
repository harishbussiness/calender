import { CalendarCategory, CalendarItem } from '../types/calendar';

const STORAGE_KEY_ITEMS = 'apple_calendar_items_v3';
const STORAGE_KEY_CATEGORIES = 'apple_calendar_categories_v3';
const OLD_KEYS_TO_CLEAN = [
  'apple_calendar_items',
  'apple_calendar_items_v2',
  'apple_calendar_categories',
  'apple_calendar_categories_v2'
];

export const DEFAULT_CATEGORIES: CalendarCategory[] = [
  { id: 'cat-deadlines', name: 'Deadlines', color: '#FF3B30', visible: true, isDefault: true },
  { id: 'cat-work', name: 'Work', color: '#007AFF', visible: true },
  { id: 'cat-personal', name: 'Personal', color: '#34C759', visible: true },
];

class LocalCalendarDatabase {
  constructor() {
    // Clean old mock data keys if they exist
    if (typeof window !== 'undefined') {
      try {
        OLD_KEYS_TO_CLEAN.forEach(k => localStorage.removeItem(k));
      } catch {
        // ignore
      }
    }
  }

  // Load all items (starts completely empty)
  public getItems(): CalendarItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return [];
  }

  // Persist items
  public saveItems(items: CalendarItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save to database:', e);
    }
  }

  // Add an item
  public insertItem(item: CalendarItem): void {
    const items = this.getItems();
    items.unshift(item);
    this.saveItems(items);
  }

  // Update item
  public updateItem(updated: CalendarItem): void {
    const items = this.getItems();
    const index = items.findIndex(i => i.id === updated.id);
    if (index !== -1) {
      items[index] = updated;
      this.saveItems(items);
    }
  }

  // Remove an item (called when deleted or when marked done)
  public deleteItem(id: string): void {
    const items = this.getItems();
    const filtered = items.filter(i => i.id !== id);
    this.saveItems(filtered);
  }

  // Clear all data completely
  public clearAll(): void {
    this.saveItems([]);
  }

  // Categories
  public getCategories(): CalendarCategory[] {
    if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return DEFAULT_CATEGORIES;
  }

  public saveCategories(categories: CalendarCategory[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories:', e);
    }
  }
}

export const db = new LocalCalendarDatabase();
