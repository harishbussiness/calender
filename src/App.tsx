import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  CalendarCategory, 
  CalendarItem, 
  ItemType, 
  SmartListType, 
  ViewMode 
} from './types/calendar';
import { db } from './db/database';
import { 
  getTodayString, 
  toDateString, 
  exportToICS 
} from './utils/dateUtils';
import { sounds } from './utils/audio';

import { WindowHeader } from './components/WindowHeader';
import { Sidebar } from './components/Sidebar';
import { MonthView } from './components/MonthView';
import { WeekView } from './components/WeekView';
import { DayView } from './components/DayView';
import { DeadlinesView } from './components/DeadlinesView';
import { RemindersView } from './components/RemindersView';
import { InspectorModal } from './components/InspectorModal';
import { QuickAddModal } from './components/QuickAddModal';
import { CommandPalette } from './components/CommandPalette';
import { CheckCircle2, RotateCcw } from 'lucide-react';

const STORAGE_KEY_DARK = 'apple_calendar_dark_mode';
const STORAGE_KEY_SOUND = 'apple_calendar_sound';

export default function App() {
  // Built-in database instance initialization
  const [items, setItems] = useState<CalendarItem[]>(() => db.getItems());
  const [categories, setCategories] = useState<CalendarCategory[]>(() => db.getCategories());

  // Navigation & View State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [activeSmartList, setActiveSmartList] = useState<SmartListType | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // UI Panels
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);

  // Modals
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddDefaults, setQuickAddDefaults] = useState<{
    date?: string;
    time?: string;
    type?: ItemType;
  }>({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Undo Toast state
  const [undoItem, setUndoItem] = useState<CalendarItem | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sound preference
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem(STORAGE_KEY_SOUND);
      return val !== 'false';
    } catch {
      return true;
    }
  });

  // Dark mode preference
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem(STORAGE_KEY_DARK);
      if (val !== null) return val === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Sync dark mode class with <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEY_DARK, String(isDarkMode));
    } catch {
      // ignore
    }
  }, [isDarkMode]);

  // Sync sounds state
  useEffect(() => {
    sounds.enabled = isSoundEnabled;
    try {
      localStorage.setItem(STORAGE_KEY_SOUND, String(isSoundEnabled));
    } catch {
      // ignore
    }
  }, [isSoundEnabled]);

  // Date Navigation handlers
  const handlePrevDate = () => {
    sounds.playTap();
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setCurrentDate(d);
    setSelectedDate(d);
  };

  const handleNextDate = () => {
    sounds.playTap();
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setCurrentDate(d);
    setSelectedDate(d);
  };

  const handleToday = () => {
    sounds.playTap();
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Complete and Remove task from Database
  const handleToggleComplete = useCallback((itemId: string) => {
    const itemToComplete = items.find(i => i.id === itemId);
    if (!itemToComplete) return;

    sounds.playComplete();
    if (itemToComplete.type === 'deadline' || itemToComplete.priority === 'high') {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FF3B30', '#007AFF', '#34C759', '#FF9500']
      });
    }

    // Remove permanently from database
    db.deleteItem(itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));

    // If currently open in inspector, close inspector
    if (selectedItem?.id === itemId) {
      setSelectedItem(null);
      setIsInspectorOpen(false);
    }

    // Show undo toast
    setUndoItem(itemToComplete);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setUndoItem(null);
    }, 4500);
  }, [items, selectedItem]);

  // Undo removal
  const handleUndo = () => {
    if (!undoItem) return;
    sounds.playTap();
    db.insertItem(undoItem);
    setItems(prev => [undoItem, ...prev]);
    setUndoItem(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
  };

  const handleToggleSubtask = (itemId: string, subtaskId: string) => {
    sounds.playTap();
    setItems(prev => {
      const updatedList = prev.map(item => {
        if (item.id === itemId) {
          const updatedSubs = item.subtasks.map(st => 
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          const updatedItem = { ...item, subtasks: updatedSubs };
          db.updateItem(updatedItem);
          return updatedItem;
        }
        return item;
      });
      return updatedList;
    });

    if (selectedItem?.id === itemId) {
      setSelectedItem(prev => {
        if (!prev) return null;
        return {
          ...prev,
          subtasks: prev.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
        };
      });
    }
  };

  const handleAddItem = (newItem: Omit<CalendarItem, 'id' | 'createdAt'>) => {
    const created: CalendarItem = {
      ...newItem,
      id: `item-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    sounds.playTap();
    db.insertItem(created);
    setItems(prev => [created, ...prev]);
    setSelectedItem(created);
    setIsInspectorOpen(true);
  };

  const handleUpdateItem = (updated: CalendarItem) => {
    db.updateItem(updated);
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    setSelectedItem(updated);
  };

  const handleDeleteItem = (itemId: string) => {
    db.deleteItem(itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
    if (selectedItem?.id === itemId) {
      setSelectedItem(null);
      setIsInspectorOpen(false);
    }
  };

  const handleReschedule = (itemId: string, newDateStr: string) => {
    setItems(prev => {
      return prev.map(i => {
        if (i.id === itemId) {
          const updated = { ...i, date: newDateStr };
          db.updateItem(updated);
          return updated;
        }
        return i;
      });
    });
  };

  const handleToggleCategory = (catId: string) => {
    sounds.playTap();
    const updated = categories.map(c => c.id === catId ? { ...c, visible: !c.visible } : c);
    setCategories(updated);
    db.saveCategories(updated);
  };

  const handleAddCategory = (newCat: { name: string; color: string }) => {
    const created: CalendarCategory = {
      id: `cat-${Date.now()}`,
      name: newCat.name,
      color: newCat.color,
      visible: true
    };
    sounds.playTap();
    const updated = [...categories, created];
    setCategories(updated);
    db.saveCategories(updated);
  };

  const handleSelectItem = (item: CalendarItem) => {
    setSelectedItem(item);
    setIsInspectorOpen(true);
  };

  // Keyboard shortcut listener (Cmd+K, Cmd+N, Cmd+T)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setQuickAddDefaults({ date: toDateString(selectedDate) });
        setIsQuickAddOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        handleToday();
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsQuickAddOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDate]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f5f5f7] dark:bg-[#121214] text-[#1d1d1f] dark:text-[#f5f5f7]">
      {/* Top macOS App Bar */}
      <WindowHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode);
          setActiveSmartList(null);
          setSelectedCategoryId(null);
        }}
        onPrevDate={handlePrevDate}
        onNextDate={handleNextDate}
        onToday={handleToday}
        onQuickAdd={() => {
          sounds.playTap();
          setQuickAddDefaults({ date: toDateString(selectedDate) });
          setIsQuickAddOpen(true);
        }}
        onOpenSearch={() => {
          sounds.playTap();
          setIsSearchOpen(true);
        }}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => {
          sounds.playTap();
          setIsSidebarOpen(prev => !prev);
        }}
        isInspectorOpen={isInspectorOpen}
        onToggleInspector={() => {
          sounds.playTap();
          setIsInspectorOpen(prev => !prev);
        }}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => {
          sounds.playTap();
          setIsDarkMode(prev => !prev);
        }}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={() => setIsSoundEnabled(prev => !prev)}
        onExportICS={() => {
          sounds.playTap();
          exportToICS(items, categories);
        }}
      />

      {/* Main Workspace Frame */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Apple Sidebar */}
        {isSidebarOpen && (
          <Sidebar
            currentDate={currentDate}
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setCurrentDate(date);
            }}
            categories={categories}
            onToggleCategory={handleToggleCategory}
            onAddCategory={handleAddCategory}
            items={items}
            activeSmartList={activeSmartList}
            onSelectSmartList={(type) => {
              setActiveSmartList(type);
              setSelectedCategoryId(null);
            }}
            onViewModeChange={setViewMode}
          />
        )}

        {/* Primary Viewport */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {viewMode === 'month' && (
            <MonthView
              currentDate={currentDate}
              selectedDate={selectedDate}
              onSelectDate={(d) => {
                setSelectedDate(d);
              }}
              items={items}
              categories={categories}
              onSelectItem={handleSelectItem}
              onToggleComplete={handleToggleComplete}
              onDoubleClickDay={(dateStr) => {
                setQuickAddDefaults({ date: dateStr });
                setIsQuickAddOpen(true);
              }}
            />
          )}

          {viewMode === 'week' && (
            <WeekView
              currentDate={currentDate}
              selectedDate={selectedDate}
              onSelectDate={(d) => {
                setSelectedDate(d);
              }}
              items={items}
              categories={categories}
              onSelectItem={handleSelectItem}
              onToggleComplete={handleToggleComplete}
              onCreateAtTime={(dateStr, timeStr) => {
                setQuickAddDefaults({ date: dateStr, time: timeStr, type: 'event' });
                setIsQuickAddOpen(true);
              }}
            />
          )}

          {viewMode === 'day' && (
            <DayView
              selectedDate={selectedDate}
              items={items}
              categories={categories}
              onSelectItem={handleSelectItem}
              onToggleComplete={handleToggleComplete}
              onQuickAddTask={(title, dateStr) => {
                handleAddItem({
                  title,
                  type: 'task',
                  date: dateStr,
                  isAllDay: true,
                  completed: false,
                  priority: 'none',
                  calendarId: categories[0]?.id || 'cat-work',
                  subtasks: []
                });
              }}
              onCreateAtTime={(dateStr, timeStr) => {
                setQuickAddDefaults({ date: dateStr, time: timeStr, type: 'event' });
                setIsQuickAddOpen(true);
              }}
            />
          )}

          {viewMode === 'deadlines' && (
            <DeadlinesView
              items={items}
              categories={categories}
              onSelectItem={handleSelectItem}
              onToggleComplete={handleToggleComplete}
              onToggleSubtask={handleToggleSubtask}
              onReschedule={handleReschedule}
              onQuickAddDeadline={() => {
                sounds.playTap();
                setQuickAddDefaults({ date: getTodayString(), type: 'deadline' });
                setIsQuickAddOpen(true);
              }}
            />
          )}

          {viewMode === 'reminders' && (
            <RemindersView
              items={items}
              categories={categories}
              activeSmartList={activeSmartList}
              selectedCategoryId={selectedCategoryId}
              onSelectItem={handleSelectItem}
              onToggleComplete={handleToggleComplete}
              onToggleSubtask={handleToggleSubtask}
              onQuickAddTask={(title, dateStr, categoryId) => {
                handleAddItem({
                  title,
                  type: 'task',
                  date: dateStr || getTodayString(),
                  isAllDay: true,
                  completed: false,
                  priority: 'none',
                  calendarId: categoryId || categories[0]?.id || 'cat-work',
                  subtasks: []
                });
              }}
            />
          )}
        </main>

        {/* macOS Slide-out Inspector Drawer */}
        <InspectorModal
          item={selectedItem}
          categories={categories}
          isOpen={isInspectorOpen && !!selectedItem}
          onClose={() => setIsInspectorOpen(false)}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onCompleteItem={handleToggleComplete}
        />
      </div>

      {/* Undo Task Completion Toast */}
      {undoItem && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl shadow-xl text-xs font-medium animate-slide-up">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
            Task completed and removed from database
          </span>
          <button
            type="button"
            onClick={handleUndo}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/20 dark:bg-black/10 hover:bg-white/30 dark:hover:bg-black/20 transition-colors font-semibold"
          >
            <RotateCcw className="w-3 h-3" />
            Undo
          </button>
        </div>
      )}

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        categories={categories}
        defaultDate={quickAddDefaults.date}
        defaultTime={quickAddDefaults.time}
        defaultType={quickAddDefaults.type}
        onAddItem={handleAddItem}
      />

      {/* Apple Spotlight Command Palette */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        items={items}
        categories={categories}
        onSelectItem={handleSelectItem}
      />
    </div>
  );
}
