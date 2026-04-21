/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GenerationStatus } from '../types';
import { User } from 'firebase/auth';
import { ART_STYLES } from './artStyles';
import { ART_MOVEMENTS } from './artMovements';
import { ART_MEDIA, ART_SUPPORTS } from './artMedia';
import { GRAPHIC_DESIGNERS } from './artDesigners';
import { ILLUSTRATORS } from './artIllustrators';
import { MASTER_ARTISTS } from './artArtists';
import { CustomSelect, SelectOption } from './CustomSelect';
import { StyleSelection, AspectRatio, ASPECT_RATIO_CONFIG, StyleCategory } from '../types';
import { getStyleRefManifest, toSlug } from '../services/styleRefService';

/** Look up the aiContext for a selected name from a given options array. */
const getAiContext = (name: string, options: SelectOption[]): string | undefined => {
  if (!name) return undefined;
  const found = options.find(o => (typeof o === 'string' ? o : o.name) === name);
  return found && typeof found !== 'string' ? found.aiContext : undefined;
};
import { SlidersHorizontal, Info, Paperclip, Sparkles, ArrowRight, LogIn, Loader2, Link2, FileUp, X, Wand2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InputSectionProps {
  onGenerate: (prompt: string, styleSelection?: StyleSelection, aspectRatio?: AspectRatio) => void;
  status: GenerationStatus;
  user: User | null;
  generationsLeft: number;
  isUnlimited?: boolean;
  isClient?: boolean;
  hoursLimit: number;
  totalLimit: number;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  referenceUrl: string;
  onReferenceUrlChange: (url: string) => void;
  onLogin: () => void;
  remixRequest?: {prompt: string, timestamp: number} | null;
  onCancelRemix?: () => void;
}

const SUGGESTIONS_POOL = [
  'Retro Camera', 'Space Rocket', 'Origami Bird', 'Isometric House',
  'Cyberpunk Helmet', 'Vintage Radio', 'Mechanical Keyboard', 'Bonsai Tree',
  'Magic Potion Bottle', 'Steampunk Goggles', 'Neon Sign', 'Coffee Maker',
  'Electric Guitar', 'Vinyl Record Player', 'Telescope', 'Microscope',
  'Robot Dog', 'Hoverboard', 'Arcade Machine', 'Crystal Ball',
  'Ancient Compass', 'Hot Air Balloon', 'Gramophone', 'Pocket Watch',
  'Typewriter', 'Feather Quill', 'Hourglass', 'Lighthouse',
  'Anchor', 'Compass Rose', 'Globe', 'Microphone',
  'Saxophone', 'Grand Piano', 'Cello', 'Violin',
  'Drum Set', 'Synthesizer', 'Cassette Tape', 'Walkman',
  'Game Boy', 'Polaroid Camera', 'Film Projector', 'Binoculars',
  'Compass', 'Magnifying Glass', 'Skeleton Key', 'Treasure Chest',
  'Sword', 'Shield', 'Knight Helmet', 'Dragon Statue',
  'Wizard Staff', 'Crystal Shard', 'Magic Lamp', 'Flying Carpet',
  'Potion Cauldron', 'Spell Book', 'Owl', 'Wolf',
  'Lion', 'Eagle', 'Phoenix', 'Unicorn',
  'Pegasus', 'Griffin', 'Kraken', 'Spaceship',
  'Satellite', 'Astronaut Helmet'
];

const PHRASES_POOL = [
  'Minimalist streetwear hoodie design with logo',
  'Modern SaaS landing page hero layout',
  'Mobile banking app dashboard UI design',
  'Low-poly fantasy warrior character for games',
  'Elegant Italian restaurant menu with gold accents',
  'Cinematic mountain landscape during golden hour',
  'Flat style productivity icon set design',
  'Cozy cyberpunk apartment interior with neon',
  'Stylized 3D profile avatar for social media',
  'Clean portfolio website header with menu',
  'Social media feed mobile interface design',
  'Retro pixel art game background with clouds',
  'Vintage graphic t-shirt print with retro sun',
  'Modern cafe branding and logo design',
  'Minimalist weather app icon with sun clouds',
  'Abstract geometric pattern for textile design',
  'Isometric city block with tiny cars',
  'Watercolor portrait of a mysterious woman',
  'Oil painting of a stormy sea at night',
  'Pop art style illustration of a soda can',
  'Surreal landscape with floating islands',
  'Art Deco poster for a luxury hotel',
  'Bauhaus inspired graphic design poster',
  'Vaporwave aesthetic sunset with palm trees',
  'Gothic cathedral architecture sketch',
  'Victorian era botanical illustration',
  'Japanese ukiyo-e style wave painting',
  'Nordic minimalist living room interior',
  'Industrial loft office space design',
  'Bohemian style bedroom with plants',
  'Mediterranean villa patio with fountain',
  'Futuristic neon city street view',
  'Post-apocalyptic wasteland environment',
  'Steampunk airship flying through clouds',
  'Ancient Egyptian tomb wall painting',
  'Mayan temple ruins in the jungle',
  'Greek temple on a sunny hilltop',
  'Roman colosseum arena illustration',
  'Medieval castle on a snowy mountain',
  'Zen garden with sand and stones',
  'Cherry blossom trees in a park',
  'Autumn forest with colorful leaves',
  'Tropical beach with turquoise water',
  'Desert dunes under a starry sky',
  'Arctic icebergs in the ocean',
  'Underwater coral reef with fish',
  'Outer space nebula with stars',
  'Black and white street photography',
  'Macro photo of a butterfly wing',
  'Double exposure of a forest and face',
  'Glitch art portrait with neon colors',
  'Paper cut art of a forest scene',
  'Stained glass window design',
  'Mosaic tile pattern for a floor',
  'Mandala design with intricate details',
  'Calligraphy quote with ink splatters',
  'Graffiti tag on a brick wall',
  'Comic book panel with action scene',
  'Manga character design with big eyes',
  'Chibi style cute animal illustration',
  'Low-poly 3D model of a sports car',
  'Voxel art style house with garden',
  'Claymation style character for animation',
  'Puppet theater stage with curtains',
  'Origami crane on a wooden table'
];

export const InputSection: React.FC<InputSectionProps> = ({ onGenerate, status, user, generationsLeft, isUnlimited, isClient, hoursLimit, totalLimit, selectedFile, onFileSelect, referenceUrl, onReferenceUrlChange, onLogin, remixRequest, onCancelRemix }) => {
  const [input, setInput] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedMovement, setSelectedMovement] = useState('');
  const [selectedMedia, setSelectedMedia] = useState('');
  const [selectedSupport, setSelectedSupport] = useState('');
  const [selectedDesigner, setSelectedDesigner] = useState('');
  const [selectedIllustrator, setSelectedIllustrator] = useState('');
  const [selectedArtist, setSelectedArtist] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [placeholderSuggestion, setPlaceholderSuggestion] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showStyleTooltip, setShowStyleTooltip] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('square');
  const [styleManifest, setStyleManifest] = useState<Set<string>>(new Set());
  const [remixFlash, setRemixFlash] = useState<string | null>(null);
  const attachmentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isRemixMode = !!remixRequest;

  /** Wraps a style setter so it fires a brief confirmation flash in remix mode */
  const withRemixFlash = (setter: (v: string) => void, label: string) => (v: string) => {
    setter(v);
    if (v && isRemixMode) {
      setRemixFlash(`${label}: ${v}`);
      setTimeout(() => setRemixFlash(null), 2200);
    }
  };

  // Mutual exclusivity — only one style and one material at a time
  const hasStyleSelected = !!(selectedStyle || selectedMovement || selectedDesigner || selectedIllustrator || selectedArtist);
  const hasMaterialSelected = !!(selectedMedia || selectedSupport);
  const activeStyleName = selectedStyle || selectedMovement || selectedDesigner || selectedIllustrator || selectedArtist || '';
  const activeMaterialName = selectedMedia || selectedSupport || '';
  const styleHint = activeStyleName ? `${activeStyleName} is active — clear it to choose a different style` : '';
  const materialHint = activeMaterialName ? `${activeMaterialName} is active — clear it to choose a different material` : '';

  // Close attachment menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (attachmentRef.current && !attachmentRef.current.contains(e.target as Node)) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    // Fetch the set of styles that have visual reference images
    getStyleRefManifest().then((manifest) => {
      setStyleManifest(manifest);
    });

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const shuffledSuggestions = [...SUGGESTIONS_POOL].sort(() => 0.5 - Math.random());
    const shuffledPhrases = [...PHRASES_POOL].sort(() => 0.5 - Math.random());
    setCurrentSuggestions(shuffledSuggestions.slice(0, 4));
    setPlaceholderSuggestion(shuffledPhrases[0]);
  }, [user]);

  const isLoading = status === GenerationStatus.LOADING;
  const isLimitReached = user && !isUnlimited && generationsLeft <= 0;

  useEffect(() => {
    if (remixRequest) {
      setInput(remixRequest.prompt);
      setShowAdvanced(true); // Always open styles when remixing
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [remixRequest]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    } else if (e.key === 'Tab' && !input.trim() && placeholderSuggestion && user && !isLimitReached) {
      e.preventDefault();
      setInput(placeholderSuggestion);
    }
  };

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status !== GenerationStatus.LOADING) {
      let finalPrompt = input.trim();
      let styleModifiers = [];
      if (selectedStyle) styleModifiers.push(`the ${selectedStyle} period`);
      if (selectedMovement) styleModifiers.push(`the ${selectedMovement} movement`);
      
      if (styleModifiers.length > 0) {
        finalPrompt += `, meticulously executed using the specific methods, compositional approaches, and visual aesthetics that typify ${styleModifiers.join(' and ')}`;
      }
      
      if (selectedMedia) {
        finalPrompt += `, directly simulating the distinct approaches, textures, and technical methods of creating art with ${selectedMedia}`;
      } else if (selectedSupport) {
        finalPrompt += `, directly simulating the characteristics and feel of art created on ${selectedSupport.toLowerCase()}`;
      }
      
      let roleModifiers = [];
      if (selectedDesigner) {
        const ctx = getAiContext(selectedDesigner, GRAPHIC_DESIGNERS);
        roleModifiers.push(ctx
          ? `graphic designer ${selectedDesigner} — ${ctx}`
          : `graphic designer ${selectedDesigner}`);
      }
      if (selectedIllustrator) {
        const ctx = getAiContext(selectedIllustrator, ILLUSTRATORS);
        roleModifiers.push(ctx
          ? `illustrator ${selectedIllustrator} — ${ctx}`
          : `illustrator ${selectedIllustrator}`);
      }
      if (selectedArtist) {
        const ctx = getAiContext(selectedArtist, MASTER_ARTISTS);
        roleModifiers.push(ctx
          ? `master artist ${selectedArtist} — ${ctx}`
          : `master artist ${selectedArtist}`);
      }
      
      if (roleModifiers.length > 0) {
        let rolesString = '';
        if (roleModifiers.length === 1) {
          rolesString = roleModifiers[0];
        } else if (roleModifiers.length === 2) {
          rolesString = `both ${roleModifiers[0]} and ${roleModifiers[1]}`;
        } else {
          rolesString = `${roleModifiers.slice(0, -1).join(', ')}, and ${roleModifiers[roleModifiers.length - 1]}`;
        }
        finalPrompt += `, heavily incorporating the specific visual methods, stylistic approaches, and underlying design philosophies that typify the work of ${rolesString}`;
      }
      
      let styleSelection: StyleSelection | undefined;
      if (selectedStyle) styleSelection = { category: 'period', name: selectedStyle, slug: toSlug(selectedStyle) };
      else if (selectedMovement) styleSelection = { category: 'movement', name: selectedMovement, slug: toSlug(selectedMovement) };
      else if (selectedDesigner) styleSelection = { category: 'designer', name: selectedDesigner, slug: toSlug(selectedDesigner) };
      else if (selectedIllustrator) styleSelection = { category: 'illustrator', name: selectedIllustrator, slug: toSlug(selectedIllustrator) };
      else if (selectedArtist) styleSelection = { category: 'artist', name: selectedArtist, slug: toSlug(selectedArtist) };
      
      onGenerate(finalPrompt, styleSelection, aspectRatio);
    }
  }, [input, status, onGenerate, selectedStyle, selectedMovement, selectedMedia, selectedSupport, selectedDesigner, selectedIllustrator, selectedArtist, aspectRatio]);

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 px-4">
      {/* ── Remix Mode Banner ── */}
      <AnimatePresence>
        {isRemixMode && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="mb-4 flex items-start gap-3 bg-[#00A2FD]/8 border border-[#00A2FD]/25 rounded-2xl px-4 py-3.5"
          >
            <Wand2 size={16} className="text-[#00A2FD] flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#00A2FD] mb-0.5">Remix Mode</p>
              <p className="text-xs text-base-300 truncate">&#8220;{remixRequest?.prompt}&#8221;</p>
              <p className="text-[10px] text-base-500 mt-1">Adjust styles below, then tap <strong className="text-[#00A2FD]">Remix</strong> to generate a new version.</p>
            </div>
            {onCancelRemix && (
              <button
                type="button"
                onClick={onCancelRemix}
                className="text-base-500 hover:text-white transition-colors flex-shrink-0 mt-0.5"
                title="Exit remix mode"
              >
                <X size={15} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Hero Section — only shown to logged-out visitors */}
      {!user && (
        <div className="text-center mb-12">
          <h2 className="text-5xl sm:text-6xl font-extrabold text-white mb-3 font-display tracking-tight leading-[1.1]">
            Schoedel Design
            <span className="block bg-gradient-to-r from-brand-400 to-brand-300 bg-clip-text text-transparent">
              Vector AI
            </span>
          </h2>
          <p className="text-base-400 text-lg max-w-md mx-auto">
            AI-powered SVG vector art generation from text prompts
          </p>
          <div className="mt-6 w-16 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent mx-auto"></div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative group flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {user && (
            <div className="relative" ref={attachmentRef}>
              <button
                type="button"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className={`flex items-center justify-center w-12 h-12 rounded-xl border transition-colors ${
                  showAttachmentMenu || referenceUrl || selectedFile
                    ? 'bg-[#00A2FD]/10 border-[#00A2FD]/30 text-[#00A2FD]'
                    : 'bg-[#101A28] border-white/10 text-base-400 hover:text-white hover:bg-white/5'
                }`}
                title="Add reference"
              >
                <Paperclip size={24} />
              </button>
              
              {showAttachmentMenu && (
                <div className="absolute bottom-full left-0 mb-2 bg-[#1A2634] border border-white/10 rounded-xl p-3 shadow-2xl z-20 flex flex-col gap-3 min-w-[280px]">
                  {/* URL row */}
                  <div className="flex items-center bg-black/20 rounded-lg px-3 py-2 border border-white/5 focus-within:border-[#00A2FD]/50 transition-colors">
                    <Link2 size={18} className="text-base-400 mr-2" />
                    <input
                      type="url"
                      value={referenceUrl}
                      onChange={(e) => onReferenceUrlChange(e.target.value)}
                      placeholder="Paste image URL..."
                      className="bg-transparent border-none outline-none text-sm text-white placeholder-base-500 w-full"
                      disabled={isLoading || isLimitReached}
                    />
                    {referenceUrl && (
                      <button
                        type="button"
                        onClick={() => onReferenceUrlChange('')}
                        className="ml-2 text-base-500 hover:text-white transition-colors flex-shrink-0"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  
                  {isClient && (
                    <div className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2 border border-white/5">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileUp size={18} className="text-base-400" />
                        {selectedFile ? (
                          <span className="text-sm text-[#00A2FD] truncate">{selectedFile.name}</span>
                        ) : (
                          <span className="text-sm text-base-400">Upload a file</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <input 
                          type="file" 
                          id="file-upload" 
                          className="hidden" 
                          accept="image/*,.txt,.md,.csv,.pdf,.docx" 
                          onChange={(e) => {
                            onFileSelect(e.target.files?.[0] || null);
                            // Auto-close the flyout after a file is chosen
                            setShowAttachmentMenu(false);
                          }} 
                        />
                        <label 
                          htmlFor="file-upload" 
                          className="cursor-pointer text-[#00A2FD] hover:opacity-80 text-sm font-medium px-2 py-1 rounded hover:bg-[#00A2FD]/10 transition-colors"
                        >
                          Browse
                        </label>
                        {selectedFile && (
                          <button 
                            type="button" 
                            onClick={() => onFileSelect(null)} 
                            className="text-base-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Done button to close the flyout */}
                  <button
                    type="button"
                    onClick={() => setShowAttachmentMenu(false)}
                    className="w-full py-2 rounded-lg bg-[#00A2FD]/10 hover:bg-[#00A2FD]/20 text-[#00A2FD] text-sm font-semibold transition-colors border border-[#00A2FD]/20"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 relative flex items-center bg-[#101A28] rounded-xl border border-white/10 shadow-lg overflow-hidden p-2">
            <div className="pl-4 text-[#00A2FD] flex items-center justify-center flex-shrink-0">
              <Sparkles size={24} className="text-[#00A2FD]" />
            </div>
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-resize logic
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={!user ? "Sign in to start creating..." : isLimitReached ? "Limit reached..." : `e.g. ${placeholderSuggestion}...`}
              ref={textareaRef}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-base-500 placeholder:italic pl-4 pr-[46px] py-4 text-[10px] sm:text-[15px] disabled:opacity-50 min-w-0 resize-none max-h-[200px] leading-tight overflow-y-auto"
              disabled={isLoading || !user || isLimitReached}
              rows={1}
            />
            {!user ? (
              <button
                type="button"
                onClick={onLogin}
                className="flex items-center justify-center w-12 h-12 rounded-lg font-semibold transition-all duration-200 bg-[#00A2FD] text-white hover:opacity-90 active:scale-95 shadow-lg shadow-[#00A2FD]/20 flex-shrink-0"
              >
                <LogIn size={20} />
              </button>
            ) : isRemixMode ? (
              /* Remix submit — labeled so it's obvious what the button does */
              <button
                type="button"
                onClick={handleSubmit as any}
                disabled={!input.trim() || isLoading || isLimitReached}
                className={`
                  flex items-center justify-center gap-2 px-5 h-12 rounded-lg font-bold text-sm transition-all duration-200 flex-shrink-0 whitespace-nowrap
                  ${!input.trim() || isLoading || isLimitReached
                    ? 'bg-base-700 text-base-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#00A2FD] to-[#4db8ff] text-white hover:opacity-90 active:scale-95 shadow-lg shadow-[#00A2FD]/20'}
                `}
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                <span>{isLoading ? 'Generating…' : 'Remix'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit as any}
                disabled={!input.trim() || isLoading || isLimitReached}
                className={`
                  flex items-center justify-center w-12 h-12 rounded-lg font-semibold transition-all duration-200 flex-shrink-0
                  ${!input.trim() || isLoading || isLimitReached
                    ? 'bg-base-700 text-base-500 cursor-not-allowed' 
                    : 'bg-[#00A2FD] text-white hover:opacity-90 active:scale-95 shadow-lg shadow-[#00A2FD]/20'}
                `}
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <ArrowRight size={24} />
                )}
              </button>
            )}
          </div>
        </div>
        
        {user && (
          <div className="mt-2 text-center relative z-40">
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="inline-flex items-center gap-2 text-sm text-base-400 hover:text-white transition-colors py-1 px-3 rounded-full hover:bg-white/5"
              >
                <SlidersHorizontal size={14} className={showAdvanced ? "text-[#00A2FD]" : ""} />
                {showAdvanced ? "Hide advanced styles" : "Advanced styles & modifiers"}
              </button>
              {/* Info tooltip icon */}
              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setShowStyleTooltip(true)}
                  onMouseLeave={() => setShowStyleTooltip(false)}
                  onFocus={() => setShowStyleTooltip(true)}
                  onBlur={() => setShowStyleTooltip(false)}
                  className="w-5 h-5 flex items-center justify-center text-base-600 hover:text-[#00A2FD] transition-colors rounded-full"
                  aria-label="Style selection tips"
                >
                  <Info size={13} />
                </button>
                <AnimatePresence>
                  {showStyleTooltip && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full right-0 mb-2 w-64 p-3 rounded-xl bg-[#1A2634] border border-white/10 shadow-2xl text-left z-50 pointer-events-none"
                    >
                      <p className="text-[11px] text-base-300 leading-relaxed">
                        We recommend selecting <span className="text-white font-medium">one style</span> at a time. If applicable, you can also select a material to complement it — though certain materials may not render well if they aren&apos;t well aligned with the chosen style.
                      </p>
                      <div className="absolute bottom-[-5px] right-3 w-2.5 h-2.5 bg-[#1A2634] border-r border-b border-white/10 rotate-45" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="mt-3 flex flex-col items-center gap-4 overflow-visible"
                >
                  {/* Style selectors — mutually exclusive group */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-base-500/30 select-none">Style</span>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <CustomSelect label="Art Period" value={selectedStyle} onChange={withRemixFlash(setSelectedStyle, 'Art Period')} options={ART_STYLES} disabled={hasStyleSelected && !selectedStyle} disabledHint={styleHint} styleCategory="period" styleManifest={styleManifest} />
                      <CustomSelect label="Movement" value={selectedMovement} onChange={withRemixFlash(setSelectedMovement, 'Movement')} options={ART_MOVEMENTS} disabled={hasStyleSelected && !selectedMovement} disabledHint={styleHint} styleCategory="movement" styleManifest={styleManifest} />
                      <CustomSelect label="Designer" value={selectedDesigner} onChange={withRemixFlash(setSelectedDesigner, 'Designer')} options={GRAPHIC_DESIGNERS} disabled={hasStyleSelected && !selectedDesigner} disabledHint={styleHint} styleCategory="designer" styleManifest={styleManifest} />
                      <CustomSelect label="Illustrator" value={selectedIllustrator} onChange={withRemixFlash(setSelectedIllustrator, 'Illustrator')} options={ILLUSTRATORS} disabled={hasStyleSelected && !selectedIllustrator} disabledHint={styleHint} styleCategory="illustrator" styleManifest={styleManifest} />
                      <CustomSelect label="Artist" value={selectedArtist} onChange={withRemixFlash(setSelectedArtist, 'Artist')} options={MASTER_ARTISTS} disabled={hasStyleSelected && !selectedArtist} disabledHint={styleHint} styleCategory="artist" styleManifest={styleManifest} />
                    </div>
                  </div>

                  {/* Material selectors — mutually exclusive group */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-base-500/30 select-none">Material</span>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <CustomSelect label="Media" value={selectedMedia} onChange={withRemixFlash(setSelectedMedia, 'Media')} options={ART_MEDIA} disabled={hasMaterialSelected && !selectedMedia} disabledHint={materialHint} />
                      <CustomSelect label="Support" value={selectedSupport} onChange={withRemixFlash(setSelectedSupport, 'Support')} options={ART_SUPPORTS} disabled={hasMaterialSelected && !selectedSupport} disabledHint={materialHint} />
                    </div>
                  </div>

                  {/* Aspect Ratio selector */}
                  <div className="flex flex-col items-center gap-2 mt-2 w-full max-w-[240px]">
                    <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-base-500/30 select-none">Aspect Ratio</span>
                    <div className="grid grid-cols-3 gap-1 bg-[#101A28] border border-white/5 p-1 rounded-lg w-full">
                      {(Object.entries(ASPECT_RATIO_CONFIG) as [AspectRatio, typeof ASPECT_RATIO_CONFIG[AspectRatio]][]).map(([key, config]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setAspectRatio(key)}
                          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                            aspectRatio === key 
                              ? 'bg-[#00A2FD]/10 text-[#00A2FD]' 
                              : 'text-base-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span className="text-sm leading-none opacity-80">{config.icon}</span>
                          {config.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Remix flash confirmation */}
                  <AnimatePresence>
                    {remixFlash && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00A2FD]/10 border border-[#00A2FD]/20 text-[11px] font-medium text-[#00A2FD]"
                      >
                        <Check size={11} />
                        Added to remix: <span className="font-bold">{remixFlash}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </form>
      
      {/* User Status / Limit Indicator */}
      {user && !isUnlimited && (
        <div className="mt-4 text-center">
          <p className={`text-sm font-medium ${isLimitReached ? 'text-red-400' : 'text-base-400'}`}>
            {generationsLeft} of {totalLimit} generations remaining (resets rolling {hoursLimit}h)
          </p>
        </div>
      )}

      {/* Quick suggestions */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {currentSuggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setInput(suggestion)}
            className="px-3 py-1.5 text-sm font-medium text-base-300 bg-base-800/50 border border-white/10 rounded-full hover:bg-base-700 hover:text-white hover:border-white/20 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !user || isLimitReached}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};
