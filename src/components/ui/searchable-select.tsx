'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface SearchableOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
}

interface SearchableSelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  hasError?: boolean;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyText = 'No matching options found.',
  disabled = false,
  className,
  id,
  hasError = false,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus search input when popover opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [open]);

  const selectedOption = React.useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.value.toLowerCase().includes(query) ||
        (opt.description && opt.description.toLowerCase().includes(query)) ||
        (opt.group && opt.group.toLowerCase().includes(query))
    );
  }, [options, searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-xl border px-3.5 py-2 text-xs font-medium text-black transition-all focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 text-left cursor-pointer shadow-2xs',
            hasError
              ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
              : 'border-[#EAEAEA] bg-[#FAFAFA] hover:bg-white hover:border-[#D4D4D8] focus:outline-none focus:ring-1 focus:ring-black focus:border-black',
            !selectedOption && (hasError ? 'text-rose-400' : 'text-[#888888]'),
            className
          )}
        >
          <span className="truncate block font-bangla">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[calc(100vw-2rem)] sm:w-80 md:w-96 max-w-lg p-0 bg-white border border-[#EAEAEA] shadow-xl rounded-xl overflow-hidden z-50"
      >
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-[#EAEAEA] px-3 py-2 bg-[#FAFAFA]">
          <Search className="w-3.5 h-3.5 text-[#888888] shrink-0 mr-2" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-xs font-medium text-black outline-none placeholder:text-[#888888] font-bangla"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 hover:bg-zinc-200 rounded-md transition-colors"
            >
              <X className="w-3 h-3 text-[#666666]" />
            </button>
          )}
        </div>

        {/* Options List */}
        <div className="max-h-60 overflow-y-auto p-1 text-xs">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#888888] font-bangla">
              {emptyText}
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-start justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-zinc-900 text-white font-semibold'
                      : 'hover:bg-[#F4F4F5] text-zinc-900 font-medium'
                  )}
                >
                  <div className="flex flex-col gap-0.5 pr-2">
                    <span className="font-bangla text-xs leading-snug">
                      {opt.label}
                    </span>
                    {opt.description && (
                      <span
                        className={cn(
                          'text-[10px] leading-tight font-normal',
                          isSelected ? 'text-zinc-300' : 'text-[#666666]'
                        )}
                      >
                        {opt.description}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
