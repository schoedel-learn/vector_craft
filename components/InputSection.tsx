/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useEffect } from 'react';
import { GenerationStatus } from '../types';
import { User } from 'firebase/auth';

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
  'Robot Dog', 'Hoverboard', 'Arcade Machine', 'Crystal Ball'
];

export const InputSection: React.FC<InputSectionProps> = ({ onGenerate, status, user, generationsLeft, isUnlimited, isClient, hoursLimit, totalLimit, selectedFile, onFileSelect, referenceUrl, onReferenceUrlChange, onLogin }) => {
  const [input, setInput] = useState('');
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  useEffect(() => {
    const shuffled = [...SUGGESTIONS_POOL].sort(() => 0.5 - Math.random());
    setCurrentSuggestions(shuffled.slice(0, 4));
  }, [user]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status !== GenerationStatus.LOADING) {
      onGenerate(input.trim());
    }
  }, [input, status, onGenerate]);

  const isLoading = status === GenerationStatus.LOADING;
  const isLimitReached = user && !isUnlimited && generationsLeft <= 0;

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 px-4">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-extrabold text-white mb-3 font-display">
          What do you want to create?
        </h2>
        <p className="text-base-300 text-lg">
          Describe an object, icon, or scene, and we'll render it as vector art.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative group">
        <div className="flex items-center gap-2">
          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className={`flex items-center justify-center w-12 h-12 rounded-xl border transition-colors ${
                  showAttachmentMenu || referenceUrl || selectedFile
                    ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                    : 'bg-[#101A28] border-white/10 text-base-400 hover:text-white hover:bg-white/5'
                }`}
                title="Add reference"
              >
                <span className="material-symbols-outlined text-[24px]">attach_file</span>
              </button>
              
              {showAttachmentMenu && (
                <div className="absolute top-full left-0 mt-2 bg-[#1A2634] border border-white/10 rounded-xl p-3 shadow-2xl z-20 flex flex-col gap-3 min-w-[280px]">
                  <div className="flex items-center bg-black/20 rounded-lg px-3 py-2 border border-white/5 focus-within:border-brand-500/50 transition-colors">
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
                          <span className="text-sm text-brand-400 truncate">{selectedFile.name}</span>
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
                          className="cursor-pointer text-brand-400 hover:text-brand-300 text-sm font-medium px-2 py-1 rounded hover:bg-brand-500/10 transition-colors"
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
            <div className="pl-4 text-[#00A2FD] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">magic_button</span>
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={!user ? "Sign in to start creating..." : isLimitReached ? "Generation limit reached..." : "e.g. A futuristic cyberpunk helmet with neon lights..."}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-base-500 px-4 py-3 text-lg disabled:opacity-50"
              disabled={isLoading || !user || isLimitReached}
            />
            {!user ? (
              <button
                type="button"
                onClick={onLogin}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 bg-brand-500 text-white hover:bg-brand-400 active:scale-95 shadow-lg shadow-brand-500/20"
              >
                <span className="hidden sm:inline">Sign In</span>
                <span className="material-symbols-outlined text-[20px]">login</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || isLoading || isLimitReached}
                className={`
                  flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200
                  ${!input.trim() || isLoading || isLimitReached
                    ? 'bg-base-700 text-base-500 cursor-not-allowed' 
                    : 'bg-brand-500 text-white hover:bg-brand-400 active:scale-95 shadow-lg shadow-brand-500/20'}
                `}
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                    <span className="hidden sm:inline">Crafting...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Generate</span>
                    <span className="material-symbols-outlined text-[20px]">send</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
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
