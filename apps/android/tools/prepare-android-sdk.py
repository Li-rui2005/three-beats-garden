"""Prepare pinned Windows Android SDK tools and esbuild in a local directory.

No binaries, download cache, signing keys or passwords should be committed.
"""
from pathlib import Path, PurePosixPath
import argparse
import base64
import hashlib
import os
import shutil
import sys
import tarfile
import tempfile
import urllib.request
import zipfile

PACKAGES = (
    {"url": "https://dl.google.com/android/repository/build-tools_r35_windows.zip",
     "filename": "build-tools_r35_windows.zip", "sha1": "af059bb67cf7786f45ee0db85e2d24985df1b4b6",
     "prefix": "android-15", "target": "build-tools/35.0.0", "markers": ("aapt2.exe", "aapt.exe", "zipalign.exe", "lib/d8.jar", "lib/apksigner.jar")},
    {"url": "https://dl.google.com/android/repository/platform-35_r02.zip",
     "filename": "platform-35_r02.zip", "sha1": "0bb560a90a7a2cbd0dd8348224d518b638fe7949",
     "prefix": "android-35", "target": "platforms/android-35", "markers": ("android.jar",)},
)
ESBUILD_VERSION = "0.28.2"
ESBUILD_URL = "https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-0.28.2.tgz"
ESBUILD_INTEGRITY = "sha512-5ebpxr3nWMzrL/rnUI755Jkuee0bHL/Gq0WTF9lvcpv73wAp5eu8MfBUgWK9bhWvZjj7yX8etf/8tI8Ney695g=="


def digest(path, algorithm="sha1"):
    value = hashlib.new(algorithm)
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            value.update(chunk)
    return value


def download(url, path, verify):
    if path.exists():
        if not verify(path):
            raise RuntimeError("Cached archive failed integrity verification: " + path.name)
        print("Verified cached archive: " + path.name, flush=True)
        return path
    print("Downloading " + path.name, flush=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, prefix="download-", suffix=".part", delete=False) as temporary:
        temporary_path = Path(temporary.name)
        try:
            with urllib.request.urlopen(url, timeout=120) as response:
                shutil.copyfileobj(response, temporary)
        except Exception:
            temporary.close()
            temporary_path.unlink(missing_ok=True)
            raise
    if not verify(temporary_path):
        temporary_path.unlink(missing_ok=True)
        raise RuntimeError("Downloaded archive failed integrity verification: " + path.name)
    temporary_path.replace(path)
    return path


def extract_sdk(archive, destination, prefix):
    destination = destination.resolve()
    with zipfile.ZipFile(archive) as package:
        for member in package.infolist():
            relative = PurePosixPath(member.filename)
            parts = relative.parts
            if relative.is_absolute() or ".." in parts or not parts or parts[0] != prefix:
                raise RuntimeError("Unexpected path in SDK archive: " + member.filename)
            if len(parts) == 1:
                continue
            target = destination.joinpath(*parts[1:]).resolve()
            if not target.is_relative_to(destination):
                raise RuntimeError("SDK archive path escapes destination.")
            if member.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                with package.open(member) as source, target.open("wb") as output:
                    shutil.copyfileobj(source, output)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sdk-root", type=Path, required=True, help="Local Android SDK destination")
    parser.add_argument("--cache-dir", type=Path, help="Archive cache; defaults to SDK/.downloads")
    args = parser.parse_args()
    if os.name != "nt":
        raise RuntimeError("This helper prepares Windows tools only.")
    sdk = args.sdk_root.expanduser().resolve()
    cache = args.cache_dir.expanduser().resolve() if args.cache_dir else sdk / ".downloads"
    sdk.mkdir(parents=True, exist_ok=True)
    cache.mkdir(parents=True, exist_ok=True)
    for package in PACKAGES:
        destination = sdk / package["target"]
        if all((destination / marker).is_file() for marker in package["markers"]):
            print("Using installed SDK component: " + package["target"], flush=True)
            continue
        archive = download(package["url"], cache / package["filename"],
                           lambda path, expected=package["sha1"]: digest(path).hexdigest() == expected)
        extract_sdk(archive, destination, package["prefix"])
        if not all((destination / marker).is_file() for marker in package["markers"]):
            raise RuntimeError("SDK archive lacks expected tools: " + package["target"])
        print("Prepared " + package["target"], flush=True)
    archive = download(ESBUILD_URL, cache / ("esbuild-win32-x64-" + ESBUILD_VERSION + ".tgz"),
                       lambda path: "sha512-" + base64.b64encode(digest(path, "sha512").digest()).decode() == ESBUILD_INTEGRITY)
    with tarfile.open(archive) as package:
        member = package.getmember("package/esbuild.exe")
        if not member.isfile():
            raise RuntimeError("Expected an esbuild executable file.")
        tools = sdk / "tools"
        tools.mkdir(exist_ok=True)
        with package.extractfile(member) as source, (tools / "esbuild.exe").open("wb") as output:
            shutil.copyfileobj(source, output)
    print("Prepared pinned esbuild " + ESBUILD_VERSION + ". This helper does not execute downloaded tools.", flush=True)
    print("SDK root: " + str(sdk), flush=True)
    print("Review SDK NOTICE/license files before use. Pass --sdk-root or set ANDROID_SDK_ROOT when building.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, KeyError, zipfile.BadZipFile, tarfile.TarError) as error:
        print("Toolchain preparation failed: " + str(error), file=sys.stderr)
        sys.exit(1)
