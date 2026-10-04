# Screens

PNG = rendered drawing (taken literally for layout, spacing, type and wording). `html/` = the exact
HTML/CSS each PNG was rendered from — copy values from it rather than measuring pixels.

| File | Screen (SPEC §) | Route | State | Scheme | Width |
|---|---|---|---|---|---|
| overview-default-light-1440.png | Sheet 01 Overview (§4.1) | / | default | paper | 1440 |
| experience-default-light-1440.png | Sheet 02 Experience (§4.2) | /experience | default | paper | 1440 |
| projects-default-light-1440.png | Sheet 03 Projects (§4.3) | /projects | default | paper | 1440 |
| project-detail-jamigos-default-light-1440.png | Sheet 03.1 Project detail (§4.4) | /projects/jamigos | default | paper | 1440 |
| certifications-default-light-1440.png | Sheet 04 Certifications (§4.5) | /certifications | default | paper | 1440 |
| education-default-light-1440.png | Sheet 05 Education (§4.6) | /education | part 3 selected | paper | 1440 |
| html/motion-preview.dc.html | Motion reference for §M1 (design/motion.md) | / | first load | paper | 1440 |

Notes on the drawings:
- The Education drawing shows the exploded view at its final (fully exploded) state; plates may
  overlap slightly in the PNG — in the build give each plate enough vertical spacing that only the
  thickness shadows touch (see `design/motion.md` §M5).
- The motion preview is a Design-canvas component file (`<x-dc>`, `{{holes}}`, `<sc-for>`); read its
  `<helmet><style>` for keyframes/timings and its script for the portrait stagger and crosshair.
- The overview drawing predates the "How I work", S-07 and "In progress" blocks in `design/copy.md`:
  build those in the same visual language (panels split by 1 px ink rules, mono labels).

## Not drawn
See `design/README.md` "Not drawn": 404, phone/tablet, Blueprint theme, Dutch pages, project
details other than Jamigos, phone sheet index panel, Open Graph images.
