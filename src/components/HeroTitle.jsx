// HeroTitle.jsx
import React from 'react';

export function HeroTitle({
  title,
  subtitle,
  align = 'center',
  className = '',
  colors = {
    heading: '#FFFFFF',
    body: '#F5F5F5',
  },
}) {
  const alignment =
    align === 'left'
      ? 'text-left items-start'
      : align === 'right'
      ? 'text-right items-end'
      : 'text-center items-center';

  return (
    <div className={`flex flex-col ${alignment} mb-8 ${className}`}>

        {/* Inline icon + title */}
        <div className="flex items-center gap-2">
            <span
            className="material-symbols-outlined text-[32px]"
            style={{ color: colors.heading }}
            >
            receipt_long
            </span>

            <h1
            className="text-4xl font-bold"
            style={{ color: colors.heading }}
            >
            {title}
            </h1>
        </div>

        {/* Subtitle */}
        {subtitle && (
            <p
            className="mt-1 text-sm tracking-wide"
            style={{ color: colors.body, opacity: 0.85 }}
            >
            {subtitle}
            </p>
        )}
    </div>

  );
}
