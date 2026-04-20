import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check, Search } from 'lucide-react';

interface CustomSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ 
  label, 
  value, 
  onChange, 
  options,
  placeholder = "None (Auto)"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 bg-[#1A2634] border ${isOpen || value ? 'border-[#00A2FD]/50' : 'border-white/10'} rounded-lg text-sm text-white py-1.5 px-3 outline-none hover:border-[#00A2FD]/50 transition-colors min-w-[140px] max-w-[200px] whitespace-nowrap min-h-[36px] shadow-sm`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className="text-base-400 font-medium whitespace-nowrap">{label}:</span>
          <span className={`truncate ${!value ? 'text-base-500 italic' : 'text-[#00A2FD] font-semibold'}`}>
            {value || placeholder}
          </span>
        </div>
        <ChevronDown 
          size={14} 
          className={`text-base-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 top-full mt-2 left-0 w-[240px] bg-[#101A28] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
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
            <div className="max-h-[240px] overflow-y-auto p-1 py-1.5 scrollbar-thin">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between group ${
                  !value ? 'bg-[#00A2FD]/10 text-[#00A2FD] font-medium' : 'text-base-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="italic">None (Auto)</span>
                {!value && <Check size={14} className="text-[#00A2FD]" />}
              </button>
              
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-base-500">
                  No results found.
                </div>
              ) : (
                filteredOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between group ${
                      value === opt ? 'bg-[#00A2FD]/10 text-[#00A2FD] font-medium' : 'text-base-200 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {value === opt && <Check size={14} className="text-[#00A2FD] flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
