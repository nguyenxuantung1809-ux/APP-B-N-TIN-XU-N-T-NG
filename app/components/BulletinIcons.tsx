import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function VietnamFlagIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
    <circle cx="12" cy="12" r="10.7" fill="#e5222a" stroke="#ffffff" strokeWidth="1.1" />
    <polygon points="12,4.25 13.86,9.2 19.15,9.45 15.02,12.76 16.42,17.86 12,14.94 7.58,17.86 8.98,12.76 4.85,9.45 10.14,9.2" fill="#ffe34d" />
  </svg>;
}

export function GlobalMarketsGlobeIcon(props: IconProps) {
  return <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" {...props}>
    <defs><clipPath id="global-map-clip"><circle cx="16" cy="16" r="14.35" /></clipPath></defs>
    <circle cx="16" cy="16" r="14.5" fill="#174b9a" stroke="#ffffff" strokeWidth="1.25" />
    <g clipPath="url(#global-map-clip)" fill="#ffffff">
      <path d="M2.4 10.1 4.8 6.4 8.1 3.5l4.25-.9 3.1 1.15.55 2.05-2.05.65-1.5-.7-1.05.95-2.15-.1-.8 1.3-1.95.55-.35 1.45-1.8.5-.25 1.35-1.55-.2z" />
      <path d="m5.05 11.15 2.65-.6 2.45 1.05 1.2 1.65 2.35.75 1.4 2.15-1.35 1.55-.25 2.35-1.25 1.55-.65 3.15-1.45 3.2-1.45-1.55-.3-2.7-1.25-1.65-.25-2.4-1.45-1.8.25-2.1-1.45-1.4z" />
      <path d="m15.7 5.45 2.45-1.6 3.15.05 1.35 1.05 2.45-.45 3.85 2.25 1.25 2.3-1.6 1.25-2.25-.2-1.35 1.35-2.3-.75-1.55.95-2.15-.35-1.75-1.55-2.4-.7-1.05-1.75 1.1-1.15z" />
      <path d="m16.1 11.2 3.25-.7 3.4 1.75.9 2.2-1.35 2.05-.45 3.1-1.45 2.15-.65 3.4-2.05 2.2-1.55-2.85-1.15-2.1.25-2.7-1.35-2.4.4-2.25-1.1-2.05z" />
      <path d="m25.1 17.5 2.15-.85 1.65.8-.5 1.65-1.8.9-1.25-.75z" />
    </g>
  </svg>;
}

export function WorldMarketIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" {...props}>
    <circle cx="11.5" cy="11.5" r="8.6" stroke="currentColor" strokeWidth="1.55" />
    <path d="M3.3 9.2h16.4M3.2 13.4h7.1M11.5 2.9c2.2 2.25 3.35 5.1 3.3 8.6M11.5 2.9C9.1 5.25 8.05 8.15 8.2 11.5" stroke="currentColor" strokeWidth="1.25" opacity=".82" />
    <path d="m10.2 17.25 2.45-2.05 2.05 1.25 4.15-4.05" stroke="#7ee8ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m16.75 12.35 2.2-.05-.1 2.18" stroke="#7ee8ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export function AssessmentIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" {...props}>
    <rect x="4.1" y="3.7" width="12.2" height="16.5" rx="2.1" stroke="currentColor" strokeWidth="1.55" />
    <path d="M7.8 3.9c.15-1.05.92-1.65 2.35-1.65s2.22.6 2.37 1.65v1.35H7.8zM7.2 9h5.8M7.2 12.3h4" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="16.8" cy="16.35" r="3.1" stroke="#7ee8ff" strokeWidth="1.65" />
    <path d="m19.1 18.65 2.15 2.1" stroke="#7ee8ff" strokeWidth="1.65" strokeLinecap="round" />
  </svg>;
}

export function CommodityGroupIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" {...props}>
    <ellipse cx="11.2" cy="4.8" rx="5.25" ry="1.75" fill="rgba(92,215,255,.16)" stroke="currentColor" strokeWidth="1.3" />
    <path d="M5.95 4.8v8.4c0 1.05 2.35 1.85 5.25 1.85s5.25-.8 5.25-1.85V4.8M5.95 8.25c1.3.75 3.05 1.05 5.25 1.05s3.95-.3 5.25-1.05M5.95 12.05c1.3.75 3.05 1.05 5.25 1.05s3.95-.3 5.25-1.05" stroke="currentColor" strokeWidth="1.25" />
    <path d="M19.35 7.15c-1.2 2.05-3.05 4.1-3.05 6.05a3.05 3.05 0 0 0 6.1 0c0-1.95-1.85-4-3.05-6.05Z" fill="rgba(126,232,255,.2)" stroke="#7ee8ff" strokeWidth="1.3" />
    <path d="m2.4 20.35 1.4-3.65h5.05l1.4 3.65zM9.05 20.35l1.4-3.65h5.05l1.4 3.65z" fill="rgba(92,215,255,.14)" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>;
}

