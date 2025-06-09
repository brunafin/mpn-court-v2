import React from "react";

const VoleyNetIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="8" y1="8" x2="8" y2="56" />
    <line x1="56" y1="8" x2="56" y2="56" />
    <line x1="8" y1="16" x2="56" y2="16" />
    <line x1="8" y1="24" x2="56" y2="24" />
    <line x1="8" y1="32" x2="56" y2="32" />
    <line x1="8" y1="40" x2="56" y2="40" />
    <line x1="8" y1="48" x2="56" y2="48" />
    <line x1="16" y1="16" x2="16" y2="48" />
    <line x1="24" y1="16" x2="24" y2="48" />
    <line x1="32" y1="16" x2="32" y2="48" />
    <line x1="40" y1="16" x2="40" y2="48" />
    <line x1="48" y1="16" x2="48" y2="48" />
  </svg>
);

export default VoleyNetIcon;
