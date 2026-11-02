import React, { useState, useEffect, useRef } from 'react';
import { CalendarCategory, CalendarItem } from '../types/calendar';
import { 
  toDateString, 
  formatTime12h, 
  padZero, 
  getTodayString, 
  calculateDeadline 
} from '../utils/dateUtils';
import { sounds } from '../utils/audio';
import { 
  Check, 
  Flame, 
  Clock, 
  MapPin, 
  Plus, 
  Calendar as CalendarIcon
} from 'lucide-react';

interface DayViewProps {
  selectedDate: Date;
  items: CalendarItem[];
  categories: CalendarCategory[];
  onSelectItem: (item: CalendarItem) => void;
  onToggleComplete: (itemId: string) => void;
  onQuickAddTask: (title: string, dateStr: string) => void;
  onCreateAtTime: (dateStr: string, timeStr: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const DayView: React.FC<DayViewProps> = ({
  selectedDate,
  items,
  categories,
  onSelectItem,
  onToggleComplete,
  onQuickAddTask,
  onCreateAtTime
}) => {
  const [inlineTaskText, setInlineTaskText] = useState('');
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  const selectedDateStr = toDateString(selectedDate);
  const isToday = selectedDateStr === getTodayString();

  const categoryMap = new Map<string, CalendarCategory>(categories.map(c => [c.id, c]));
  const visibleCategoryIds = new Set(categories.filter(c => c.visible).map(c => c.id));

  const dayItems = items.filter(
    i => i.date === selectedDateStr && visibleCategoryIds.has(i.calendarId)
  );

  const timedEvents = dayItems.filter(i => !i.isAllDay && i.startTime);
  const tasksAndDeadlines = dayItems.filter(i => i.type === 'task' || i.type === 'deadline');

  useEffect(() => {
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollTop = 8 * 56;
    }
  }, [selectedDateStr]);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const handleInlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTaskText.trim()) return;
    onQuickAddTask(inlineTaskText.trim(), selectedDateStr);
    setInlineTaskText('');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-white dark:bg-[#18181a] overflow-hidden select-none">
      {/* Left: Schedule Timeline */}
      <div className="flex-1 flex flex-col border-r border-black/[0.04] dark:border-white/[0.04] overflow-hidden">
        <div className="p-3 border-b border-black/[0.04] dark:border-white/[0.04] bg-[#fafafc] dark:bg-[#1c1c1e] flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Timeline
          </span>
          <span className="text-xs text-neutral-400">
            {timedEvents.length} events
          </span>
        </div>

        <div ref={timelineScrollRef} className="flex-1 overflow-y-auto flex relative">
          <div className="w-14 shrink-0 border-r border-black/[0.04] dark:border-white/[0.04]">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-[56px] text-[10px] text-neutral-400 text-right pr-2 -translate-y-2 tabular-nums"
              >
                {hour === 0 ? '' : formatTime12h(`${padZero(hour)}:00`)}
              </div>
            ))}
          </div>

          <div className="flex-1 relative h-[1344px]">
            {HOURS.map((hour) => (
              <div
                key={hour}
                onClick={() => onCreateAtTime(selectedDateStr, `${padZero(hour)}:00`)}
                className="h-[56px] border-b border-black/[0.03] dark:border-white/[0.03] hover:bg-[#007AFF]/[0.02] cursor-pointer"
              />
            ))}

            {isToday && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                style={{ top: `${(currentMinutes / 60) * 56}px` }}
              >
                <div className="w-2 h-2 rounded-full bg-[#FF3B30] -ml-1" />
                <div className="flex-1 h-[1.5px] bg-[#FF3B30]" />
              </div>
            )}

            {timedEvents.map((item) => {
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
              const heightPx = Math.max((durationMinutes / 60) * 56, 36);
              const cat = categoryMap.get(item.calendarId);
              const catColor = cat?.color || '#007AFF';

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    sounds.playTap();
                    onSelectItem(item);
                  }}
                  className="absolute left-3 right-4 rounded-xl p-2.5 z-10 cursor-pointer border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#202022] shadow-xs hover:border-[#007AFF]/30"
                  style={{
                    top: `${topPx}px`,
                    height: `${heightPx}px`,
                    borderLeftWidth: '3.5px',
                    borderLeftColor: catColor
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-neutral-400 tabular-nums shrink-0 ml-2">
                      {formatTime12h(item.startTime)}
                    </span>
                  </div>

                  {item.location && heightPx >= 50 && (
                    <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Day's Tasks */}
      <div className="w-full md:w-80 flex flex-col bg-[#fbfbfd] dark:bg-[#161618] overflow-hidden select-none">
        <div className="p-4 border-b border-black/[0.04] dark:border-white/[0.04] bg-white dark:bg-[#18181a]">
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            {selectedDate.toLocaleDateString(undefined, { weekday: 'long' })}
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex-1 p-3 overflow-y-auto space-y-1">
          {tasksAndDeadlines.length === 0 ? (
            <div className="py-16 text-center text-neutral-400">
              <CalendarIcon className="w-8 h-8 mx-auto mb-1.5 opacity-30" />
              <p className="text-xs font-medium">No actions for today</p>
            </div>
          ) : (
            tasksAndDeadlines.map((item) => {
              const cat = categoryMap.get(item.calendarId);
              const deadline = calculateDeadline(item.date, item.startTime, item.completed);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    sounds.playTap();
                    onSelectItem(item);
                  }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playTap();
                        onToggleComplete(item.id);
                      }}
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        item.completed ? 'bg-[#34C759] border-[#34C759] text-white' : 'border-neutral-300 dark:border-neutral-600'
                      }`}
                    >
                      {item.completed && <Check className="w-2.5 h-2.5 stroke-3" />}
                    </button>
                    <span className={`truncate font-medium ${item.completed ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                      {item.title}
                    </span>
                  </div>

                  {item.type === 'deadline' && (
                    <span className="text-[10px] font-semibold text-[#FF3B30] shrink-0 ml-2">
                      {deadline.relativeText}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Inline Add Task */}
        <form onSubmit={handleInlineSubmit} className="p-3 border-t border-black/[0.04] dark:border-white/[0.04] bg-white dark:bg-[#18181a]">
          <div className="flex items-center gap-2 bg-black/[0.03] dark:bg-white/[0.05] rounded-lg px-2.5 py-1.5">
            <Plus className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <input
              type="text"
              placeholder="Add action..."
              value={inlineTaskText}
              onChange={(e) => setInlineTaskText(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 w-full"
            />
          </div>
        </form>
      </div>
    </div>
  );
};
