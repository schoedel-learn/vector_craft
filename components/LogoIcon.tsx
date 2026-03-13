import React from 'react';

export const LogoIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg 
    viewBox="0 0 256 256" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="12" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    {/* Book Outline */}
    <path d="M 115 200 L 75 200 C 40 200 30 180 30 140 L 30 100 C 30 60 40 40 75 40 L 215 40 C 222 40 228 46 228 53 L 228 187 C 228 194 222 200 215 200 L 145 200" />
    
    {/* Inner Line */}
    <path d="M 35 65 L 228 65" />
    
    {/* Middle Trace */}
    <path d="M 130 230 L 130 95" />
    <circle cx="130" cy="75" r="12" />
    
    {/* Left Trace */}
    <path d="M 90 200 L 90 175 L 65 150 L 65 140" />
    <circle cx="65" cy="120" r="12" />
    
    {/* Right Trace */}
    <path d="M 175 200 L 175 155 L 150 130 L 150 120" />
    <circle cx="150" cy="100" r="12" />
  </svg>
);
