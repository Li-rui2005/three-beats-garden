"""Read-only checks for release integrity, accidental local files, JSON, and Python syntax."""
from pathlib import Path
import hashlib,json,re,sys,zipfile,xml.etree.ElementTree as ET
from urllib.parse import unquote
ROOT=Path(__file__).resolve().parents[1]
blocked_parts={'.cache','node_modules','build','signing','.openai','android-sdk-cache','local-private-backup'}
blocked_names={'project.private.config.json','signing.local.json','.env'}
blocked_suffixes={'.p12','.pfx','.jks','.keystore','.exe','.jar'}
tokens=[re.compile('gh[pousr]'+'_[A-Za-z0-9]{25,}'),re.compile('github'+'_pat_[A-Za-z0-9_]{25,}'),re.compile('-----BEGIN '+'(?:RSA |EC |OPENSSH )?PRIVATE KEY-----')]
count=0
def allowed_path(path):
    return not any(part in blocked_parts for part in path.parts) and path.name not in blocked_names and not (path.name.startswith('.env.') and path.name!='.env.example') and path.suffix.lower() not in blocked_suffixes
for source in ROOT.rglob('*'):
    relative=source.relative_to(ROOT)
    if '.git' in relative.parts or '__pycache__' in relative.parts:continue
    if not source.is_file():continue
    assert allowed_path(relative),'Forbidden local/private file: '+relative.as_posix()
    assert source.stat().st_size<50*1024*1024,'Unexpected large file: '+relative.as_posix()
    if source.suffix in {'.js','.cjs','.mjs','.json','.md','.txt','.py','.yml','.yaml','.html','.css'}:
        text=source.read_text(encoding='utf-8-sig')
        assert not any(pattern.search(text) for pattern in tokens),'Possible credential in '+relative.as_posix()
        assert not re.search(r'C:[/\\]+Users[/\\]+li(?:[/\\]|\b)',text,re.I),'Host-specific user path in '+relative.as_posix()
    if source.suffix=='.json':json.loads(source.read_text(encoding='utf-8-sig'))
    if source.suffix=='.py':compile(source.read_text(encoding='utf-8-sig'),str(relative),'exec')
    if source.suffix=='.md':
        for target in re.findall(r'\[[^\]]*\]\(([^\s)]+)\)',text):
            if target.startswith(('http:','https:','mailto:','#','codex:')):continue
            target=unquote(target.split('#',1)[0].strip('<>'))
            if target:assert (source.parent/target).exists(),'Broken local Markdown link in '+relative.as_posix()+': '+target
    if source.suffix in {'.zip','.apk'}:
        with zipfile.ZipFile(source) as archive:
            assert archive.testzip() is None,'Invalid ZIP: '+relative.as_posix()
            for name in archive.namelist():
                entry=Path(name)
                assert '..' not in entry.parts and not entry.is_absolute(),'Unsafe archive entry'
                assert '.git' not in entry.parts and allowed_path(entry),'Private file in archive '+relative.as_posix()
    count+=1
manifest=json.loads((ROOT/'releases/v1.0.0/manifest.json').read_text(encoding='utf-8'))
for artifact in manifest['artifacts']:
    source=ROOT/artifact['path']
    assert source.stat().st_size==artifact['bytes'],'Release size changed: '+artifact['path']
    assert hashlib.sha256(source.read_bytes()).hexdigest()==artifact['sha256'],'Release hash changed: '+artifact['path']
android=ET.parse(ROOT/'apps/android/AndroidManifest.xml').getroot()
assert not android.findall('uses-permission'),'Offline APK source unexpectedly requests permissions'
assert json.loads((ROOT/'apps/wechat/project.config.json').read_text(encoding='utf-8'))['appid']=='','Release source must keep the real account AppID out of this initial handoff'
print('Repository validation passed:',count,'files,',len(manifest['artifacts']),'release hashes, no prohibited files/credential patterns/host user paths.')
