/** Lightweight SVG nav icons (no emoji rendering quirks). */

export function IconDashboard({ className = "w-5 h-5" }: { className?: string }) {
 return (
 <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
 <path
 d="M4 13c3.5-5 6.5-5 10 0s6.5 5 10 0"
 stroke="currentColor"
 strokeWidth="1.8"
 strokeLinecap="round"
 />
 <path
 d="M4 18c3.5-4 6.5-4 10 0s6.5 4 10 0"
 stroke="currentColor"
 strokeWidth="1.4"
 strokeLinecap="round"
 opacity="0.55"
 />
 </svg>
 );
}

export function IconSpots({ className = "w-5 h-5" }: { className?: string }) {
 return (
 <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
 <path
 d="M12 21s7-5.4 7-11a7 7 0 10-14 0c0 5.6 7 11 7 11z"
 stroke="currentColor"
 strokeWidth="1.7"
 strokeLinejoin="round"
 />
 <circle cx="12" cy="10" r="2.4" fill="currentColor" />
 </svg>
 );
}

export function IconSessions({ className = "w-5 h-5" }: { className?: string }) {
 return (
 <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
 <rect
 x="5"
 y="3.5"
 width="14"
 height="17"
 rx="2"
 stroke="currentColor"
 strokeWidth="1.7"
 />
 <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
 </svg>
 );
}

export function IconNotes({ className = "w-5 h-5" }: { className?: string }) {
 return (
 <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
 <path
 d="M14 3.5H7.5A2.5 2.5 0 005 6v12a2.5 2.5 0 002.5 2.5h9A2.5 2.5 0 0019 18V8.5L14 3.5z"
 stroke="currentColor"
 strokeWidth="1.7"
 strokeLinejoin="round"
 />
 <path d="M14 3.5V8h4.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
 <path d="M8.5 13h7M8.5 16.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
 </svg>
 );
}

export function IconSettings({ className = "w-5 h-5" }: { className?: string }) {
 return (
 <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
 <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
 <path
 d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6"
 stroke="currentColor"
 strokeWidth="1.6"
 strokeLinecap="round"
 />
 </svg>
 );
}
