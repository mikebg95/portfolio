# Components

Exact markup/CSS reference: the drawings' HTML in `design/screens/html/` (class names there —
`.paper`, `.tab`, `.note`, `.box`, `.row`, `.stamp`, `.cert`, `.card`, `.tb`, `.plate`, `.hatch` —
are a good starting vocabulary). Values from `tokens.json`. Every interactive component: visible focus
ring (2 px focus colour, 2 px offset, square), min 44 × 44 px hit area, works with keyboard.

## SheetFrame
Desk background → sheet (`paper` + grid) with 2 px outer border, 10 px padding, 1 px inner border.
Optional zone strip 1–8 (desktop). Slot for header, sections, footer. Motion: §M1 frame draw.

## SheetHeader / SheetTab
Monogram cell: 38 px square, 2 px ink border, "MG" Archivo 800; beside it "DRAWING SET" (mono 11 px
600) / "michaelgoldman.dev" (muted). Tabs: flex 1 1 140 px, padding 12 × 18, 1 px ink right rule,
small line "SHEET 0n" (10 px muted) over name (12 px mono). States: default; hover (underline draws
under the name); active (`ink` fill, `ink-on-fill` text, `aria-current="page"`); focus. Utility
cluster (right): EN/NL switch (two mono buttons, active one underlined), theme
switch (button "PAPER"/"BLUEPRINT" with a small square swatch), CV link.

Phone (< 768 px, `overview-default-light-390`): one 56 px row of ruled cells — 56 px monogram cell
(30 px MG square) · "SHEET 0n / 05" (micro muted) over the sheet name (13 px mono) · language cell
"EN/NL" (current underlined; links to the other) · theme cell (16 px swatch split on the diagonal,
no label on screen). No CV: it is on Sheet 01's buttons and in the title block's CONTACT cell.

## SheetTabBar (phone)
Title-block strip fixed to the screen bottom (replaces the old SHEETS panel): 2 px ink top rule,
5 equal cells with 1 px ink rules, 62 px tall + the safe-area inset; number (mono 15 600) over the
short name (mono 10). Current cell ink-filled (`aria-current="page"`); the fill slides between
cells on a sheet change (§M2). Plain links (works without JS); the page is padded to scroll clear.

## SheetLabel
Mono 12 px, letter-spacing .12em, `line` colour, uppercase: "SHEET 0n — NAME · VIEW TYPE".

## DisplayHeading
Archivo 800–850, font-stretch 118%, uppercase, line-height .88–.92, size display-xl (Sheet 01 name)
or display-l (other sheets) or display-m/s (section/detail titles). Motion: plotter wipe.

## Button
Primary: ink fill, `ink-on-fill` text, mono 13 px, letter-spacing .04em, padding 14 × 22, square.
Secondary: 1.5 px ink border, transparent. Hover: the opposite fill wipes in from the left (200 ms).
Pressed: translate 1 px 1 px. Focus ring. Disabled: not used.

## Link
`line` colour, no underline; hover → `redline`; external links end with " ↗" and open in a new tab
with `rel="noopener"`.

