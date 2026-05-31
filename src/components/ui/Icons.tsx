import React from 'react';

type IconProps = { size?: number; style?: React.CSSProperties; className?: string };

const mkIcon = (path: React.ReactNode, defaults = { strokeWidth: '1.6', fill: 'none' }) =>
  ({ size = 16, style, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={defaults.fill} stroke="currentColor"
      strokeWidth={defaults.strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={style} className={className}>
      {path}
    </svg>
  );

export const SearchIcon = mkIcon(<><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></>);
export const ClockIcon = mkIcon(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>);
export const BookmarkIcon = mkIcon(<path d="M6 4h12v17l-6-3.5L6 21z"/>);
export const ShareIcon = mkIcon(<><path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/></>);
export const FilterIcon = mkIcon(<path d="M4 5h16M7 12h10M10 19h4"/>);
export const SortIcon = mkIcon(<><path d="M7 4v16M3 8l4-4 4 4"/><path d="M17 20V4M13 16l4 4 4-4"/></>);
export const GridIcon = mkIcon(<><rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/></>);
export const ListIcon = mkIcon(<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>);
export const CheckIcon = mkIcon(<path d="M5 12l5 5 9-11"/>, { strokeWidth: '2.2', fill: 'none' });
export const LockIcon = mkIcon(<><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>);
export const StarIcon = ({ size = 14, style, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} className={className}>
    <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3z"/>
  </svg>
);
export const ArrowIcon = mkIcon(<><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>);
export const ChevIcon = mkIcon(<path d="M9 6l6 6-6 6"/>, { strokeWidth: '1.8', fill: 'none' });
export const DocIcon = mkIcon(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></>);
export const GlobeIcon = mkIcon(<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>, { strokeWidth: '1.5', fill: 'none' });
export const BeakerIcon = mkIcon(<><path d="M9 3h6M10 3v6L5 19a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-10V3"/></>);
export const BrainIcon = mkIcon(<><path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 5 3 3 0 0 0 2 5v1a3 3 0 0 0 6 0V4"/><path d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 5 3 3 0 0 1-2 5v1a3 3 0 0 1-6 0"/></>);
export const UploadIcon = mkIcon(<><path d="M12 20V8"/><path d="M7 13l5-5 5 5"/><path d="M5 4h14"/></>);
export const SparkIcon = mkIcon(<><path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2L12 3z"/><path d="M19 3l.8 2L22 6l-2.2.8L19 9l-.8-2.2L16 6l2.2-1L19 3z" opacity="0.7"/></>);
export const HeartIcon = mkIcon(<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>);
export const ReplyIcon = mkIcon(<><path d="M9 14l-5-5 5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v3"/></>);
export const FlagIcon = mkIcon(<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>);
export const UserIcon = mkIcon(<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7"/></>);
export const SendIcon = mkIcon(<path d="M3 11l18-8-7 18-3-7-8-3z"/>);
export const EyeIcon = mkIcon(<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>);
export const FireIcon = mkIcon(<path d="M12 22a6 6 0 0 0 6-6c0-3-2-4-3-7-1-3-3-5-3-7 0 2-2 4-4 7-2 3-4 4-4 7a6 6 0 0 0 8 6z"/>);
export const TelegramIcon = ({ size = 16, style, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} className={className}>
    <path d="M21.4 4.6L2.8 11.7c-1 .4-1 1.7 0 2l4.5 1.4 1.7 5.5c.2.7 1.1.9 1.6.3l2.5-2.6 4.7 3.5c.6.4 1.4.1 1.6-.6l3.4-15.4c.2-.9-.7-1.6-1.4-1.2zM10 14.6l-.6 4 1.4-3 8.5-7.8L10 14.6z"/>
  </svg>
);
export const PinIcon = mkIcon(<><path d="M12 22s7-7.5 7-13a7 7 0 0 0-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></>);
export const BookIcon = mkIcon(<><path d="M4 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H4z"/><path d="M20 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z"/></>);
export const CiteIcon = mkIcon(<><path d="M7 7c-2 0-4 2-4 5s2 5 4 5l-1 2"/><path d="M16 7c-2 0-4 2-4 5s2 5 4 5l-1 2"/></>);
export const AtomIcon = mkIcon(<><circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/></>, { strokeWidth: '1.5', fill: 'none' });

export const ICON_MAP: Record<string, React.FC<IconProps>> = {
  doc: DocIcon, cite: CiteIcon, beaker: BeakerIcon, brain: BrainIcon,
  book: BookIcon, globe: GlobeIcon, atom: AtomIcon, spark: SparkIcon,
  search: SearchIcon, clock: ClockIcon, check: CheckIcon, lock: LockIcon,
  star: StarIcon, arrow: ArrowIcon, chev: ChevIcon, eye: EyeIcon,
  heart: HeartIcon, reply: ReplyIcon, flag: FlagIcon, send: SendIcon,
  upload: UploadIcon, fire: FireIcon, pin: PinIcon, user: UserIcon,
  grid: GridIcon, list: ListIcon, sort: SortIcon, share: ShareIcon,
  bookmark: BookmarkIcon, filter: FilterIcon, telegram: TelegramIcon,
};
