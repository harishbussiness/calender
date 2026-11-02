import React, { useState } from 'react';
import { 
  Flame, 
  Flag, 
  Inbox, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  X,
  Database
} from 'lucide-react';
import { CalendarCategory, CalendarItem, SmartListType, ViewMode } from '../types/calendar';
import { 
  MONTH_NAMES_SHORT, 
  DAY_NAMES_SHORT, 
  getMonthMatrix, 
  getTodayString, 
  isSameDay 
} from '../utils/dateUtils';
import { sounds } from '../utils/audio';

interface SidebarProps {
  currentDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  categories: CalendarCategory[];
  onToggleCategory: (categoryId: string) => void;
  onAddCategory: (category: { name: string; color: string }) => void;
  items: CalendarItem[];
  activeSmartList: SmartListType | null;
  onSelectSmartList: (type: SmartListType | null) => void;
  onViewModeChange: (mode: ViewMode) => void;
}

const APPLE_PALETTE = [
  '#007AFF', // Blue
  '#FF3B30', // Red
  '#34C759', // Green
  '#AF52DE', // Purple
  '#FF9500', // Orange
  '#5856D6', // Indigo
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentDate,
  selectedDate,
  onSelectDate,
  categories,
  onToggleCategory,
  onAddCategory,
  items,
  activeSmartList,
  onSelectSmartList,
  onViewModeChange
}) => {
  const [miniYear, setMiniYear] = useState(currentDate.getFullYear());
  const [miniMonth, setMiniMonth] = useState(currentDate.getMonth());
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(APPLE_PALETTE[0]);

  React.useEffect(() => {
    setMiniYear(currentDate.getFullYear());
    setMiniMonth(currentDate.getMonth());
  }, [currentDate]);

  const handlePrevMiniMonth = () => {
    if (miniMonth === 0) {
      setMiniMonth(11);
      setMiniYear(miniYear - 1);
    } else {
      setMiniMonth(miniMonth - 1);
    }
  };

  const handleNextMiniMonth = () => {
    if (miniMonth === 11) {
      setMiniMonth(0);
      setMiniYear(miniYear + 1);
    } else {
      setMiniMonth(miniMonth + 1);
    }
  };

  const miniDays = getMonthMatrix(miniYear, miniMonth);
  const todayStr = getTodayString();

  // Counts (active tasks in database)
  const todayCount = items.filter(i => i.date === todayStr).length;
  const deadlinesCount = items.filter(i => i.type === 'deadline' || i.priority === 'high').length;
  const flaggedCount = items.filter(i => i.isFlagged).length;

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory({
      name: newCatName.trim(),
      color: newCatColor
    });
    setNewCatName('');
    setIsAddingCategory(false);
  };

  return (
    <aside className="w-56 min-w-[224px] bg-[#fbfbfd] dark:bg-[#18181a] border-r border-black/[0.06] dark:border-white/[0.06] flex flex-col h-full overflow-y-auto select-none transition-all">
      {/* Mini Calendar */}
      <div className="p-3 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            {MONTH_NAMES_SHORT[miniMonth]} {miniYear}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handlePrevMiniMonth}
              className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextMiniMonth}
              className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 text-center mb-1 text-[10px] font-medium text-neutral-400">
          {DAY_NAMES_SHORT.map(d => (
            <span key={d}>{d[0]}</span>
          ))}
        </div>

        {/* Mini Days */}
        <div className="grid grid-cols-7 gap-y-0.5 text-center text-xs">
          {miniDays.slice(0, 35).map((d) => {
            const isSelected = isSameDay(d.date, selectedDate);
            const isToday = d.isToday;

            return (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => {
                  sounds.playTap();
                  onSelectDate(d.date);
                }}
                className={`h-6 w-6 mx-auto flex items-center justify-center rounded-full text-[11px] transition-all cursor-pointer ${
                  !d.isCurrentMonth
                    ? 'text-neutral-300 dark:text-neutral-600'
                    : 'text-neutral-700 dark:text-neutral-200'
                } ${
                  isToday
                    ? 'bg-[#FF3B30] text-white font-bold'
                    : isSelected
                    ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white font-medium'
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {d.dayNumber}
              </button>
            );
          })}
        </div>
      </div>

      {/* Smart Filters List */}
      <div className="py-2 px-2 space-y-0.5 border-b border-black/[0.04] dark:border-white/[0.04]">
        {/* Today */}
        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            onSelectSmartList('today');
            onViewModeChange('reminders');
          }}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeSmartList === 'today'
              ? 'bg-[#007AFF] text-white font-semibold'
              : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <span className="flex items-center gap-2">
            <Clock className={`w-3.5 h-3.5 ${activeSmartList === 'today' ? 'text-white' : 'text-[#007AFF]'}`} />
            Today
          </span>
          <span className={`tabular-nums ${activeSmartList === 'today' ? 'text-white' : 'text-neutral-400'}`}>
            {todayCount}
          </span>
        </button>

        {/* Deadlines */}
        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            onSelectSmartList('deadlines');
            onViewModeChange('deadlines');
          }}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeSmartList === 'deadlines'
              ? 'bg-[#FF3B30] text-white font-semibold'
              : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <span className="flex items-center gap-2">
            <Flame className={`w-3.5 h-3.5 ${activeSmartList === 'deadlines' ? 'text-white' : 'text-[#FF3B30]'}`} />
            Deadlines
          </span>
          <span className={`tabular-nums ${activeSmartList === 'deadlines' ? 'text-white' : 'text-neutral-400'}`}>
            {deadlinesCount}
          </span>
        </button>

        {/* Flagged */}
        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            onSelectSmartList('flagged');
            onViewModeChange('reminders');
          }}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeSmartList === 'flagged'
              ? 'bg-[#FF9500] text-white font-semibold'
              : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <span className="flex items-center gap-2">
            <Flag className={`w-3.5 h-3.5 ${activeSmartList === 'flagged' ? 'text-white' : 'text-[#FF9500]'}`} />
            Flagged
          </span>
          <span className={`tabular-nums ${activeSmartList === 'flagged' ? 'text-white' : 'text-neutral-400'}`}>
            {flaggedCount}
          </span>
        </button>

        {/* All Items */}
        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            onSelectSmartList('all');
            onViewModeChange('reminders');
          }}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeSmartList === 'all'
              ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 font-semibold'
              : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <span className="flex items-center gap-2">
            <Inbox className="w-3.5 h-3.5 text-neutral-400" />
            All Active
          </span>
          <span className="tabular-nums text-neutral-400">
            {items.length}
          </span>
        </button>
      </div>

      {/* Calendars Section */}
      <div className="p-3 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Calendars
          </span>
          <button
            type="button"
            onClick={() => setIsAddingCategory(true)}
            className="p-0.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 rounded"
            title="Add Calendar"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-0.5">
          {categories.map((cat) => {
            const count = items.filter(i => i.calendarId === cat.id).length;
            return (
              <div
                key={cat.id}
                className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-xs"
              >
                <label className="flex items-center gap-2 cursor-pointer flex-1 truncate">
                  <input
                    type="checkbox"
                    checked={cat.visible}
                    onChange={() => onToggleCategory(cat.id)}
                    className="sr-only"
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 transition-opacity"
                    style={{
                      backgroundColor: cat.color,
                      opacity: cat.visible ? 1 : 0.3
                    }}
                  />
                  <span className={`truncate ${cat.visible ? 'text-neutral-800 dark:text-neutral-200' : 'text-neutral-400 line-through'}`}>
                    {cat.name}
                  </span>
                </label>
                <span className="text-[11px] tabular-nums text-neutral-400 font-normal">
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Add Calendar Form */}
        {isAddingCategory && (
          <form onSubmit={handleCreateCategory} className="mt-2 p-2.5 bg-white dark:bg-[#202022] rounded-xl border border-black/10 dark:border-white/10 text-xs shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">New Calendar</span>
              <button
                type="button"
                onClick={() => setIsAddingCategory(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Calendar name..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full px-2 py-1 bg-black/5 dark:bg-white/5 rounded border border-transparent focus:border-[#007AFF] text-xs text-neutral-900 dark:text-white outline-none mb-2"
              autoFocus
            />
            <div className="flex items-center gap-1.5 mb-2.5">
              {APPLE_PALETTE.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setNewCatColor(c)}
                  className={`w-3.5 h-3.5 rounded-full transition-transform ${newCatColor === c ? 'scale-125 ring-2 ring-offset-1 ring-[#007AFF]' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsAddingCategory(false)}
                className="px-2 py-0.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newCatName.trim()}
                className="px-2.5 py-0.5 bg-[#007AFF] text-white rounded font-medium disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Database status footer */}
      <div className="p-2.5 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-[10px] text-neutral-400 px-3">
        <span className="flex items-center gap-1.5">
          <Database className="w-3 h-3 text-[#34C759]" /> Local Database
        </span>
        <span className="tabular-nums">{items.length} records</span>
      </div>
    </aside>
  );
};
