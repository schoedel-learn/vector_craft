import React, { useState } from 'react';

interface ApiKeySetupProps {
  onSave: (key: string) => void;
  currentKey?: string | null;
  isModal?: boolean;
  onClose?: () => void;
}

/**
 * Lets users enter their own free Gemini API key (BYOK).
 * The key is stored in localStorage — never sent to any server.
 */
export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onSave, currentKey, isModal = false, onClose }) => {
  const [key, setKey] = useState(currentKey || '');
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (trimmed) {
      onSave(trimmed);
    }
  };

  const handleRemove = () => {
    setKey('');
    onSave('');
  };

  const content = (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-base-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-base-800/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-brand-400 text-[20px]">key</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">
                {currentKey ? 'Manage API Key' : 'Connect Your Gemini API Key'}
              </h2>
              <p className="text-xs text-base-500 mt-0.5">Free tier — no credit card required</p>
            </div>
          </div>
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors text-base-400 hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Explanation */}
          <div className="bg-brand-500/5 border border-brand-500/10 rounded-xl p-4 text-sm text-brand-200/80 leading-relaxed">
            <p className="mb-2">
              Vector Craft uses <strong className="text-brand-300">Google's Gemini API</strong> to generate SVGs.
              Each user provides their own API key so you can use your <strong className="text-brand-300">free quota</strong> directly.
            </p>
            <p className="text-brand-200/60">
              Your key is stored locally in your browser. It is never sent to our servers.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-base-500 uppercase tracking-[0.2em]">How to get your free key</h3>
            <ol className="space-y-2 text-sm text-base-300">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-[11px] font-bold text-brand-400 flex-shrink-0 mt-0.5">1</span>
                <span>
                  Go to{' '}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors"
                  >
                    aistudio.google.com/apikey
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-[11px] font-bold text-brand-400 flex-shrink-0 mt-0.5">2</span>
                <span>Sign in with your Google account and click <strong className="text-white">"Create API key"</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-[11px] font-bold text-brand-400 flex-shrink-0 mt-0.5">3</span>
                <span>Copy the key and paste it below</span>
              </li>
            </ol>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-base-500 uppercase tracking-[0.2em] mb-3">
                Your Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full bg-base-950 border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-sm focus:outline-none focus:border-brand-400/50 transition-all text-white placeholder:text-base-700 font-mono"
                  required
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-500 hover:text-white transition-colors"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showKey ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              {currentKey && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="flex-1 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs uppercase tracking-widest hover:bg-red-500/20 transition-all"
                >
                  Remove Key
                </button>
              )}
              <button
                type="submit"
                disabled={!key.trim()}
                className="flex-1 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-base-950 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentKey ? 'Update Key' : 'Save & Start Creating'}
              </button>
            </div>
          </form>

          {/* Privacy note */}
          <div className="flex items-start gap-2 text-[11px] text-base-600">
            <span className="material-symbols-outlined text-[14px] mt-0.5 flex-shrink-0">lock</span>
            <span>Your API key is stored only in this browser's local storage and is sent directly to Google's Gemini API. We never see or store it.</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-base-950/80 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return <div className="mt-12 px-4">{content}</div>;
};
