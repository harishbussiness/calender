import React, { useState, useEffect } from 'react';
import { CalendarCategory, CalendarItem, ItemType, PriorityLevel } from '../types/calendar';
import { getTodayString, parseQuickEntry } from '../utils/dateUtils';
import { sounds } from '../utils/audio';
import { X, Sparkles, Calendar as CalendarIcon, Clock, Flame, Check } from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CalendarCategory[];
  defaultDate?: string;
  defaultTime?: string;
  defaultType?: ItemType;
  onAddItem: (item: Omit<CalendarItem, 'id' | 'createdAt'>) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  categories,
  defaultDate,
  defaultTime,
  defaultType = 'task',
  onAddItem
}) => {
  if (!isOpen) return null;

  const [inputMode, setInputMode] = useState<'smart' | 'manual'>('smart');
  const [naturalText, setNaturalText] = useState('');
  
  // Manual form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ItemType>(defaultType);
  const [date, setDate] = useState(defaultDate || getTodayString());
  const [startTime, setStartTime] = useState(defaultTime || '09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [calendarId, setCalendarId] = useState(categories[0]?.id || 'cat-work');
  const [priority, setPriority] = useState<PriorityLevel>('none');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (defaultDate) setDate(defaultDate);
    if (defaultTime) setStartTime(defaultTime);
    if (defaultType) setType(defaultType);
  }, [defaultDate, defaultTime, defaultType, isOpen]);

  const handleSmartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalText.trim()) return;

    sounds.playTap();
    const parsed = parseQuickEntry(naturalText.trim());

    onAddItem({
      title: parsed.title || 'Untitled Action',
      type: parsed.type || defaultType,
      date: parsed.date || date || getTodayString(),
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      isAllDay: !parsed.startTime,
      completed: false,
      priority: parsed.priority || 'none',
      calendarId: calendarId,
      notes: '',
      subtasks: []
    });

    setNaturalText('');
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    sounds.playTap();
    onAddItem({
      title: title.trim(),
      type,
      date,
      startTime: isAllDay ? undefined : startTime,
      endTime: isAllDay ? undefined : endTime,
      isAllDay,
      completed: false,
      priority,
      calendarId,
      notes,
      subtasks: []
    });

    setTitle('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg apple-glass bg-white dark:bg-[#202022] rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-black/5 dark:bg-white/10 p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setInputMode('smart')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  inputMode === 'smart'
                    ? 'bg-white dark:bg-[#2c2c2e] text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#007AFF]" />
                Natural Language
              </button>
              <button
                type="button"
                onClick={() => setInputMode('manual')}
                className={`px-3 py-1 rounded-md transition-all ${
                  inputMode === 'manual'
                    ? 'bg-white dark:bg-[#2c2c2e] text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Custom Details
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Smart Mode Content */}
        {inputMode === 'smart' ? (
          <form onSubmit={handleSmartSubmit} className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-300 block mb-1.5">
                Type in natural speech:
              </label>
              <input
                type="text"
                value={naturalText}
                onChange={(e) => setNaturalText(e.target.value)}
                placeholder="e.g. Design critique tomorrow at 2pm !high"
                className="w-full px-4 py-3 bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-2xl text-sm text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:ring-2 focus:ring-[#007AFF]"
                autoFocus
              />
              <p className="text-[11px] text-neutral-400 mt-2">
                Tip: Type keywords like <span className="font-semibold text-neutral-600 dark:text-neutral-300">"tomorrow"</span>, <span className="font-semibold text-neutral-600 dark:text-neutral-300">"at 3pm"</span>, <span className="font-semibold text-neutral-600 dark:text-neutral-300">"!high"</span>, or <span className="font-semibold text-neutral-600 dark:text-neutral-300">"deadline"</span> to auto-configure.
              </p>
            </div>

            {/* Calendar category picker for smart mode */}
            <div className="flex items-center justify-between pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
              <span className="text-xs text-neutral-500">Save to Calendar:</span>
              <select
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                className="px-2.5 py-1 bg-black/5 dark:bg-white/10 rounded-lg text-xs font-medium text-neutral-800 dark:text-neutral-200 border-none outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="text-black dark:text-white bg-white dark:bg-[#202022]">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!naturalText.trim()}
                className="px-5 py-2 bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-40"
              >
                Add Item
              </button>
            </div>
          </form>
        ) : (
          /* Manual Details Form */
          <form onSubmit={handleManualSubmit} className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-300 block mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Item Title"
                className="w-full px-3 py-2 bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-xl text-xs text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-[#007AFF]"
                autoFocus
              />
            </div>

            {/* Type & Priority Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ItemType)}
                  className="w-full px-2.5 py-1.5 bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-lg text-xs font-medium text-neutral-800 dark:text-neutral-200 outline-none"
                >
                  <option value="task">Task / Reminder</option>
                  <option value="event">Calendar Event</option>
                  <option value="deadline">Critical Deadline</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="w-full px-2.5 py-1.5 bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-lg text-xs font-medium text-neutral-800 dark:text-neutral-200 outline-none"
                >
                  <option value="none">None</option>
                  <option value="low">Low (!)</option>
                  <option value="medium">Medium (!!)</option>
                  <option value="high">High (!!!)</option>
                </select>
              </div>
            </div>

            {/* Date and Time Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-lg text-xs font-medium text-neutral-800 dark:text-neutral-200 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Calendar</label>
                <select
                  value={calendarId}
                  onChange={(e) => setCalendarId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-lg text-xs font-medium text-neutral-800 dark:text-neutral-200 outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="text-black dark:text-white bg-white dark:bg-[#202022]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Time toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-600 dark:text-neutral-400">All-Day</span>
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="rounded text-[#007AFF]"
              />
            </div>

            {!isAllDay && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-lg text-xs text-neutral-800 dark:text-neutral-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-lg text-xs text-neutral-800 dark:text-neutral-200 outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes or details..."
                className="w-full px-2.5 py-1.5 bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-lg text-xs text-neutral-800 dark:text-neutral-200 outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-5 py-2 bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
