import chroma from 'chroma-js';

/**
 * Color palettes and mood configurations
 * Using Chroma.js for advanced color manipulation
 */

export interface MoodConfig {
  id: string;
  label: string;
  hasDetail: boolean;
  color: string;
}

export const MOODS: MoodConfig[] = [
  { id: 'moment', label: 'Taking a moment', hasDetail: false, color: '#7EB5C1' },
  { id: 'anxious', label: 'Anxious about...', hasDetail: true, color: '#9B7E9F' },
  { id: 'processing', label: 'Processing...', hasDetail: true, color: '#7E8E9F' },
  { id: 'preparing', label: 'Preparing for...', hasDetail: true, color: '#8E9B7E' },
  { id: 'grateful', label: 'Grateful for...', hasDetail: true, color: '#9FC17E' },
  { id: 'celebrating', label: 'Celebrating...', hasDetail: true, color: '#C1A87E' },
  { id: 'here', label: 'Just here', hasDetail: false, color: '#8EAAB4' },
];

export interface AvatarConfig {
  id: string;
  colors: [string, string];  // Gradient from/to
}

export const AVATARS: AvatarConfig[] = [
  { id: 'teal', colors: ['#7EB5C1', '#5A9BAA'] },
  { id: 'lavender', colors: ['#C17EB5', '#AA5A9B'] },
  { id: 'amber', colors: ['#C1A87E', '#AA8A5A'] },
  { id: 'sage', colors: ['#7EC17E', '#5AAA5A'] },
  { id: 'coral', colors: ['#C17E7E', '#AA5A5A'] },
  { id: 'indigo', colors: ['#7E7EC1', '#5A5AAA'] },
];

export const BASE_COLORS = {
  primary: '#7EB5C1',
  background: '#0f1723',
  backgroundMid: '#1a2634',
};

/**
 * Convert hex to RGB values (0-1 range for WebGL)
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  try {
    const [r, g, b] = chroma(hex).gl();
    return { r, g, b };
  } catch {
    return { r: 0.5, g: 0.7, b: 0.76 };
  }
}

/**
 * Convert hex to RGBA string with alpha
 */
export function hexToRgba(hex: string, alpha: number): string {
  try {
    return chroma(hex).alpha(alpha).css();
  } catch {
    return `rgba(128, 179, 194, ${alpha})`;
  }
}

/**
 * Get avatar gradient CSS
 */
export function getAvatarGradient(avatarId: string): string {
  const avatar = AVATARS.find((a) => a.id === avatarId);
  if (!avatar) return `linear-gradient(135deg, ${AVATARS[0].colors[0]}, ${AVATARS[0].colors[1]})`;
  return `linear-gradient(135deg, ${avatar.colors[0]}, ${avatar.colors[1]})`;
}

/**
 * Get mood color by mood ID
 */
export function getMoodColor(moodId: string | undefined): string {
  if (!moodId) return BASE_COLORS.primary;
  const mood = MOODS.find((m) => m.id === moodId);
  return mood?.color ?? BASE_COLORS.primary;
}

/**
 * Interpolate between two colors (useful for breathing transitions)
 */
export function lerpColor(color1: string, color2: string, t: number): string {
  return chroma.mix(color1, color2, t, 'lab').hex();
}

/**
 * Create a color scale for gradients
 */
export function createColorScale(colors: string[], steps: number = 10): string[] {
  return chroma.scale(colors).mode('lab').colors(steps);
}

/**
 * Lighten a color by a percentage (0-1)
 */
export function lighten(color: string, amount: number): string {
  return chroma(color).brighten(amount * 3).hex();
}

/**
 * Darken a color by a percentage (0-1)
 */
export function darken(color: string, amount: number): string {
  return chroma(color).darken(amount * 3).hex();
}

/**
 * Check if a color has sufficient contrast against another
 */
export function hasContrast(foreground: string, background: string, minRatio = 4.5): boolean {
  return chroma.contrast(foreground, background) >= minRatio;
}

/**
 * Get a contrasting text color (white or black) for a background
 */
export function getContrastingText(background: string): string {
  return chroma(background).luminance() > 0.5 ? '#000000' : '#ffffff';
}
