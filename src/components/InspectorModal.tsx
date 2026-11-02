import React, { useState, useEffect } from 'react';
import { CalendarCategory, CalendarItem, ItemType, PriorityLevel, SubTask } from '../types/calendar';
import { sounds } from '../utils/audio';
import { 
  X, 
  Trash2, 
  Calendar as CalendarIcon, 
  Flag, 
  MapPin, 
  Link, 
  FileText, 
  ListTree, 
  Plus, 
  Check, 
  ExternalLink
} from 'lucide-react';

interface InspectorModalProps {
  item: CalendarItem | null;
  categories: CalendarCategory[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateItem: (updated: CalendarItem) => void;
  onDeleteItem: (itemId: string) => void;
  onCompleteItem: (itemId: string) => void;
}

export const InspectorModal: React.FC<InspectorModalProps> = ({
  item,
  categories,
  isOpen,
  onClose,
  onUpdateItem,
  onDeleteItem,
  onCompleteItem
}) => {
  if (!isOpen || !item) return null;

  const [title, setTitle] = useState(item.title);
  const [type, setType] = useState<ItemType>(item.type);
  const [date, setDate] = useState(item.date);
  const [startTime, setStartTime] = useState(item.startTime || '09:00');
  const [endTime, setEndTime] = useState(item.endTime || '10:00');
  const [isAllDay, setIsAllDay] = useState(!!item.isAllDay);
  const [calendarId, setCalendarId] = useState(item.calendarId);
  const [priority, setPriority] = useState<PriorityLevel>(item.priority);
  const [isFlagged, setIsFlagged] = useState(!!item.isFlagged);
  const [location, setLocation] = useState(item.location || '');
  const [url, setUrl] = useState(item.url || '');
  const [notes, setNotes] = useState(item.notes || '');
  const [subtasks, setSubtasks] = useState<SubTask[]>(item.subtasks || []);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  useEffect(() => {
    setTitle(item.title);
    setType(item.type);
    setDate(item.date);
    setStartTime(item.startTime || '09:00');
    setEndTime(item.endTime || '10:00');
    setIsAllDay(!!item.isAllDay);
    setCalendarId(item.calendarId);
    setPriority(item.priority);
    setIsFlagged(!!item.isFlagged);
    setLocation(item.location || '');
    setUrl(item.url || '');
    setNotes(item.notes || '');
    setSubtasks(item.subtasks || []);
  }, [item]);

  const saveChanges = (partial?: Partial<CalendarItem>) => {
    const updated: CalendarItem = {
      ...item,
      title,
      type,
      date,
      startTime: isAllDay ? undefined : startTime,
      endTime: isAllDay ? undefined : endTime,
      isAllDay,
      calendarId,
      priority,
      isFlagged,
      location,
      url,
      notes,
      subtasks,
      ...partial
    };
    onUpdateItem(updated);
  };

  const handleMarkDoneAndRemove = () => {
    sounds.playComplete();
    onCompleteItem(item.id);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    const newSub: SubTask = {
      id: `sub-${Date.now()}`,
      text: newSubtaskText.trim(),
      completed: false
    };
    const updatedSub = [...subtasks, newSub];
    setSubtasks(updatedSub);
    setNewSubtaskText('');
    saveChanges({ subtasks: updatedSub });
  };

  const handleToggleSubtask = (subId: string) => {
    sounds.playTap();
    const updated = subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s);
    setSubtasks(updated);
    saveChanges({ subtasks: updated });
  };

  const handleDeleteSubtask = (subId: string) => {
    const updated = subtasks.filter(s => s.id !== subId);
    setSubtasks(updated);
    saveChanges({ subtasks: updated });
  };

  const handleDelete = () => {
    sounds.playTap();
    onDeleteItem(item.id);
    onClose();
  };

