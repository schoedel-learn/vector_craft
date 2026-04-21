import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Space, SpaceKnowledge } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Search, Check, Layers, Sparkles, Undo2 } from 'lucide-react';
import { generateTextWithGemini } from '../services/geminiService';

interface SpacesManagerProps {
  userId: string;
  selectedSpaceId: string | null;
  onSelectSpace: (space: Space | null) => void;
  apiKey: string;
}

export const SpacesManager: React.FC<SpacesManagerProps> = ({ userId, selectedSpaceId, onSelectSpace, apiKey }) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [spaceSearch, setSpaceSearch] = useState('');
  const [formError, setFormError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [knowledge, setKnowledge] = useState<SpaceKnowledge[]>([]);
  const [newUrl, setNewUrl] = useState('');

  // AI Generation State
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalDescription, setOriginalDescription] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

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
  useEffect(() => {
    if (!editingSpaceId) return;

    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await updateDoc(doc(db, 'users', userId, 'spaces', editingSpaceId), {
          title: title.trim() || 'Untitled Space',
          description,
          prompt,
          knowledge,
          timestamp: Date.now()
        });
        setSaveStatus('saved');
        
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error("Autosave error:", error);
        setSaveStatus('error');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, description, prompt, knowledge, editingSpaceId, userId]);

  const handleInitializeDraft = async () => {
    try {
      const docRef = await addDoc(collection(db, 'users', userId, 'spaces'), {
        uid: userId,
        title: 'Untitled Space',
        description: '',
        prompt: '',
        knowledge: [],
        timestamp: Date.now()
      });
      setEditingSpaceId(docRef.id);
      setTitle('Untitled Space');
      setDescription('');
      setPrompt('');
      setKnowledge([]);
      setFormError('');
      setIsCreating(true);
      setIsModalOpen(true);
    } catch(e) {
      console.error("Failed to init draft:", e);
    }
  };

  const getDisplayTitle = (rawTitle: string) => {
    if (rawTitle.length > 20) {
      return rawTitle.substring(0, 17).trim() + '...';
    }
    return rawTitle;
  };

  const handleCloseForm = async () => {
    if (editingSpaceId) {
      if ((title.trim() === 'Untitled Space' || title.trim() === '') && !description.trim() && !prompt.trim() && knowledge.length === 0) {
        try {
          await deleteDoc(doc(db, 'users', userId, 'spaces', editingSpaceId));
          if (selectedSpaceId === editingSpaceId) onSelectSpace(null);
        } catch(e) {
          console.error("Failed to delete empty draft", e);
        }
      }
    }
    resetForm();
    setIsCreating(false);
    setIsModalOpen(false);
  };

  const handleGenerateAI = async (
    field: 'title' | 'description' | 'prompt',
    currentValue: string,
    setOriginalValue: (val: string) => void,
    originalValue: string,
    setValue: (val: string) => void,
    setLoading: (val: boolean) => void,
    instruction: string
  ) => {
    if (!apiKey) {
      setFormError("API key required for generation.");
      return;
    }
    setLoading(true);
    setFormError('');
    try {
      // Save original only if we haven't saved it yet or we're starting a fresh remix
      if (!originalValue || originalValue === currentValue) {
         setOriginalValue(currentValue);
      }
      
      const promptToUse = currentValue.trim() || `Generate an innovative idea for an AI art ${field}.`;
      const generated = await generateTextWithGemini(apiKey, promptToUse, instruction);
      setValue(generated.trim().replace(/^["']|["']$/g, '')); // Strip surrounding quotes if any
    } catch (err: any) {
      setFormError(err.message || `Failed to generate ${field}.`);
    } finally {
      setLoading(false);
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
    setEditingSpaceId(null);
    setFormError('');
    setOriginalTitle('');
    setOriginalDescription('');
    setOriginalPrompt('');
  };

  const handleEditSpaceClick = (space: Space) => {
    setTitle(space.title);
    setDescription(space.description || '');
    setPrompt(space.prompt || '');
    setKnowledge(space.knowledge || []);
    setEditingSpaceId(space.id);
    setSaveSuccess(false);
    setIsCreating(true);
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

  // Controls whether the full spaces panel is visible
  const [isSpacesExpanded, setIsSpacesExpanded] = useState(false);
  const isSpaceActive = !!selectedSpaceId;

  return (
    <div className="mb-4">
      {/* ── Collapsed pill state: shown when no space is active and panel is closed ── */}
      {!isSpaceActive && !isSpacesExpanded ? (
        <motion.button
          type="button"
          onClick={() => setIsSpacesExpanded(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-base-800/60 border border-white/8 text-base-500 hover:text-brand-400 hover:border-brand-400/30 hover:bg-brand-400/5 transition-all text-xs font-medium group"
          title="Open Spaces"
        >
          <Layers size={13} className="group-hover:text-brand-400 transition-colors" />
          <span>Spaces</span>
          <span className="material-symbols-outlined text-[13px] opacity-50">add</span>
        </motion.button>
      ) : (
        /* ── Expanded / active state ── */
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/8 bg-[#0E1620]/80 p-3"
        >
          {/* Header row */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Layers size={14} className={isSpaceActive ? 'text-brand-400' : 'text-base-500'} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-base-500">Spaces</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={handleInitializeDraft}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-base-800/50 border border-white/5 text-base-400 hover:text-brand-400 hover:border-brand-400/30 transition-all"
                title="Create New Space"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
              <button 
                onClick={() => {
                  setIsCreating(false);
                  setIsModalOpen(true);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-base-800/50 border border-white/5 text-base-400 hover:text-brand-400 hover:border-brand-400/30 transition-all"
                title="Manage Spaces"
              >
                <span className="material-symbols-outlined text-[16px]">settings</span>
              </button>
              {/* Collapse button (only when not space-active) */}
              {!isSpaceActive && (
                <button
                  onClick={() => setIsSpacesExpanded(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-base-800/50 border border-white/5 text-base-400 hover:text-white hover:border-white/20 transition-all"
                  title="Collapse Spaces"
                >
                  <span className="material-symbols-outlined text-[16px]">expand_less</span>
                </button>
              )}
            </div>
          </div>

          {/* Dropdown selector */}
          <div className="relative z-50" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full flex items-center justify-between gap-3 bg-[#1A2634] border ${
                isDropdownOpen || selectedSpaceId
                  ? 'border-brand-400/50 shadow-[0_0_12px_rgba(0,162,253,0.08)]'
                  : 'border-white/10'
              } rounded-xl px-4 py-2.5 outline-none hover:border-brand-400/40 transition-all text-left group`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${selectedSpaceId ? 'bg-brand-400/20 text-brand-400' : 'bg-base-800 text-base-500 group-hover:text-brand-400 group-hover:bg-brand-400/10'} transition-colors`}>
                  <Layers size={14} />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-base-500 mb-0.5">Current Space</span>
                  <span className={`text-sm font-medium truncate ${selectedSpaceId ? 'text-white' : 'text-base-400 italic'}`}>
                    {selectedSpace ? getDisplayTitle(selectedSpace.title) : "None (Global Namespace)"}
                  </span>
                </div>
              </div>
              <ChevronDown 
                size={16} 
                className={`text-base-500 transition-transform duration-200 flex-shrink-0 ${isDropdownOpen ? 'rotate-180 text-brand-400' : 'group-hover:text-brand-400'}`}
              />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-full mt-2 left-0 w-full bg-[#101A28] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
                >
                  <div className="p-2 border-b border-white/5 relative bg-[#1A2634]/50">
                    <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-base-500" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search spaces..."
                      value={spaceSearch}
                      onChange={(e) => setSpaceSearch(e.target.value)}
                      className="w-full bg-[#101A28] border border-white/5 rounded-lg text-sm text-white py-2 pl-9 pr-3 outline-none focus:border-brand-400/50 transition-colors placeholder:text-base-600"
                    />
                  </div>
                  
                  <div className="max-h-[220px] overflow-y-auto p-1.5 scrollbar-thin">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSpace(null);
                        setIsDropdownOpen(false);
                        setIsSpacesExpanded(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-between group ${
                        !selectedSpaceId ? 'bg-brand-400/10 text-brand-400 font-medium' : 'text-base-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="italic flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-base-500 inline-block"></span>
                        None (Global Namespace)
                      </span>
                      {!selectedSpaceId && <Check size={16} className="text-brand-400" />}
                    </button>
                    
                    {spaces.filter(s => s.title.toLowerCase().includes(spaceSearch.toLowerCase())).map(space => (
                      <button
                        key={space.id}
                        type="button"
                        onClick={() => {
                          onSelectSpace(space);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-between mt-1 group ${
                          selectedSpaceId === space.id ? 'bg-brand-400/10 text-brand-400 font-medium' : 'text-base-200 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex flex-col truncate">
                          <span className="truncate">{getDisplayTitle(space.title)}</span>
                          {space.description && <span className="text-[10px] text-base-500 truncate mt-0.5">{space.description}</span>}
                        </div>
                        {selectedSpaceId === space.id && <Check size={16} className="text-brand-400 flex-shrink-0" />}
                      </button>
                    ))}
                    
                    {spaces.filter(s => s.title.toLowerCase().includes(spaceSearch.toLowerCase())).length === 0 && (
                      <div className="px-3 py-4 text-center text-sm text-base-500">
                        No spaces found.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Active space info card */}
          {selectedSpace && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 rounded-xl bg-brand-400/5 border border-brand-400/10 text-[12px] text-brand-200/80"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-brand-400">check_circle</span>
                  <span className="font-bold text-brand-400 uppercase tracking-wider text-[10px]">Working in: {getDisplayTitle(selectedSpace.title)}</span>
                </div>
                {/* Exit space */}
                <button
                  type="button"
                  onClick={() => { onSelectSpace(null); setIsSpacesExpanded(false); }}
                  className="text-base-500 hover:text-white transition-colors text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-white/5"
                  title="Exit space"
                >
                  <span className="material-symbols-outlined text-[12px]">close</span>
                  Exit
                </button>
              </div>
              {selectedSpace.description && <p className="opacity-70 leading-relaxed mt-1">{selectedSpace.description}</p>}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedSpace.prompt && (
                  <span className="px-2 py-0.5 rounded-md bg-brand-400/10 border border-brand-400/20 text-[9px] font-bold uppercase tracking-wider text-brand-300">
                    Custom Prompt
                  </span>
                )}
                {selectedSpace.knowledge.length > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-brand-400/10 border border-brand-400/20 text-[9px] font-bold uppercase tracking-wider text-brand-300">
                    {selectedSpace.knowledge.length} Knowledge Items
                  </span>
                )}
              </div>
            </motion.div>
          )}
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
                  {editingSpaceId ? 'Edit Space' : isCreating ? 'Create New Space' : 'Manage Spaces'}
                </h2>
                <div className="flex items-center gap-2">
                  {!isCreating && !editingSpaceId && (
                    <button 
                      onClick={handleInitializeDraft}
                      className="w-10 h-10 flex items-center justify-center hover:bg-white/5 hover:bg-brand-400/10 rounded-full transition-colors text-brand-400 hover:text-brand-300"
                      title="Create New Space"
                    >
                      <span className="material-symbols-outlined text-[24px]">add_circle</span>
                    </button>
                  )}
                  <button onClick={handleCloseForm} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors text-base-400 hover:text-white">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
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
                            <h4 className="font-bold text-white mb-1">{getDisplayTitle(space.title)}</h4>
                            <p className="text-xs text-base-500 line-clamp-1">{space.description || 'No description provided'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleEditSpaceClick(space)}
                              className="w-10 h-10 flex items-center justify-center text-base-500 hover:text-brand-400 hover:bg-brand-400/10 rounded-xl transition-all"
                              title="Edit Space"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
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
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-[10px] font-bold text-base-500 uppercase tracking-[0.2em] mb-0">Space Title</label>
                          <div className="flex items-center gap-3">
                            {originalTitle && originalTitle !== title && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTitle(originalTitle);
                                  setOriginalTitle('');
                                }}
                                className="flex items-center gap-1 text-[10px] font-medium tracking-wide text-base-400 hover:text-white transition-colors"
                                title="Revert to original"
                              >
                                <Undo2 size={12} />
                                Revert
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleGenerateAI('title', title, setOriginalTitle, originalTitle, setTitle, setIsGeneratingTitle, "You are a naming assistant for an AI SVG web app. Suggest a concise, highly creative 2-4 word title for a workspace based on this input. Return ONLY the title. No quotes.")}
                              disabled={isGeneratingTitle}
                              className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-brand-400 hover:text-brand-300 transition-colors disabled:opacity-50"
                            >
                              <Sparkles size={12} className={isGeneratingTitle ? "animate-pulse" : ""} />
                              {isGeneratingTitle ? "Generating..." : originalTitle && originalTitle !== title ? "Remix" : "Generate"}
                            </button>
                          </div>
                        </div>
                        <input 
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g., Brand Identity"
                          className="w-full bg-base-950 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-brand-400/50 transition-all text-white placeholder:text-base-700"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-[10px] font-bold text-base-500 uppercase tracking-[0.2em] mb-0">Description</label>
                          <div className="flex items-center gap-3">
                            {originalDescription && originalDescription !== description && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDescription(originalDescription);
                                  setOriginalDescription('');
                                }}
                                className="flex items-center gap-1 text-[10px] font-medium tracking-wide text-base-400 hover:text-white transition-colors"
                                title="Revert to original"
                              >
                                <Undo2 size={12} />
                                Revert
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleGenerateAI('description', description, setOriginalDescription, originalDescription, setDescription, setIsGeneratingDescription, "You are an assistant. Write a concise, 1-2 sentence description explaining the purpose of this AI art workspace based on the user's input. Return ONLY the description.")}
                              disabled={isGeneratingDescription}
                              className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-brand-400 hover:text-brand-300 transition-colors disabled:opacity-50"
                            >
                              <Sparkles size={12} className={isGeneratingDescription ? "animate-pulse" : ""} />
                              {isGeneratingDescription ? "Generating..." : originalDescription && originalDescription !== description ? "Remix" : "Generate"}
                            </button>
                          </div>
                        </div>
                        <textarea 
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Briefly describe the purpose of this space..."
                          className="w-full bg-base-950 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-brand-400/50 transition-all h-24 resize-none text-white placeholder:text-base-700"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-[10px] font-bold text-base-500 uppercase tracking-[0.2em] mb-0">Space Prompt (System Guidance)</label>
                          <div className="flex items-center gap-3">
                            {originalPrompt && originalPrompt !== prompt && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPrompt(originalPrompt);
                                  setOriginalPrompt('');
                                }}
                                className="flex items-center gap-1 text-[10px] font-medium tracking-wide text-base-400 hover:text-white transition-colors"
                                title="Revert to original"
                              >
                                <Undo2 size={12} />
                                Revert
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleGenerateAI('prompt', prompt, setOriginalPrompt, originalPrompt, setPrompt, setIsGeneratingPrompt, "You are an expert AI prompt engineer for vector art. Expand the user's input into a highly detailed system instruction (3-5 sentences) that will guide an SVG generator. Focus on specific visual styles, color palettes, shapes, and technical SVG approaches. Avoid introductory text, just provide the prompt.")}
                              disabled={isGeneratingPrompt}
                              className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-brand-400 hover:text-brand-300 transition-colors disabled:opacity-50"
                            >
                              <Sparkles size={12} className={isGeneratingPrompt ? "animate-pulse" : ""} />
                              {isGeneratingPrompt ? "Generating..." : originalPrompt && originalPrompt !== prompt ? "Remix" : "Generate"}
                            </button>
                          </div>
                        </div>
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
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addUrl();
                                }
                              }}
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
                              <button type="button" onClick={() => removeKnowledge(i)} className="w-8 h-8 flex items-center justify-center text-base-600 hover:text-red-400 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {formError && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-in fade-in zoom-in duration-200">
                        <span className="material-symbols-outlined text-[20px]">error</span>
                        {formError}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center gap-2 text-xs font-medium h-5">
                        {saveStatus === 'saving' && <span className="text-brand-400 animate-pulse transition-opacity">Saving...</span>}
                        {saveStatus === 'saved' && <span className="text-green-400 flex items-center gap-1 transition-opacity"><Check size={14} /> Saved</span>}
                        {saveStatus === 'error' && <span className="text-red-400 transition-opacity">Error saving</span>}
                      </div>

                      <button 
                        type="button"
                        onClick={handleCloseForm}
                        className="px-10 py-4 rounded-xl bg-brand-400 text-base-950 font-bold transition-all uppercase tracking-widest text-xs shadow-lg shadow-brand-400/20 hover:bg-brand-300"
                      >
                        Done
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
