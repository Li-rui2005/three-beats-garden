# 慢三拍 · Android 离线版

本目录包含原生 Android WebView 外壳、Manifest、桌面图标和内置 HTML。APK 内置八关资源，不依赖网页域名、不声明联网权限，最低系统为 Android 8.0（API 26）。现有安装包位于完整仓库的 `releases/v1.0.0/android/`。

## 构建前提

- 当前构建脚本仅支持 **Windows**；生成的 APK 不区分 ARM/x86 架构。
- Python 3.10+、JDK（含 java/javac/keytool/jar；已验证 JDK 25）。
- 标准 Android SDK：`build-tools/35.0.0`、`platforms/android-35`。
- 默认通过 esbuild 打包 `apps/web/src`；`--use-bundled-assets` 可保留当前离线 HTML 快照。
- 原 APK 的本地签名备份，仓库不包含签名私钥与密码。

完整参数、工具准备与签名说明见 [Android 构建说明](docs/build.md)。独立Android源码ZIP也包含此文档与 `tools/prepare-android-sdk.py`。

以下示例在仓库根目录运行，签名路径需要替换为实际本机目录：

```powershell
python tools/prepare-android-sdk.py --sdk-root .cache/android-sdk
python apps/android/build.py --sdk-root .cache/android-sdk --signing-dir "原签名备份目录" --output .cache/android-build/three-beats.apk
```

也可设置 `ANDROID_SDK_ROOT` / `ANDROID_HOME`；esbuild 可用 `--esbuild` / `ESBUILD_BINARY` 指定。源码和默认发布路径按脚本位置定位，不依赖调用时的当前目录。从其他目录调用时，使用对应脚本与输入目录的绝对路径即可。

缺少原签名时构建会明确失败，**不会自动生成替代签名**。只有显式 `--new-signing-key` 才能在空目录创建新身份；新身份不能覆盖手机上已安装的原签名版本。

独立源码包中可先准备SDK，然后使用内置HTML快照构建：

```powershell
python tools/prepare-android-sdk.py --sdk-root .cache/android-sdk
python build.py --sdk-root .cache/android-sdk --use-bundled-assets --signing-dir "原签名备份目录" --output build/three-beats.apk
```

若要重新转译最新Web源码，请使用完整仓库；独立Android包没有Web源文件。

默认发布目标已存在时也会拒绝覆盖，避免改写已有交付；本地构建建议输出到 `.cache/`。签名及结构检查不代替真机测试，当前仍未完成安卓真机/模拟器运行验证。
