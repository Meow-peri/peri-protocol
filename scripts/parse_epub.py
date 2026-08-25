#!/usr/bin/env python3
"""Parse the Perimenopause Protocol EPUB into structured JSON for the Next.js app.

Output: /home/z/my-project/scripts/content.json
Model:
  chapters: [{ file, number, slug, title, tagline, icon, sections: [{kind, title, blocks}] }]
  Block types: heading{level,text} | para{segments} | list{ordered,items:[{text}]} |
               checklist{items:[{text}]} | card{variant,label,segments} | image{src,alt} | quote{segments}
  Segment = inline text with markers converted to a light markdown: **bold**, *italic*
"""
import json
import re
import zipfile
from bs4 import BeautifulSoup, NavigableString, Tag

EPUB = '/home/z/my-project/upload/Perimenopause_Protocol_Deluxe_Knox_Ray (1).epub'
OUT = '/home/z/my-project/scripts/content.json'

# Chapter metadata (number 0 = HRT special, etc.)
CHAPTER_META = {
    'ch004.xhtml': dict(number=1, slug='wake-up', tagline='Sleep disruption and early waking', icon='moon'),
    'ch005.xhtml': dict(number=2, slug='rage', tagline='Sudden mood or emotional fires', icon='flame'),
    'ch006.xhtml': dict(number=3, slug='belly', tagline='Weight and metabolic changes', icon='scale'),
    'ch007.xhtml': dict(number=4, slug='brain-fog', tagline='Memory and focus', icon='brain'),
    'ch008.xhtml': dict(number=5, slug='hair-loss', tagline='Shedding and hair changes', icon='sparkle'),
    'ch009.xhtml': dict(number=6, slug='joints', tagline='Pain, stiffness, or cracking', icon='bone'),
    'ch010.xhtml': dict(number=7, slug='fatigue', tagline='Tired but wired', icon='battery'),
    'ch011.xhtml': dict(number=8, slug='palpitations', tagline='Racing heart and physical anxiety', icon='heart'),
    'ch012.xhtml': dict(number=9, slug='libido', tagline='Desire, dryness, or discomfort', icon='heart'),
    'ch013.xhtml': dict(number=10, slug='periods', tagline='Flooding and cycle changes', icon='droplet'),
    'ch014.xhtml': dict(number=11, slug='acne-skin', tagline='Breakouts, dryness, and sagging', icon='sun'),
    'ch015.xhtml': dict(number=12, slug='bloating', tagline='Cycle-related digestive changes', icon='wind'),
    'ch016.xhtml': dict(number=13, slug='hrt', tagline='The HRT decision — what to ask for', icon='pill'),
    'ch017.xhtml': dict(number=14, slug='stacking', tagline='Protocol Stacking in Practice', icon='layers'),
    'ch018.xhtml': dict(number=15, slug='lab-cheatsheet', tagline='Appendix A · The Complete Lab-Test Cheat Sheet', icon='flask'),
    'ch019.xhtml': dict(number=16, slug='supplement-matrix', tagline='Appendix B · Supplement Interaction Matrix', icon='alert'),
    'ch020.xhtml': dict(number=17, slug='supplement-label', tagline='Appendix B2 · How to Read a Supplement Label', icon='tag'),
    'ch021.xhtml': dict(number=18, slug='source-stack', tagline='Appendix C · The Source Stack', icon='book'),
    'ch022.xhtml': dict(number=19, slug='doctor-scripts', tagline='Appendix D · If Your Doctor Says X, You Say Y', icon='message'),
}

INLINE_SKIP_TEXT = re.compile(r'(Track it outside Kindle|Previous:|Contents \||Next:)')

# current file being parsed (for href resolution)
CURRENT_FILE = ''


