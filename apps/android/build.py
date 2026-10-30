"""Build the signed offline Android APK on Windows, independent of cwd.

Signing is explicit: an absent identity is never silently replaced.
"""
from pathlib import Path
import argparse
import hashlib
import json
import os
import re
import secrets
import shutil
import subprocess
import sys
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[1]
WEB = REPO / "apps" / "web" / "src"
DEFAULT_OUTPUT = (REPO / "releases/v1.0.0/android/three-beats-1.0.0.apk"
                  if (REPO / "apps/web/src").is_dir() else ROOT / "build/three-beats-1.0.0.apk")


def arguments():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sdk-root", type=Path, help="SDK root; otherwise ANDROID_SDK_ROOT or ANDROID_HOME")
    parser.add_argument("--esbuild", "--esbuild-binary", dest="esbuild", type=Path,
                        help="esbuild.exe; otherwise ESBUILD_BINARY, then SDK/tools/esbuild.exe")
    parser.add_argument("--use-bundled-assets", action="store_true", help="Use assets/index.html without re-bundling web source")
    parser.add_argument("--signing-dir", type=Path, help="Directory with the existing signing.local.json and three-beats-release.p12")
    parser.add_argument("--new-signing-key", action="store_true", help="Explicitly create a NEW identity in an empty signing directory")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Signed APK output")
    parser.add_argument("--overwrite", action="store_true", help="Explicitly permit replacement of an existing output APK")
    return parser.parse_args()


def run(args, env=None):
    result = subprocess.run([str(x) for x in args], cwd=ROOT, env=env,
                            capture_output=True, text=True, encoding="utf-8", errors="replace")
    if result.returncode:
        raise RuntimeError(f"{Path(str(args[0])).name} failed:\n{result.stdout}\n{result.stderr}")
    return (result.stdout + result.stderr).strip()


def required_file(path, label):
    if not path.is_file():
        raise RuntimeError(f"{label} not found: {path}")
    return path


def java_tools():
    java_home = os.environ.get("JAVA_HOME")
    found = {}
    for name in ("java", "javac", "keytool", "jar"):
        candidate = Path(java_home).expanduser() / "bin" / (name + ".exe") if java_home else None
        if not candidate or not candidate.is_file():
            on_path = shutil.which(name)
            candidate = Path(on_path) if on_path else None
        if not candidate or not candidate.is_file():
            raise RuntimeError("Set JAVA_HOME or PATH to a JDK containing java, javac, keytool and jar.")
        found[name] = candidate.resolve()
    return found


def signing_material(directory, create, keytool):
    if directory is None:
        raise RuntimeError("Specify --signing-dir for the existing identity. Use --new-signing-key only to intentionally create a different identity.")
    directory = directory.expanduser().resolve()
    config, keystore = directory / "signing.local.json", directory / "three-beats-release.p12"
    if config.exists() != keystore.exists():
        raise RuntimeError("Incomplete signing backup: restore BOTH signing.local.json and three-beats-release.p12. No replacement was created.")
    if config.exists():
        if create:
            raise RuntimeError("Identity already exists. Remove --new-signing-key to reuse it, or choose a different empty directory.")
        password = json.loads(config.read_text(encoding="utf-8-sig")).get("password")
        if not isinstance(password, str) or not password:
            raise RuntimeError("The existing signing.local.json contains no usable password.")
    else:
        if not create:
            raise RuntimeError("Signing identity not found. Restore it, or explicitly use --new-signing-key to create a different identity.")
        if directory.exists() and any(directory.iterdir()):
            raise RuntimeError("New signing identities require an empty signing directory.")
        directory.mkdir(parents=True, exist_ok=True)
        password = secrets.token_urlsafe(32)
        env = dict(os.environ, THREEBEATS_STOREPASS=password)
        run([keytool, "-genkeypair", "-keystore", keystore, "-storetype", "PKCS12",
             "-alias", "threebeats", "-keyalg", "RSA", "-keysize", "2048", "-sigalg", "SHA256withRSA",
             "-validity", "10000", "-dname", "CN=Three Beats Garden, OU=Independent Game",
             "-storepass:env", "THREEBEATS_STOREPASS", "-keypass:env", "THREEBEATS_STOREPASS", "-noprompt"], env=env)
        config.write_text(json.dumps({"password": password}) + "\n", encoding="utf-8")
        print("Created the explicitly requested NEW identity. Preserve both local signing files for updates.", flush=True)
    return directory, keystore, dict(os.environ, THREEBEATS_STOREPASS=password)


