import React from 'react';

interface BrandLogoProps {
  className?: string;
  compact?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', compact = false }) => {
  return (
    <span className={`inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 ${className}`}>
      <svg
        width={compact ? 28 : 34}
        height={compact ? 28 : 34}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="40" height="40" rx="10" fill="#2C1A12" />
        <path
          d="M20 7C16.8 11.2 14.5 14.4 14.5 17.8C14.5 20.9 16.95 23.2 20 23.2C23.05 23.2 25.5 20.9 25.5 17.8C25.5 14.4 23.2 11.2 20 7Z"
          fill="#E5A93B"
        />
        <path
          d="M11 23.5C13.8 23.5 16.4 24.8 18.2 26.8H21.8C23.6 24.8 26.2 23.5 29 23.5C28.2 28.1 24.5 31.2 20 31.2C15.5 31.2 11.8 28.1 11 23.5Z"
          fill="#FAF5EB"
        />
        <circle cx="20" cy="17.5" r="1.8" fill="#2C1A12" />
      </svg>
      <span
        className="font-bold tracking-tight text-[#2C1A12] whitespace-nowrap shrink-0"
        style={{ fontFamily: 'var(--font-display)', fontSize: compact ? '1.05rem' : '1.22rem' }}
      >
        Tariq Sweets &amp; Bakes
      </span>
    </span>
  );
};
