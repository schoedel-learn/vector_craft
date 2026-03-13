import React from 'react';
import { GeneratedSvg } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: GeneratedSvg[];
  onRegenerate: (prompt: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history, onRegenerate }) => {
  if (!isOpen) return null;

  const handleDownload = (svg: GeneratedSvg) => {
    const blob = new Blob([svg.content], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vectorcraft-${svg.id}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-base-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-base-800/50">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-brand-400 text-[20px]">schedule</span>
            <h2 className="text-xl font-semibold text-white font-display">Your Generation History</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-base-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-base-950/50">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-base-500">
              <span className="material-symbols-outlined text-[48px] mb-4 opacity-20">schedule</span>
              <p>No SVGs generated yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((item) => (
                <div key={item.id} className="bg-base-900 rounded-xl border border-white/10 overflow-hidden group hover:border-brand-400 hover:shadow-lg transition-all flex flex-col">
                  
                  {/* Preview Area */}
                  <div className="p-4 flex items-center justify-center bg-[#101A28] aspect-square relative">
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: item.content }} 
                    />
                    
                  </div>

                  {/* Details */}
                  <div className="p-4 border-t border-white/10 bg-base-800/50 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-base-200 line-clamp-2 mb-1" title={item.prompt}>
                        "{item.prompt}"
                      </p>
                      <span className="text-xs text-base-500">
                        {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleDownload(item)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-base-700 text-base-200 rounded-lg hover:bg-base-600 hover:text-white transition-colors text-sm font-medium"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        Download
                      </button>
                      <button
                        onClick={() => {
                          onRegenerate(item.prompt);
                          onClose();
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-brand-500/20 text-brand-300 rounded-lg hover:bg-brand-500/30 hover:text-brand-200 transition-colors text-sm font-medium"
                      >
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                        Regenerate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
