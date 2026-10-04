import tokens from '../design/tokens.json';

// The site icon: a framed sheet with a registration mark — a target circle under the redline
// crosshair. Colours come from design/tokens.json; the dark set applies when the system is dark
// (a favicon cannot see the site's own theme toggle).
type Theme = 'light' | 'dark';

const colours = (theme: Theme) => ({
  paper: tokens.color.paper[theme],
  ink: tokens.color.ink[theme],
  line: tokens.color.line[theme],
  redline: tokens.color.redline[theme],
});

const rules = (theme: Theme) => {
  const c = colours(theme);
  return (
    `.paper{fill:${c.paper}}.frame{stroke:${c.ink}}` +
    `.target{stroke:${c.line}}.cross{stroke:${c.redline}}`
  );
};

export function faviconSvg(): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
    `<style>${rules('light')}@media (prefers-color-scheme:dark){${rules('dark')}}</style>` +
    '<rect class="paper frame" x="1" y="1" width="30" height="30" stroke-width="2"/>' +
    '<circle class="target" cx="16" cy="16" r="7" fill="none" stroke-width="2"/>' +
    '<path class="cross" d="M16 5v22M5 16h22" stroke-width="2" stroke-linecap="square"/>' +
    '</svg>'
  );
}