  return (
    <div 
      className="fixed inset-y-0 right-0 z-40 w-full sm:w-80 bg-white dark:bg-[#1c1c1e] border-l border-black/[0.08] dark:border-white/[0.08] shadow-2xl flex flex-col transition-all overflow-hidden"
    >
      {/* Top Header */}
      <div className="p-3 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between">
        <button
          type="button"
          onClick={handleMarkDoneAndRemove}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#34C759]/10 text-[#34C759] hover:bg-[#34C759] hover:text-white transition-colors cursor-pointer text-xs font-medium"
          title="Mark Done & Remove from Database"
        >
          <Check className="w-3.5 h-3.5 stroke-3" />
          <span>Mark Done</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              const next = !isFlagged;
              setIsFlagged(next);
              saveChanges({ isFlagged: next });
            }}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              isFlagged ? 'text-[#FF9500]' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-[#FF9500]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleDelete}
            title="Delete Item"
            className="p-1.5 rounded-md text-neutral-400 hover:text-[#FF3B30] transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => saveChanges()}
          placeholder="Title"
          className="w-full text-base font-bold text-neutral-900 dark:text-white bg-transparent outline-none py-1"
        />

        {/* Type Switcher */}
        <div className="grid grid-cols-3 gap-1 bg-black/[0.04] dark:bg-white/[0.06] p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setType('event');
              saveChanges({ type: 'event' });
            }}
            className={`py-1 rounded-md font-medium transition-all cursor-pointer ${
              type === 'event' ? 'bg-white dark:bg-[#2c2c2e] text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500'
            }`}
          >
            Event
          </button>
          <button
            type="button"
            onClick={() => {
              setType('task');
              saveChanges({ type: 'task' });
            }}
            className={`py-1 rounded-md font-medium transition-all cursor-pointer ${
              type === 'task' ? 'bg-white dark:bg-[#2c2c2e] text-[#007AFF] shadow-xs' : 'text-neutral-500'
            }`}
          >
            Task
          </button>
          <button
            type="button"
            onClick={() => {
              setType('deadline');
              saveChanges({ type: 'deadline' });
            }}
            className={`py-1 rounded-md font-medium transition-all cursor-pointer ${
              type === 'deadline' ? 'bg-white dark:bg-[#2c2c2e] text-[#FF3B30] shadow-xs' : 'text-neutral-500'
            }`}
          >
            Deadline
          </button>
        </div>

        {/* Calendar Dropdown */}
        <div>
          <label className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1">Calendar</label>
          <select
            value={calendarId}
            onChange={(e) => {
              setCalendarId(e.target.value);
              saveChanges({ calendarId: e.target.value });
            }}
            className="w-full px-2.5 py-1.5 bg-black/[0.03] dark:bg-white/[0.05] rounded-lg text-neutral-800 dark:text-neutral-200 outline-none"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="text-black dark:text-white bg-white dark:bg-[#202022]">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date and Times */}
        <div className="bg-black/[0.02] dark:bg-white/[0.03] p-2.5 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-neutral-400" /> Date
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                saveChanges({ date: e.target.value });
              }}
              className="px-2 py-0.5 bg-white dark:bg-[#2c2c2e] rounded border border-black/10 dark:border-white/10 outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-neutral-600 dark:text-neutral-400">All-Day</span>
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={(e) => {
                setIsAllDay(e.target.checked);
                saveChanges({ isAllDay: e.target.checked });
              }}
              className="rounded text-[#007AFF]"
            />
          </div>

          {!isAllDay && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-0.5">Start</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    saveChanges({ startTime: e.target.value });
                  }}
                  className="w-full px-2 py-0.5 bg-white dark:bg-[#2c2c2e] rounded border border-black/10 dark:border-white/10 outline-none tabular-nums"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 block mb-0.5">End</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    saveChanges({ endTime: e.target.value });
                  }}
                  className="w-full px-2 py-0.5 bg-white dark:bg-[#2c2c2e] rounded border border-black/10 dark:border-white/10 outline-none tabular-nums"
                />
              </div>
            </div>
          )}
        </div>

        {/* Priority */}
        <div>
          <label className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1">Priority</label>
          <div className="grid grid-cols-4 gap-1 bg-black/[0.04] dark:bg-white/[0.06] p-0.5 rounded-lg text-center">
            {(['none', 'low', 'medium', 'high'] as PriorityLevel[]).map((p) => {
              const label = p === 'none' ? 'None' : p === 'low' ? '!' : p === 'medium' ? '!!' : '!!!';
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPriority(p);
                    saveChanges({ priority: p });
                  }}
                  className={`py-1 rounded-md transition-all cursor-pointer ${
                    priority === p
                      ? p === 'high'
                        ? 'bg-[#FF3B30] text-white font-bold'
                        : 'bg-white dark:bg-[#2c2c2e] text-neutral-900 dark:text-white shadow-xs font-semibold'
                      : 'text-neutral-500'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subtasks */}
        <div>
          <label className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1">
            Subtasks ({subtasks.length})
          </label>
          <div className="space-y-1 mb-2">
            {subtasks.map((st) => (
              <div
                key={st.id}
                className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
              >
                <div
                  onClick={() => handleToggleSubtask(st.id)}
                  className="flex items-center gap-2 flex-1 cursor-pointer truncate"
                >
                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${st.completed ? 'bg-[#34C759] border-[#34C759] text-white' : 'border-neutral-300 dark:border-neutral-600'}`}>
                    {st.completed && <Check className="w-2.5 h-2.5 stroke-3" />}
                  </span>
                  <span className={`truncate ${st.completed ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                    {st.text}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSubtask(st.id)}
                  className="text-neutral-400 hover:text-[#FF3B30]"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddSubtask} className="flex gap-1">
            <input
              type="text"
              placeholder="Add subtask..."
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              className="flex-1 px-2.5 py-1 bg-black/[0.03] dark:bg-white/[0.05] rounded-lg text-neutral-900 dark:text-white outline-none"
            />
            <button
              type="submit"
              disabled={!newSubtaskText.trim()}
              className="px-2 py-1 bg-[#007AFF] text-white rounded-lg disabled:opacity-40"
            >
              <Plus className="w-3 h-3" />
            </button>
          </form>
        </div>

        {/* Location & URL */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-black/[0.02] dark:bg-white/[0.03] rounded-lg">
            <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <input
              type="text"
              placeholder="Location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onBlur={() => saveChanges()}
              className="w-full bg-transparent border-none outline-none text-neutral-800 dark:text-neutral-200 placeholder-neutral-400"
            />
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-black/[0.02] dark:bg-white/[0.03] rounded-lg">
            <Link className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <input
              type="url"
              placeholder="URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => saveChanges()}
              className="w-full bg-transparent border-none outline-none text-neutral-800 dark:text-neutral-200 placeholder-neutral-400"
            />
            {url && (
              <a href={url} target="_blank" rel="noreferrer" className="text-[#007AFF]">
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1">Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => saveChanges()}
            placeholder="Add notes..."
            className="w-full p-2 bg-black/[0.03] dark:bg-white/[0.05] rounded-lg text-neutral-800 dark:text-neutral-200 outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
};
