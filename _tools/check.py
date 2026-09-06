"""Validate the deployed HTML, navigation, multilingual links and syndication data."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote, urljoin
from datetime import datetime
import hashlib
import json
import subprocess
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITE = 'https://ajliouat.com'
config = json.loads((ROOT / '_site_source/pages.json').read_text())
errors = []

def require(condition, message):
    if not condition:
        errors.append(message)

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.elements = []
        self.ids = set()
        self.schemas = []
        self.schema = None
        self.feed(text)
    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        self.elements.append((tag, attrs))
        if 'id' in attrs:
            require(attrs['id'] not in self.ids, 'Duplicate ID: ' + attrs['id'])
            self.ids.add(attrs['id'])
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.schema = ''
    def handle_endtag(self, tag):
        if tag == 'script' and self.schema is not None:
            self.schemas.append(json.loads(self.schema))
            self.schema = None
    def handle_data(self, data):
        if self.schema is not None:
            self.schema += data
    def tags(self, tag):
        return [attrs for name, attrs in self.elements if name == tag]

expected = {}
for item in config['pages']:
    for lang in ['en', 'fr'] if item.get('fr') else ['en']:
        relative = ('fr/' if lang == 'fr' else '') + item['path']
        canonical = SITE + '/' + relative.removesuffix('index.html')
        expected[relative] = (lang, canonical, item)
scanned = {}
for relative, (lang, canonical, item) in expected.items():
    file = ROOT / relative
    require(file.is_file(), 'Missing page: ' + relative)
    if not file.is_file():
        continue
    text = file.read_text()
    page = Page(text)
    scanned[file.resolve()] = page
    links = page.tags('link')
    metas = {a.get('name', a.get('property')): a.get('content') for a in page.tags('meta')}
    require(page.tags('html')[0].get('lang') == lang, relative + ': wrong language')
    require(len(page.tags('h1')) == 1 and len(page.tags('main')) == 1, relative + ': main/H1 structure')
    require(len(page.tags('nav')) == 1 and len(page.tags('footer')) == 1, relative + ': static navigation/footer missing')
    require(any(a.get('href') == '#main-content' for a in page.tags('a')), relative + ': skip link missing')
    canonicals = [a.get('href') for a in links if a.get('rel') == 'canonical']
    require(canonicals == [canonical], relative + ': wrong canonical')
    require(bool(metas.get('description')), relative + ': missing description')
    for key in ['og:title', 'og:description', 'og:image', 'og:image:alt', 'twitter:card']:
        require(bool(metas.get(key)), relative + ': missing ' + key)
    require(metas.get('og:url') == canonical, relative + ': wrong Open Graph URL')
    require(len(page.schemas) == 1, relative + ': missing structured data')
    require(any(a.get('type') == 'application/atom+xml' for a in links), relative + ': feed not discoverable')
    require(not any('/i18n/' in a.get('src', '') for a in page.tags('script')), relative + ': runtime translations remain')
    require('avatar.png' not in text, relative + ': oversized portrait remains')
    require('{{' not in text, relative + ': unresolved template token')
    alternates = {a.get('hreflang'): a.get('href') for a in links if 'hreflang' in a}
    if item.get('fr'):
        english = SITE + '/' + item['path'].removesuffix('index.html')
        french = SITE + '/fr/' + item['path'].removesuffix('index.html')
        require(alternates == {'en': english, 'fr': french, 'x-default': english}, relative + ': incorrect language alternatives')
        switches = [a for a in page.tags('a') if a.get('class') == 'lang-toggle']
        require(len(switches) == 1, relative + ': language link missing')
        if switches:
            require(urljoin(canonical, switches[0]['href']) == (english if lang == 'fr' else french), relative + ': language link changes page')
    else:
        require(not alternates and not any(a.get('class') == 'lang-toggle' for a in page.tags('a')), relative + ': offers missing translation')
    for img in page.tags('img'):
        require(bool(img.get('alt')) and 'width' in img and 'height' in img, relative + ': image accessibility/dimensions')

for file, page in scanned.items():
    current = SITE + '/' + str(file.relative_to(ROOT))
    refs = []
    for tag, attrs in page.elements:
        for key in ['href', 'src']:
            if attrs.get(key):
                refs.append(attrs[key])
        for entry in attrs.get('srcset', '').split(','):
            if entry.strip():
                refs.append(entry.strip().split()[0])
    for ref in refs:
        parsed = urlsplit(urljoin(current, ref))
        if parsed.scheme not in ['http', 'https'] or parsed.netloc != 'ajliouat.com':
            continue
        target = ROOT / unquote(parsed.path.lstrip('/'))
        if target.is_dir():
            target /= 'index.html'
        require(target.exists(), f'{file.relative_to(ROOT)}: missing target {ref}')
        if parsed.fragment and target.resolve() in scanned:
            require(unquote(parsed.fragment) in scanned[target.resolve()].ids, f'{file.relative_to(ROOT)}: missing anchor {ref}')

atom = {'a': 'http://www.w3.org/2005/Atom'}
feed = ET.parse(ROOT / 'feed.xml').getroot()
entries = feed.findall('a:entry', atom)
article_urls = {canonical for relative, (_, canonical, p) in expected.items() if p.get('article')}
ids = [e.findtext('a:id', namespaces=atom) for e in entries]
require(set(ids) == article_urls and len(ids) == len(set(ids)), 'Atom entries must cover every article exactly once')
require(bool(feed.findtext('a:author/a:name', namespaces=atom)), 'Atom author missing')
for entry in entries:
    for field in ['title', 'id', 'updated', 'summary']:
        require(bool(entry.findtext('a:' + field, namespaces=atom)), 'Atom entry missing ' + field)
    datetime.fromisoformat(entry.findtext('a:updated', namespaces=atom).replace('Z', '+00:00'))
    require(entry.find('a:link', atom).get('href') in article_urls, 'Atom link mismatch')
locations = [el.text for el in ET.parse(ROOT / 'sitemap.xml').findall('{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
require(set(locations) == {v[1] for v in expected.values()} and len(locations) == len(set(locations)), 'Sitemap must cover all public pages exactly once')
require('Sitemap: ' + SITE + '/sitemap.xml' in (ROOT / 'robots.txt').read_text(), 'Sitemap missing from robots.txt')
for file in ['assets/avatar-160.webp', 'assets/avatar-320.webp']:
    require((ROOT / file).stat().st_size < 50000, file + ': exceeds portrait budget')
for file in ['about.html', 'fr/about.html']:
    text = (ROOT / file).read_text()
    require('ENSAI' in text and 'FSTT' in text and 'Paris-Saclay' not in text, file + ': static biography does not match existing visible biography')
for file in ['nav.js', '_tools/build.mjs', 'mermaid.js']:
    subprocess.run(['node', '--check', str(ROOT / file)], check=True, capture_output=True)
# A second build must not change the rendered release.
outputs = list(expected) + ['feed.xml', 'sitemap.xml', 'robots.txt']
before = {file: hashlib.sha256((ROOT / file).read_bytes()).hexdigest() for file in outputs}
subprocess.run(['node', str(ROOT / '_tools/build.mjs')], check=True, capture_output=True)
require(all(before[file] == hashlib.sha256((ROOT / file).read_bytes()).hexdigest() for file in outputs), 'Build is not deterministic')
if errors:
    print('\n'.join(errors))
    raise SystemExit(1)
print(f'PASS: {len(expected)} pages, {len(entries)} feed entries, links and anchors, language pairs, metadata, portraits and deterministic build.')
