/** The two drawing themes (SPEC §3.3); `data-theme` on `<html>` holds one when the visitor chose it. */
export const THEMES = ['paper', 'blueprint'] as const;
export type Theme = (typeof THEMES)[number];

/** localStorage key for the visitor's theme choice. Absent → the theme follows the system. */
export const THEME_STORAGE_KEY = 'theme';

export const isTheme = (value: unknown): value is Theme => THEMES.includes(value as Theme);

/** The theme on screen: the visitor's choice when there is one, otherwise the system's. */
export function effectiveTheme(chosen: string | null | undefined, systemDark: boolean): Theme {
  if (isTheme(chosen)) return chosen;
  return systemDark ? 'blueprint' : 'paper';
}

export const otherTheme = (theme: Theme): Theme => (theme === 'paper' ? 'blueprint' : 'paper');
