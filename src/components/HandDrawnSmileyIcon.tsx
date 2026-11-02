import React from 'react';

interface HandDrawnSmileyIconProps {
  className?: string;
  strokeWidth?: number;
  mood?: 'happy' | 'cheeky' | 'wink' | 'smug';
}

export const HandDrawnSmileyIcon: React.FC<HandDrawnSmileyIconProps> = ({
  className = 'w-6 h-6',
  strokeWidth = 2.5,
  mood = 'happy',
}) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Hand-drawn organic, slightly wobbly outer face circle */}
      <path
        d="M 23.8 4.5 C 34.5 4.1 43.5 12.8 43.5 23.5 C 43.5 34.8 35.2 43.5 24.2 43.5 C 13 43.5 4.5 35 4.5 24 C 4.5 13.2 13.2 4.9 23.8 4.5 C 28.5 4.3 36 6.8 39.5 10.5"
        strokeWidth={strokeWidth}
        className="opacity-95"
      />

      {/* Hand-drawn Left Eye */}
      {mood === 'wink' ? (
        <path d="M 14 18.5 Q 17.5 15.5 21 18.5" strokeWidth={strokeWidth} />
      ) : (
        <>
          <ellipse
            cx="17"
            cy="18.5"
            rx="2.2"
            ry="2.8"
            fill="currentColor"
            stroke="none"
          />
          {/* Hand-drawn eye glint highlight */}
          <circle cx="16.2" cy="17.5" r="0.8" fill="#FFFFFF" stroke="none" />
        </>
      )}

      {/* Hand-drawn Right Eye */}
      <ellipse
        cx="31"
        cy="18.5"
        rx="2.2"
        ry="2.8"
        fill="currentColor"
        stroke="none"
      />
      <circle cx="30.2" cy="17.5" r="0.8" fill="#FFFFFF" stroke="none" />

      {/* Hand-drawn Smile Curve according to mood */}
      {mood === 'smug' ? (
        <path
          d="M 15 30 C 20 31.5 28 29 34 24.5"
          strokeWidth={strokeWidth}
        />
      ) : mood === 'cheeky' ? (
        <>
          <path
            d="M 14 26.5 C 18 36.5 29 36.5 34 26.5"
            strokeWidth={strokeWidth}
          />
          {/* Hand-drawn tongue sticking out */}
          <path
            d="M 21 32 C 21 36.5 26 36.5 26 32"
            fill="currentColor"
            fillOpacity="0.3"
            strokeWidth={strokeWidth * 0.8}
          />
        </>
      ) : (
        <path
          d="M 14 27.5 C 17.5 36.5 30.5 36.5 34 27.5"
          strokeWidth={strokeWidth}
        />
      )}

      {/* Hand-drawn Cheek Dimples / Upturned smile tips */}
      <path
        d="M 12.5 26.5 C 13.2 28.5 15 28.8 15.5 27.2"
        strokeWidth={strokeWidth * 0.85}
      />
      <path
        d="M 32.5 27.2 C 33 28.8 34.8 28.5 35.5 26.5"
        strokeWidth={strokeWidth * 0.85}
      />

      {/* Cute Hand-drawn blush hatch marks */}
      <g strokeWidth={strokeWidth * 0.65} className="opacity-60">
        <path d="M 9.5 23 L 13 25" />
        <path d="M 11 21 L 14.5 23" />
        <path d="M 35 23 L 38.5 25" />
        <path d="M 33.5 21 L 37 23" />
      </g>
    </svg>
  );
};
