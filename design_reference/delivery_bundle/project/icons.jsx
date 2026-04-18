// icons.jsx — minimal line icons (no emoji, no decoration)
const Icon = {
  plus: (c='currentColor', s=20) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>
  ),
  minus: (c='currentColor', s=20) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><path d="M4 10h12" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>
  ),
  close: (c='currentColor', s=20) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>
  ),
  chevLeft: (c='currentColor', s=20) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><path d="M12 4l-6 6 6 6" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  chevRight: (c='currentColor', s=16) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><path d="M8 4l6 6-6 6" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  chevDown: (c='currentColor', s=16) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><path d="M4 7l6 6 6-6" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  search: (c='currentColor', s=18) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="5.5" stroke={c} strokeWidth="1.8"/><path d="M13 13l4 4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>
  ),
  cart: (c='currentColor', s=20) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><path d="M3 4h2l2 10h10l2-7H6" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="8" cy="17" r="1.4" fill={c}/><circle cx="15" cy="17" r="1.4" fill={c}/></svg>
  ),
  bag: (c='currentColor', s=20) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><path d="M4 7h12l-1 10H5L4 7zM7 7V5a3 3 0 016 0v2" stroke={c} strokeWidth="1.7" strokeLinejoin="round"/></svg>
  ),
  clock: (c='currentColor', s=16) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke={c} strokeWidth="1.6"/><path d="M10 6v4l3 2" stroke={c} strokeWidth="1.6" strokeLinecap="round"/></svg>
  ),
  pin: (c='currentColor', s=16) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><path d="M10 18s6-5.5 6-10A6 6 0 004 8c0 4.5 6 10 6 10z" stroke={c} strokeWidth="1.6"/><circle cx="10" cy="8" r="2" stroke={c} strokeWidth="1.6"/></svg>
  ),
  check: (c='currentColor', s=18) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  whatsapp: (c='currentColor', s=18) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><path d="M3 17l1.2-3.6A7 7 0 1110 17c-1.3 0-2.5-.3-3.5-.9L3 17z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/><path d="M7.5 8c0 2.5 2 4.5 4.5 4.5l1-1.2-1.5-.8-.8.6c-.7-.3-1.3-.9-1.6-1.6l.6-.8-.8-1.5L7.5 8z" fill={c}/></svg>
  ),
  store: (c='currentColor', s=16) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><path d="M3 7l1-3h12l1 3v1a2 2 0 01-4 0 2 2 0 01-4 0 2 2 0 01-4 0 2 2 0 01-2-1V7zM4 9v8h12V9" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/></svg>
  ),
  moto: (c='currentColor', s=18) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><circle cx="5" cy="14" r="2.5" stroke={c} strokeWidth="1.5"/><circle cx="15" cy="14" r="2.5" stroke={c} strokeWidth="1.5"/><path d="M7 14h5l1-5h-3M10 9l-2-4H5" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  dot: (c='currentColor', s=8) => (
    <svg width={s} height={s} viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill={c}/></svg>
  ),
};

window.Icon = Icon;
