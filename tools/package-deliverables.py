"""Create separate platform archives, release checksums, and an optional complete handoff ZIP."""
from pathlib import Path
import argparse, hashlib, json, zipfile

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--all-out',type=Path,help='Optional full-project ZIP outside the repository')
args=parser.parse_args()
release=ROOT/'releases/v1.0.0'
def excluded(path):
    return any(part in {'.git','.cache','node_modules','__pycache__','build','signing','.openai'} for part in path.parts) or path.name=='project.private.config.json' or path.suffix in {'.p12','.jks','.keystore','.pyc'}
def archive_tree(source,target,prefix):
    target.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
        for source_file in sorted(source.rglob('*')):
            relative=source_file.relative_to(source)
            if source_file.is_file() and not excluded(relative) and source_file.resolve()!=target.resolve():
                archive.write(source_file,Path(prefix)/relative)
    with zipfile.ZipFile(target) as archive:assert archive.testzip() is None
archive_tree(ROOT/'apps/web',release/'web/three-beats-web-source-1.0.0.zip','three-beats-web')
archive_tree(ROOT/'apps/android',release/'android/three-beats-android-source-1.0.0.zip','three-beats-android')
# The self-contained WeChat project has its own safe packager.
import subprocess,sys
subprocess.run([sys.executable,str(ROOT/'apps/wechat/tools/package.py'),'--out',str(release/'wechat/three-beats-wechat-1.0.0.zip')],check=True,cwd=ROOT)
artifacts=[]
for source in sorted(release.rglob('*')):
    if not source.is_file() or source.name in {'README.md','SHA256SUMS.txt','manifest.json'} or source.suffix=='.sha256':continue
    if source.suffix in {'.html','.txt','.md','.json'}:
        source.write_text(source.read_text(encoding='utf-8'),encoding='utf-8',newline='\n')
    artifacts.append({'path':source.relative_to(ROOT).as_posix(),'bytes':source.stat().st_size,'sha256':hashlib.sha256(source.read_bytes()).hexdigest()})
(release/'manifest.json').write_text(json.dumps({'version':'1.0.0','artifacts':artifacts},ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
(release/'SHA256SUMS.txt').write_text(''.join(item['sha256']+'  '+str(Path(item['path']).relative_to('releases/v1.0.0')).replace('\\','/')+'\n' for item in artifacts),encoding='utf-8',newline='\n')
if args.all_out:
    destination=args.all_out.resolve()
    if destination.is_relative_to(ROOT):raise SystemExit('--all-out must be outside the repository to avoid recursive packaging')
    archive_tree(ROOT,destination,'three-beats-garden')
    destination.with_name(destination.name+'.sha256').write_text(hashlib.sha256(destination.read_bytes()).hexdigest()+'  '+destination.name+'\n',encoding='utf-8',newline='\n')
print('Packaged platform sources and verified checksums for '+str(len(artifacts))+' release artifacts.')
