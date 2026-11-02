import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  PanelLeft, 
  PanelRight, 
  MoreHorizontal,
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  Download,
  Calendar,
  Layers,
  Clock,
  Flame,
  List
} from 'lucide-react';
import { ViewMode } from '../types/calendar';
import { MONTH_NAMES } from '../utils/dateUtils';
import { sounds } from '../utils/audio';

interface WindowHeaderProps {
  currentDate: Date;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onPrevDate: () => void;
  onNextDate: () => void;
  onToday: () => void;
  onQuickAdd: () => void;
  onOpenSearch: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  onExportICS: () => void;
}

export const WindowHeader: React.FC<WindowHeaderProps> = ({
  currentDate,
  viewMode,
  onViewModeChange,
  onPrevDate,
  onNextDate,
  onToday,
  onQuickAdd,
  onOpenSearch,
  isSidebarOpen,
  onToggleSidebar,
  isInspectorOpen,
  onToggleInspector,
  isDarkMode,
  onToggleDarkMode,
  isSoundEnabled,
  onToggleSound,
  onExportICS
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const monthName = MONTH_NAMES[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleViewChange = (mode: ViewMode) => {
    sounds.playTap();
    onViewModeChange(mode);
  };

  return (
    <header className="h-12 min-h-[48px] bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.06] px-3.5 flex items-center justify-between gap-4 select-none shrink-0 z-30 transition-colors">
      {/* Left: Window Controls, Sidebar Toggle & Date Navigation */}
      <div className="flex items-center gap-3">
        {/* macOS Traffic Lights */}
        <div className="hidden sm:flex items-center gap-1.5 mr-1">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/60 opacity-90 hover:opacity-100" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/60 opacity-90 hover:opacity-100" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/60 opacity-90 hover:opacity-100" />
        </div>

        {/* Sidebar Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
          className="p-1 rounded-md text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Month & Year Title with Steppers */}
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
            {monthName} <span className="font-normal text-neutral-400 dark:text-neutral-500">{year}</span>
          </div>

          <div className="flex items-center gap-0.5 ml-1">
            <button
              type="button"
              onClick={onPrevDate}
              title="Previous"
              className="p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onToday}
              className="px-2 py-0.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={onNextDate}
              title="Next"
              className="p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Center: Apple Minimalist Segmented View Control */}
      <div className="flex items-center bg-black/[0.04] dark:bg-white/[0.06] p-0.5 rounded-lg">
        <button
          type="button"
          onClick={() => handleViewChange('month')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
            viewMode === 'month'
              ? 'bg-white dark:bg-[#2c2c2e] text-neutral-900 dark:text-white shadow-xs font-semibold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Month</span>
        </button>
        <button
          type="button"
          onClick={() => handleViewChange('week')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
            viewMode === 'week'
              ? 'bg-white dark:bg-[#2c2c2e] text-neutral-900 dark:text-white shadow-xs font-semibold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Week</span>
        </button>
        <button
          type="button"
          onClick={() => handleViewChange('day')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
            viewMode === 'day'
              ? 'bg-white dark:bg-[#2c2c2e] text-neutral-900 dark:text-white shadow-xs font-semibold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Day</span>
        </button>
        <button
          type="button"
          onClick={() => handleViewChange('deadlines')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
            viewMode === 'deadlines'
              ? 'bg-white dark:bg-[#2c2c2e] text-[#FF3B30] dark:text-[#FF453A] shadow-xs font-semibold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-[#FF3B30]'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-[#FF3B30]" />
          <span>Deadlines</span>
        </button>
        <button
          type="button"
          onClick={() => handleViewChange('reminders')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
            viewMode === 'reminders'
              ? 'bg-white dark:bg-[#2c2c2e] text-[#007AFF] dark:text-[#0A84FF] shadow-xs font-semibold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-[#007AFF]'
          }`}
        >
          <List className="w-3.5 h-3.5 text-[#007AFF]" />
          <span>Tasks</span>
        </button>
      </div>

      {/* Right: Search, Add Item & Clean Dropdown Menu */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search button */}
        <button
          type="button"
          onClick={onOpenSearch}
          title="Search (⌘K)"
          className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Primary New Item button */}
        <button
          type="button"
          onClick={onQuickAdd}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#007AFF] hover:bg-[#0071E3] active:bg-[#005BB5] text-white text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-2" />
          <span>New</span>
        </button>

        {/* Overflow Menu (keeps header completely uncluttered) */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(prev => !prev)}
            title="Options & Appearance"
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#252528] rounded-xl border border-black/10 dark:border-white/10 shadow-xl py-1.5 z-50 text-xs">
              {/* Dark mode toggle */}
              <button
                type="button"
                onClick={() => {
                  onToggleDarkMode();
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left flex items-center justify-between text-neutral-700 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-neutral-500" />}
                  Appearance
                </span>
                <span className="text-neutral-400 capitalize">{isDarkMode ? 'Dark' : 'Light'}</span>
              </button>

              {/* Sound toggle */}
              <button
                type="button"
                onClick={() => {
                  onToggleSound();
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left flex items-center justify-between text-neutral-700 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#007AFF]" /> : <VolumeX className="w-3.5 h-3.5 text-neutral-400" />}
                  Sound Effects
                </span>
                <span className="text-neutral-400">{isSoundEnabled ? 'On' : 'Off'}</span>
              </button>

              <div className="h-[1px] bg-black/5 dark:bg-white/5 my-1" />

              {/* Export to ICS */}
              <button
                type="button"
                onClick={() => {
                  onExportICS();
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 text-neutral-700 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-neutral-400" />
                <span>Export Calendar (.ics)</span>
              </button>

              {/* Toggle Inspector */}
              <button
                type="button"
                onClick={() => {
                  onToggleInspector();
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left flex items-center justify-between text-neutral-700 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <PanelRight className="w-3.5 h-3.5 text-neutral-400" />
                  Inspector Drawer
                </span>
                <span className="text-neutral-400">{isInspectorOpen ? 'Shown' : 'Hidden'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
