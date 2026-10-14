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
    assert data['checks']['web_pages_derived_from_current_pdf']
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