def make_assets(build, sdk, args):
    assets = build / "assets"
    shutil.copytree(ROOT / "assets", assets)
    if args.use_bundled_assets:
        required_file(assets / "index.html", "Bundled offline HTML")
        print("Using the committed HTML snapshot; current web source changes are not incorporated.", flush=True)
        return assets
    binary = args.esbuild or os.environ.get("ESBUILD_BINARY") or sdk / "tools/esbuild.exe"
    esbuild = required_file(Path(binary).expanduser().resolve(), "esbuild.exe (--esbuild or ESBUILD_BINARY)")
    for name in ("app.js", "style.css", "index.html"):
        required_file(WEB / name, "Web source")
    run([esbuild, WEB / "app.js", "--bundle", "--format=iife", "--target=chrome57", "--charset=utf8",
         "--legal-comments=none", "--outfile=" + str(build / "game.js")])
    css = re.sub(r"^@import[^;]+;\s*", "", (WEB / "style.css").read_text(encoding="utf-8"))
    css += """
/* Android 8 WebView compatibility fallbacks. */
dialog { width: calc(100% - 32px); max-width: 460px; }
.brand { pointer-events: none; }
@supports not (aspect-ratio: 1 / 1) {
 .board-wrap { height: 0; padding-top: 83.93%; }
 #board { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
 @media(max-width: 760px) { .board-wrap { padding-top: 84.82%; } }
}
"""
    (build / "source.css").write_text(css, encoding="utf-8")
    run([esbuild, build / "source.css", "--target=chrome57", "--charset=utf8", "--outfile=" + str(build / "game.css")])
    html = (WEB / "index.html").read_text(encoding="utf-8")
    html = html.replace('<link rel="stylesheet" href="style.css">', "<style>" + (build / "game.css").read_text(encoding="utf-8") + "</style>")
    html = html.replace('<script type="module" src="app.js"></script>', "<script>" + (build / "game.js").read_text(encoding="utf-8") + "</script>")
    html = html.replace('href="./"', 'href="#"').replace("THREE BEATS LATER</small>", "THREE BEATS LATER · OFFLINE</small>")
    csp = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; connect-src \'none\'; base-uri \'none\'; form-action \'none\'">\n  '
    html = html.replace('<meta name="theme-color"', csp + '<meta name="theme-color"')
    (assets / "index.html").write_text(html, encoding="utf-8")
    print("Bundled web source; JavaScript and CSS target Chrome 57.", flush=True)
    return assets


def validate_assets(assets):
    html = (assets / "index.html").read_text(encoding="utf-8")
    if re.search(r'<(?:script|link|img)[^>]+(?:src|href)=[\"\']https?://', html) or "@import" in html:
        raise RuntimeError("External asset reference remains in the offline HTML.")
    if 'type="module"' in html:
        raise RuntimeError("An unbundled module remains in the offline HTML.")