def resolve_href(href: str):
    """Map an EPUB href to a nav target: '@anchor' (same chapter) or 'slug' (other chapter).
    Returns None for nav/backmatter links we drop."""
    if not href:
        return None
    href = href.strip()
    if href.startswith('http'):
        return None
    file_part, _, frag = href.partition('#')
    file_part = file_part.split('/')[-1]
    if file_part in ('', CURRENT_FILE):
        return '@' + frag if frag else None
    if file_part in CHAPTER_META:
        return CHAPTER_META[file_part]['slug']
    return None  # ch003 (contents) / ch023 (backmatter) -> plain text


def render_inline(node) -> str:
    """Convert inline HTML to light markdown string."""
    if isinstance(node, NavigableString):
        return str(node)
    if not isinstance(node, Tag):
        return ''
    out = []
    for child in node.children:
        s = render_inline(child)
        out.append(s)
    text = ''.join(out)
    name = node.name
    if name in ('strong', 'b'):
        t = text.strip()
        return f'**{t}**' + (' ' if text.endswith(' ') else '') if t else ''
    if name in ('em', 'i'):
        t = text.strip()
        return f'*{t}*' + (' ' if text.endswith(' ') else '') if t else ''
    if name == 'a':
        target = resolve_href(node.get('href', ''))
        if target and text.strip():
            return f'[[{text}|{target}]]'
        return text
    if name == 'br':
        return '\n'
    return text


def clean(text: str) -> str:
    text = text.replace('\u00a0', ' ')
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r' ?\n ?', '\n', text)
    return text.strip()


def parse_blocks(container, skip_nav=True) -> list:
    blocks = []
    for el in container.children:
        if not isinstance(el, Tag):
            continue
        name = el.name
        if name == 'hr':
            continue
        if name in ('h3', 'h4', 'h5'):
            blocks.append(dict(type='heading', level=int(name[1]), text=clean(render_inline(el))))
        elif name == 'p':
            text = clean(render_inline(el))
            if not text or (skip_nav and INLINE_SKIP_TEXT.search(text)):
                continue
            blocks.append(dict(type='para', text=text))
        elif name == 'blockquote':
            text = clean(render_inline(el))
            if text:
                blocks.append(dict(type='quote', text=text))
        elif name in ('ul', 'ol'):
            items = []
            task = 'task-list' in (el.get('class') or [])
            for li in el.find_all('li', recursive=False):
                # strip checkbox symbols
                for sym in li.select('span.checkbox-symbol'):
                    sym.decompose()
                text = clean(render_inline(li))
                if text:
                    items.append(text)
            if items:
                blocks.append(dict(type='checklist' if task else 'list',
                                   ordered=(name == 'ol'), items=items))
        elif name == 'aside':
            cls = el.get('class') or []
            variant = 'info'
            label = ''
            for c in cls:
                if c.endswith('-card'):
                    variant = c.replace('-card', '')
            strong = el.find('strong')
            if strong:
                label = clean(strong.get_text())
            for sym in el.select('span.checkbox-symbol'):
                sym.decompose()
            text = clean(render_inline(el))
            # remove the label prefix from text (handles **LABEL** form)
            if label:
                text = re.sub(rf'^\*\*{re.escape(label)}\*\*\s*', '', text)
                text = re.sub(rf'^{re.escape(label)}\s*', '', text)
            if text:
                blocks.append(dict(type='card', variant=variant, label=label, text=text))
        elif name == 'figure':
            img = el.find('img')
            if img:
                blocks.append(dict(type='image', src=img.get('src', ''), alt=img.get('alt', '')))
        elif name == 'table':
            # convert simple tables to rows of cells
            rows = []
            for tr in el.find_all('tr'):
                cells = [clean(render_inline(c)) for c in tr.find_all(['th', 'td'])]
                if any(cells):
                    rows.append(cells)
            if rows:
                blocks.append(dict(type='table', rows=rows))
        elif name == 'section':
            # nested section — flatten as subsection
            sub_id = el.get('id', '')
            h = el.find(['h3', 'h4'])
            sub_title = clean(render_inline(h)) if h else ''
            if h:
                h.extract()
            inner = parse_blocks(el, skip_nav=skip_nav)
            blocks.append(dict(type='subsection', id=sub_id, title=sub_title, blocks=inner))
    return blocks


