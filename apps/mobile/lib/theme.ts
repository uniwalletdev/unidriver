import { useColorScheme } from 'react-native';

/**
 * Design tokens — the same values as apps/web/app/globals.css and docs/MOBILE_DESIGN.md, so
 * the app, the web and the published designs stay one product.
 */
const light = {
  bg: '#F5F6FA',
  surface: '#FFFFFF',
  fill: '#EEF0F6',
  border: '#E2E5EE',
  text: '#0F172A',
  text2: '#475569',
  text3: '#64748B',
  brand: '#4F46E5',
  brandInk: '#FFFFFF',
  brandSoft: '#EEF2FF',
  earn: '#059669',
  earnSoft: '#ECFDF5',
  warn: '#B45309',
  warnSoft: '#FFFBEB',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
};

const dark: typeof light = {
  bg: '#0B1120',
  surface: '#111827',
  fill: '#1A2334',
  border: '#243044',
  text: '#E8EDF5',
  text2: '#A3B0C2',
  text3: '#7C8AA0',
  brand: '#818CF8',
  brandInk: '#0B1120',
  brandSoft: '#1E1B4B',
  earn: '#34D399',
  earnSoft: '#052E22',
  warn: '#FBBF24',
  warnSoft: '#2A1F05',
  danger: '#F87171',
  dangerSoft: '#2A0F0F',
};

export type Palette = typeof light;

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

export const radius = { card: 16, control: 12, pill: 999 };
/** Minimum touch target: 44pt (iOS) / 48dp (Android) — we use 48 everywhere. */
export const TAP = 48;
