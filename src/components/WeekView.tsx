import React, { useEffect, useRef } from 'react';
import { CalendarCategory, CalendarItem } from '../types/calendar';
import { 
  getWeekDays, 
  formatTime12h, 
  padZero, 
  getTodayString,
  isSameDay 
} from '../utils/dateUtils';
import { sounds } from '../utils/audio';
import { Check, Flame } from 'lucide-react';

interface WeekViewProps {
  currentDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  items: CalendarItem[];
  categories: CalendarCategory[];
  onSelectItem: (item: CalendarItem) => void;
  onToggleComplete: (itemId: string) => void;
  onCreateAtTime: (dateStr: string, timeStr: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  selectedDate,
  onSelectDate,
  items,
  categories,
  onSelectItem,
  onToggleComplete,
  onCreateAtTime
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const weekDays = getWeekDays(currentDate);

  const categoryMap = new Map<string, CalendarCategory>(categories.map(c => [c.id, c]));
  const visibleCategoryIds = new Set(categories.filter(c => c.visible).map(c => c.id));
  const visibleItems = items.filter(item => visibleCategoryIds.has(item.calendarId));

  // Auto-scroll to 8:00 AM on initial mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 8 * 56; // 56px per hour
    }
  }, []);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#18181a] overflow-hidden select-none">
      {/* Week Header Row */}
      <div className="flex border-b border-black/[0.04] dark:border-white/[0.04] bg-[#fafafc] dark:bg-[#1c1c1e]">
        <div className="w-14 shrink-0" />

        {/* 7 Day Headers */}
        <div className="flex-1 grid grid-cols-7 divide-x divide-black/[0.04] dark:divide-white/[0.04]">
          {weekDays.map((day) => {
            const isToday = day.isToday;
            const isSelected = isSameDay(day.date, selectedDate);

            return (
              <div
                key={day.dateStr}
                onClick={() => onSelectDate(day.date)}
                className={`py-2 text-center cursor-pointer transition-colors ${
                  isSelected ? 'bg-[#007AFF]/[0.03]' : ''
                }`}
              >
                <div className="text-[11px] font-semibold uppercase text-neutral-400">
                  {day.date.toLocaleDateString(undefined, { weekday: 'short' })}
                </div>
                <div
                  className={`inline-flex items-center justify-center w-7 h-7 mt-0.5 rounded-full text-xs font-semibold tabular-nums ${
                    isToday
                      ? 'bg-[#FF3B30] text-white font-bold'
                      : isSelected
                      ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white'
                      : 'text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  {day.dayNumber}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hourly Timeline */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto flex relative"
      >
        {/* Time Gutter */}
        <div className="w-14 shrink-0 border-r border-black/[0.04] dark:border-white/[0.04] select-none">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-[56px] text-[10px] text-neutral-400 text-right pr-2 -translate-y-2 tabular-nums"
            >
              {hour === 0 ? '' : formatTime12h(`${padZero(hour)}:00`)}
            </div>
          ))}
        </div>

        {/* 7 Columns */}
        <div className="flex-1 grid grid-cols-7 divide-x divide-black/[0.04] dark:divide-white/[0.04] relative">
          {weekDays.map((day) => {
            const dayItems = visibleItems.filter(i => i.date === day.dateStr && !i.isAllDay);
            const isToday = day.isToday;

            return (
              <div
                key={day.dateStr}
                className="relative h-[1344px]"
              >
                {/* 24 Hour Slots */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    onClick={() => onCreateAtTime(day.dateStr, `${padZero(hour)}:00`)}
                    className="h-[56px] border-b border-black/[0.03] dark:border-white/[0.03] hover:bg-[#007AFF]/[0.02] cursor-pointer"
                  />
                ))}

                {/* Current Time Indicator */}
                {isToday && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                    style={{ top: `${(currentMinutes / 60) * 56}px` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-[#FF3B30] -ml-1" />
                    <div className="flex-1 h-[1.5px] bg-[#FF3B30]" />
                  </div>
                )}

                {/* Event Cards */}
                {dayItems.map((item) => {
                  let startMinutes = 9 * 60;
                  if (item.startTime) {
                    const [h, m] = item.startTime.split(':').map(Number);
                    startMinutes = h * 60 + m;
                  }

                  let durationMinutes = 60;
                  if (item.endTime && item.startTime) {
                    const [eh, em] = item.endTime.split(':').map(Number);
                    const [sh, sm] = item.startTime.split(':').map(Number);
                    const diff = (eh * 60 + em) - (sh * 60 + sm);
                    if (diff > 0) durationMinutes = diff;
                  }

                  const topPx = (startMinutes / 60) * 56;
                  const heightPx = Math.max((durationMinutes / 60) * 56, 32);
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
                      className={`absolute left-1 right-1 rounded-lg p-1.5 z-10 cursor-pointer overflow-hidden transition-colors ${
                        item.completed
                          ? 'opacity-40 line-through bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                          : isDeadline
                          ? 'bg-[#FF3B30]/15 text-[#FF3B30] dark:text-[#FF453A]'
                          : 'bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-neutral-800 dark:text-neutral-200'
                      }`}
                      style={{
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                        borderLeft: `3px solid ${catColor}`
                      }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-medium truncate">
                          {item.title}
                        </span>
                        {isDeadline && (
                          <Flame className="w-3 h-3 text-[#FF3B30] shrink-0" />
                        )}
                      </div>

                      {heightPx >= 44 && (
                        <div className="text-[10px] text-neutral-400 tabular-nums">
                          {formatTime12h(item.startTime)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
