import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export const Footer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  // Obfuscated data to prevent bot scraping
  const siteParts = ['https://', 'schoedel', '.', 'design'];
  const emailParts = ['contact', 'schoedel.design'];
  const nameParts = ['Schoedel', 'Design', 'AI'];

  const handleSiteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(siteParts.join(''), '_blank', 'noopener,noreferrer');
  };

  const handleEmailCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    const email = `${emailParts[0]}@${emailParts[1]}`;
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <footer className="bg-[#1C2A3C] text-white w-full mt-auto flex flex-col">
      <hr className="border-[#101A28] w-[90%] max-w-5xl mx-auto" />
      <div className="py-8 px-4 flex flex-col items-center justify-center gap-3 text-sm">
        <div className="flex items-center gap-1">
          <a
            href="#"
            onClick={handleSiteClick}
            className="hover:text-gray-300 transition-colors font-medium text-white"
            title={`Visit ${nameParts.join(' ')}`}
          >
            {nameParts.join(' ')}
          </a>
          <span className="mx-1">&middot;</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-base-400">
          <a href="/privacy.html" className="hover:text-white transition-colors">Privacy Policy</a>
          <span className="text-base-600">|</span>
          <a href="/terms.html" className="hover:text-white transition-colors">Terms of Service</a>
          <span className="text-base-600">|</span>
          <button
            onClick={handleEmailCopy}
            className="hover:text-white transition-colors flex items-center justify-center group relative"
            title="Copy email address"
          >
            <span>{emailParts[0]}&#64;{emailParts[1]}</span>
            <span className="absolute -right-5 flex items-center">
              {copied ? (
                <Check size={14} className="text-green-400" />
              ) : (
                <Copy size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
};
