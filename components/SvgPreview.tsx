/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { GeneratedSvg, Space } from '../types';
import { Bookmark, CheckCircle2, Code, Download, SlidersHorizontal, X, Copy, Check } from 'lucide-react';

interface SvgPreviewProps {
  data: GeneratedSvg | null;
  selectedSpace?: Space | null;
  onSaveToSpace?: (svgId: string, spaceId: string) => void;
  onRemix?: (svgId: string, prompt: string, keep: boolean) => void;
}

export const SvgPreview: React.FC<SvgPreviewProps> = ({ data, selectedSpace, onSaveToSpace, onRemix }) => {
  const [copied, setCopied] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [isSavedToSpace, setIsSavedToSpace] = useState(false);
  const [isRemixing, setIsRemixing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset copied state when data changes
  useEffect(() => {
    setCopied(false);
    setCopiedPrompt(false);
    setShowCode(false);
    setIsSavedToSpace(data?.spaceId ? true : false);
    setIsRemixing(false);
  }, [data]);

  if (!data) return null;

  const handleSaveToSpace = () => {
    if (selectedSpace && onSaveToSpace) {
      onSaveToSpace(data.id, selectedSpace.id);
      setIsSavedToSpace(true);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([data.content], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vectorcraft-${data.id}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(data.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(data.prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-base-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-base-800/50">
          <h3 className="text-sm font-medium text-base-300 truncate max-w-[150px] sm:max-w-xs">
            Result: <span className="text-base-500">"{data.prompt}"</span>
          </h3>
          <div className="flex gap-2">
            {selectedSpace && !isSavedToSpace && (
              <button
                onClick={handleSaveToSpace}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-brand-400 bg-brand-400/10 border border-brand-400/20 rounded-lg hover:bg-brand-400/20 transition-colors shadow-sm"
              >
                <Bookmark size={18} />
                <span className="hidden sm:inline">Save to {selectedSpace.title}</span>
              </button>
            )}
            {isSavedToSpace && (
              <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-brand-400 bg-brand-400/5 border border-brand-400/10 rounded-lg">
                <CheckCircle2 size={18} />
                <span className="hidden sm:inline">Saved to Space</span>
              </div>
            )}
              <button
              onClick={() => setShowCode(!showCode)}
              className={`p-2 rounded-lg transition-colors group relative flex items-center justify-center ${showCode ? 'text-brand-400 bg-brand-400/10' : 'text-base-400 hover:text-white hover:bg-white/10'}`}
              title={showCode ? "Hide SVG Code" : "Show SVG Code"}
            >
              <Code size={20} />
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-base-900 bg-white rounded-lg hover:bg-base-200 transition-colors shadow-sm"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Download</span>
            </button>
            {!isRemixing ? (
              <button
                onClick={() => setIsRemixing(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#00A2FD] bg-[#00A2FD]/10 border border-[#00A2FD]/20 rounded-lg hover:bg-[#00A2FD]/20 transition-colors shadow-sm"
              >
                <SlidersHorizontal size={18} />
                <span className="hidden sm:inline">Remix</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-[#00A2FD]/10 px-2 py-1 rounded-lg border border-[#00A2FD]/20 animate-in fade-in slide-in-from-right-2 duration-200">
                <span className="text-xs text-[#00A2FD] font-medium hidden sm:inline px-1">Original?</span>
                <button
                  onClick={() => { setIsRemixing(false); onRemix?.(data.id, data.prompt, true); }}
                  className="px-2 py-1 text-xs font-medium text-white bg-[#00A2FD] hover:bg-[#00A2FD]/80 rounded transition-colors"
                >
                  Keep
                </button>
                <button
                  onClick={() => { setIsRemixing(false); onRemix?.(data.id, data.prompt, false); }}
                  className="px-2 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setIsRemixing(false)}
                  className="p-1 text-base-400 hover:text-white transition-colors"
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="p-8 flex items-center justify-center bg-[#101A28] min-h-[400px] relative">
          {showCode ? (
            <div className="w-full max-w-4xl h-full max-h-[500px] overflow-auto bg-base-950 rounded-xl border border-white/10 p-4 relative text-left">
              <div className="sticky top-0 flex justify-end mb-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-base-300 bg-base-800 hover:bg-base-700 hover:text-white rounded-lg transition-colors shadow-sm border border-white/5"
                >
                  {copied ? (
                    <><Check size={14} className="text-green-400" /> Copied!</>
                  ) : (
                    <><Copy size={14} /> Copy Code</>
                  )}
                </button>
              </div>
              <pre className="text-sm text-base-400 font-mono whitespace-pre-wrap break-all">
                <code>{data.content}</code>
              </pre>
            </div>
          ) : (
            <>
              <div className="absolute top-4 right-4">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-base-300 bg-base-800/50 hover:bg-base-700 hover:text-white rounded-lg transition-colors shadow-sm border border-white/5 backdrop-blur-sm"
                  title="Copy SVG Code"
                >
                  {copied ? (
                    <><Check size={14} className="text-green-400" /> Copied!</>
                  ) : (
                    <><Copy size={14} /> Copy SVG</>
                  )}
                </button>
              </div>
              <div 
                ref={containerRef}
                className="w-full max-w-[512px] h-auto transition-all duration-500 transform hover:scale-[1.02] filter drop-shadow-2xl"
                dangerouslySetInnerHTML={{ __html: data.content }} 
              />
            </>
          )}
        </div>
        
        {/* Metadata Footer */}
        <div className="p-6 bg-base-900 border-t border-white/10 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-base-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                Prompt Used
              </h4>
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1 text-xs font-medium text-base-400 hover:text-white transition-colors"
                title="Copy Prompt"
              >
                {copiedPrompt ? (
                  <><Check size={14} className="text-green-400" /> Copied</>
                ) : (
                  <><Copy size={14} /> Copy</>
                )}
              </button>
            </div>
            <p className="text-sm text-base-300 leading-relaxed bg-base-950/50 p-3 rounded-lg border border-white/5">{data.prompt}</p>
          </div>
          <div className="sm:text-right shrink-0">
            <h4 className="text-xs font-bold text-base-500 uppercase tracking-widest mb-2">Generated On</h4>
            <p className="text-sm text-base-400 font-mono bg-base-950/50 p-3 rounded-lg border border-white/5">
              {new Date(data.timestamp).toLocaleDateString()} <span className="text-base-600 mx-1">•</span> {new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
