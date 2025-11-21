// SplashScreen.jsx
import React from 'react';

export function SplashScreen({ visible, appName = 'Receipt Splitter', tagline }) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: '#0A0A0A' }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-[28px]"
            style={{ color: '#FDF701' }}
          >
            receipt_long
          </span>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: '#FFFFFF' }}
          >
            {appName}
          </h1>
        </div>

        {tagline && (
          <p
            className="text-xs uppercase tracking-[0.18em] text-center"
            style={{ color: '#F5F5F5', opacity: 0.8 }}
          >
            {tagline}
          </p>
        )}

        {/* Simple loading bar */}
        <div className="w-40 h-1 rounded-full mt-4" style={{ backgroundColor: '#222222' }}>
          <div
            // Animation timing – tweak duration here
            className="h-1 rounded-full animate-pulse"
            style={{
              width: '60%',
              backgroundColor: '#FDF701',
            }}
          />
        </div>
      </div>
    </div>
  );
}
