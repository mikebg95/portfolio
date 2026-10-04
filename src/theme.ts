/** The two drawing themes (SPEC §3.3); `data-theme` on `<html>` holds one when the visitor chose it. */
export const THEMES = ['paper', 'blueprint'] as const;
export type Theme = (typeof THEMES)[number];

/** localStorage key for the visitor's theme choice. Absent → the theme follows the system. */
export const THEME_STORAGE_KEY = 'theme';
