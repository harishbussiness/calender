import React, { useState } from 'react';
import { 
  CalendarItem, 
  CalendarCategory 
} from '../types/calendar';
import { 
  DayInfo, 
  DAY_NAMES_SHORT, 
  getMonthMatrix, 
  formatTime12h, 
  isSameDay 
} from '../utils/dateUtils';
import { sounds } from '../utils/audio';
import { Flame, Check, X } from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  items: CalendarItem[];
  categories: CalendarCategory[];
  onSelectItem: (item: CalendarItem) => void;
  onToggleComplete: (itemId: string) => void;
  onDoubleClickDay: (dateStr: string) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  selectedDate,
  onSelectDate,
  items,
  categories,
  onSelectItem,
  onToggleComplete,
  onDoubleClickDay
}) => {
  const [overflowDay, setOverflowDay] = useState<{ day: DayInfo; items: CalendarItem[] } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getMonthMatrix(year, month);

  const categoryMap = new Map<string, CalendarCategory>(categories.map(c => [c.id, c]));
  const visibleCategoryIds = new Set(categories.filter(c => c.visible).map(c => c.id));
  const visibleItems = items.filter(item => visibleCategoryIds.has(item.calendarId));

  const itemsByDate = new Map<string, CalendarItem[]>();
  visibleItems.forEach(item => {
    const list = itemsByDate.get(item.date) || [];
    list.push(item);
    itemsByDate.set(item.date, list);
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#18181a] overflow-hidden select-none">
      {/* Day Headers (Sun - Sat) */}
      <div className="grid grid-cols-7 border-b border-black/[0.04] dark:border-white/[0.04] bg-[#fafafc] dark:bg-[#1c1c1e]">
        {DAY_NAMES_SHORT.map((dayName, idx) => {
          const isWeekend = idx === 0 || idx === 6;
          return (
            <div
              key={dayName}
              className={`py-1.5 text-center text-[11px] font-semibold tracking-wider uppercase ${
                isWeekend ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {dayName}
            </div>
          );
        })}
      </div>

      {/* 7-column Calendar Matrix */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 md:grid-rows-6 divide-x divide-y divide-black/[0.04] dark:divide-white/[0.04] border-b border-black/[0.04] dark:border-white/[0.04] overflow-y-auto">
        {days.map((day) => {
          const dayItems = itemsByDate.get(day.dateStr) || [];
          const isSelected = isSameDay(day.date, selectedDate);
          const maxVisible = 3;
          const hasOverflow = dayItems.length > maxVisible;
          const displayItems = hasOverflow ? dayItems.slice(0, maxVisible) : dayItems;

          return (
            <div
              key={day.dateStr}
              onClick={() => onSelectDate(day.date)}
              onDoubleClick={() => onDoubleClickDay(day.dateStr)}
              className={`min-h-[88px] p-1.5 flex flex-col transition-colors group cursor-pointer ${
                !day.isCurrentMonth
                  ? 'bg-black/[0.015] dark:bg-white/[0.01]'
                  : 'bg-white dark:bg-[#18181a]'
              } ${isSelected ? 'bg-[#007AFF]/[0.03] dark:bg-[#007AFF]/[0.05]' : ''}`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between mb-1 px-1">
                <span
                  className={`inline-flex items-center justify-center text-xs tabular-nums ${
                    day.isToday
                      ? 'w-6 h-6 rounded-full bg-[#FF3B30] text-white font-bold'
                      : !day.isCurrentMonth
                      ? 'text-neutral-300 dark:text-neutral-600 font-normal'
                      : 'text-neutral-700 dark:text-neutral-300 font-medium'
                  }`}
                >
                  {day.dayNumber}
                </span>

                {dayItems.some(i => i.type === 'deadline' && !i.completed) && (
                  <Flame className="w-3 h-3 text-[#FF3B30]" />
                )}
              </div>

              {/* Day Items List */}
              <div className="flex-1 space-y-1 overflow-hidden">
                {displayItems.map((item) => {
                  const cat = categoryMap.get(item.calendarId);
                  const catColor = cat?.color || '#007AFF';
                  const isDeadline = item.type === 'deadline';

                  return (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playTap();
                        onSelectItem(item);
                      }}
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] leading-tight truncate transition-colors cursor-pointer ${
                        item.completed
                          ? 'opacity-40 line-through text-neutral-400 bg-neutral-100 dark:bg-neutral-800/40'
                          : isDeadline
                          ? 'bg-[#FF3B30]/10 text-[#FF3B30] dark:text-[#FF453A] font-medium'
                          : 'bg-black/[0.03] dark:bg-white/[0.05] text-neutral-800 dark:text-neutral-200 hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                      }`}
                      style={{
                        borderLeft: `2.5px solid ${catColor}`
                      }}
                    >
                      {item.startTime && !item.isAllDay && (
                        <span className="text-[10px] text-neutral-400 tabular-nums shrink-0">
                          {formatTime12h(item.startTime).replace(' ', '')}
                        </span>
                      )}
                      <span className="truncate">{item.title}</span>
                    </div>
                  );
                })}

                {/* Overflow Link */}
                {hasOverflow && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOverflowDay({ day, items: dayItems });
                    }}
                    className="text-[10px] font-medium text-neutral-400 hover:text-[#007AFF] px-1 py-0.5 rounded transition-colors w-full text-left cursor-pointer"
                  >
                    +{dayItems.length - maxVisible} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overflow Modal */}
      {overflowDay && (
        <div 
          className="fixed inset-0 bg-black/25 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setOverflowDay(null)}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-[#202022] rounded-2xl border border-black/10 dark:border-white/10 shadow-xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.06] dark:border-white/[0.06] mb-2.5">
              <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">
                {overflowDay.day.date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </h4>
              <button
                type="button"
                onClick={() => setOverflowDay(null)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 max-h-64 overflow-y-auto">
              {overflowDay.items.map((item) => {
                const cat = categoryMap.get(item.calendarId);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      sounds.playTap();
                      onSelectItem(item);
                      setOverflowDay(null);
                    }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat?.color || '#007AFF' }}
                      />
                      <span className={`truncate ${item.completed ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                        {item.title}
                      </span>
                    </div>

                    {item.startTime && (
                      <span className="text-[11px] tabular-nums text-neutral-400 ml-2 shrink-0">
                        {formatTime12h(item.startTime)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
