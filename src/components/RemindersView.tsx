import React, { useState } from 'react';
import { CalendarCategory, CalendarItem, SmartListType } from '../types/calendar';
import { 
  getTodayString, 
  formatTime12h, 
  calculateDeadline, 
  MONTH_NAMES_SHORT 
} from '../utils/dateUtils';
import { sounds } from '../utils/audio';
import { 
  Check, 
  Plus, 
  Flag, 
  Calendar as CalendarIcon
} from 'lucide-react';

interface RemindersViewProps {
  items: CalendarItem[];
  categories: CalendarCategory[];
  activeSmartList: SmartListType | null;
  selectedCategoryId: string | null;
  onSelectItem: (item: CalendarItem) => void;
  onToggleComplete: (itemId: string) => void;
  onToggleSubtask: (itemId: string, subtaskId: string) => void;
  onQuickAddTask: (title: string, dateStr?: string, categoryId?: string) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  items,
  categories,
  activeSmartList,
  selectedCategoryId,
  onSelectItem,
  onToggleComplete,
  onToggleSubtask,
  onQuickAddTask
}) => {
  const [newTaskInput, setNewTaskInput] = useState('');
  const todayStr = getTodayString();

  const categoryMap = new Map<string, CalendarCategory>(categories.map(c => [c.id, c]));
  const visibleCategoryIds = new Set(categories.filter(c => c.visible).map(c => c.id));

  let filteredItems = items.filter(i => visibleCategoryIds.has(i.calendarId));
  let headerTitle = 'All Tasks';
  let headerColor = '#007AFF';

  if (activeSmartList === 'today') {
    filteredItems = filteredItems.filter(i => i.date === todayStr);
    headerTitle = 'Today';
    headerColor = '#007AFF';
  } else if (activeSmartList === 'scheduled') {
    filteredItems = filteredItems.filter(i => i.date >= todayStr);
    headerTitle = 'Scheduled';
    headerColor = '#FF3B30';
  } else if (activeSmartList === 'deadlines') {
    filteredItems = filteredItems.filter(i => i.type === 'deadline' || i.priority === 'high');
    headerTitle = 'Deadlines';
    headerColor = '#FF9500';
  } else if (activeSmartList === 'flagged') {
    filteredItems = filteredItems.filter(i => i.isFlagged);
    headerTitle = 'Flagged';
    headerColor = '#5856D6';
  } else if (selectedCategoryId) {
    const cat = categoryMap.get(selectedCategoryId);
    filteredItems = filteredItems.filter(i => i.calendarId === selectedCategoryId);
    headerTitle = cat?.name || 'Tasks';
    headerColor = cat?.color || '#007AFF';
  }

  const handleInlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    sounds.playTap();
    onQuickAddTask(
      newTaskInput.trim(),
      activeSmartList === 'today' ? todayStr : undefined,
      selectedCategoryId || undefined
    );
    setNewTaskInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#18181a] overflow-hidden select-none">
      {/* Header */}
      <div className="px-6 py-4 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white" style={{ color: headerColor }}>
            {headerTitle}
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {filteredItems.length} {filteredItems.length === 1 ? 'task' : 'tasks'}
          </p>
        </div>

        <span className="text-2xl font-light tabular-nums" style={{ color: headerColor }}>
          {filteredItems.length}
        </span>
      </div>

      {/* Task Rows List */}
      <div className="flex-1 overflow-y-auto px-6 py-3 space-y-0.5 max-w-3xl w-full mx-auto">
        {filteredItems.length === 0 ? (
          <div className="py-24 text-center text-neutral-400">
            <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-medium">No tasks in this list</p>
            <p className="text-[11px] text-neutral-400 mt-1">Type below to add a new task.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const cat = categoryMap.get(item.calendarId);
            const deadline = calculateDeadline(item.date, item.startTime, false);
            const [y, m, d] = item.date.split('-').map(Number);
            const itemDate = new Date(y, m - 1, d);
            const formattedDate = `${MONTH_NAMES_SHORT[itemDate.getMonth()]} ${itemDate.getDate()}`;
            const hasSubtasks = item.subtasks && item.subtasks.length > 0;

            return (
              <div
                key={item.id}
                onClick={() => {
                  sounds.playTap();
                  onSelectItem(item);
                }}
                className="group flex flex-col py-2 px-3 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors cursor-pointer border border-transparent hover:border-black/[0.04] dark:hover:border-white/[0.04]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Checkbox - clicking marks done and removes */}
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
                        {item.isFlagged && (
                          <Flag className="w-3 h-3 text-[#FF9500] fill-[#FF9500] shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Date & Deadline */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.type === 'deadline' && (
                      <span className="text-[11px] font-semibold text-[#FF3B30] dark:text-[#FF453A]">
                        {deadline.relativeText}
                      </span>
                    )}
                    <span className="text-[11px] text-neutral-400 tabular-nums">
                      {formattedDate} {item.startTime && `· ${formatTime12h(item.startTime)}`}
                    </span>
                  </div>
                </div>

                {/* Subtasks snippet */}
                {hasSubtasks && (
                  <div className="mt-1 pl-8 space-y-1">
                    {item.subtasks.map((st) => (
                      <div
                        key={st.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          sounds.playTap();
                          onToggleSubtask(item.id, st.id);
                        }}
                        className="flex items-center gap-2 text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                      >
                        <span className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${st.completed ? 'bg-[#34C759] border-[#34C759] text-white' : 'border-neutral-300 dark:border-neutral-600'}`}>
                          {st.completed && <Check className="w-2 h-2 stroke-3" />}
                        </span>
                        <span className={`truncate ${st.completed ? 'line-through text-neutral-400' : ''}`}>
                          {st.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Inline Fast Add */}
        <form onSubmit={handleInlineSubmit} className="pt-2">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-[#007AFF] transition-colors">
            <Plus className="w-4 h-4 text-[#007AFF] shrink-0" />
            <input
              type="text"
              placeholder="Add a new task... (press Return)"
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-xs text-neutral-900 dark:text-white placeholder-neutral-400"
            />
          </div>
        </form>
      </div>
    </div>
  );
};
