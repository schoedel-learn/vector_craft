/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { LogoIcon } from './LogoIcon';

interface HeaderProps {
  user: any;
  onLogin: () => void;
  onLogout: () => void;
  onOpenHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogin, onLogout, onOpenHistory }) => {
  return (
    <header className="w-full py-6 px-4 border-b border-base-700 bg-[#1C2A3C] sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Schoedel Design AI Logo" 
              className="w-10 h-10 object-contain"
              onError={(e) => {
                // Fallback to the SVG icon if the image fails to load
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
              <span className="text-xl font-medium text-white tracking-tight font-display leading-none">
                Design
              </span>
              <span className="text-[10px] font-bold text-white uppercase tracking-wider relative -top-2">
                AI
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <button
                onClick={onOpenHistory}
                className="flex items-center gap-2 text-sm font-medium text-white hover:text-gray-300 transition-colors"
                title="View History"
              >
                <span className="material-symbols-outlined text-[18px]">history</span>
                <span className="hidden sm:inline">History</span>
              </button>
              <div className="h-4 w-px bg-base-300 hidden sm:block"></div>
              <div className="flex items-center gap-3">
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full border border-base-200"
                />
                <button
                  onClick={onLogout}
                  className="text-sm text-white hover:text-gray-300 transition-colors flex items-center justify-center"
                  title="Sign Out"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-base-900 rounded-lg hover:bg-base-800 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};