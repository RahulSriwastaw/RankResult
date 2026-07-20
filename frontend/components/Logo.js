import React from 'react';
import Link from 'next/link';

export default function Logo({ className = "", size = "md", href = "/" }) {
  const isSm = size === "sm";
  const isLg = size === "lg";

  const badgeSize = isSm ? "w-8 h-8" : isLg ? "w-11 h-11" : "w-10 h-10";
  const textSize = isSm ? "text-lg" : isLg ? "text-2xl sm:text-3xl" : "text-xl sm:text-[23px]";
  const badgeFont = isSm ? "text-[13px]" : isLg ? "text-[17px]" : "text-[15px]";

  const content = (
    <div className={`flex items-center gap-2.5 shrink-0 select-none ${className}`}>
      {/* Shield Glowing Badge */}
      <div className={`relative flex items-center justify-center ${badgeSize} shrink-0`}>
        <svg
          className="w-full h-full drop-shadow-[0_0_12px_rgba(139,92,246,0.65)]"
          viewBox="0 0 40 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 2L3 8.5V22C3 31.8 10.3 40.8 20 43.5C29.7 40.8 37 31.8 37 22V8.5L20 2Z"
            fill="url(#rvShieldBg)"
            stroke="url(#rvShieldBorder)"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="rvShieldBg" x1="20" y1="2" x2="20" y2="43.5" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="60%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#0a0e27" />
            </linearGradient>
            <linearGradient id="rvShieldBorder" x1="3" y1="2" x2="37" y2="43.5" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center font-black ${badgeFont} tracking-tighter pt-0.5`}>
          <span className="bg-gradient-to-br from-white via-purple-200 to-indigo-300 text-transparent bg-clip-text drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] font-sans">
            RR
          </span>
        </div>
      </div>

      {/* Brand Text */}
      <div className={`flex items-center font-black tracking-tight ${textSize}`}>
        <span className="text-white">Rank</span>
        <span className="text-[#FF9F1C]">Result</span>
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label="RankResult Home" className="inline-flex">
      {content}
    </Link>
  );
}
