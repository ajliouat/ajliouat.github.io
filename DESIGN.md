## Design philosophy

This site is designed to feel like a credible, production-grade research portfolio: clear hierarchy, low-noise visuals, and layouts that could plausibly ship as part of a serious product or lab website.

The core principles:

- Emphasize reading: typography and spacing are tuned for long-form reading rather than marketing.
- Show, don’t shout: color is used sparingly to highlight structure and key actions, not as decoration.
- Feel “engineered”: cards, diagrams, and code-like blocks borrow from developer tools rather than generic blog themes.
- Dark-first, light-optional: dark mode is the default, with a clean light theme as an alternate view.

---

## Color system

The palette is intentionally narrow and stable:

- **Neutrals**
  - Light: background `#ffffff` with subtle radial gradients (`#f9fafb` → `#f3f4f6`).
  - Dark: background `#020617` (near-black) with surfaces at `#020617`–`#111827`.
  - Borders: `#e5e7eb` (light) and `#1f2937` (dark) to keep structure visible without heavy outlines.
- **Accent (blue-only)**
  - Primary accent: `#2563eb` / `#1d4ed8` (links, badges, emphasis).
  - Secondary accent: `#0ea5e9` / `#38bdf8` (underlines, edges in diagrams).
  - Soft backgrounds: `#eff6ff` / `#bfdbfe` to give depth without high saturation.

All pages define shared CSS variables:

- `--bg`, `--surface`, `--border` for backgrounds and structure.
- `--text`, `--muted` for primary and secondary text.
- `--accent` for links and highlight elements.

The dark theme overrides these via `html[data-theme='dark']` so the same markup works in both modes.

---

## Layout and hierarchy

Across pages, the layout rules are:

- **Max width**: main content constrained to `~960px` to keep line length readable.
- **Vertical rhythm**:
  - Top padding around `3.5–4rem`.
  - Section spacing tuned so headers, subheaders, and bodies form clear blocks.
- **Grid usage**:
  - Two-column grids (`minmax(0, 1.6fr)` + `minmax(0, 1fr)`) for project detail pages.
  - Card grids (2 columns) for the projects index.

Header sections typically include:

- A small badge chip (all blue, uppercase, subtle border).
- A medium-weight title with slight negative letter spacing.
- A muted subtitle capped to ~640px width.

---

## Navigation system

The navigation bar is a shared include (`nav.html` + `nav.js`) injected into a `#site-nav-root` placeholder on every page.

Key behaviors:

- Sticky at the top with a subtle blur (`backdrop-filter: blur(12px)`).
- Link underline is a blue gradient line that animates on hover.
- Active section is highlighted via a `nav-link-active` class, driven by the current path.

Implementation details:

- HTML structure lives in `nav.html`.
- JavaScript loader lives in `nav.js`, which:
  - Fetches and injects the nav HTML.
  - Computes the active section based on `window.location.pathname`.
  - Wires up the theme toggle button.

This lets project pages and blog posts stay focused on their content while inheriting a consistent shell.

---

## Dark/light theming

The theming model is deliberately simple:

- The `<html>` element carries `data-theme="dark"` or `data-theme="light"`.
- `nav.js`:
  - Reads a stored theme from `localStorage` if present.
  - Defaults to **dark** if nothing is stored.
  - Toggles the `data-theme` attribute and persists the new value.
- `nav.html` holds the dark-theme overrides:
  - Sets `--bg`, `--surface`, `--border`, `--text`, `--muted`, `--accent` for dark mode.
  - Adjusts the nav background and link colors to remain legible.
  - Tweaks specific components (like `.tech-tag`) so text remains readable on dark surfaces.

The toggle itself:

- Compact pill button next to the nav links.
- Shows “Dark” with a moon icon when the site is in light mode, and “Light” with a sun icon in dark mode.

The overarching philosophy is that dark mode is the “primary” view for this site, with light mode being a first-class but secondary option.

---

## Components and patterns

**Cards**

- Used on the projects index and similar overview pages.
- Structure:
  - Small uppercase badge row (domain tags like “Hardware/GPU × LLM”).
  - Title, short explanatory body, and tags.
  - Footer with a primary link and status indicator.
- Visual:
  - Rounded corners, subtle border, and a faint radial gradient.
  - Hover adds elevation and a slight upward translation, mimicking modern dashboard UIs.

**Tech tags**

- Implemented as small pill elements (`.tech-tag`).
- In light mode:
  - Neutral background (`#f9fafb`), muted text, light border.
- In dark mode:
  - Dark pill background (`rgba(15, 23, 42, 0.7)`).
  - Light text (`#e5e7eb`) and a slightly stronger border.

**Back / GitHub actions**

- Consistent pattern at the bottom of project pages:
  - “Back to projects” button with a light pill style.
  - A heavier, dark gradient button for GitHub links.
- Emphasizes GitHub as the primary action while keeping navigation obvious.

---

## Diagrams (Mermaid)

Mermaid is centralized through a shared script (`mermaid.js`) instead of per-page inline initialization.

Configuration:

- Theme: `dark` with a custom blue palette.
- Fonts: system UI stack, font size around `13px` for readability.
- Nodes:
  - Fill `#0b1120`, border `#1d4ed8`, text `#e5e7eb`.
- Edges:
  - `#38bdf8`, matching the rest of the accent system.

Integration:

- Pages simply include `<script src="/mermaid.js"></script>`.
- Diagram containers reuse the same “code card” visual: dark background, subtle border, rounded corners.

This makes the diagrams feel like part of the UI rather than foreign iframes.

---

## Content tone

The visual language is deliberately understated:

- No heavy gradients or neon colors; blue is the only chromatic accent.
- Cards and diagrams read as tools and artifacts, not marketing widgets.
- Typography skews slightly more “product” than “blog” to keep the portfolio feeling like a live engineering surface.

Overall, the design target is “10/10 credible”: something that a staff-level engineer or researcher could show to a hiring committee or a collaborator and have it feel like a serious, thoughtfully engineered system rather than a throwaway personal site.

