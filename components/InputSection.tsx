/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useEffect } from 'react';
import { GenerationStatus } from '../types';
import { User } from 'firebase/auth';
import { ART_STYLES } from './artStyles';
import { ART_MOVEMENTS } from './artMovements';
import { ART_MEDIA, ART_SUPPORTS } from './artMedia';
import { GRAPHIC_DESIGNERS } from './artDesigners';
import { ILLUSTRATORS } from './artIllustrators';
import { MASTER_ARTISTS } from './artArtists';
import { CustomSelect } from './CustomSelect';
import { SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InputSectionProps {
  onGenerate: (prompt: string) => void;
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

export const InputSection: React.FC<InputSectionProps> = ({ onGenerate, status, user, generationsLeft, isUnlimited, isClient, hoursLimit, totalLimit, selectedFile, onFileSelect, referenceUrl, onReferenceUrlChange, onLogin }) => {
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

  useEffect(() => {
    const shuffledSuggestions = [...SUGGESTIONS_POOL].sort(() => 0.5 - Math.random());
    const shuffledPhrases = [...PHRASES_POOL].sort(() => 0.5 - Math.random());
    setCurrentSuggestions(shuffledSuggestions.slice(0, 4));
    setPlaceholderSuggestion(shuffledPhrases[0]);
  }, [user]);

  const isLoading = status === GenerationStatus.LOADING;
  const isLimitReached = user && !isUnlimited && generationsLeft <= 0;

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
      
      let mediaModifiers = [];
      if (selectedMedia) mediaModifiers.push(selectedMedia);
      if (selectedSupport) mediaModifiers.push(`on ${selectedSupport.toLowerCase()}`);
      
      if (mediaModifiers.length > 0) {
        finalPrompt += `, directly simulating the distinct approaches, textures, and technical methods of creating art with ${mediaModifiers.join(' ')}`;
      }
      
      let roleModifiers = [];
      if (selectedDesigner) roleModifiers.push(`graphic designer ${selectedDesigner}`);
      if (selectedIllustrator) roleModifiers.push(`illustrator ${selectedIllustrator}`);
      if (selectedArtist) roleModifiers.push(`master artist ${selectedArtist}`);
      
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
      
      onGenerate(finalPrompt);
    }
  }, [input, status, onGenerate, selectedStyle, selectedMovement, selectedMedia, selectedSupport, selectedDesigner, selectedIllustrator, selectedArtist]);

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 px-4">
      {/* Hero Section */}
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

      {/* Prompt Section */}
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-white mb-3 font-sans">
          What do you want to create?
        </h3>
        <p className="text-base-300 text-lg">
          Describe an object, icon, or scene, and we'll render it as vector art.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative group flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {user && (
            <div className="relative">
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
                <span className="material-symbols-outlined text-[24px]">attach_file</span>
              </button>
              
              {showAttachmentMenu && (
                <div className="absolute top-full left-0 mt-2 bg-[#1A2634] border border-white/10 rounded-xl p-3 shadow-2xl z-20 flex flex-col gap-3 min-w-[280px]">
                  <div className="flex items-center bg-black/20 rounded-lg px-3 py-2 border border-white/5 focus-within:border-[#00A2FD]/50 transition-colors">
                    <span className="material-symbols-outlined text-[18px] text-base-400 mr-2">link</span>
                    <input
                      type="url"
                      value={referenceUrl}
                      onChange={(e) => onReferenceUrlChange(e.target.value)}
                      placeholder="Paste URL..."
                      className="bg-transparent border-none outline-none text-sm text-white placeholder-base-500 w-full"
                      disabled={isLoading || isLimitReached}
                    />
                  </div>
                  
                  {isClient && (
                    <div className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2 border border-white/5">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="material-symbols-outlined text-[18px] text-base-400">upload_file</span>
                        {selectedFile ? (
                          <span className="text-sm text-[#00A2FD] truncate">{selectedFile.name}</span>
                        ) : (
                          <span className="text-sm text-base-400">Upload file</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <input 
                          type="file" 
                          id="file-upload" 
                          className="hidden" 
                          accept="image/*,.txt,.md,.csv,.pdf,.docx" 
                          onChange={(e) => onFileSelect(e.target.files?.[0] || null)} 
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
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex-1 relative flex items-center bg-[#101A28] rounded-xl border border-white/10 shadow-lg overflow-hidden p-2">
            <div className="pl-4 text-[#00A2FD] flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[24px]">magic_button</span>
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
                <span className="material-symbols-outlined text-[20px]">login</span>
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
                  <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
                )}
              </button>
            )}
          </div>
        </div>
        
        {user && (
          <div className="mt-2 text-center relative z-40">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center gap-2 text-sm text-base-400 hover:text-white transition-colors py-1 px-3 rounded-full hover:bg-white/5"
            >
              <SlidersHorizontal size={14} className={showAdvanced ? "text-[#00A2FD]" : ""} />
              {showAdvanced ? "Hide advanced styles" : "Advanced styles & modifiers"}
            </button>
            
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="mt-3 flex flex-wrap items-center justify-center gap-3 overflow-visible"
                >
                  <CustomSelect label="Art Period" value={selectedStyle} onChange={setSelectedStyle} options={ART_STYLES} />
                  <CustomSelect label="Movement" value={selectedMovement} onChange={setSelectedMovement} options={ART_MOVEMENTS} />
                  <CustomSelect label="Media" value={selectedMedia} onChange={setSelectedMedia} options={ART_MEDIA} />
                  <CustomSelect label="Support" value={selectedSupport} onChange={setSelectedSupport} options={ART_SUPPORTS} />
                  <CustomSelect label="Designer" value={selectedDesigner} onChange={setSelectedDesigner} options={GRAPHIC_DESIGNERS} />
                  <CustomSelect label="Illustrator" value={selectedIllustrator} onChange={setSelectedIllustrator} options={ILLUSTRATORS} />
                  <CustomSelect label="Artist" value={selectedArtist} onChange={setSelectedArtist} options={MASTER_ARTISTS} />
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
