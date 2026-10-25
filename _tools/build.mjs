import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const write = (file, value) => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
  fs.writeFileSync(path.join(root, file), value.replace(/[\t ]+$/gm, ''))
}
const config = JSON.parse(read('_site_source/pages.json'))
const editorial = JSON.parse(read('_site_source/editorial.json'))
const { site, pages } = config
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const plain = value => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
const route = file => '/' + file.replace(/index\.html$/, '')
const local = (file, lang) => (lang === 'fr' ? '/fr' : '') + route(file)
const url = (file, lang = 'en') => site + local(file, lang)
const version = file => createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex').slice(0, 10)
const dictionaries = {}
for (const lang of ['en', 'fr']) {
  const context = { window: {} }
  vm.createContext(context)
  for (const file of fs.readdirSync(path.join(root, 'i18n')).filter(f => f.endsWith(`.${lang}.js`)).sort()) {
    vm.runInContext(read(`i18n/${file}`), context, { filename: file, timeout: 1000 })
  }
  dictionaries[lang] = { ...context.window.I18N[lang], ...editorial[lang] }
}
const articles = pages.filter(p => p.article)
const bilingual = new Set(pages.filter(p => p.fr).map(p => route(p.path)))
const stem = p => path.basename(p.path, '.html')
// Reading time counts the prose only: styles, scripts, inline SVG and Mermaid sources are not read.
const readingMinutes = source => {
  const prose = source.replace(/<(style|script|svg)\b[^>]*>[\s\S]*?<\/\1>/g, ' ').replace(/<div class="mermaid">[\s\S]*?<\/div>/g, ' ')
  return Math.max(1, Math.ceil(plain(prose).split(/\s+/).length / 220))
}
// A translated article has a full French source next to the English one and is published at the same path under /fr/.
const frSourcePath = p => p.path.replace(/\.html$/, '.fr.html')
for (const p of pages) {
  p.source = read(`_site_source/pages/${p.path}`)
  if (p.article) {
    p.minutes = readingMinutes(p.source)
    p.topic = editorial.articles[stem(p)]?.topic || 'Calcul et inférence'
    if (p.fr) {
      p.fr.source = read(`_site_source/pages/${frSourcePath(p)}`)
      p.fr.minutes = readingMinutes(p.fr.source)
      const index = editorial.articles[stem(p)] || {}
      if (index.title || index.summary) throw new Error(`${p.path}: a translated article takes its French title and summary from pages.json; remove them from editorial.json`)
    }
  }
}
const sourceOf = (p, lang) => lang === 'fr' && p.fr?.source ? p.fr.source : p.source
function translate(html, lang) {
  return html.replace(/<([\w-]+)([^>]*\bdata-i18n="([^"]+)"[^>]*)>[\s\S]*?<\/\1>/g, (_, tag, attrs, key) => {
    if (dictionaries[lang][key] === undefined) throw new Error(`Missing ${lang} translation: ${key}`)
    return `<${tag}${attrs}>${esc(dictionaries[lang][key])}</${tag}>`
  })
}
function nav(p, lang) {
  const t = dictionaries[lang]
  const destinations = [['home', 'index.html'], ['about', 'about.html'], ['projects', 'projects/index.html'], ['blog', 'blog/index.html'], ['communities', 'communities.html'], ['contact', 'contact.html']]
  const links = destinations.map(([key, file]) => `<a href="${local(file, lang)}" class="nav-link${p.section === key ? ' nav-link-active' : ''}"${p.section === key ? ' aria-current="page"' : ''}>${esc(t[`nav.${key}`])}</a>`).join('\n')
  const other = lang === 'fr' ? 'en' : 'fr'
  const language = p.fr ? `<a class="lang-toggle" href="${local(p.path, other)}" lang="${other}" hreflang="${other}" aria-label="${other === 'fr' ? 'Lire cette page en français' : 'Read this page in English'}">${other.toUpperCase()}</a>` : '<span class="language-note" title="This page is available in English">EN</span>'
  return `<a class="skip-link" href="#main-content">${lang === 'fr' ? 'Aller au contenu' : 'Skip to content'}</a>
<div id="site-nav-root"><header class="site-nav"><div class="nav-inner"><a href="${local('index.html', lang)}" class="nav-brand">Abdeljalil Jliouat</a><nav class="nav-links" aria-label="${lang === 'fr' ? 'Navigation principale' : 'Main navigation'}">${links}</nav><div class="nav-toggles"><button class="theme-toggle" type="button" aria-label="${lang === 'fr' ? 'Thème sombre' : 'Dark theme'}" aria-pressed="false" hidden><span class="theme-toggle-icon" aria-hidden="true">☾</span><span class="theme-toggle-label">${lang === 'fr' ? 'Sombre' : 'Dark'}</span></button>${language}<a href="https://julie.ajliouat.com" class="aj-link" aria-label="${lang === 'fr' ? 'Espace personnel' : 'Personal space'}">AJ</a></div></div></header></div>`
}
function footer(lang) {
  const t = dictionaries[lang]
  return `<footer class="site-footer"><div class="site-footer-inner"><div class="site-footer-left"><span class="site-footer-brand">${esc(t['footer.brand'])}</span><span>${esc(t['footer.tagline'])}</span><span>${esc(t['footer.location'])}</span></div><div class="site-footer-right"><a href="mailto:contact@ajliouat.com">contact@ajliouat.com</a><a href="/feed.xml">${lang === 'fr' ? 'S’abonner via RSS' : 'Subscribe via RSS'}</a><a href="https://github.com/ajliouat">GitHub</a></div></div></footer>`
}
function articleList(lang, source) {
  const order = [...source.matchAll(/class="post-title">\s*<a href="([^"]+)"/g)].map(m => `blog/${m[1]}`)
  const ordered = [...new Set([...order, ...articles.map(p => p.path)])].map(file => articles.find(p => p.path === file)).filter(Boolean)
  const topics = { 'Calcul et inférence': 'Compute & inference', 'Robotique et signaux': 'Robotics & neural signals', 'Optimisation et énergie': 'Optimization & energy' }
  return ordered.map(p => {
    const fr = p.fr ? { title: p.fr.headline, summary: p.fr.description } : editorial.articles[stem(p)]
    const title = lang === 'fr' && fr ? fr.title : p.headline
    const summary = lang === 'fr' && fr ? fr.summary : p.description
    const translated = lang === 'fr' && p.fr, href = translated ? local(p.path, 'fr') : route(p.path)
    const action = lang === 'en' ? 'Read article →' : translated ? 'Lire l’article →' : 'Lire l’article en anglais →'
    return `<article class="post-card"><div class="post-meta"><span>${p.year}</span><span>${esc(lang === 'fr' ? p.topic : topics[p.topic])}</span><span>${translated ? p.fr.minutes : p.minutes} min${lang === 'en' ? ' read' : ' de lecture'}</span></div><h2 class="post-title"><a href="${href}">${esc(title)}</a></h2><p class="post-excerpt">${esc(summary)}</p><a href="${href}" class="post-link">${action}</a></article>`
  }).join('\n')
}
function related(p, lang) {
  const choices = articles.filter(a => a.path !== p.path).sort((a, b) => Number(b.topic === p.topic) - Number(a.topic === p.topic)).slice(0, 2)
  if (lang === 'fr') {
    const item = a => a.fr ? `<li><a href="${local(a.path, 'fr')}">${esc(a.fr.headline)}</a></li>` : `<li><a href="${route(a.path)}" hreflang="en">${esc(editorial.articles[stem(a)]?.title || a.headline)}</a> (en anglais)</li>`
    return `<section class="next-reading" aria-labelledby="next-reading-title"><h2 id="next-reading-title">Pour aller plus loin</h2><ul>${choices.map(item).join('')}</ul><p>Vous travaillez sur un problème similaire ? <a href="/fr/contact.html">Parlons-en.</a></p><a href="/feed.xml">Recevoir les nouveaux articles via RSS</a></section>`
  }
  return `<section class="next-reading" aria-labelledby="next-reading-title"><h2 id="next-reading-title">Keep exploring</h2><ul>${choices.map(a => `<li><a href="${route(a.path)}">${esc(a.headline)}</a></li>`).join('')}</ul><p>Working on a similar problem? <a href="/contact.html">Let’s discuss it.</a></p><a href="/feed.xml">Get new articles via RSS</a></section>`
}
function renderBody(p, lang) {
  const source = sourceOf(p, lang)
  const css = source.match(/<style>([\s\S]*?)<\/style>/)[1]
  let body = source.replace(/<style>[\s\S]*?<\/style>\s*/, '')
  // Inline scripts are code, not markup: set them aside so the link, table and translation rewrites cannot alter them.
  const scripts = []
  body = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, script => `<!--script:${scripts.push(script) - 1}-->`)
  body = translate(body, lang).replaceAll('{{articleCount}}', articles.length)
  body = body.replace(/<main\b([^>]*)>/, '<main$1 id="main-content" tabindex="-1">')
  body = body.replace(/<img src="avatar\.png[^"]*"[^>]*>/, '<img src="/assets/avatar-160.webp" srcset="/assets/avatar-160.webp 160w, /assets/avatar-320.webp 320w" sizes="80px" alt="Abdeljalil Jliouat" class="profile-image" width="80" height="80" decoding="async">')
  body = body.replace(/href="([^"#][^"]*)"/g, (whole, href) => {
    if (/^[a-z][\w+.-]*:|^\/\//i.test(href)) return whole
    const resolved = new URL(href, site + route(p.path))
    if (lang === 'fr' && bilingual.has(resolved.pathname)) resolved.pathname = '/fr' + resolved.pathname
    return `href="${resolved.pathname}${resolved.search}${resolved.hash}"`
  })
  // A link that now leads to a French page no longer points to English content.
  if (lang === 'fr') body = body.replace(/<a\b[^>]*\bhref="\/fr\/[^"]*"[^>]*>/g, tag => tag.replace(/\s+hreflang="en"/, ''))
  body = body.replace(/<table\b[^>]*>[\s\S]*?<\/table>/g, (table, offset) => {
    const headings = [...body.slice(0, offset).matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)]
    const label = headings.length ? plain(headings.at(-1)[1]) : 'Data table'
    return `<div class="table-scroll" role="region" aria-label="${esc(label)}" tabindex="0">${table.replace(/<th(\s|>)/g, '<th scope="col"$1')}</div>`
  })
  if (p.path === 'blog/index.html') {
    body = body.replace(/<section class="posts-list">[\s\S]*?<\/section>/, `<section class="posts-list" aria-label="Articles">${articleList(lang, p.source)}</section>`)
    body = body.replace('</p>\n    </section>', `</p><p class="rss-callout"><a href="/feed.xml">${lang === 'fr' ? 'Recevoir les nouveaux articles via RSS →' : 'Follow new articles via RSS →'}</a></p>\n    </section>`)
  }
  if (p.path === 'projects/index.html' && lang === 'fr') {
    body = body.replace(/View details\s*→/g, 'Voir le projet en anglais →')
      .replaceAll('Hardware/GPU × LLM', 'Calcul GPU × LLM')
      .replaceAll('LLM × Robotics × GPU', 'LLM × Robotique × GPU')
      .replaceAll('Quantum AI × Energy', 'IA quantique × Énergie')
      .replaceAll('Scripted control', 'Contrôle scripté')
  }

  if (p.article) {
    const minutes = lang === 'fr' && p.fr ? `${p.fr.minutes} min de lecture` : `${p.minutes} min read`
    body = body.replace(/(<div class="post-meta">)([\s\S]*?)(<\/div>)/, `$1$2 · ${minutes}$3`)
    body = body.replace('</main>', related(p, lang) + '\n</main>')
  }
  if (!p.fr && p.section === 'projects') body = body.replace('</main>', '<section class="next-reading"><h2>Building a similar system?</h2><p><a href="/contact.html">Get in touch about your project.</a></p></section>\n</main>')
  if (lang === 'fr') body = body.replace('aria-label="Work at a glance"', 'aria-label="Mon travail en bref"')
  body = body.replace(/<!--script:(\d+)-->/g, (_, index) => scripts[index])
  return { css, body }
}
const updatedOf = (p, lang) => (lang === 'fr' && p.fr.updated) || p.updated
function metadata(p, lang) {
  const detail = lang === 'fr' ? p.fr : p
  const canonical = url(p.path, lang), image = `${site}/assets/social-card.png`
  const person = { '@type': 'Person', '@id': `${site}/#person`, name: 'Abdeljalil Jliouat', url: `${site}/about.html`, jobTitle: 'Senior Applied AI Engineer', image: `${site}/assets/avatar-320.webp`, sameAs: ['https://github.com/ajliouat', 'https://www.linkedin.com/in/a-jliouat/'] }
  const item = { '@type': p.article ? 'BlogPosting' : p.section === 'about' ? 'ProfilePage' : 'WebPage', '@id': canonical, url: canonical, name: detail.title, description: detail.description, inLanguage: lang }
  if (p.article) Object.assign(item, { headline: detail.headline, author: { '@id': person['@id'] }, dateModified: updatedOf(p, lang), image: [image], mainEntityOfPage: canonical })
  if (p.section === 'about') item.mainEntity = { '@id': person['@id'] }
  const alternates = p.fr ? ['en', 'fr', 'x-default'].map(l => `<link rel="alternate" hreflang="${l}" href="${url(p.path, l === 'fr' ? 'fr' : 'en')}">`).join('\n') : ''
  const metas = { 'og:type': p.article ? 'article' : 'website', 'og:site_name': 'Abdeljalil Jliouat', 'og:locale': lang === 'fr' ? 'fr_FR' : 'en_US', 'og:title': detail.title, 'og:description': detail.description, 'og:url': canonical, 'og:image': image, 'og:image:width': '1200', 'og:image:height': '630', 'og:image:alt': 'Abdeljalil Jliouat — Applied AI and systems engineering' }
  return `<title>${esc(detail.title)}</title><meta name="description" content="${esc(detail.description)}"><link rel="canonical" href="${canonical}">\n${alternates}
<link rel="alternate" type="application/atom+xml" title="Abdeljalil Jliouat — Technical articles" href="${site}/feed.xml">
${Object.entries(metas).map(([property, content]) => `<meta property="${property}" content="${esc(content)}">`).join('\n')}
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(detail.title)}"><meta name="twitter:description" content="${esc(detail.description)}"><meta name="twitter:image" content="${image}">
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': [person, item] }).replaceAll('<', '\\u003c')}</script>`
}
const urls = []
for (const p of pages) {
  for (const lang of p.fr ? ['en', 'fr'] : ['en']) {
    const { css, body } = renderBody(p, lang)
    write((lang === 'fr' ? 'fr/' : '') + p.path, `<!DOCTYPE html>
<!-- Generated by _tools/build.mjs; edit _site_source/pages/${lang === 'fr' && p.fr?.source ? frSourcePath(p) : p.path}. -->
<html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
${metadata(p, lang)}
<style>${css}</style><link rel="stylesheet" href="/assets/site.css?v=${version('assets/site.css')}"><script src="/nav.js?v=${version('nav.js')}"></script>
</head><body>${nav(p, lang)}\n${body}\n${footer(lang)}
${body.includes('class="mermaid"') ? `<script src="/mermaid.js?v=${version('mermaid.js')}" defer></script>` : ''}
</body></html>\n`)
    urls.push(url(p.path, lang))
  }
}
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${esc(u)}</loc></url>`).join('\n')}\n</urlset>\n`)
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`)
// One entry per article and language, each declaring its language.
const entries = articles.flatMap(p => (p.fr ? ['en', 'fr'] : ['en']).map(lang => ({ p, lang, detail: lang === 'fr' ? p.fr : p, updated: updatedOf(p, lang) })))
  .sort((a, b) => new Date(b.updated) - new Date(a.updated))
  .map(({ p, lang, detail, updated }) => `<entry xml:lang="${lang}"><id>${url(p.path, lang)}</id><title>${esc(detail.headline)}</title><link href="${url(p.path, lang)}"/><updated>${esc(updated)}</updated><summary>${esc(detail.description)}</summary></entry>`)
write('feed.xml', `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en"><id>${site}/feed.xml</id><title>Abdeljalil Jliouat — Applied AI &amp; Systems Engineering</title><subtitle>Code, experiments and engineering notes on production AI.</subtitle><link rel="self" href="${site}/feed.xml"/><link href="${site}/blog/"/><updated>${config.feedUpdated}</updated><author><name>Abdeljalil Jliouat</name><uri>${site}/about.html</uri></author>\n${entries.join('\n')}\n</feed>\n`)
console.log(`Built ${urls.length} pages, ${entries.length} feed entries and a sitemap.`)
