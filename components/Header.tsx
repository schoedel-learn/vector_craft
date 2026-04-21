/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LogoIcon } from './LogoIcon';
import { ShieldCheck, KeyRound, History, Pencil, LogOut, LogIn } from 'lucide-react';

interface HeaderProps {
  user: any;
  userProfile?: any;
  onLogin: () => void;
  onLogout: () => void;
  onOpenHistory: () => void;
  onOpenAvatarSelector?: () => void;
  isUnlimited?: boolean;
  onOpenAdminPanel?: () => void;
  onLogoClick?: () => void;
  hasApiKey?: boolean;
  onManageApiKey?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  user, 
  userProfile,
  onLogin, 
  onLogout, 
  onOpenHistory, 
  onOpenAvatarSelector,
  isUnlimited, 
  onOpenAdminPanel, 
  onLogoClick,
  hasApiKey,
  onManageApiKey
}) => {
  const avatarSvg = userProfile?.avatarSvg;

  return (
    <header className="w-full py-6 px-4 border-b border-base-700 bg-[#1C2A3C] sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <button 
          onClick={onLogoClick}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
        >
          <div className="flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Schoedel Design AI Logo" 
              className="w-10 h-10 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const svgFallback = e.currentTarget.nextElementSibling;
                if (svgFallback) {
                  (svgFallback as HTMLElement).style.display = 'block';
                }
              }}
            />
            <div style={{ display: 'none' }} className="text-white">
              <LogoIcon className="w-10 h-10" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-white tracking-tight font-display leading-[0.9]">
              Schoedel.
            </h1>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-medium text-white tracking-tight font-display leading-none">
                Design
              </span>
              <span className="text-[10px] font-bold text-white uppercase tracking-wider relative -top-2">
                AI
              </span>
            </div>
          </div>
        </button>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {isUnlimited && onOpenAdminPanel && (
                <button
                  onClick={onOpenAdminPanel}
                  className="flex items-center gap-2 text-sm font-medium text-[#00A2FD] hover:opacity-80 transition-colors"
                  title="Admin Panel"
                >
                  <ShieldCheck size={18} />
                  <span className="hidden sm:inline">Admin</span>
                </button>
              )}
              {onManageApiKey && (
                <button
                  onClick={onManageApiKey}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    hasApiKey 
                      ? 'text-base-400 hover:text-white' 
                      : 'text-amber-400 hover:text-amber-300'
                  }`}
                  title={hasApiKey ? "Manage API Key" : "Set up API Key"}
                >
                  <KeyRound size={18} />
                  <span className="hidden sm:inline">{hasApiKey ? 'API Key' : 'Add Key'}</span>
                </button>
              )}
              <button
                onClick={onOpenHistory}
                className="flex items-center gap-2 text-sm font-medium text-white hover:text-gray-300 transition-colors"
                title="View History"
              >
                <History size={18} />
                <span className="hidden sm:inline">History</span>
              </button>
              <div className="h-4 w-px bg-base-300 hidden sm:block"></div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={onOpenAvatarSelector}
                  className="relative group"
                  title="Customize Avatar"
                >
                  {avatarSvg ? (
                    <div 
                      className="w-11 h-11 rounded-full border border-base-200 bg-base-800 overflow-hidden group-hover:border-brand-400 transition-colors flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                      dangerouslySetInnerHTML={{ __html: avatarSvg }}
                    />
                  ) : (
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} 
                      alt="Avatar" 
                      className="w-11 h-11 rounded-full border border-base-200 group-hover:border-brand-400 transition-colors object-cover"
                    />
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#00A2FD] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                    <Pencil size={8} className="text-base-950" />
                  </div>
                </button>
                <button
                  onClick={onLogout}
                  className="text-sm text-white hover:text-gray-300 transition-colors flex items-center justify-center"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-base-900 rounded-lg hover:bg-base-800 transition-colors shadow-sm"
            >
              <LogIn size={18} />
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};