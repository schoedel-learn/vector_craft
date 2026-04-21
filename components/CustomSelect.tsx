import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check, Search, X, Info, Camera } from 'lucide-react';
import { StyleCategory } from '../types';
import { toSlug } from '../services/styleRefService';

/**
 * Options can be either plain strings (no tooltip) or objects with a name and tooltip.
 * This lets us keep simple lists like ART_MEDIA as string[] while providing
 * rich tooltips for styles, movements, designers, illustrators, and painters.
 */
export type SelectOption = string | { name: string; tooltip: string; aiContext?: string };

const getOptionName = (opt: SelectOption): string =>
  typeof opt === 'string' ? opt : opt.name;

const getOptionTooltip = (opt: SelectOption): string | undefined =>
  typeof opt === 'string' ? undefined : opt.tooltip;

interface CustomSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  /** When true, the selector is softly dimmed and cannot be opened */
  disabled?: boolean;
  /** Hint shown on hover when the selector is disabled */
  disabledHint?: string;
  /** Category for style lookups (shows camera icon if ref images exist) */
  styleCategory?: StyleCategory;
  styleManifest?: Set<string>;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Default",
  disabled = false,
  disabledHint,
  styleCategory,
  styleManifest
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [hoveredOption, setHoveredOption] = useState<SelectOption | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
        setHoveredOption(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset hovered option when search text changes
  useEffect(() => {
    setHoveredOption(null);
  }, [search]);

  const filteredOptions = options.filter(opt =>
    getOptionName(opt).toLowerCase().includes(search.toLowerCase())
  );

  // Check if any option in the list carries tooltip data
  const hasTooltips = options.length > 0 && typeof options[0] !== 'string';

  const handleToggle = () => {
    if (disabled) return;
    if (isOpen) {
      setIsOpen(false);
      setSearch('');
      setHoveredOption(null);
    } else {
      setIsOpen(true);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        title={disabled && disabledHint ? disabledHint : undefined}
        className={`flex items-center justify-between gap-2 bg-[#1A2634] border ${
          disabled
            ? 'border-white/5 opacity-40 cursor-not-allowed'
            : isOpen || value
              ? 'border-[#00A2FD]/50'
              : 'border-white/10'
        } rounded-lg text-sm text-white py-1.5 px-3 outline-none ${
          !disabled ? 'hover:border-[#00A2FD]/50' : ''
        } transition-all min-w-[140px] max-w-[200px] whitespace-nowrap min-h-[36px] shadow-sm`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className={`font-medium whitespace-nowrap ${disabled ? 'text-base-500' : 'text-base-400'}`}>
            {label}:
          </span>
          <span className={`truncate ${!value ? 'text-base-500 italic' : 'text-[#00A2FD] font-semibold'}`}>
            {value || placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => { if (e.key === 'Enter') handleClear(e as any); }}
              className="text-base-400 hover:text-white transition-colors p-0.5 rounded hover:bg-white/10"
              aria-label={`Clear ${label} selection`}
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-base-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-50 top-full mt-2 left-0 ${hasTooltips ? 'w-[300px]' : 'w-[240px]'} bg-[#101A28] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl`}
          >
            {/* Search Input */}
            <div className="p-2 border-b border-white/5 relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-base-500" />
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1A2634] border border-white/5 rounded-lg text-sm text-white py-1.5 pl-8 pr-3 outline-none focus:border-[#00A2FD]/50 transition-colors placeholder:text-base-500"
              />
            </div>

            {/* Options List */}
            <div className={`${hasTooltips ? 'max-h-[200px]' : 'max-h-[240px]'} overflow-y-auto p-1 py-1.5 scrollbar-thin`}>
              {/* "Default" (clear) option */}
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                  setSearch('');
                }}
                onMouseEnter={() => setHoveredOption(null)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between group ${
                  !value ? 'bg-[#00A2FD]/10 text-[#00A2FD] font-medium' : 'text-base-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="italic">Default</span>
                {!value && <Check size={14} className="text-[#00A2FD]" />}
              </button>

              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-base-500">
                  No results found.
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const name = getOptionName(opt);
                  const hasVisualRef = styleCategory && styleManifest
                    ? styleManifest.has(`${styleCategory}_${toSlug(name)}`)
                    : false;

                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        onChange(name);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      onMouseEnter={() => setHoveredOption(opt)}
                      onMouseLeave={() => setHoveredOption(null)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between group ${
                        value === name ? 'bg-[#00A2FD]/10 text-[#00A2FD] font-medium' : 'text-base-200 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate">{name}</span>
                        {hasVisualRef && (
                          <Camera size={13} className="text-[#00A2FD]/60 flex-shrink-0" title="Visual references available" />
                        )}
                      </div>
                      {value === name && <Check size={14} className="text-[#00A2FD] flex-shrink-0 ml-2" />}
                    </button>
                  );
                })
              )}
            </div>

            {/* Tooltip Preview Panel — only rendered when the options carry tooltip data */}
            {hasTooltips && (
              <div className="border-t border-white/5 px-3 py-2.5 bg-[#0D1520] min-h-[52px] flex items-start">
                <AnimatePresence mode="wait">
                  {hoveredOption && getOptionTooltip(hoveredOption) ? (
                    <motion.div
                      key={getOptionName(hoveredOption)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="flex gap-2 items-start"
                    >
                      <Info size={12} className="text-[#00A2FD]/60 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-base-300 leading-relaxed line-clamp-3">
                        {getOptionTooltip(hoveredOption)}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.p
                      key="default-hint"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="text-[11px] text-base-500/50 italic flex items-center gap-2"
                    >
                      <Info size={12} className="flex-shrink-0" />
                      Hover an option to see details
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
