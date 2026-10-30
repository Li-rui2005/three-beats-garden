# v1.0.0 发行文件

| 平台 | 文件 | 用途 |
| --- | --- | --- |
| Web | [three-beats-offline.html](web/three-beats-offline.html) | 浏览器直接打开的离线版 |
| Web | [three-beats-web-source-1.0.0.zip](web/three-beats-web-source-1.0.0.zip) | 网页源码、规则测试与打包脚本 |
| Android | [three-beats-1.0.0.apk](android/three-beats-1.0.0.apk) | 可安装的原签名离线APK，Android 8.0起 |
| Android | [three-beats-android-source-1.0.0.zip](android/three-beats-android-source-1.0.0.zip) | Android外壳、内置资源和构建脚本；不含私钥/SDK |
| Android | [verification.txt](android/verification.txt) | 脱敏后的签名及包结构检查记录 |
| 微信 | [three-beats-wechat-1.0.0.zip](wechat/three-beats-wechat-1.0.0.zip) | 独立导入工程，待填真实AppID |

[机器可读产物清单](manifest.json) · [SHA-256校验值](SHA256SUMS.txt)

Android源码ZIP可直接重建已内置的HTML版本，但需要另备SDK和明确选择签名；若从最新Web源码重新生成安卓资源，还需要完整仓库中的 `apps/web/src/`。详见 [Android构建说明](../../apps/android/README.md)。

发行包内不含签名密码、私钥、Git历史、登录凭据、SDK和本机调试配置。详细平台验证边界见[验证总览](../../docs/validation/README.md)。
