"""Package the standalone WeChat source project without local account settings."""
from pathlib import Path
import argparse
import hashlib
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE_NAME = 'three-beats-wechat-1.0.0.zip'
EXCLUDED_NAMES = {'project.private.config.json', '.DS_Store', 'Thumbs.db'}
EXCLUDED_PARTS = {'.git', '__pycache__', 'node_modules', '.cache', '.pytest_cache', 'build', 'dist', 'coverage'}


def default_target():
    """Only infer the release directory for the documented monorepo layout."""
    repository = ROOT.parent.parent
    if (ROOT.name == 'wechat' and ROOT.parent.name == 'apps'
            and (repository / 'apps' / 'web').is_dir()
            and (repository / 'apps' / 'android').is_dir()):
        return repository / 'releases' / 'v1.0.0' / 'wechat' / ARCHIVE_NAME
    return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, metavar='FILE.zip',
                        help='Output ZIP path; required for a standalone extracted project.')
    args = parser.parse_args()
    target = args.out.expanduser().resolve() if args.out else default_target()
    if target is None:
        parser.error('Standalone project: specify --out /path/to/' + ARCHIVE_NAME)
    if target.suffix.lower() != '.zip':
        parser.error('--out must name a .zip file, not a directory')
    target = target.resolve()
    checksum = target.with_name(target.name + '.sha256')
    temporary = target.with_name(target.name + '.tmp')
    generated = {target, checksum, temporary}

    # Resolve source paths from this script so the caller can use any working directory.
    sources = []
    for source in sorted(ROOT.rglob('*')):
        relative = source.relative_to(ROOT)
        if (not source.is_file() or source.is_symlink()
                or source.resolve() in generated
                or source.name in EXCLUDED_NAMES
                or source.suffix.lower() in {'.pyc', '.pyo'}
                or any(part in EXCLUDED_PARTS for part in relative.parts)):
            continue
        sources.append((source, relative))

    target.parent.mkdir(parents=True, exist_ok=True)
    try:
        with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_DEFLATED,
                             compresslevel=9) as archive:
            for source, relative in sources:
                archive.write(source, (Path('three-beats-wechat') / relative).as_posix())
        with zipfile.ZipFile(temporary) as archive:
            if archive.testzip() is not None:
                raise RuntimeError('Project ZIP integrity check failed')
            names = archive.namelist()
            for required in ('game.js', 'game.json', 'project.config.json'):
                if 'three-beats-wechat/' + required not in names:
                    raise RuntimeError('Required project file missing: ' + required)
        temporary.replace(target)
    finally:
        if temporary.exists():
            temporary.unlink()

    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    checksum.write_text(digest + '  ' + target.name + '\n', encoding='utf-8', newline='\n')
    print('Project ZIP integrity: OK')
    print('Output: ' + str(target))
    print('Files: ' + str(len(sources)) + '; size: ' + str(target.stat().st_size) + ' bytes')
    print('SHA256: ' + digest)


if __name__ == '__main__':
    main()
