/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { InputSection } from './components/InputSection';
import { SvgPreview } from './components/SvgPreview';
import { Header } from './components/Header';
import { HistoryModal } from './components/HistoryModal';
import { Footer } from './components/Footer';
import { AdminPanel } from './components/AdminPanel';
import { SpacesManager } from './components/SpacesManager';
import { AvatarSelector } from './components/AvatarSelector';
import { ApiKeySetup } from './components/ApiKeySetup';
import { generateSvgFromPrompt, ReferenceFile } from './services/geminiService';
import { getAvatarSvg } from './services/avatarService';
import { GeneratedSvg, GenerationStatus, ApiError, Space, UserProfile } from './types';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';

const API_KEY_STORAGE_KEY = 'vectorcraft_gemini_api_key';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo?: any[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const App: React.FC = () => {
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [currentSvg, setCurrentSvg] = useState<GeneratedSvg | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedSvg[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [referenceUrl, setReferenceUrl] = useState('');
  const [isClientUser, setIsClientUser] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);

  // BYOK: API key stored in localStorage
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(() => {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  });
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const handleSaveApiKey = (key: string) => {
    if (key) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
      setGeminiApiKey(key);
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      setGeminiApiKey(null);
    }
    setIsApiKeyModalOpen(false);
  };

  useEffect(() => {
    // Handle the result of a redirect-based sign-in (fallback from popup)
    getRedirectResult(auth).catch((error) => {
      console.error("Redirect sign-in failed", error);
      setLoginError(error?.message || "Sign-in failed. Please try again.");
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        // Listen to user profile
        const userDocRef = doc(db, 'users', currentUser.uid);
        onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const profile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              avatarConfig: data.avatarConfig,
              isUnlimited: data.role === 'admin'
            };
            
            // Add generated SVG to profile for UI
            if (profile.avatarConfig) {
              (profile as any).avatarSvg = getAvatarSvg(profile.avatarConfig.style, profile.avatarConfig.seed);
            }
            
            setUserProfile(profile);
          }
        });

        setDoc(doc(db, 'users', currentUser.uid), { role: 'user' }, { merge: true }).catch(e => {
          console.error("Failed to bootstrap user role", e);
        });

        if (currentUser.email) {
          const clientDocRef = doc(db, 'allowed_clients', currentUser.email);
          onSnapshot(clientDocRef, (docSnap) => {
            setIsClientUser(docSnap.exists());
          }, (err) => {
            console.error("Failed to check client status", err);
          });
        }
      } else {
        setIsClientUser(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setHistory([]);
      return;
    }

    const path = `users/${user.uid}/svgs`;
    const q = query(
      collection(db, path),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const svgs: GeneratedSvg[] = [];
      snapshot.forEach((doc) => {
        svgs.push({ id: doc.id, ...doc.data() } as GeneratedSvg);
      });
      setHistory(svgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-cancelled-by-user') {
        // Fall back to redirect-based sign-in when popup is blocked
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError: any) {
          console.error("Redirect sign-in failed", redirectError);
          setLoginError(redirectError?.message || "Sign-in failed. Please try again.");
        }
      } else {
        console.error("Login failed", error);
        setLoginError(error?.message || "Sign-in failed. Please try again.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleSaveAvatar = async (config: { style: string; seed: string }) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        avatarConfig: config
      });
    } catch (error) {
      console.error("Error updating avatar:", error);
    }
  };

  const isUnlimited = user?.email === 'schoedelb@gmail.com' || userProfile?.isUnlimited;
  const isClient = isClientUser || isUnlimited; // Admin has all client features
  
  const RECENT_LIMIT = isClient ? 25 : 5;
  const HOURS_LIMIT = isClient ? 24 : 72;
  const limitTime = Date.now() - (HOURS_LIMIT * 60 * 60 * 1000);
  const recentGenerationsCount = history.filter(svg => svg.timestamp > limitTime).length;
  const generationsLeft = isUnlimited ? Infinity : Math.max(0, RECENT_LIMIT - recentGenerationsCount);

  const handleGenerate = async (prompt: string) => {
    if (!user) {
      setError({
        message: "Sign In Required",
        details: "Please sign in to generate vector art."
      });
      setStatus(GenerationStatus.ERROR);
      return;
    }

    if (!geminiApiKey) {
      setError({
        message: "API Key Required",
        details: "Please add your Gemini API key to start generating."
      });
      setStatus(GenerationStatus.ERROR);
      return;
    }

    if (!isUnlimited && generationsLeft <= 0) {
      setError({
        message: "Generation Limit Reached",
        details: `You have reached your limit of ${RECENT_LIMIT} generations per ${HOURS_LIMIT} hours. Please try again later.`
      });
      setStatus(GenerationStatus.ERROR);
      return;
    }

    setStatus(GenerationStatus.LOADING);
    setError(null);
    setCurrentSvg(null);

    try {
      let reference: ReferenceFile | undefined = undefined;
      
      if (selectedFile) {
        if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]); // Remove data:image/...;base64,
            };
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });
          reference = { type: selectedFile.type === 'application/pdf' ? 'pdf' : 'image', mimeType: selectedFile.type, data: base64 };
        } else if (selectedFile.name.endsWith('.docx')) {
          const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = reject;
            reader.readAsArrayBuffer(selectedFile);
          });
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ arrayBuffer });
          reference = { type: 'text', mimeType: 'text/plain', data: result.value };
        } else {
          const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(selectedFile);
          });
          reference = { type: 'text', mimeType: selectedFile.type, data: text };
        }
      }

      const svgContent = await generateSvgFromPrompt(
        geminiApiKey,
        prompt, 
        reference, 
        referenceUrl,
        selectedSpace?.prompt,
        selectedSpace?.knowledge
      );
      
      // Clear selected file after successful generation
      setSelectedFile(null);
      setReferenceUrl('');
      
      // Validate the generated SVG content
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
      const parserError = svgDoc.querySelector("parsererror");
      const isSvg = svgDoc.documentElement.tagName.toLowerCase() === 'svg';

      if (parserError || !isSvg) {
        throw new Error("The AI generated invalid SVG code. Please try a different prompt or try again.");
      }

      const id = crypto.randomUUID();
      const timestamp = Date.now();
      
      const newSvg: GeneratedSvg = {
        id,
        content: svgContent,
        prompt: prompt,
        timestamp,
        spaceId: selectedSpace?.id
      };
      
      setCurrentSvg(newSvg);
      setStatus(GenerationStatus.SUCCESS);

      if (user) {
        const path = `users/${user.uid}/svgs/${id}`;
        try {
          await setDoc(doc(db, `users/${user.uid}/svgs`, id), {
            uid: user.uid,
            prompt,
            content: svgContent,
            timestamp,
            spaceId: selectedSpace?.id || null
          });
        } catch (dbError) {
          handleFirestoreError(dbError, OperationType.CREATE, path);
        }
      }
    } catch (err: any) {
      setStatus(GenerationStatus.ERROR);
      setError({
        message: "Generation Failed",
        details: err.message || "An unexpected error occurred while contacting Gemini."
      });
    }
  };

  const handleSaveToSpace = async (svgId: string, spaceId: string) => {
    if (!user) return;
    try {
      const svgRef = doc(db, `users/${user.uid}/svgs`, svgId);
      await updateDoc(svgRef, { spaceId });
      
      // Update local state if needed
      if (currentSvg && currentSvg.id === svgId) {
        setCurrentSvg({ ...currentSvg, spaceId });
      }
    } catch (error) {
      console.error("Error saving to space:", error);
    }
  };

  // Show the API key setup screen if logged in but no key is set
  const needsApiKey = user && !geminiApiKey;

  return (
    <div className="min-h-screen bg-[#101A28] text-base-50 font-sans selection:bg-brand-500/30 flex flex-col">
      <Header 
        user={user} 
        userProfile={userProfile}
        onLogin={handleLogin} 
        onLogout={handleLogout} 
        onOpenHistory={() => setIsHistoryOpen(true)} 
        onOpenAvatarSelector={() => setIsAvatarSelectorOpen(true)}
        isUnlimited={isUnlimited}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onLogoClick={() => setSelectedSpace(null)}
        hasApiKey={!!geminiApiKey}
        onManageApiKey={() => setIsApiKeyModalOpen(true)}
      />
      
      <main className="flex-1 pb-20 pt-8">
        {needsApiKey ? (
          <ApiKeySetup onSave={handleSaveApiKey} />
        ) : (
          <>
            <div className="max-w-2xl mx-auto px-4">
              {isClient && user && (
                <SpacesManager 
                  userId={user.uid} 
                  selectedSpaceId={selectedSpace?.id || null} 
                  onSelectSpace={setSelectedSpace} 
                />
              )}
            </div>

            <InputSection 
              onGenerate={handleGenerate} 
              status={status} 
              user={user}
              generationsLeft={generationsLeft}
              isUnlimited={isUnlimited}
              isClient={isClient}
              hoursLimit={HOURS_LIMIT}
              totalLimit={RECENT_LIMIT}
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
              referenceUrl={referenceUrl}
              onReferenceUrlChange={setReferenceUrl}
              onLogin={handleLogin}
            />

            {loginError && (
              <div className="max-w-2xl mx-auto mt-4 px-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-red-200">
                  <span className="material-symbols-outlined text-red-400 text-[20px] flex-shrink-0 mt-0.5">error</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-400 font-display">Sign-in Failed</h4>
                    <p className="text-sm text-red-300/70 mt-1">{loginError}</p>
                  </div>
                  <button
                    onClick={() => setLoginError(null)}
                    className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                    title="Dismiss"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              </div>
            )}
            
            {status === GenerationStatus.ERROR && error && (
              <div className="max-w-2xl mx-auto mt-8 px-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-red-200">
                  <span className="material-symbols-outlined text-red-400 text-[20px] flex-shrink-0 mt-0.5">error</span>
                  <div>
                    <h4 className="font-semibold text-red-400 font-display">{error.message}</h4>
                    <p className="text-sm text-red-300/70 mt-1">{error.details}</p>
                  </div>
                </div>
              </div>
            )}

            {status === GenerationStatus.SUCCESS && currentSvg && (
              <SvgPreview 
                data={currentSvg} 
                selectedSpace={selectedSpace}
                onSaveToSpace={handleSaveToSpace}
              />
            )}
            
            {/* Empty State / Placeholder */}
            {status === GenerationStatus.IDLE && (
              <div className="max-w-2xl mx-auto mt-16 text-center px-4 opacity-50 pointer-events-none select-none">
                 <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-base-800/50 border border-white/5 mb-4">
                    <svg className="w-12 h-12 text-base-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                       <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                       <circle cx="8.5" cy="8.5" r="1.5" />
                       <polyline points="21 15 16 10 5 21" />
                    </svg>
                 </div>
                 <p className="text-base-400 text-sm">Generated artwork will appear here</p>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        history={history} 
        onRegenerate={handleGenerate} 
      />

      <AdminPanel 
        isOpen={isAdminPanelOpen} 
        onClose={() => setIsAdminPanelOpen(false)} 
        userId={user?.uid || ''}
      />

      <AvatarSelector 
        isOpen={isAvatarSelectorOpen}
        onClose={() => setIsAvatarSelectorOpen(false)}
        currentConfig={userProfile?.avatarConfig}
        onSave={handleSaveAvatar}
      />

      {/* API Key management modal (for updating/removing an existing key) */}
      {isApiKeyModalOpen && (
        <ApiKeySetup 
          isModal 
          currentKey={geminiApiKey} 
          onSave={handleSaveApiKey} 
          onClose={() => setIsApiKeyModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;
