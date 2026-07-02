import Link from 'next/link';

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size * (170 / 36)}
      height={size}
      viewBox="0 0 170 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ScaleAki"
    >
      <rect x="2" y="2" width="32" height="32" rx="9" fill="#10b981" />
      <path
        d="M4 32L14 22"
        stroke="#cbd5e1"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M4 32L14 22"
        stroke="#94a3b8"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="16" r="6.5" stroke="#ffffff" strokeWidth="2.5" fill="none" />
      <text
        x="20"
        y="20.5"
        fontFamily="Outfit, sans-serif"
        fontSize="11"
        fontWeight="900"
        fill="#ffffff"
        textAnchor="middle"
      >
        $
      </text>
      <text
        x="44"
        y="26"
        fontFamily="Outfit, sans-serif"
        fontSize="24"
        fontWeight="900"
        letterSpacing="-0.8"
      >
        <tspan fill="#ffffff">scale</tspan>
        <tspan fill="#10b981">aki</tspan>
      </text>
    </svg>
  );
}

export function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="32" height="32" rx="9" fill="#10b981" />
      <path d="M4 32L14 22" stroke="#cbd5e1" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M4 32L14 22" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="20" cy="16" r="6.5" stroke="#fff" strokeWidth="2.5" fill="none" />
      <text x="20" y="20.5" fontFamily="Outfit, sans-serif" fontSize="11" fontWeight="900" fill="#fff" textAnchor="middle">$</text>
    </svg>
  );
}

// re-export for any wrapper usage
export { Link };