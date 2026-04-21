import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, addDoc } from 'firebase/firestore';
import { ShieldCheck, X, Layers, Trash2, Camera, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { StyleCategory, StyleSelection, StyleRef } from '../types';
import { getStyleRefs, uploadStyleRefImage, saveStyleRefMetadata, deleteStyleRefImage, toSlug } from '../services/styleRefService';
import { ART_STYLES } from './artStyles';
import { ART_MOVEMENTS } from './artMovements';
import { GRAPHIC_DESIGNERS } from './artDesigners';
import { ILLUSTRATORS } from './artIllustrators';
import { MASTER_ARTISTS } from './artArtists';
import { CustomSelect } from './CustomSelect';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

type Tab = 'general' | 'style_library';

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, userId }) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [email, setEmail] = useState('');
  const [clients, setClients] = useState<{ email: string; addedBy: string; timestamp: number }[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);

  // Style Library State
  const [selectedCategory, setSelectedCategory] = useState<StyleCategory>('period');
  const [selectedName, setSelectedName] = useState('');
  const [currentStyleRef, setCurrentStyleRef] = useState<StyleRef | null>(null);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const unsubscribe = onSnapshot(collection(db, 'allowed_clients'), (snapshot) => {
      const clientList: any[] = [];
      snapshot.forEach((doc) => {
        clientList.push({ email: doc.id, ...doc.data() });
      });
      setClients(clientList);
    });

    return () => unsubscribe();
  }, [isOpen]);

  // Load style refs when selection changes
  useEffect(() => {
    if (activeTab === 'style_library' && selectedName) {
      loadStyleRefs();
    } else {
      setCurrentStyleRef(null);
    }
  }, [activeTab, selectedCategory, selectedName]);

  const loadStyleRefs = async () => {
    setIsLoadingImages(true);
    try {
      const selection: StyleSelection = {
        category: selectedCategory,
        name: selectedName,
        slug: toSlug(selectedName)
      };
      const refDoc = await getStyleRefs(selection);
      setCurrentStyleRef(refDoc);
    } catch (err) {
      console.error('Failed to load style refs', err);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      await setDoc(doc(db, 'allowed_clients', email.trim().toLowerCase()), {
        addedBy: 'admin',
        timestamp: Date.now()
      });
      setEmail('');
    } catch (error) {
      console.error("Error adding client:", error);
    }
  };

  const handleRemoveClient = async (clientEmail: string) => {
    try {
      await deleteDoc(doc(db, 'allowed_clients', clientEmail));
    } catch (error) {
      console.error("Error removing client:", error);
    }
  };

  const handleSeedSpace = async () => {
    if (!userId || isSeeding) return;
    setIsSeeding(true);
    try {
      await addDoc(collection(db, 'users', userId, 'spaces'), {
        uid: userId,
        title: "Brand Identity",
        description: "A sample space for maintaining consistent brand visuals.",
        prompt: "Always use a minimalist, high-contrast aesthetic with emerald green accents (#10B981) and clean geometric shapes. Ensure all vectors have a professional, modern tech vibe.",
        knowledge: [
          { type: 'url', value: 'https://brand.schoedel.design/guidelines' }
        ],
        timestamp: Date.now()
      });
      alert('Space seeded successfully!');
    } catch (error) {
      console.error("Error seeding space:", error);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedName) return;

    if (currentStyleRef && currentStyleRef.imageUrls.length >= 3) {
      alert('Maximum of 3 reference images allowed per style.');
      return;
    }

    setIsUploading(true);
    try {
      const selection: StyleSelection = {
        category: selectedCategory,
        name: selectedName,
        slug: toSlug(selectedName)
      };

      const nextIndex = currentStyleRef ? currentStyleRef.imageUrls.length : 0;
      const { downloadUrl, gcsUri } = await uploadStyleRefImage(selection, file, nextIndex);
      
      const newUrls = currentStyleRef ? [...currentStyleRef.imageUrls, downloadUrl] : [downloadUrl];
      const newUris = currentStyleRef ? [...currentStyleRef.imageGcsUris, gcsUri] : [gcsUri];
      
      await saveStyleRefMetadata(selection, newUrls, newUris);
      await loadStyleRefs(); // Reload to get fresh state

    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!selectedName || !currentStyleRef) return;
    if (!confirm('Are you sure you want to remove this reference image?')) return;

    try {
      const selection: StyleSelection = {
        category: selectedCategory,
        name: selectedName,
        slug: toSlug(selectedName)
      };
      await deleteStyleRefImage(selection, imageUrl, currentStyleRef);
      await loadStyleRefs();
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete image.');
    }
  };

  const getOptionsForCategory = () => {
    switch (selectedCategory) {
      case 'period': return ART_STYLES;
      case 'movement': return ART_MOVEMENTS;
      case 'designer': return GRAPHIC_DESIGNERS;
      case 'illustrator': return ILLUSTRATORS;
      case 'artist': return MASTER_ARTISTS;
      default: return [];
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1A2634] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20 flex-shrink-0">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-semibold text-white font-display flex items-center gap-2">
              <ShieldCheck size={20} className="text-brand-400" />
              Admin
            </h2>
            <div className="flex bg-[#101A28] rounded-lg p-1 border border-white/5">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'general' ? 'bg-[#00A2FD]/20 text-[#00A2FD]' : 'text-base-400 hover:text-white'
                }`}
              >
                Access & Tools
              </button>
              <button
                onClick={() => setActiveTab('style_library')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'style_library' ? 'bg-[#00A2FD]/20 text-[#00A2FD]' : 'text-base-400 hover:text-white'
                }`}
              >
                <Camera size={14} />
                Style Library
              </button>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-base-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'general' && (
            <div className="space-y-8 max-w-md">
              <section>
                <h3 className="text-xs font-bold text-base-500 uppercase tracking-widest mb-4">Quick Actions</h3>
                <button
                  onClick={handleSeedSpace}
                  disabled={isSeeding}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-brand-400/10 border border-brand-400/20 rounded-xl text-brand-400 font-bold text-xs uppercase tracking-widest hover:bg-brand-400/20 transition-all disabled:opacity-50"
                >
                  <Layers size={18} />
                  {isSeeding ? 'Seeding...' : 'Seed Sample Space'}
                </button>
              </section>

              <section>
                <form onSubmit={handleAddClient} className="mb-6">
                  <label className="block text-[10px] font-bold text-base-500 uppercase tracking-[0.2em] mb-3">Add Client User</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-base-500 focus:outline-none focus:border-brand-500/50"
                      required
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand-500 text-base-950 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-brand-400 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </form>

                <div>
                  <h3 className="text-[10px] font-bold text-base-500 uppercase tracking-[0.2em] mb-3">Current Clients</h3>
                  {clients.length === 0 ? (
                    <p className="text-sm text-base-500 italic">No clients added yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {clients.map((client) => (
                        <li key={client.email} className="flex items-center justify-between bg-black/20 border border-white/5 rounded-lg p-3">
                          <span className="text-sm text-white">{client.email}</span>
                          <button
                            onClick={() => handleRemoveClient(client.email)}
                            className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-400/10 transition-colors"
                            title="Remove client"
                          >
                            <Trash2 size={18} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'style_library' && (
            <div className="flex flex-col gap-6 h-full">
              <div className="bg-[#101A28] border border-white/5 rounded-xl p-4 flex-shrink-0">
                <h3 className="text-[10px] font-bold text-[#00A2FD] uppercase tracking-[0.2em] mb-4">Select Target Style</h3>
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-base-400">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value as StyleCategory);
                        setSelectedName('');
                      }}
                      className="bg-[#1A2634] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#00A2FD]/50 min-w-[140px]"
                    >
                      <option value="period">Art Period</option>
                      <option value="movement">Art Movement</option>
                      <option value="designer">Graphic Designer</option>
                      <option value="illustrator">Illustrator</option>
                      <option value="artist">Master Artist</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-base-400">Style / Name</label>
                    <CustomSelect
                      label="Select"
                      value={selectedName}
                      onChange={setSelectedName}
                      options={getOptionsForCategory()}
                      placeholder="Choose..."
                    />
                  </div>
                </div>
              </div>

              {selectedName ? (
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-white">{selectedName}</h3>
                      <p className="text-sm text-base-400">
                        {currentStyleRef?.imageCount || 0} / 3 reference images curated
                      </p>
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleUploadImage}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || (currentStyleRef?.imageCount || 0) >= 3}
                        className="flex items-center gap-2 px-4 py-2 bg-[#00A2FD] text-white rounded-lg text-sm font-semibold hover:bg-[#0090e6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#00A2FD]/20"
                      >
                        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        Upload Image
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#101A28] border border-white/5 rounded-xl flex-1 p-6 flex flex-col items-center justify-center">
                    {isLoadingImages ? (
                      <Loader2 size={32} className="text-[#00A2FD] animate-spin" />
                    ) : currentStyleRef && currentStyleRef.imageUrls.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full auto-rows-max">
                        {currentStyleRef.imageUrls.map((url, i) => (
                          <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-[#1A2634]">
                            <img src={url} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={() => handleDeleteImage(url)}
                                className="p-3 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-full transition-colors backdrop-blur-md"
                                title="Delete image"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center max-w-sm">
                        <div className="w-16 h-16 bg-[#00A2FD]/10 text-[#00A2FD] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#00A2FD]/20">
                          <ImageIcon size={32} />
                        </div>
                        <h4 className="text-white font-medium mb-2">No Visual References Yet</h4>
                        <p className="text-sm text-base-400 leading-relaxed">
                          Upload up to 3 hand-curated images that exemplify the visual grammar—colors, line weight, rendering techniques—of {selectedName}.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                  <Camera size={48} className="text-base-500/50 mb-4" />
                  <p className="text-base-400">Select a style category and name to manage its visual library.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
