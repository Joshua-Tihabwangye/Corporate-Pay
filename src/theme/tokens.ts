export const EVZ_COLORS = {
  green: '#03CD8C',
  orange: '#F77F00',
  grey: '#A6A6A6',
  light: '#F2F2F2',
  slate: '#0F172A'
} as const;

export type EvzColorKey = keyof typeof EVZ_COLORS;
