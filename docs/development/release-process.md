# 发版与归档

## 日常检查

```sh
node tools/check-all.cjs
python tools/verify-repository.py
```

这些检查不需要微信账号、Android SDK或签名密钥，也不会部署或上传。

## 更新产物

1. 修改对应 `apps/` 源码，运行规则与模拟宿主检查。
2. 生成网页离线HTML：`node apps/web/build-offline.mjs`。
3. 如Android代码/内置网页变化，按Android构建说明使用原签名材料重建；否则保留已交付APK的原始字节。
4. 运行 `python tools/package-deliverables.py`，重建平台源码ZIP、微信独立工程ZIP、manifest与SHA256SUMS。
5. 运行 `python tools/verify-repository.py`，检查归档与敏感文件排除。
6. 核对 `docs/validation/` 的设备/账号测试范围，更新CHANGELOG后提交Git。

完整交付ZIP可指定到仓库外，例如：

```sh
python tools/package-deliverables.py --all-out ../three-beats-all-v1.0.0.zip
```

此ZIP包含当前源码、素材、文档和发行成品，排除Git元数据、SDK、缓存与签名密钥。签名材料由所有者在仓库外另行备份。

## GitHub上传

本项目采用全新的Git历史，原Sites部署仓库历史不导入。只上传当前整理后的安全文件；仓库可见性以所有者选择为准。

不要把GitHub登录密码、验证码或访问令牌写入项目文件。没有可用认证时先保留本地提交，完成正常登录后再推送。

尚未选择开源许可证，勿在创建仓库时自动添加MIT等模板。微信AppID的真实值及私有配置由账号所有者在本机填写；初始交付保留空AppID。
