# Presentation and reading

The site uses a system typeface, a narrow neutral-and-blue palette and static pages. Shared presentation lives in `assets/site.css`; page content and local layout rules live in `_site_source/pages/`. Make changes there and regenerate the public HTML with `_tools/build.mjs`.

## Typography and layout

- Main content is constrained to about 960 px. Long articles use a narrower reading column.
- The home headline uses regular weight, 24 px on small screens and up to 30 px on desktop, with a 1.35 line height.
- Project section headings use 18 px, medium weight and the primary text color. Project prose uses 15 px with a 1.8 line height.
- Page introductions use short category labels, proportionate titles and muted descriptions.
- Project details have an unboxed reading column and a right-hand contents list on desktop. At 840 px and below, the contents list appears above the text in two columns.
- Overview entries are separated by thin rules and whitespace. They have no enclosing card surface, elevation or movement on hover.

## Color and themes

| Role | Light | Dark |
|---|---|---|
| Page background | `#ffffff` | `#020617` |
| Primary text | `#0f172a` | `#e5e7eb` |
| Secondary text | `#6b7280` | `#9ca3af` |
| Borders | `#e5e7eb` | `#1f2937` |
| Link accent | `#2563eb` | `#38bdf8` |

Use the shared `--bg`, `--surface`, `--border`, `--text`, `--muted` and `--accent` variables. Page backgrounds are flat. Category labels and technology lists are plain, muted text; decorative dots and tag outlines are suppressed. Links within prose remain underlined so color is not their only distinguishing feature.

Light is the default. `nav.js` reads the reader's saved preference before painting and the theme control updates `data-theme` on the root element. Both themes use the same content and layout.

## Navigation and actions

Navigation and the footer are generated into every page and work without JavaScript. The header stays at the top; a blue underline identifies the active section. The keyboard skip link and visible focus outlines must remain usable.

Functional controls retain rounded shapes:

- Home actions have pill corners, a 40 px minimum height and content-sized widths.
- Theme, language and profile controls stay compact and rounded.
- Project footer actions retain pill shapes. The GitHub action uses a solid, contrasting surface without a gradient, shadow or hover movement.

The home page links directly to a recent technical study. Counts of projects or articles are not displayed as achievements.

## Code, tables and diagrams

Code and diagrams keep their bounded surfaces where these help distinguish technical material from prose. Long code blocks and tables scroll within their own containers instead of widening the page.

`mermaid.js` renders diagrams using the system font and the current light or dark theme. It preserves diagram sources and serializes redraws when the theme changes. Diagram colors use the same neutral and blue family as the site.

## Build and review

Run `node _tools/build.mjs` and `python3 _tools/check.py` from this repository. The build refreshes stylesheet cache references across all generated pages.

Inspect affected pages on mobile first, then desktop, in both themes. Check translated main pages, long titles, contents links, focus indicators, table containment and image loading. Keep existing public paths and anchors stable. Generated pages use static language links; legacy runtime translation files are retained only for older cached pages.
