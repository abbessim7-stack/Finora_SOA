import type { ComponentType, ReactNode, SVGProps } from 'react';

export type IconProps = { size?: number } & Omit<SVGProps<SVGSVGElement>, 'width' | 'height'>;

function Svg({ size = 20, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconGrid = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="2.2" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="2.2" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="2.2" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2.2" />
  </Svg>
);

export const IconRefresh = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 7v5h-5" />
    <path d="M4.6 9a7.5 7.5 0 0 1 12.6-2L20 12" />
    <path d="M4 17v-5h5" />
    <path d="M19.4 15a7.5 7.5 0 0 1-12.6 2L4 12" />
  </Svg>
);

export const IconArrows = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 4v13" />
    <path d="m3.5 13.5 3.5 3.5 3.5-3.5" />
    <path d="M17 20V7" />
    <path d="m13.5 10.5 3.5-3.5 3.5 3.5" />
  </Svg>
);

export const IconTarget = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.6" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconTag = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20.3 12.9 12.9 20.3a1.9 1.9 0 0 1-2.7 0l-6.5-6.5A1.9 1.9 0 0 1 3.2 12.4V4.7c0-.8.7-1.5 1.5-1.5h7.7c.5 0 1 .2 1.4.6l6.5 6.5c.8.7.8 1.9 0 2.6Z" />
    <circle cx="7.6" cy="7.6" r="1.4" />
  </Svg>
);

export const IconPlus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconChevronLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="m14.5 6-6 6 6 6" />
  </Svg>
);

export const IconChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </Svg>
);

export const IconChevronDown = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Svg>
);

export const IconLogout = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 16.5 14.5 12 10 7.5" />
    <path d="M14.5 12H4" />
  </Svg>
);

export const IconTrash = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16" />
    <path d="M9.5 7V5.2c0-.7.5-1.2 1.2-1.2h2.6c.7 0 1.2.5 1.2 1.2V7" />
    <path d="M6.5 7l.8 12a1.8 1.8 0 0 0 1.8 1.7h5.8a1.8 1.8 0 0 0 1.8-1.7l.8-12" />
    <path d="M10.5 11v6M13.5 11v6" />
  </Svg>
);

export const IconPencil = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0 0-3L17 5a2.1 2.1 0 0 0-3 0L3.5 15.5V20Z" />
    <path d="m14 6 4 4" />
  </Svg>
);

export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </Svg>
);

export const IconDownload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4v10" />
    <path d="m7.5 10 4.5 4.5L16.5 10" />
    <path d="M4.5 17.5V19a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-1.5" />
  </Svg>
);

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Svg>
);

export const IconAlert = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10.3 4.3 2.9 17.2A1.9 1.9 0 0 0 4.6 20h14.8a1.9 1.9 0 0 0 1.7-2.8L13.7 4.3a1.9 1.9 0 0 0-3.4 0Z" />
    <path d="M12 9v4.5" />
    <circle cx="12" cy="16.8" r="0.9" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconClose = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
);

export const IconWallet = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 8.5A2.5 2.5 0 0 1 6 6h11a2 2 0 0 1 2 2v1" />
    <path d="M3.5 8.5V17A2.5 2.5 0 0 0 6 19.5h12A2.5 2.5 0 0 0 20.5 17v-5.5A2.5 2.5 0 0 0 18 9H6a2.5 2.5 0 0 1-2.5-.5Z" />
    <circle cx="16.5" cy="14" r="1.2" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconSparkle = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5Z" />
  </Svg>
);

export const IconLock = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4.5" y="10" width="15" height="10" rx="2.6" />
    <path d="M8 10V7.8a4 4 0 0 1 8 0V10" />
  </Svg>
);

export const IconMail = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.6" />
    <path d="m4.5 7.5 6.4 5.1a2 2 0 0 0 2.2 0l6.4-5.1" />
  </Svg>
);

export const IconUser = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6" />
  </Svg>
);

export const IconBasket = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 9h17l-1.6 8.4a2 2 0 0 1-2 1.6H7.1a2 2 0 0 1-2-1.6L3.5 9Z" />
    <path d="M8.5 9 10 4.5M15.5 9 14 4.5M9.8 13v3M14.2 13v3" />
  </Svg>
);

export const IconCar = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 16.5h16v-2.2l-1.6-4.1a2 2 0 0 0-1.9-1.3H7.5a2 2 0 0 0-1.9 1.3L4 14.3v2.2Z" />
    <path d="M3.5 16.5v2.2M20.5 16.5v2.2" />
    <circle cx="7.8" cy="16.6" r="1.5" />
    <circle cx="16.2" cy="16.6" r="1.5" />
    <path d="M6.5 11.2h11" />
  </Svg>
);

