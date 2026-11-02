import React from 'react';
import { CalendarCategory, CalendarItem } from '../types/calendar';
import { 
  calculateDeadline, 
  formatTime12h, 
  MONTH_NAMES_SHORT 
} from '../utils/dateUtils';
import { sounds } from '../utils/audio';
import { 
  Flame, 
  Check, 
  Plus,
  Calendar as CalendarIcon
} from 'lucide-react';

interface DeadlinesViewProps {
  items: CalendarItem[];
  categories: CalendarCategory[];
  onSelectItem: (item: CalendarItem) => void;
  onToggleComplete: (itemId: string) => void;
  onToggleSubtask: (itemId: string, subtaskId: string) => void;
  onReschedule: (itemId: string, newDateStr: string) => void;
  onQuickAddDeadline: () => void;
}

export const DeadlinesView: React.FC<DeadlinesViewProps> = ({
  items,
  categories,
  onSelectItem,
  onToggleComplete,
  onQuickAddDeadline
}) => {
  const categoryMap = new Map<string, CalendarCategory>(categories.map(c => [c.id, c]));
  const visibleCategoryIds = new Set(categories.filter(c => c.visible).map(c => c.id));

  // Only deadline or high-priority items
  const deadlineCandidates = items.filter(
    i => (i.type === 'deadline' || i.priority === 'high') && visibleCategoryIds.has(i.calendarId)
  );

  // Group by urgency
  const overdue: CalendarItem[] = [];
  const dueToday: CalendarItem[] = [];
  const upcoming: CalendarItem[] = [];

  deadlineCandidates.forEach(item => {
    const info = calculateDeadline(item.date, item.startTime, false);
    if (info.status === 'overdue') overdue.push(item);
    else if (info.status === 'today') dueToday.push(item);
    else upcoming.push(item);
  });

  const renderItemRow = (item: CalendarItem) => {
    const cat = categoryMap.get(item.calendarId);
    const deadline = calculateDeadline(item.date, item.startTime, false);
    const [y, m, d] = item.date.split('-').map(Number);
    const itemDate = new Date(y, m - 1, d);
    const formattedDate = `${MONTH_NAMES_SHORT[itemDate.getMonth()]} ${itemDate.getDate()}`;
    const totalSub = item.subtasks?.length || 0;
    const completedSub = item.subtasks?.filter(s => s.completed).length || 0;

    return (
      <div
        key={item.id}
        onClick={() => {
          sounds.playTap();
          onSelectItem(item);
        }}
        className="group flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors cursor-pointer border border-transparent hover:border-black/[0.04] dark:hover:border-white/[0.04]"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Checkbox - clicking completes and removes the task */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(item.id);
            }}
            title="Mark as done and remove"
            className="w-5 h-5 rounded-full border-2 border-neutral-300 dark:border-neutral-600 hover:border-[#34C759] hover:bg-[#34C759]/10 flex items-center justify-center shrink-0 transition-all cursor-pointer group/check"
          >
            <Check className="w-3 h-3 text-[#34C759] opacity-0 group-hover/check:opacity-100 transition-opacity stroke-3" />
          </button>

          {/* Title & Category */}
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cat?.color || '#007AFF' }}
              />
              <span className="text-xs font-medium text-neutral-900 dark:text-white truncate">
                {item.title}
              </span>
              {item.priority === 'high' && (
                <span className="text-[#FF3B30] text-[10px] font-bold shrink-0">!!!</span>
              )}
            </div>

            {totalSub > 0 && (
              <span className="text-[11px] text-neutral-400 pl-4 block mt-0.5">
                {completedSub} of {totalSub} subtasks
              </span>
            )}
          </div>
        </div>

        {/* Urgency & Date */}
        <div className="flex items-center gap-2.5 shrink-0 ml-3">
          <span className={`text-[11px] font-semibold tabular-nums ${
            deadline.status === 'overdue'
              ? 'text-[#FF3B30] dark:text-[#FF453A]'
              : deadline.status === 'today'
              ? 'text-[#FF9500] dark:text-[#FF9F0A]'
              : 'text-neutral-400'
          }`}>
            {deadline.relativeText}
          </span>

          <span className="text-[11px] text-neutral-400 tabular-nums">
            {formattedDate} {item.startTime && `· ${formatTime12h(item.startTime)}`}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#18181a] overflow-hidden select-none">
      {/* Header Bar */}
      <div className="p-4 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#FF3B30]" />
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Deadlines ({deadlineCandidates.length})
          </h2>
        </div>

        <button
          type="button"
          onClick={onQuickAddDeadline}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#FF3B30] hover:bg-[#E0342A] text-white text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Add Deadline</span>
        </button>
      </div>

      {/* Deadlines List */}
      <div className="flex-1 overflow-y-auto p-4 max-w-3xl w-full mx-auto space-y-5">
        {/* Overdue */}
        {overdue.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-[#FF3B30] uppercase tracking-wider mb-1 px-3">
              Overdue ({overdue.length})
            </div>
            <div className="space-y-0.5">
              {overdue.map(renderItemRow)}
            </div>
          </div>
        )}

        {/* Due Today */}
        {dueToday.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-[#FF9500] uppercase tracking-wider mb-1 px-3">
              Due Today ({dueToday.length})
            </div>
            <div className="space-y-0.5">
              {dueToday.map(renderItemRow)}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 px-3">
              Upcoming ({upcoming.length})
            </div>
            <div className="space-y-0.5">
              {upcoming.map(renderItemRow)}
            </div>
          </div>
        )}

        {/* Empty state */}
        {deadlineCandidates.length === 0 && (
          <div className="py-24 text-center text-neutral-400">
            <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              No active deadlines
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Click &quot;Add Deadline&quot; above to track upcoming deliverables.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
