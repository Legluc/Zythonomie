export const Colors = {
  noir: '#000000',
  blanc: '#ffffff',
  vert: '#005433',
  jaune: '#FCC216',
  rose: '#F2B3B3',
  bleu: '#234B8C',
  orange: '#F46C37',
  rouge: '#D31A30',
} as const;

export type ColorKey = keyof typeof Colors;

export const Fonts = {
  title: 'Asphalt-Black',
  body: 'DMSans',
} as const;
