import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Space, SpaceKnowledge } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SpacesManagerProps {
  userId: string;
  selectedSpaceId: string | null;
  onSelectSpace: (space: Space | null) => void;
}

export const SpacesManager: React.FC<SpacesManagerProps> = ({ userId, selectedSpaceId, onSelectSpace }) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [knowledge, setKnowledge] = useState<SpaceKnowledge[]>([]);
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'users', userId, 'spaces'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const spacesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Space[];
      setSpaces(spacesData);
      
      // If the selected space was deleted, deselect it
      if (selectedSpaceId && !spacesData.find(s => s.id === selectedSpaceId)) {
        onSelectSpace(null);
      }
    });
    return () => unsubscribe();
  }, [userId, selectedSpaceId, onSelectSpace]);

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await addDoc(collection(db, 'users', userId, 'spaces'), {
        uid: userId,
        title,
        description,
        prompt,
        knowledge,
        timestamp: Date.now()
      });
      resetForm();
      setIsCreating(false);
    } catch (error) {
      console.error("Error creating space:", error);
    }
  };

  const handleDeleteSpace = async (e: React.MouseEvent, spaceId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this space?")) return;
    try {
      await deleteDoc(doc(db, 'users', userId, 'spaces', spaceId));
    } catch (error) {
      console.error("Error deleting space:", error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrompt('');
    setKnowledge([]);
    setNewUrl('');
  };

  const addUrl = () => {
    if (!newUrl.trim()) return;
    setKnowledge([...knowledge, { type: 'url', value: newUrl }]);
    setNewUrl('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setKnowledge([...knowledge, { 
        type: 'file', 
        value: result, 
        name: file.name,
        mimeType: file.type
      }]);
    };
    reader.readAsDataURL(file);
  };

  const removeKnowledge = (index: number) => {
    setKnowledge(knowledge.filter((_, i) => i !== index));
  };

  const selectedSpace = spaces.find(s => s.id === selectedSpaceId);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-400 text-[20px]">layers</span>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-base-500">Spaces</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setIsCreating(true);
              setIsModalOpen(true);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-base-800/50 border border-white/5 text-base-400 hover:text-brand-400 hover:border-brand-400/30 transition-all"
            title="Create New Space"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
          <button 
            onClick={() => {
              setIsCreating(false);
              setIsModalOpen(true);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-base-800/50 border border-white/5 text-base-400 hover:text-brand-400 hover:border-brand-400/30 transition-all"
            title="Manage Spaces"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {spaces.map(space => (
          <button
            key={space.id}
            onClick={() => onSelectSpace(selectedSpaceId === space.id ? null : space)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-2 ${
              selectedSpaceId === space.id 
                ? 'bg-brand-400/10 border-brand-400/50 text-brand-400 shadow-[0_0_15px_rgba(129,140,248,0.1)]' 
                : 'bg-base-900/50 border-white/5 text-base-400 hover:border-white/10'
            }`}
          >
            {space.title}
          </button>
        ))}
      </div>

      {selectedSpace && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-2xl bg-brand-400/5 border border-brand-400/10 text-[13px] text-brand-200/80"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="material-symbols-outlined text-[16px] text-brand-400">info</span>
            <span className="font-bold text-brand-400 uppercase tracking-wider text-[11px]">Active Space: {selectedSpace.title}</span>
          </div>
          {selectedSpace.description && <p className="mb-3 opacity-70 leading-relaxed">{selectedSpace.description}</p>}
          <div className="flex flex-wrap gap-2">
            {selectedSpace.prompt && (
              <span className="px-2.5 py-1 rounded-lg bg-brand-400/10 border border-brand-400/20 text-[10px] font-bold uppercase tracking-wider text-brand-300">
                Custom Prompt Active
              </span>
            )}
            {selectedSpace.knowledge.length > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-brand-400/10 border border-brand-400/20 text-[10px] font-bold uppercase tracking-wider text-brand-300">
                {selectedSpace.knowledge.length} Knowledge Items
              </span>
            )}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-base-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-base-900 border border-white/10 rounded-[32px] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-base-800/30">
                <h2 className="text-xl font-bold flex items-center gap-3 text-white font-display">
                  <span className="material-symbols-outlined text-brand-400 text-[24px]">layers</span>
                  {isCreating ? 'Create New Space' : 'Manage Spaces'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors text-base-400 hover:text-white">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                {!isCreating ? (
                  <div className="space-y-6">
                    <div className="grid gap-3">
                      {spaces.map(space => (
                        <div 
                          key={space.id}
                          className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-brand-400/30 transition-all"
                        >
                          <div>
                            <h4 className="font-bold text-white mb-1">{space.title}</h4>
                            <p className="text-xs text-base-500 line-clamp-1">{space.description || 'No description provided'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => handleDeleteSpace(e, space.id)}
                              className="w-10 h-10 flex items-center justify-center text-base-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                              title="Delete Space"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                      {spaces.length === 0 && (
                        <div className="text-center py-20 text-base-600">
                          <span className="material-symbols-outlined text-[48px] mb-4 opacity-20">layers</span>
                          <p className="text-sm">No spaces created yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreateSpace} className="space-y-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-bold text-base-500 uppercase tracking-[0.2em] mb-3">Space Title</label>
                        <input 
                          required
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g., Brand Identity"
                          className="w-full bg-base-950 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-brand-400/50 transition-all text-white placeholder:text-base-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-base-500 uppercase tracking-[0.2em] mb-3">Description</label>
                        <textarea 
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Briefly describe the purpose of this space..."
                          className="w-full bg-base-950 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-brand-400/50 transition-all h-24 resize-none text-white placeholder:text-base-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-base-500 uppercase tracking-[0.2em] mb-3">Space Prompt (System Guidance)</label>
                        <textarea 
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Instructions that will guide every generation in this space..."
                          className="w-full bg-base-950 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-brand-400/50 transition-all h-40 resize-none text-white placeholder:text-base-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-base-500 uppercase tracking-[0.2em] mb-3">Knowledge Base (URLs & Files)</label>
                        <div className="flex flex-col gap-4 mb-4">
                          <div className="flex gap-3">
                            <input 
                              value={newUrl}
                              onChange={(e) => setNewUrl(e.target.value)}
                              placeholder="Add a reference URL..."
                              className="flex-1 bg-base-950 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-brand-400/50 transition-all text-white placeholder:text-base-700"
                            />
                            <button 
                              type="button"
                              onClick={addUrl}
                              className="px-6 py-3 bg-base-800 hover:bg-base-700 rounded-2xl transition-all text-xs font-bold uppercase tracking-wider text-white"
                            >
                              Add URL
                            </button>
                          </div>
                          <div className="relative">
                            <input 
                              type="file"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="space-file-upload"
                            />
                            <label 
                              htmlFor="space-file-upload"
                              className="flex items-center justify-center gap-3 w-full p-5 rounded-2xl border border-dashed border-white/10 hover:border-brand-400/30 hover:bg-brand-400/5 transition-all cursor-pointer text-sm text-base-500 hover:text-brand-400"
                            >
                              <span className="material-symbols-outlined text-[20px]">upload_file</span>
                              Upload Reference File
                            </label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {knowledge.map((k, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                              <div className="flex items-center gap-3 text-base-400">
                                <span className="material-symbols-outlined text-[18px]">{k.type === 'url' ? 'link' : 'description'}</span>
                                <span className="truncate max-w-[350px]">{k.name || k.value}</span>
                              </div>
                              <button onClick={() => removeKnowledge(i)} className="w-8 h-8 flex items-center justify-center text-base-600 hover:text-red-400 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button 
                        type="button"
                        onClick={() => setIsCreating(false)}
                        className="flex-1 py-4 rounded-2xl bg-base-800 hover:bg-base-700 text-white font-bold transition-all uppercase tracking-widest text-xs"
                      >
                        Back
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-4 rounded-2xl bg-brand-400 hover:bg-brand-300 text-base-950 font-bold transition-all uppercase tracking-widest text-xs shadow-lg shadow-brand-400/20"
                      >
                        Create Space
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
