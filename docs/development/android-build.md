# Android 离线 APK 构建

## 环境与路径

`apps/android/build.py` 从脚本位置定位仓库，网页源文件固定为 `apps/web/src`，不依赖旧工作区、用户目录或当前目录。当前构建脚本仅支持 Windows；已交付 APK 不含架构专属本地库。

需要 Python 3.10+、JDK（JAVA_HOME 或 PATH 中存在 java/javac/keytool/jar）、Android API 35 与 Build Tools 35.0.0。默认用 esbuild 转译网页资源，避免较早 WebView 无法解析新语法。现有 APK 已做签名与结构验证，但未完成真机运行测试。

## SDK 与 esbuild

SDK 根目录优先级为 `--sdk-root`、`ANDROID_SDK_ROOT`、`ANDROID_HOME`。支持 Android Studio SDK Manager 的标准安装目录，需要：

```text
<sdk>/build-tools/35.0.0/aapt2.exe
<sdk>/build-tools/35.0.0/aapt.exe
<sdk>/build-tools/35.0.0/zipalign.exe
<sdk>/build-tools/35.0.0/lib/d8.jar
<sdk>/build-tools/35.0.0/lib/apksigner.jar
<sdk>/platforms/android-35/android.jar
```

也可在仓库根目录运行准备工具：

```powershell
python tools/prepare-android-sdk.py --sdk-root .cache/android-sdk
```

准备工具下载 Google 官方 Build Tools 35.0.0、API 35 固定归档，并对照官方仓库公布的 SHA-1 校验；下载 npm 官方 esbuild Windows x64 0.28.2 包并校验固定 SHA-512 integrity。它将 SDK 解包为标准目录、将 esbuild 放到 `<sdk>/tools/esbuild.exe`，不执行下载的工具、不编译应用、不创建签名。可用 `--cache-dir` 指定归档缓存。使用前应阅读下载包内的 NOTICE／许可说明。

SDK、缓存、esbuild 二进制与签名均为本地依赖，不上传 GitHub；`.cache/`、`build/`、签名文件须保持 Git 忽略。

esbuild 优先级：`--esbuild`（别名 `--esbuild-binary`）、环境变量 `ESBUILD_BINARY`、`<sdk>/tools/esbuild.exe`。

## 构建方式

正常构建会从仓库网页源文件生成新的离线 HTML，临时文件写入已忽略的 `apps/android/build/run-*`，不会改写提交的 `assets/index.html` 快照：

```powershell
python apps/android/build.py --sdk-root .cache/android-sdk --signing-dir "原签名备份目录" --output .cache/android-build/three-beats.apk
```

可以额外指定 `--esbuild "esbuild.exe的路径"`。如果只想封装当前已有快照，不做网页转译：

```powershell
python apps/android/build.py --sdk-root .cache/android-sdk --signing-dir "原签名备份目录" --use-bundled-assets --output .cache/android-build/three-beats.apk
```

`--use-bundled-assets` 不需要 esbuild，但不会包含最近对 `apps/web/src` 做出的修改。两种模式都会检查离线 HTML 是否残留远程资源和未打包模块。

## 保留原签名

原签名目录必须同时包含 `three-beats-release.p12` 和 `signing.local.json`，两者一起备份；公开和私有仓库都不应存放它们。`--signing-dir` 用于指定原备份目录。缺参数、缺任一文件或密码配置无效会明确失败，不会自动换钥。密码通过子进程环境提供给工具，不作为命令行参数或写入发布报告。

只有确实要创建**不同的签名身份**时，才在空目录显式执行：

```powershell
python apps/android/build.py --sdk-root .cache/android-sdk --signing-dir .cache/new-android-signing --new-signing-key --output .cache/android-build/three-beats-new-identity.apk
```

新身份不能覆盖手机上已安装的原签名版本。创建后要保留两份本地文件；以后使用同一目录时去掉 `--new-signing-key`。该选项遇到已有签名或不完整签名备份会拒绝执行。

## 输出与检查

默认目标为 `releases/v1.0.0/android/three-beats-1.0.0.apk`。目标已存在时拒绝覆盖；本地验证请指定 `.cache/` 输出，确需替换时显式使用 `--overwrite`。

APK 签名后会进行 v2/v3 签名、ZIP 对齐、入口/资源/DEX 和无权限检查，通过后才复制到目标路径，并生成 `.sha256` 与 `.verification.txt`。报告保留公开证书指纹，但替换仓库、SDK、JDK、签名目录的宿主绝对路径。

发布新版本前需更新 Manifest 中的 `versionCode` / `versionName` 及产品说明，再选择新发布路径。更改版本名称不会更改签名身份。

## 本次整理的验证范围

本次仅重构路径和签名策略，执行 Python 语法编译与 `--help` 检查，不重建或覆盖已交付 APK。完整构建和真机运行仍需本地工具链、原签名备份与实际手机。
