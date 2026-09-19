// ---------- Willkommen-Screen ----------
export const Chevron = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M9 6l6 6-6 6" stroke="#105258" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LoginIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
    <path d="M13 4h5a1 1 0 011 1v14a1 1 0 01-1 1h-5" stroke="#105258" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M4 12h10M10 8l4 4-4 4" stroke="#105258" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const UserPlusIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
    <circle cx="10" cy="8" r="3.4" stroke="#105258" strokeWidth="1.4" />
    <path d="M4 20c0-3.3 2.7-6 6-6 1.2 0 2.4.4 3.3 1" stroke="#105258" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M17.5 13.5v6M14.5 16.5h6" stroke="#105258" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="16.8" cy="9.2" r="0.9" fill="#105258" />
  </svg>
);

export const ShieldIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
    <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" stroke="#105258" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M9 12l2 2 4-4" stroke="#105258" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PinIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
    <path d="M12 21s-7-6.1-7-11a7 7 0 1114 0c0 4.9-7 11-7 11z" stroke="#105258" strokeWidth="1.3" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="2.6" stroke="#105258" strokeWidth="1.3" />
  </svg>
);

export const HeartIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
    <path d="M12 20s-8-4.8-8-10.2C4 6.5 6 5 8.3 5c1.6 0 3 .8 3.7 2 .7-1.2 2.1-2 3.7-2C18 5 20 6.5 20 9.8 20 15.2 12 20 12 20z" stroke="#105258" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

export const HeadsetIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
    <path d="M4 14v-2a8 8 0 0116 0v2" stroke="#105258" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="2.5" y="13" width="4.5" height="7" rx="2.2" stroke="#105258" strokeWidth="1.5" />
    <rect x="17" y="13" width="4.5" height="7" rx="2.2" stroke="#105258" strokeWidth="1.5" />
    <path d="M19.5 20.5a4.5 4.5 0 01-4.5 3h-2" stroke="#105258" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ---------- Rollen-Screen ----------
export const HomeSmallIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-5v-6h-4v6H5a1 1 0 01-1-1v-9z" stroke="#ffffff" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
);

export const ArrowRight = ({ color = "#1c2129" }: { color?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M4 12h15M13 6l6 6-6 6" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


export const PersonSearchIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="8.5" r="3.2" stroke="#105258" strokeWidth="1.3" />
    <path d="M5 20c0-3 2.7-5.5 6-5.5 1 0 2 .2 2.8.6" stroke="#105258" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="16" cy="16" r="3" stroke="#105258" strokeWidth="1.3" />
    <path d="M18.3 18.3l2.2 2.2" stroke="#105258" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const ClipboardIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="4" width="14" height="17" rx="2" stroke="#105258" strokeWidth="1.3" />
    <rect x="9" y="2.5" width="6" height="3.5" rx="1" stroke="#105258" strokeWidth="1.3" fill="#f5f8f7" />
    <path d="M9 12l2 2 4-4" stroke="#105258" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


export const BriefcaseIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
    <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" stroke="#105258" strokeWidth="1.4" />
    <path d="M9 7.5V6a2 2 0 012-2h2a2 2 0 012 2v1.5" stroke="#105258" strokeWidth="1.4" />
    <path d="M3.5 12.5h17" stroke="#105258" strokeWidth="1.4" />
    <rect x="10" y="11" width="4" height="3" rx="1" stroke="#105258" strokeWidth="1.4" fill="#f5f8f7" />
  </svg>
);

export const LockIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <rect x="5.5" y="10.5" width="13" height="9.5" rx="2.5" stroke="#1c2129" strokeWidth="1.4" />
    <path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" stroke="#1c2129" strokeWidth="1.4" />
    <circle cx="12" cy="15" r="1.3" fill="#1c2129" />
    <path d="M12 16v1.5" stroke="#1c2129" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// ---------- Formular-Icons (register-pro) ----------
export const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" stroke="#8a9aa0" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="2.8" stroke="#8a9aa0" strokeWidth="1.5" />
  </svg>
);
export const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" stroke="#8a9aa0" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="2.8" stroke="#8a9aa0" strokeWidth="1.5" />
    <path d="M4 20L20 4" stroke="#8a9aa0" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
export const ShieldSmallIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" stroke="#105258" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M9 12l2 2 4-4" stroke="#105258" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const ChevronDown = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M6 9l6 6 6-6" stroke="#1c2129" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const CatGartenIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 21V10M12 10c0-4 3-6.5 7-6.5 0 4-2.5 6.5-7 6.5zM12 14c0-3-2.3-5-5.5-5 0 3.2 2.2 5 5.5 5z" stroke="#105258" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);
export const CatElektroIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M13 2.5L5 13.5h6l-1 8 8-11h-6l1-8z" stroke="#105258" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);
export const CatSanitaerIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 3.5s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z" stroke="#105258" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);
export const CatDachIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 14l9-8 9 8M6 14v5h12v-5" stroke="#105258" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);
export const CatFensterIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="4" width="14" height="16" rx="1.5" stroke="#105258" strokeWidth="1.4" />
    <path d="M12 4v16M5 12h14" stroke="#105258" strokeWidth="1.4" />
  </svg>
);
export const CatReinigungIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M14 4l6 6-9 9H5v-6l9-9z" stroke="#105258" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M11.5 6.5l6 6" stroke="#105258" strokeWidth="1.4" />
  </svg>
);
export const CatInnenIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M4 20l4-4M8.5 15.5l7-9 3-2-1 3-9 7-1.5 1.5z" stroke="#105258" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M4 20h16" stroke="#105258" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
export const CatMalerIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="4" width="13" height="6" rx="1.5" stroke="#105258" strokeWidth="1.4" />
    <path d="M17 7h3v4h-9" stroke="#105258" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M11 11v3M9.5 14h3v6h-3v-6z" stroke="#105258" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);
export const CatPoolIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 15c1.5-1.2 3-1.2 4.5 0s3 1.2 4.5 0 3-1.2 4.5 0 3 1.2 4.5 0M3 19c1.5-1.2 3-1.2 4.5 0s3 1.2 4.5 0 3-1.2 4.5 0 3 1.2 4.5 0" stroke="#105258" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M8 12V6a2 2 0 114 0M14 12V6a2 2 0 114 0M8 9h6" stroke="#105258" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
export const CatMehrIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#105258">
    <circle cx="6" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="18" cy="12" r="1.6" />
  </svg>
);
export const ArrowRightWhite = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M4 12h15M13 6l6 6-6 6" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const LockTinyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="5.5" y="10.5" width="13" height="9.5" rx="2.5" stroke="#8a9aa0" strokeWidth="1.5" />
    <path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" stroke="#8a9aa0" strokeWidth="1.5" />
  </svg>
);

// ---------- Eigentümer Dashboard + SideMenu ----------
export const HamburgerIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
    <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" stroke="#1c2129" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);
export const CrownIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#f0c25a"><path d="M4 8l4 3 4-6 4 6 4-3-1.5 10h-13L4 8z" /></svg>
);
export const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#1c2129" strokeWidth="1.3" strokeLinecap="round" /></svg>
);
export const ArrowRightThin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 5.5l6.5 6.5L9 18.5" stroke="#1c2129" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="#1c2129" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
