/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { GenerationStatus } from '../types';
import { User } from 'firebase/auth';

interface InputSectionProps {
  onGenerate: (prompt: string) => void;
  status: GenerationStatus;
  user: User | null;
  generationsLeft: number;
  onLogin: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ onGenerate, status, user, generationsLeft, onLogin }) => {
  const [input, setInput] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status !== GenerationStatus.LOADING) {
      onGenerate(input.trim());
    }
  }, [input, status, onGenerate]);

  const isLoading = status === GenerationStatus.LOADING;
  const isLimitReached = user && generationsLeft <= 0;

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
        <div className="relative flex items-center bg-[#101A28] rounded-xl border border-white/10 shadow-lg overflow-hidden p-2">
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
      </form>
      
      {/* User Status / Limit Indicator */}
      {user && (
        <div className="mt-4 text-center">
          <p className={`text-sm font-medium ${isLimitReached ? 'text-red-400' : 'text-base-400'}`}>
            {generationsLeft} of 10 generations remaining (resets rolling 72h)
          </p>
        </div>
      )}

      {/* Quick suggestions */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {['Retro Camera', 'Space Rocket', 'Origami Bird', 'Isometric House'].map((suggestion) => (
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
