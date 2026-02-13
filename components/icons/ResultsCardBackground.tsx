import React from 'react';

interface ResultsCardBackgroundProps {
  isPassed: boolean;
}

const ResultsCardBackground: React.FC<ResultsCardBackgroundProps> = ({ isPassed }) => {
  const colors = isPassed
    ? { light: '#dcfce7', dark: '#4ade80', pattern: '#86efac' } // Grüntöne
    : { light: '#fee2e2', dark: '#f87171', pattern: '#fca5a5' }; // Rottöne

  return (
    <div className="absolute inset-0 w-full h-full opacity-20" aria-hidden="true">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 120"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="results-card-pattern" patternUnits="userSpaceOnUse" width="16" height="16">
            <path d="M 8,0 l 8,8 l -8,8 l -8,-8 z" fill={colors.pattern} />
          </pattern>
        </defs>
        
        <path
          d="M 180,30 C 240,80 280,10 340,50 C 400,90 420,60 420,60 L 420,0 L 180,0 Z"
          fill={colors.light}
        />
        <path
          d="M 200,90 C 260,130 320,60 380,80 C 440,100 420,120 420,120 L 420,70 C 370,90 310,40 250,80 C 210,100 200,90 200,90 Z"
          fill={colors.dark}
        />
        
        <g transform="translate(40, 45) scale(1.1)">
          <path d="M 0,25 C -20,50 20,65 30,50 C 40,35 45,15 30,5 C 15,-5 -20,0 0,25 Z" fill="url(#results-card-pattern)" />
          <circle cx="-15" cy="0" r="10" fill="url(#results-card-pattern)" />
          <circle cx="15" cy="-15" r="10" fill="url(#results-card-pattern)" />
          <circle cx="45" cy="0" r="10" fill="url(#results-card-pattern)" />
        </g>
      </svg>
    </div>
  );
};

export default ResultsCardBackground;
