import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, addDoc } from 'firebase/firestore';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, userId }) => {
  const [email, setEmail] = useState('');
  const [clients, setClients] = useState<{ email: string; addedBy: string; timestamp: number }[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);

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
      onClose();
    } catch (error) {
      console.error("Error seeding space:", error);
    } finally {
      setIsSeeding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1A2634] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20">
          <h2 className="text-xl font-semibold text-white font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-400">admin_panel_settings</span>
            Admin Panel
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-base-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-8">
          <section>
            <h3 className="text-xs font-bold text-base-500 uppercase tracking-widest mb-4">Quick Actions</h3>
            <button
              onClick={handleSeedSpace}
              disabled={isSeeding}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-400/10 border border-brand-400/20 rounded-xl text-brand-400 font-bold text-xs uppercase tracking-widest hover:bg-brand-400/20 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">layers</span>
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
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