export const IconHome = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 10.5 12 4l8 6.5" />
    <path d="M6 9.8V19a1.5 1.5 0 0 0 1.5 1.5H10V15h4v5.5h2.5A1.5 1.5 0 0 0 18 19V9.8" />
  </Svg>
);

export const IconMusic = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 17.5V6.8l10-2v10.4" />
    <circle cx="6.6" cy="17.8" r="2.6" />
    <circle cx="16.6" cy="15.4" r="2.6" />
  </Svg>
);

export const IconHeart = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 19.5s-7.5-4.3-7.5-9.4A4.1 4.1 0 0 1 12 7.4a4.1 4.1 0 0 1 7.5 2.7c0 5.1-7.5 9.4-7.5 9.4Z" />
  </Svg>
);

export const IconRepeat = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9.5A4.5 4.5 0 0 1 8.5 5H18" />
    <path d="m15 2.5 3 2.5-3 2.5" />
    <path d="M20 14.5A4.5 4.5 0 0 1 15.5 19H6" />
    <path d="m9 21.5-3-2.5 3-2.5" />
  </Svg>
);

export const IconBook = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 5.5c0-.8.7-1.5 1.5-1.5H11v15H5.5A1.5 1.5 0 0 1 4 17.5v-12Z" />
    <path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5-.7 1.5-1.5v-12Z" />
  </Svg>
);

export const IconDots = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="6" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="18" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconBriefcase = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="7.5" width="18" height="12" rx="2.4" />
    <path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5" />
    <path d="M3 12.5h18" />
  </Svg>
);

export const IconLaptop = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4.5" y="5" width="15" height="10.5" rx="1.8" />
    <path d="M2.5 19h19" />
  </Svg>
);

export const IconGift = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="9" width="17" height="11.5" rx="2" />
    <path d="M3.5 13h17M12 9v11.5" />
    <path d="M12 9C10.5 5.5 8.8 4 7.3 4.6 5.7 5.2 6.3 9 12 9Zm0 0c1.5-3.5 3.2-5 4.7-4.4C18.3 5.2 17.7 9 12 9Z" />
  </Svg>
);

export const IconRefund = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 10.5a8 8 0 1 1 2.4 7.2" />
    <path d="M3.5 4.5v6h6" />
    <path d="M12 8.5v7M10 10.2c0-.9.9-1.4 2-1.4s2 .5 2 1.4c0 1-.8 1.3-2 1.6-1.2.3-2 .6-2 1.6s.9 1.4 2 1.4 2-.5 2-1.4" />
  </Svg>
);

export const IconTrendUp = (p: IconProps) => (
  <Svg {...p}>
    <path d="m3.5 16 5.5-5.5 3.5 3.5L20.5 6" />
    <path d="M15.5 6h5v5" />
  </Svg>
);

export const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5.5" width="17" height="15" rx="2.4" />
    <path d="M3.5 10.5h17M8.5 3.5v4M15.5 3.5v4" />
  </Svg>
);

const KNOWN_COLORS: Record<string, string> = {
  alimentation: '#4fd8a4',
  transport: '#61b8ff',
  logement: '#8b76ff',
  loisirs: '#f5c46b',
  santé: '#ff8078',
  abonnements: '#c58bff',
  éducation: '#63d9d1',
  divers: '#9a98b4',
  salaire: '#4fd8a4',
  freelance: '#61b8ff',
  cadeaux: '#c58bff',
  remboursements: '#63d9d1',
};

const FALLBACK_COLORS = ['#8b76ff', '#4fd8a4', '#ff8078', '#f5c46b', '#61b8ff', '#c58bff', '#ffa06b', '#63d9d1'];

export function categoryColor(name: string): string {
  const key = name.trim().toLowerCase();
  if (KNOWN_COLORS[key]) return KNOWN_COLORS[key];
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % 9973;
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length] as string;
}

const ICON_RULES: Array<[RegExp, ComponentType<IconProps>]> = [
  [/aliment|course|repas|resto|cuisine/i, IconBasket],
  [/transport|voiture|essence|train|voyage|déplacement/i, IconCar],
  [/logement|loyer|maison|immo|électric/i, IconHome],
  [/loisir|sortie|culture|cinéma|musique|concert/i, IconMusic],
  [/sant|pharma|médec|docteur|soin/i, IconHeart],
  [/abonnement|subscription|récurrent/i, IconRepeat],
  [/éduc|educ|formation|cours|livre/i, IconBook],
  [/salaire|revenu|paie/i, IconBriefcase],
  [/freelance|mission|client/i, IconLaptop],
  [/cadeau|don/i, IconGift],
  [/rembours|restitution|retour/i, IconRefund],
  [/divers|autre/i, IconDots],
];

export function categoryIcon(name: string): ComponentType<IconProps> {
  const match = ICON_RULES.find(([pattern]) => pattern.test(name));
  return match ? match[1] : IconTag;
}
