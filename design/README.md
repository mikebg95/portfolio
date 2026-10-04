# Design — "Drawing set"

Approved by Michael on 2026-10-04 ("yes i love A. looks amazing"). After a first, generic dark
"developer template" was rejected as "the most boring, basic, AI-generated website ever", the rule
for every task is: **if it starts to look like a standard portfolio template, it is wrong.** It must
look like a precise technical drawing set that happens to be a website.

Files: `tokens.json` (every value), `components.md` (every part and its states), `copy.md` (every
English string), `motion.md` (all animation — binding), `screens/` (drawings + index).
Priority when they disagree: drawing > components.md > this README. Copy wins on wording.

## Rules
1. **Paper, ink, one red.** Paper background with the two-level grid; ink for text and lines; line-blue
   for dimensions, labels and figure boxes; redline only for revision notes, "pending / in progress"
   and the crosshair. No other colours. No gradients except the grid lines themselves.
2. **Square corners everywhere.** Only balloons and stamps are round. No rounded cards, no pills.
3. **Lines carry the design.** Frames, rules, leader lines, dimension lines, hatching. Shadows only
   as hard ink offsets (lift), never blurred.
4. **Three typefaces, strict roles.** Archivo wide uppercase for display headings and names; IBM Plex
   Sans for reading; IBM Plex Mono for every label, code, date, number, stack line and table header.
5. **Drawing vocabulary, plain meaning.** Every metaphor must still read plainly: tab labels say
   "Overview / Experience / …" under "SHEET 0n"; a recruiter never has to decode anything.
6. **Numbered everything.** Sheets 01–05, details 02.1, spec rows S-01, parts 1–5, projects P-01…,
   certs C-01…, figures FIG. 1.
7. **One revision note per screen section at most.** It is a highlight, not decoration.
8. **Icons:** no icon font, no emoji. Arrows are typographic (→ ↗ ←) or 2 px square-capped inline SVG
   strokes. Tech is written as text in mono, never as coloured logos.
9. **Images:** none except the ASCII portrait (text) and project media copied from repos (Scentify
   GIF). Diagrams are HTML/CSS boxes and SVG lines, so they theme and animate.
10. **Blueprint theme** (dark): same layout, tokens' dark values — a true blueprint: deep navy paper,
    pale lines, grid in light lines, redline turns a lighter coral. Not drawn; derive from tokens.

## Layout
- Sheet: max 1320 px centred on the "desk" colour, double frame. Content padding 56 px (desktop),
  24 px (phone). Zone numbers 1–8 across the top edge on desktop only.
- Header row = monogram cell + five tab cells separated by 1 px ink rules; active tab ink-filled.
- Footer = title block, right-aligned, 4 columns × 2 rows (see `components.md`).
- Sections are separated by full-width 1 px ink rules (the sheet is divided into panels like a real
  drawing), never by empty space alone.

## Responsive
- Desktop ≥ 1024: as drawn.
- Tablet 768–1023: two-column areas stack where the drawing's flex-basis forces it; tabs stay in one
  row (labels may drop "SHEET 0n" small line).
- Phone < 768: header becomes monogram + current sheet + "Sheets" button (index panel); display sizes
  clamp (tokens); portrait block scales to 100% width with balloons moved below it as a numbered
  list; timeline turns vertical; exploded view scales; tables keep columns but scroll horizontally in
  a framed box if needed; title block becomes 2 columns. No horizontal page scroll at 320 px.

## Not drawn (build from the rules + tokens)
404 sheet; phone and tablet layouts; Blueprint theme; Dutch pages (same layout, Dutch copy);
project detail sheets other than Jamigos (same template, project-specific figures per SPEC §4.4);
the Sheets index panel on phone; Open Graph images (1200×630: a mini sheet — frame, grid, sheet
label, the page's display heading, title block with "michaelgoldman.dev").