## DimensionLine
Horizontal or vertical: arrowhead (CSS triangle 8 × 4) – 1 px line – mono 10 px label – line –
arrowhead, all `line` colour. `aria-hidden` (the label's fact is also in real text elsewhere).

## Balloon (+ Leader)
Leader: 1 px ink line. Balloon: 22–26 px circle, 1.5 px ink border, mono 600 number; variants:
default, active (ink fill, paper number), pending (dashed redline). When it represents a link/selector
it is a `<button>` or `<a>` with an accessible name ("Part 3: Minor Programming").

## RevisionNote
1.5 px dashed redline border, redline mono 12.5–13 px text, padding 10–14 × 14–18, rotate −0.8° to
−1.2°, max-width 420–470 px, background paper-raised; begins with "REV. NOTE △" (600) unless it is a
"NOTE:". Motion: stamp.

## SpecTable / SpecRow
Rows: grid 64 px code (mono 12 muted) · 150 px label (mono 12 600 .06em) · value (body 15). Bottom
rule `rule` colour; last row none. Motion: ink-in.

## GeneralNotes
Ordered list, body 14.5 px, muted-dark text, 12 px gap, heading label "GENERAL NOTES".

## TitleBlock (footer)
Right-aligned, max 760 px, 4 columns: [PROJECT ×2][SCALE][SHEET] / [DRAWN][CHECKED][REV][CONTACT].
Caption mono 9 px .1em muted, value mono 11 px (PROJECT value Archivo 800 16 px). 1 px ink cell
rules. Phone: 2 columns.

## TimelineRuler / TimelineBar (Sheet 02)
Ruler: one column per year, 1.5 px ink tick at each year start, mono 11 px year label. Bars: 44 px
tall, 1.5 px ink border, fill-1 (older) / fill-2 / ink (current, with →), sabbatical hatched with a
dashed border. Positions by month. Duration dimension under each bar. Bars are links to their detail.

## ExperienceDetail
Two columns: left 220 px (number "02.n" mono 34 px line colour, dates, employer · place) and right
(display-m title, context paragraph, bullet list, optional RevisionNote, stack line mono 12 muted).
Separated by 1 px rules. An employer (Conspect, PR-60) titles itself "role — employer" and nests
its assignments ("02.na", h3, title 20–26 px) under a line-colour bracket with its name along it,
dashed rules between them; an assignment's left column reads dates, engagement (line colour), place.

## ProjectCard
1.5 px ink border, paper-raised, square. Top: label (P-0n · KIND). Middle: mini diagram of `.box`
elements (1.5 px line border, mono 10.5 px). Title display-s, summary 14–15 px. Bottom: title-block
strip with 3 cells (caption + value). Variants: flagship (spans 2 columns), in-progress (dashed
border, redline label). States: hover/focus = lift (6 px hard shadow) + arrows redraw. Whole card is
one link.

## Figure / Box / Arrow (project details)
Figure: 1.5 px ink frame, label "FIG. n — NAME". Box: 1.5 px line border, mono 11.5 px, bold first
line in ink. Arrow: mono "⟶"/"→" or a 1.5 px line with a CSS arrowhead; optional mono 11 px label
above ("JWT"). Dashed box = external system.

## PipelineRoute
Horizontal line through 14 px circles (stations), mono 11 px labels under each; final station
filled. Motion: a dot travels the route once on enter, each station ticks.

## CertCard / Stamp
Card: 1.5 px ink border, padding 28. Stamp: 96 px circle, 2.5 px line border with an inner ring,
rotated −12°, three mono lines (VERIFIED / year bold / issuer). Pending variant: dashed redline, no
inner ring, rotating dash. Skill chips: 1 px muted border, mono 11.5 px, square.

## ExplodedAssembly (Sheet 05)
Plates: squares transformed `rotateX(58deg) rotateZ(-45deg)` (isometric), 1.5 px ink border, fills
fill-1/2/3/paper, 7 px hard ink offset for thickness; CS50 plate smaller (150 px); CKAD plate dashed
redline with redline-tint. Dashed centre axis. Balloons right of each plate's right corner with
leaders. Each plate, balloon and parts-list row is a button selecting the part (`aria-pressed`).
Selected: plate lifted 12 px + fill line colour at 25%; others 60% opacity; row highlighted fill-1.

## PartsList
Table with 1.5 px ink frame, header row mono 10 px .1em muted, cells mono 12 px, 1 px rules; row
states: default, hover (fill-1 at 50%), selected (fill-1), pending (redline text).

## DetailPanel
1.5 px ink border, paper-raised, padding 24: label "DETAIL n · SCALE 2:1", display-m title, meta
mono, body paragraph, sub-rows (code · text · EC), optional NOTE.

## Crosshair
Two dashed 1 px redline hairlines at 45% opacity + mono 10 px redline readout "X 0412 · Y 0233",
`pointer-events: none`, `aria-hidden`. Desktop fine pointer only.

## SkipLink
"Skip to sheet content" — visually hidden until focused, then an ink button top-left.