def main():
    args = arguments()
    if os.name != "nt":
        raise RuntimeError("The build toolchain currently supports Windows only; the existing APK is universal Android.")
    sdk_value = args.sdk_root or os.environ.get("ANDROID_SDK_ROOT") or os.environ.get("ANDROID_HOME")
    if not sdk_value:
        raise RuntimeError("Specify --sdk-root, ANDROID_SDK_ROOT or ANDROID_HOME. See docs/development/android-build.md.")
    sdk = Path(sdk_value).expanduser().resolve()
    bt = sdk / "build-tools/35.0.0"
    android = required_file(sdk / "platforms/android-35/android.jar", "Android API 35 platform")
    for name in ("aapt2.exe", "aapt.exe", "zipalign.exe", "lib/d8.jar", "lib/apksigner.jar"):
        required_file(bt / name, "Build Tools 35.0.0 component")
    java = java_tools()
    target = args.output.expanduser().resolve()
    if target.exists() and not args.overwrite:
        raise RuntimeError("Output already exists. Choose another --output or explicitly pass --overwrite.")
    signing, keystore, env = signing_material(args.signing_dir, args.new_signing_key, java["keytool"])
    (ROOT / "build").mkdir(exist_ok=True)
    build = Path(tempfile.mkdtemp(prefix="run-", dir=ROOT / "build"))
    for name in ("classes", "generated", "dex"):
        (build / name).mkdir()
    assets = make_assets(build, sdk, args)
    validate_assets(assets)
    run([bt / "aapt2.exe", "compile", "--dir", ROOT / "res", "-o", build / "resources.zip"])
    run([bt / "aapt2.exe", "link", "-I", android, "--manifest", ROOT / "AndroidManifest.xml",
         "--java", build / "generated", "-A", assets, "-R", build / "resources.zip",
         "--min-sdk-version", "26", "--target-sdk-version", "35", "--auto-add-overlay", "-o", build / "resources.apk"])
    sources = sorted((ROOT / "src").rglob("*.java")) + sorted((build / "generated").rglob("*.java"))
    run([java["javac"], "--release", "8", "-encoding", "UTF-8", "-classpath", android, "-d", build / "classes", *sources])
    run([java["jar"], "--create", "--file", build / "classes.jar", "-C", build / "classes", "."])
    run([java["java"], "-cp", bt / "lib/d8.jar", "com.android.tools.r8.D8", "--release", "--min-api", "26",
         "--lib", android, "--output", build / "dex", build / "classes.jar"])
    shutil.copyfile(build / "resources.apk", build / "unsigned.apk")
    with zipfile.ZipFile(build / "unsigned.apk", "a", compression=zipfile.ZIP_DEFLATED) as apk:
        for dex in sorted((build / "dex").glob("classes*.dex")):
            apk.write(dex, dex.name)
    run([bt / "zipalign.exe", "-P", "16", "-f", "4", build / "unsigned.apk", build / "aligned.apk"])
    signer = [java["java"], "-jar", bt / "lib/apksigner.jar"]
    signed = build / "signed.apk"
    run([*signer, "sign", "--ks", keystore, "--ks-key-alias", "threebeats",
         "--ks-pass", "env:THREEBEATS_STOREPASS", "--key-pass", "env:THREEBEATS_STOREPASS",
         "--v1-signing-enabled", "false", "--v2-signing-enabled", "true", "--v3-signing-enabled", "true",
         "--v4-signing-enabled", "false", "--out", signed, build / "aligned.apk"], env=env)
    verification = run([*signer, "verify", "--verbose", "--print-certs", signed])
    alignment = run([bt / "zipalign.exe", "-c", "-P", "16", "4", signed])
    badging = run([bt / "aapt.exe", "dump", "badging", signed])
    permissions = run([bt / "aapt.exe", "dump", "permissions", signed])
    if "uses-permission" in permissions:
        raise RuntimeError("Unexpected Android permission in the offline APK.")
    with zipfile.ZipFile(signed) as apk:
        if "classes.dex" not in apk.namelist() or "assets/index.html" not in apk.namelist():
            raise RuntimeError("Incomplete APK package.")
        if any(name.startswith("lib/") for name in apk.namelist()):
            raise RuntimeError("Expected a universal APK without ABI-specific native libraries.")
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(signed, target)
    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    report = "\n".join(["Three Beats Android build verification", "Package: com.threebeats.garden",
        "Minimum Android: 8.0 (API 26)", "Target API: 35", "Internet permission: absent",
        "Native ABI libraries: absent (universal APK)", "APK bytes: " + str(target.stat().st_size),
        "SHA256: " + digest, "", verification, "", alignment, "", badging, "", permissions,
        "", "Validation limit: this script does not perform phone/emulator runtime tests."])
    for path, label in ((REPO, "<repository>"), (sdk, "<android-sdk>"), (signing, "<local-signing>"),
                        (java["java"].parent.parent, "<jdk>")):
        for spelling in (str(path), path.as_posix()):
            report = report.replace(spelling, label)
    target.with_suffix(".verification.txt").write_text(report + "\n", encoding="utf-8")
    Path(str(target) + ".sha256").write_text(digest + "  " + target.name + "\n", encoding="utf-8")
    print("Signature v2/v3, alignment, package structure and offline permission checks passed.", flush=True)
    print("APK: " + str(target), flush=True)
    print("SHA256: " + digest, flush=True)


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, zipfile.BadZipFile) as error:
        print("Build failed: " + str(error), file=sys.stderr)
        sys.exit(1)
