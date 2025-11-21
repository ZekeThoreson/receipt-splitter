// LandingHero.jsx
import React from 'react';
import { HeroTitle } from './HeroTitle';

export function LandingHero({
  onScanClick,
  colors = {
    heading: '#FFFFFF',
    body: '#F5F5F5',
    accent: '#FDF701',
  },
}) {
  return (
    <section className="mb-8">
      <HeroTitle
        title="Receipt Splitter"
        subtitle="Split the bill. Skip the hassle."
        colors={{
          heading: colors.heading,
          body: colors.body,
        }}
      />

      <p
        className="text-xs md:text-sm text-center max-w-md mx-auto mb-4"
        style={{ color: colors.body, opacity: 0.75 }}
      >
        Scan your receipt, assign items, and see exactly what everyone owes —
        with clean splits and zero math.
      </p>

      <div className="flex justify-center mb-6">
        <button
          onClick={onScanClick}
          className="px-5 py-2 rounded-md text-sm font-semibold uppercase tracking-wide flex items-center gap-2"
          style={{
            backgroundColor: colors.accent,
            color: '#000000',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#EDE700';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.accent;
          }}
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ color: '#000000' }}
          >
            photo_camera
          </span>
          Scan Receipt
        </button>
      </div>
    </section>
  );
}