export function RecommendationIdeaIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" {...props}>
    <path d="M8.15 17.15v-1.1c0-1.2-.45-2.05-1.2-2.95A6.15 6.15 0 1 1 17 13.1c-.75.9-1.2 1.75-1.2 2.95v1.1" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
    <path d="m9 9.95 2.05 2.05 4.05-4.2M8.5 19.05h7M9.55 21.2h4.9M12 1V.2M4.15 4.2l-1.3-1.3M19.85 4.2l1.3-1.3M2 10.25H.3M23.7 10.25H22" stroke="#7ee8ff" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export function OilBarrelIcon(props: IconProps) {
  return <svg viewBox="0 0 32 22" aria-hidden="true" focusable="false" {...props}>
    <defs>
      <linearGradient id="oil-barrel-body" x1="3" y1="3" x2="20" y2="20" gradientUnits="userSpaceOnUse"><stop stopColor="#8696a6" /><stop offset=".3" stopColor="#3b4857" /><stop offset="1" stopColor="#101721" /></linearGradient>
      <linearGradient id="oil-drop" x1="21" y1="7" x2="29" y2="20" gradientUnits="userSpaceOnUse"><stop stopColor="#ffd45d" /><stop offset=".45" stopColor="#f49b20" /><stop offset="1" stopColor="#d76013" /></linearGradient>
    </defs>
    <path d="M3.6 3.2h15.9v16.5H3.6z" fill="url(#oil-barrel-body)" stroke="#b2bfca" strokeWidth=".75" />
    <path d="M2.5 3.15h18.1M2.5 7h18.1M2.5 15.9h16.9M2.5 19.75h17.15" fill="none" stroke="#d2dbe2" strokeWidth="1.25" strokeLinecap="round" />
    <path d="M5.2 1.35h2.9" stroke="#d2dbe2" strokeWidth="1.25" strokeLinecap="round" />
    <path d="M25.15 5.9c-2.1 3.55-5.35 7.25-5.35 10.55a5.35 5.35 0 0 0 10.7 0c0-3.3-3.25-7-5.35-10.55Z" fill="url(#oil-drop)" stroke="#ffd875" strokeWidth=".75" />
    <path d="M22.55 15.8c.05 1.45.68 2.55 1.92 3.2" fill="none" stroke="#fff3bd" strokeWidth="1.15" strokeLinecap="round" opacity=".9" />
  </svg>;
}

export function GoldBarIcon(props: IconProps) {
  return <svg viewBox="0 0 34 20" aria-hidden="true" focusable="false" {...props}>
    <defs>
      <linearGradient id="gold-bar-top" x1="5" y1="2" x2="28" y2="11" gradientUnits="userSpaceOnUse"><stop stopColor="#fff2a4" /><stop offset=".24" stopColor="#ffd94e" /><stop offset=".58" stopColor="#e6a80c" /><stop offset="1" stopColor="#8f5600" /></linearGradient>
      <linearGradient id="gold-bar-front" x1="9" y1="9" x2="27" y2="18" gradientUnits="userSpaceOnUse"><stop stopColor="#f8c72b" /><stop offset=".55" stopColor="#c98100" /><stop offset="1" stopColor="#704000" /></linearGradient>
      <linearGradient id="gold-bar-side" x1="3" y1="5" x2="10" y2="17" gradientUnits="userSpaceOnUse"><stop stopColor="#edb91e" /><stop offset="1" stopColor="#754200" /></linearGradient>
      <filter id="gold-bar-shadow" x="-20%" y="-30%" width="150%" height="170%"><feDropShadow dx="0" dy="1" stdDeviation=".8" floodColor="#000" floodOpacity=".38" /></filter>
    </defs>
    <g filter="url(#gold-bar-shadow)">
      <path d="m5.2 4.3 17.5-1.1 6.2 6.15-19.4.85z" fill="url(#gold-bar-top)" stroke="#ffe47a" strokeWidth=".55" />
      <path d="m9.5 10.2 19.4-.85-2.8 6.85-18.7.65z" fill="url(#gold-bar-front)" stroke="#9a5a00" strokeWidth=".55" />
      <path d="m5.2 4.3 4.3 5.9-2.1 6.65-3.25-5.6z" fill="url(#gold-bar-side)" stroke="#a86600" strokeWidth=".55" />
      <path d="m8.2 5.05 13.7-.85" stroke="#fff7c8" strokeWidth=".7" strokeLinecap="round" opacity=".9" />
      <text x="17.2" y="8.15" fill="#704100" fontFamily="Arial, sans-serif" fontSize="3.1" fontWeight="800" textAnchor="middle">999.9</text>
    </g>
  </svg>;
}

export function UsMarketIcon(props: IconProps) {
  return <svg viewBox="0 0 28 20" aria-hidden="true" focusable="false" {...props}>
    <rect x="1.2" y="1.2" width="25.6" height="17.6" rx="2.6" fill="#0b2f62" stroke="#93c9ee" strokeWidth=".7" />
    <path d="M11.2 4.2h12.4M11.2 7.2h12.4M4.2 10.2h19.4M4.2 13.2h19.4M4.2 16.2h19.4" stroke="#fff" strokeWidth="1.1" opacity=".92" />
    <path d="M11.2 5.7h12.4M4.2 11.7h19.4M4.2 14.7h19.4" stroke="#db2b3e" strokeWidth="1.1" />
    <path d="m5 7.7 3-2.05 2.25 1.2 3.5-3.05" fill="none" stroke="#75e7ff" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m11.8 3.7 2.1-.05-.05 2" fill="none" stroke="#75e7ff" strokeWidth="1.15" strokeLinecap="round" />
  </svg>;
}
