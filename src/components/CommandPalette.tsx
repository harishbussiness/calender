import React, { useState, useEffect, useRef } from 'react';
import { CalendarCategory, CalendarItem } from '../types/calendar';
import { sounds } from '../utils/audio';
import { Search, Calendar as CalendarIcon, Flame, CheckCircle2, Clock, MapPin, X } from 'lucide-react';
import { formatTime12h, MONTH_NAMES_SHORT } from '../utils/dateUtils';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: CalendarItem[];
  categories: CalendarCategory[];
  onSelectItem: (item: CalendarItem) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  items,
  categories,
  onSelectItem
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const categoryMap = new Map<string, CalendarCategory>(categories.map(c => [c.id, c]));

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredItems = items.filter(item => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(q);
    const notesMatch = item.notes?.toLowerCase().includes(q);
    const locMatch = item.location?.toLowerCase().includes(q);
    const cat = categoryMap.get(item.calendarId);
    const catMatch = cat?.name.toLowerCase().includes(q);
    return titleMatch || notesMatch || locMatch || catMatch;
  }).slice(0, 8); // top 8 results

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      sounds.playTap();
      onSelectItem(filteredItems[selectedIndex]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl apple-glass bg-white dark:bg-[#202022] rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden transition-all flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Spotlight Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-black/[0.08] dark:border-white/[0.08]">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items, events, deadlines, calendars..."
            className="w-full bg-transparent border-none outline-none text-sm text-neutral-900 dark:text-white placeholder-neutral-400 font-medium"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-black/5 dark:bg-white/10 text-neutral-400 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-neutral-400">
              <p className="text-xs">No matching actions or events found.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, idx) => {
                const cat = categoryMap.get(item.calendarId);
                const isSelected = idx === selectedIndex;
                const [y, m, d] = item.date.split('-').map(Number);
                const itemDate = new Date(y, m - 1, d);
                const dateLabel = `${MONTH_NAMES_SHORT[itemDate.getMonth()]} ${itemDate.getDate()}`;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      sounds.playTap();
                      onSelectItem(item);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#007AFF] text-white shadow-xs'
                        : 'hover:bg-black/5 dark:hover:bg-white/5 text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.completed ? (
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-[#34C759]'}`} />
                      ) : item.type === 'deadline' ? (
                        <Flame className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-[#FF3B30]'}`} />
                      ) : (
                        <CalendarIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-neutral-400'}`} />
                      )}

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold truncate ${item.completed ? 'line-through opacity-70' : ''}`}>
                            {item.title}
                          </span>
                          {item.priority === 'high' && (
                            <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-[#FF3B30]'}`}>
                              !!!
                            </span>
                          )}
                        </div>

                        {item.notes && (
                          <p className={`text-[11px] truncate opacity-80 ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className={`text-[11px] tabular-nums ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>
                        {dateLabel} {item.startTime && `· ${formatTime12h(item.startTime)}`}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full ring-1 ring-white/20"
                        style={{ backgroundColor: cat?.color || '#007AFF' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-400 px-4">
          <span>Navigate with <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd></span>
          <span>Open with <kbd className="font-mono">↵</kbd></span>
        </div>
      </div>
    </div>
  );
};
