import React, { useState, useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import * as collection from '@dicebear/collection';
import { motion, AnimatePresence } from 'motion/react';

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig?: { style: string; seed: string };
  onSave: (config: { style: string; seed: string }) => void;
}

const STYLES = [
  { id: 'adventurer', name: 'Adventurer' },
  { id: 'avataaars', name: 'Avatars' },
  { id: 'bottts', name: 'Robots' },
  { id: 'pixelArt', name: 'Pixel Art' },
  { id: 'lorelei', name: 'Lorelei' },
  { id: 'miniavs', name: 'Minimalist' },
  { id: 'notionists', name: 'Notionist' },
  { id: 'bigSmile', name: 'Big Smile' }
];

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({ isOpen, onClose, currentConfig, onSave }) => {
  const [selectedStyle, setSelectedStyle] = useState(currentConfig?.style || 'adventurer');
  const [seed, setSeed] = useState(currentConfig?.seed || Math.random().toString(36).substring(7));
  const [isSaving, setIsSaving] = useState(false);

  const avatarSvg = useMemo(() => {
    const style = (collection as any)[selectedStyle];
    if (!style) return '';
    const avatar = createAvatar(style, {
      seed: seed,
      size: 128,
    });
    return avatar.toString();
  }, [selectedStyle, seed]);

  const handleRandomize = () => {
    setSeed(Math.random().toString(36).substring(7));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ style: selectedStyle, seed });
      onClose();
    } catch (error) {
      console.error("Error saving avatar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-base-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-xl bg-base-900 border border-white/10 rounded-[32px] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-base-800/30">
          <h2 className="text-xl font-bold flex items-center gap-3 text-white font-display">
            <span className="material-symbols-outlined text-brand-400 text-[24px]">face</span>
            Customize Avatar
          </h2>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors text-base-400 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          <div className="flex flex-col items-center gap-6">
            <div 
              className="w-32 h-32 rounded-full bg-base-800 border-4 border-brand-400/20 overflow-hidden shadow-xl flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{ __html: avatarSvg }}
            />
            <button 
              onClick={handleRandomize}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-base-800 hover:bg-base-700 text-white text-xs font-bold uppercase tracking-widest transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">casino</span>
              Randomize Seed
            </button>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-base-500 uppercase tracking-[0.2em]">Select Style</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`px-3 py-3 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all ${
                    selectedStyle === style.id
                      ? 'bg-brand-400/10 border-brand-400/50 text-brand-400'
                      : 'bg-base-950 border-white/5 text-base-500 hover:border-white/10'
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-base-500 uppercase tracking-[0.2em]">Custom Seed</label>
            <input 
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="w-full bg-base-950 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-brand-400/50 transition-all text-white"
              placeholder="Enter a seed..."
            />
          </div>
        </div>

        <div className="p-6 bg-base-800/30 border-t border-white/5 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl bg-base-800 hover:bg-base-700 text-white font-bold transition-all uppercase tracking-widest text-xs"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-4 rounded-2xl bg-brand-400 hover:bg-brand-300 text-base-950 font-bold transition-all uppercase tracking-widest text-xs shadow-lg shadow-brand-400/20 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Avatar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
