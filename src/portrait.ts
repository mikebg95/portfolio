// The ASCII portrait (SPEC §4.1), read from its single source at build time: Vite inlines the file,
// so docs/source/ascii-portrait.txt is the only copy and the page ships it as real text.
import portrait from '../docs/source/ascii-portrait.txt?raw';

export const PORTRAIT: string = portrait;
