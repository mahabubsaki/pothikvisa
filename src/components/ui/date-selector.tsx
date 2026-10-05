'use client';

import * as React from 'react';
import { Calendar as CalendarIcon, Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguage } from '@/context/LanguageContext';

interface DateSelectorProps {
  value?: string; // strictly DD/MM/YYYY
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  minYear?: number;
  maxYear?: number;
  label?: string;
  hasError?: boolean;
}

const MONTHS = [
  { value: '01', en: 'January', bn: 'জানুয়ারি', short: 'Jan' },
  { value: '02', en: 'February', bn: 'ফেব্রুয়ারি', short: 'Feb' },
  { value: '03', en: 'March', bn: 'মার্চ', short: 'Mar' },
  { value: '04', en: 'April', bn: 'এপ্রিল', short: 'Apr' },
  { value: '05', en: 'May', bn: 'মে', short: 'May' },
  { value: '06', en: 'June', bn: 'জুন', short: 'Jun' },
  { value: '07', en: 'July', bn: 'জুলাই', short: 'Jul' },
  { value: '08', en: 'August', bn: 'আগস্ট', short: 'Aug' },
  { value: '09', en: 'September', bn: 'সেপ্টেম্বর', short: 'Sep' },
  { value: '10', en: 'October', bn: 'অক্টোবর', short: 'Oct' },
  { value: '11', en: 'November', bn: 'নভেম্বর', short: 'Nov' },
  { value: '12', en: 'December', bn: 'ডিসেম্বর', short: 'Dec' },
];

interface SearchableDatePartProps {
  label: string;
  value: string;
  displayValue?: string;
  placeholder: string;
  options: { value: string; label: string; subLabel?: string }[];
  searchPlaceholder: string;
  isOpen: boolean;
  align?: 'left' | 'right';
  isBn?: boolean;
  onToggle: () => void;
  onSelect: (val: string) => void;
  onClose: () => void;
}

