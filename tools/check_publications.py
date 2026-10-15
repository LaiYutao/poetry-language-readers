"""Verify published reader snapshots. Run: python3 tools/check_publications.py"""
from pathlib import Path
import hashlib, html, json, re, unicodedata
import xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def norm(s):return re.sub(r'\s+','',unicodedata.normalize('NFKC',s))
for folder in ['celan-atemkristall','rilke-selected','trakl-gedichte-1913']:
    dest=root/'publications/de'/folder
    data=json.loads((dest/'alignment.json').read_text())
    for kind,name in [('content','content.json'),('markdown',data['markdown']),('pdf',data['pdf'])]:
        assert digest(dest/name)==data[kind+'_sha256'],f'{folder}: {kind} differs from verified build'
    for name,expected in data['web_assets'].items():
        assert digest(dest/name)==expected,f'{folder}: stale web asset {name}'
    assert digest(root/'assets/reader.js')==data['runtime_sha256'],f'{folder}: player changed'
    content=json.loads((dest/'content.json').read_text());poems=content if isinstance(content,list) else content['poems']
    markdown=norm(html.unescape(re.sub(r'<[^>]+>','',(dest/data['markdown']).read_text())))
    for p in poems:
        for paragraph in p['translation'].split('\n'):
            assert norm(paragraph) in markdown,f'{folder}: poem {p["n"]} translation differs'
    # Context-reviewed plural labels must survive lexical compound replacements.
    if folder == 'celan-atemkristall':
        raw_md = html.unescape(re.sub(r'<[^>]+>', '', (dest/data['markdown']).read_text()))
        for poem in poems:
            for row in poem['lines']:
                for word, gloss in row:
                    if '·复' in gloss:
                        matches = re.findall(r'\*\*' + re.escape(word) + r'\*\* → ([^；\n]+)', raw_md)
                        assert matches and all('·复' in value for value in matches), f'{folder}: missing plural for {word}'
    assert data['checks']['web_pages_derived_from_current_pdf']
    if data['format']=='modular-web-v3-text':
        for name,expected in data['shared_fonts'].items():
            assert digest(root/name)==expected,f'{folder}: font changed {name}'
        checks=data['text_validation']['pages']
        assert len(checks)==data['pages'] and all(p['character_check'] for p in checks)
        for page in sorted((dest/'web/text-pages').glob('*.html')):
            markup=page.read_text();svg=ET.fromstring(markup[:markup.index('</svg>')+6])
            assert list(svg.iter('{http://www.w3.org/2000/svg}text')),f'{folder}/{page.name}: no actual text'
            assert not list(svg.iter('{http://www.w3.org/2000/svg}use')),f'{folder}/{page.name}: old glyph reference'
            for span in svg.iter('{http://www.w3.org/2000/svg}tspan'):
                family=span.get('font-family');weight=span.get('font-weight')
                if family=='ReaderSongLight':assert weight=='300'
                if family=='ReaderSongUI':assert weight=='400'
    if data['format'] == 'modular-web-v2':
        shared = ET.parse(dest/'web/glyphs-common.svg').getroot()
        shared_ids = {e.get('id') for e in shared.iter() if e.get('id')}
        for page in sorted((dest/'web/pages').glob('*.html')):
            markup = page.read_text()
            svg = ET.fromstring(markup[:markup.index('</svg>')+6])
            local_ids = {e.get('id') for e in svg.iter() if e.get('id')}
            assert not shared_ids & local_ids, f'{folder}/{page.name}: duplicate shared ID'
            for element in svg.iter():
                for attr, value in element.attrib.items():
                    if attr.endswith('href') and value.startswith('#'):
                        assert value[1:] in shared_ids | local_ids, f'{folder}/{page.name}: missing {value}'
    print(folder+': OK ('+str(len(poems))+' poems)')
