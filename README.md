# Abdeljalil Jliouat — personal site

Static portfolio and technical articles at [ajliouat.com](https://ajliouat.com). GitHub Pages publishes the checked-in HTML on `main`.

## Editing and publishing

1. Edit page content and page-specific styles in `_site_source/pages/`.
2. Edit titles and descriptions in `_site_source/pages.json`. It explicitly lists the public pages and the five pages with French equivalents.
3. Shared editorial text and French article summaries are in `_site_source/editorial.json`. Existing page translations are in `i18n/*.en.js` and `i18n/*.fr.js`; these files are used during the build, not loaded by the generated pages.
4. Run `node _tools/build.mjs`, then `python3 _tools/check.py`.
5. Preview with `python3 -m http.server 8765 --bind 127.0.0.1`, review the changes and commit the source and generated files together. Pushing `main` triggers GitHub Pages.

The build uses Node.js built-ins only. The checks use Python's standard library and Node.js; there are no packages to install. The check validates generated links, anchors, language alternatives, navigation, metadata, feed entries, image budgets and build reproducibility.

Do not edit the generated root, `blog/`, `projects/` or `fr/` HTML directly: the next build replaces it. Shared navigation and footer markup are in `_tools/build.mjs`; shared styling is in `assets/site.css`. `nav.js` handles only the theme and applies the stored preference before the page paints.

## Articles and language

To add an article, add its HTML source under `_site_source/pages/blog/` and a corresponding entry in `_site_source/pages.json` with `article: true`, its headline, summary, known year and an ISO 8601 `updated` timestamp. Add its French summary and topic in `_site_source/editorial.json`. Rebuilding updates both article indexes, reading times, related reading, the Atom feed and the sitemap.

The feed uses stable article URLs as IDs. The imported articles' `updated` values come from their last recorded Git modification. They are not asserted to be original publication dates. Preserve the known years; do not invent exact publication dates. Set `updated` when revising an article and `feedUpdated` when updating the feed.

The main pages have English URLs and real French equivalents under `/fr/`, with reciprocal `hreflang` links and self-canonicals. Technical project pages and articles currently remain in English. Their language is declared correctly and they do not offer a nonexistent French translation. French indexes provide translated summaries and label links to English content.

## Assets

The supplied portrait remains available as `avatar.png` for compatibility. Pages use `assets/avatar-160.webp` (5,600 bytes) or `assets/avatar-320.webp` (15,022 bytes), with explicit dimensions and responsive selection. Recreate the variants with `cwebp -q 84 -resize 160 160 avatar.png -o assets/avatar-160.webp` and the equivalent command for 320 px.

The share preview is `assets/social-card.png`, rendered from its neighboring SVG. Shared CSS and navigation script URLs include content hashes to refresh browser caches when they change.

Source and tooling directories are excluded from the GitHub Pages output. Workspace migration backups, audit reports, project environments and vault files are outside this public repository.