function SearchableDatePart({
  label,
  value,
  displayValue,
  placeholder,
  options,
  searchPlaceholder,
  isOpen,
  align = 'left',
  isBn = false,
  onToggle,
  onSelect,
  onClose,
}: SearchableDatePartProps) {
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(q))
    );
  }, [options, search]);

  const currentOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-[10px] font-bold text-[#666666] mb-1 font-bangla">
        {label}
      </label>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between h-9 px-2.5 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer shadow-2xs',
          isOpen
            ? 'border-black bg-white ring-1 ring-black'
            : 'border-[#EAEAEA] bg-[#FAFAFA] hover:bg-white hover:border-[#D4D4D8] text-black',
          !value && 'text-[#888888]'
        )}
      >
        <span className="truncate">
          {displayValue || currentOption?.label || value || placeholder}
        </span>
        <ChevronsUpDown className="w-3.5 h-3.5 text-[#888888] shrink-0 ml-1 opacity-70" />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute top-full mt-1.5 z-50 w-44 sm:w-52 bg-white border border-[#EAEAEA] shadow-xl rounded-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {/* Search bar */}
          <div className="flex items-center px-2 py-1.5 border-b border-[#EAEAEA] bg-[#FAFAFA]">
            <Search className="w-3.5 h-3.5 text-[#888888] mr-1.5 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs font-medium text-black outline-none placeholder:text-[#888888]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="p-0.5 hover:bg-zinc-200 rounded text-[#888888]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options */}
          <div className="max-h-48 overflow-y-auto p-1 text-xs">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-[11px] text-[#888888] font-bangla">
                {isBn ? 'পাওয়া যায়নি' : 'No match'}
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onSelect(opt.value);
                      onClose();
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-zinc-900 text-white font-semibold'
                        : 'hover:bg-[#F4F4F5] text-zinc-900 font-medium'
                    )}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-xs">{opt.label}</span>
                      {opt.subLabel && (
                        <span
                          className={cn(
                            'text-[10px] truncate',
                            isSelected ? 'text-zinc-300' : 'text-zinc-500 font-bangla'
                          )}
                        >
                          {opt.subLabel}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3 h-3 shrink-0 ml-1 text-white" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function DateSelector({
  value = '',
  onChange,
  placeholder = 'DD/MM/YYYY',
  disabled = false,
  className,
  id,
  minYear = 1940,
  maxYear = 2040,
  hasError = false,
}: DateSelectorProps) {
  const { isBn } = useLanguage();
  const [open, setOpen] = React.useState(false);
  const [activeDropdown, setActiveDropdown] = React.useState<'day' | 'month' | 'year' | null>(null);

  // Parse current DD/MM/YYYY
  const { currentDay, currentMonth, currentYear } = React.useMemo(() => {
    if (!value || typeof value !== 'string') {
      return { currentDay: '', currentMonth: '', currentYear: '' };
    }
    const parts = value.split('/');
    if (parts.length === 3) {
      return {
        currentDay: parts[0]?.padStart(2, '0') || '',
        currentMonth: parts[1]?.padStart(2, '0') || '',
        currentYear: parts[2] || '',
      };
    }
    return { currentDay: '', currentMonth: '', currentYear: '' };
  }, [value]);

  // Generate Year options
  const years = React.useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      list.push(y);
    }
    return list;
  }, [minYear, maxYear]);

  // Days in selected month/year
  const daysInMonth = React.useMemo(() => {
    const m = parseInt(currentMonth, 10);
    const y = parseInt(currentYear, 10) || 2026;
    if (!m || isNaN(m)) return 31;
    return new Date(y, m, 0).getDate();
  }, [currentMonth, currentYear]);

  const handleUpdate = (day: string, month: string, year: string) => {
    const d = day ? day.padStart(2, '0') : currentDay || '01';
    const m = month ? month.padStart(2, '0') : currentMonth || '01';
    const y = year || currentYear || '2026';
    onChange(`${d}/${m}/${y}`);
  };

  // Direct text formatting: auto insert slashes
  const handleDirectInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw.length > 8) raw = raw.slice(0, 8);

    let formatted = raw;
    if (raw.length >= 5) {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;
    } else if (raw.length >= 3) {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    onChange(formatted);
  };

  const humanReadableLabel = React.useMemo(() => {
    if (!currentDay || !currentMonth || !currentYear) return null;
    const mObj = MONTHS.find((m) => m.value === currentMonth);
    if (!mObj) return null;
    const monthName = isBn ? mObj.bn : mObj.short;
    return `${currentDay} ${monthName} ${currentYear}`;
  }, [currentDay, currentMonth, currentYear, isBn]);

  const dayOptions = React.useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const dayStr = String(i + 1).padStart(2, '0');
      return {
        value: dayStr,
        label: dayStr,
        subLabel: isBn ? `${dayStr} তারিখ` : undefined,
      };
    });
  }, [daysInMonth, isBn]);

  const monthOptions = React.useMemo(() => {
    return MONTHS.map((m) => ({
      value: m.value,
      label: `${m.value} - ${m.short}`,
      subLabel: isBn ? m.bn : m.en,
    }));
  }, [isBn]);

  const yearOptions = React.useMemo(() => {
    return years.map((y) => ({
      value: String(y),
      label: String(y),
      subLabel: undefined,
    }));
  }, [years]);

  const currentMonthObj = MONTHS.find((m) => m.value === currentMonth);
  const currentMonthDisplay = currentMonthObj
    ? `${currentMonthObj.value} - ${currentMonthObj.short}`
    : '';

  return (
    <div className={cn('relative flex items-center gap-1.5', className)}>
      <div className="relative flex-1">
        <input
          id={id}
          type="text"
          value={value}
          disabled={disabled}
          onChange={handleDirectInput}
          placeholder={placeholder}
          maxLength={10}
          className={cn(
            'w-full text-xs font-mono font-bold rounded-xl pl-3 pr-8 py-2.5 transition-all shadow-2xs focus:outline-none',
            hasError
              ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
              : 'bg-[#FAFAFA] border border-[#EAEAEA] text-black placeholder:text-[#888888] focus:border-black focus:bg-white'
          )}
        />
        <Popover open={open} onOpenChange={(val) => {
          setOpen(val);
          if (!val) setActiveDropdown(null);
        }}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors cursor-pointer"
              title={isBn ? 'তারিখ নির্বাচনকারী খুলুন' : 'Open Date Picker'}
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            className="w-80 sm:w-96 p-3.5 bg-white border border-[#EAEAEA] shadow-xl rounded-2xl z-50 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#EAEAEA]">
              <span className="text-xs font-bold text-zinc-900 font-bangla">
                {isBn ? 'তারিখ নির্বাচন করুন' : 'Select Date (DD/MM/YYYY)'}
              </span>
              {humanReadableLabel && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bangla">
                  {humanReadableLabel}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Day Searchable Selector */}
              <SearchableDatePart
                label={isBn ? 'দিন (Day)' : 'Day'}
                value={currentDay}
                placeholder={isBn ? 'দিন' : 'Day'}
                options={dayOptions}
                searchPlaceholder={isBn ? 'দিন খুঁজুন...' : 'Search day...'}
                isOpen={activeDropdown === 'day'}
                isBn={isBn}
                align="left"
                onToggle={() => setActiveDropdown((prev) => (prev === 'day' ? null : 'day'))}
                onSelect={(d) => handleUpdate(d, currentMonth, currentYear)}
                onClose={() => setActiveDropdown(null)}
              />

              {/* Month Searchable Selector */}
              <SearchableDatePart
                label={isBn ? 'মাস (Month)' : 'Month'}
                value={currentMonth}
                displayValue={currentMonthDisplay}
                placeholder={isBn ? 'মাস' : 'Month'}
                options={monthOptions}
                searchPlaceholder={isBn ? 'মাস খুঁজুন...' : 'Search month...'}
                isOpen={activeDropdown === 'month'}
                isBn={isBn}
                align="left"
                onToggle={() => setActiveDropdown((prev) => (prev === 'month' ? null : 'month'))}
                onSelect={(m) => handleUpdate(currentDay, m, currentYear)}
                onClose={() => setActiveDropdown(null)}
              />

              {/* Year Searchable Selector */}
              <SearchableDatePart
                label={isBn ? 'বছর (Year)' : 'Year'}
                value={currentYear}
                placeholder={isBn ? 'বছর' : 'Year'}
                options={yearOptions}
                searchPlaceholder={isBn ? 'বছর খুঁজুন...' : 'Search year...'}
                isOpen={activeDropdown === 'year'}
                isBn={isBn}
                align="right"
                onToggle={() => setActiveDropdown((prev) => (prev === 'year' ? null : 'year'))}
                onSelect={(y) => handleUpdate(currentDay, currentMonth, y)}
                onClose={() => setActiveDropdown(null)}
              />
            </div>

            {/* Quick Helper Button */}
            <div className="pt-2 flex justify-between items-center text-[11px] text-[#888888]">
              <span className="font-mono">{value || 'DD/MM/YYYY'}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1 text-xs font-bold bg-zinc-900 hover:bg-black text-white rounded-lg transition-colors cursor-pointer"
              >
                {isBn ? 'সম্পন্ন' : 'Done'}
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