def classify(h2_title: str, section_id: str) -> str:
    t = h2_title.lower()
    if 'safety gate' in t:
        return 'safety'
    if 'do this now' in t:
        return 'do-now'
    if '48-hour' in t or 'today & tomorrow' in t:
        return 'fix48'
    if 'this week' in t or 'first 7 days' in t:
        return 'week7'
    if '30-day' in t:
        return 'reset30'
    if 'say this to your doctor' in t:
        return 'doctor'
    if 'the science' in t:
        return 'science'
    if 'pick your pattern' in t:
        return 'patterns'
    if "isn't working" in t or 'isn\u2019t working' in t:
        return 'troubleshooting'
    if 'is this you' in t:
        return 'is-this-you'
    return 'general'


def parse_chapter(z, filename):
    global CURRENT_FILE
    CURRENT_FILE = filename
    html = z.read(f'EPUB/text/{filename}').decode('utf-8')
    soup = BeautifulSoup(html, 'html.parser')
    body = soup.body
    meta = CHAPTER_META[filename]

    # top-level h1
    h1 = body.find('h1')
    title = clean(render_inline(h1)) if h1 else meta['tagline']
    # Normalize "Chapter N · Title" → keep full but also store short
    m = re.match(r'Chapter\s+(\d+)\s*[·•]\s*(.+)', title)
    short_title = m.group(2).strip() if m else title

    sections = []
    for sec in body.find_all('section', recursive=False):
        for sub in sec.find_all('section', recursive=False):
            h2 = sub.find('h2')
            h2_title = clean(render_inline(h2)) if h2 else ''
            if h2:
                h2.extract()
            kind = classify(h2_title, sub.get('id', ''))
            anchor = sub.get('id', '')
            # skip pure nav sections (only contain prev/contents/next links)
            inner = parse_blocks(sub)
            nav_only = all(b['type'] == 'para' and INLINE_SKIP_TEXT.search(b['text']) for b in inner)
            if not inner or nav_only:
                continue
            sections.append(dict(kind=kind, title=h2_title, anchor=anchor, blocks=inner))
    return dict(file=filename, **meta, title=short_title, fullTitle=title, sections=sections)


def main():
    z = zipfile.ZipFile(EPUB)

    # Extract images to public/book/
    import os
    img_dir = '/home/z/my-project/public/book'
    os.makedirs(img_dir, exist_ok=True)
    count = 0
    for n in z.namelist():
        if n.startswith('EPUB/media/'):
            base = os.path.basename(n)
            with open(os.path.join(img_dir, base), 'wb') as f:
                f.write(z.read(n))
            count += 1
    print(f"Extracted {count} images -> {img_dir}")

    chapters = []
    for fn in sorted(CHAPTER_META.keys()):
        ch = parse_chapter(z, fn)
        # Rewrite image srcs to /book/...
        def rewrite(blocks):
            for b in blocks:
                if b['type'] == 'image':
                    b['src'] = '/book/' + b['src'].split('/')[-1]
                elif b['type'] == 'subsection':
                    rewrite(b['blocks'])
        for s in ch['sections']:
            rewrite(s['blocks'])
        chapters.append(ch)
        sec_summary = [(s['kind'], s['title'][:40]) for s in ch['sections']]
        print(f"{fn}: {ch['title']!r} — {len(ch['sections'])} sections")

    data = dict(chapters=chapters)
    with open(OUT, 'w') as f:
        json.dump(data, f, ensure_ascii=False)
    size = len(json.dumps(data, ensure_ascii=False))
    print(f"\nSaved {len(chapters)} chapters, {size} chars -> {OUT}")


if __name__ == '__main__':
    main()
