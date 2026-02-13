import React from 'react';

const KeyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.25H0v-2.25H-2.25A2.25 2.25 0 010 15V9.75a2.25 2.25 0 012.25-2.25h1.5A2.25 2.25 0 016 9.75v1.5H7.5v-1.5a3 3 0 013-3h.75"
    />
  </svg>
);

export default KeyIcon;
