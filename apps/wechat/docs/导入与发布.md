# 慢三拍 · 微信小游戏工程导入说明

这份工程使用微信小游戏原生 Canvas 2D 绘制界面，内置八个关卡，不依赖之前的网页域名，也不需要服务器、云开发或外部字体。游戏规则、触控、本地进度与声音都在代码包内运行。

## 当前交付范围

- 已准备微信小游戏代码工程、关卡与资源。
- 使用微信小游戏入口 `game.js`，配置文件为 `game.json` 与 `project.config.json`。
- 项目没有需要安装的 npm 运行依赖，不需要 Cocos、Unity 或 LayaAir。导入微信开发者工具后直接编译。
- 暂未绑定真实小游戏 AppID。没有账号及 AppID，不能完成微信真机预览、代码上传、体验版授权或正式审核发布。
- 普通浏览器预览或自动检查不能替代微信真机测试。账号到位后，请执行《真机测试清单》。

## 账号准备好后导入

1. 从[微信官方页面](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)安装微信开发者工具稳定版。
2. 用小游戏管理员或已绑定开发者的微信扫码登录开发者工具。
3. 从完整仓库使用时导入 `apps/wechat/`；从独立发行 ZIP 使用时导入解压后的 `three-beats-wechat/`。这一级目录应包含 `game.js`、`game.json`、`project.config.json`，不要导入完整仓库根目录。
4. 在导入界面填写自己的小游戏 **AppID**，确认项目类型为 **小游戏**。不要导入成普通小程序或小游戏插件。
5. 若工具没有在导入界面更新 AppID，可在项目详情中修改，或将 `project.config.json` 的 `appid` 改为真实值后重新导入。若本地产生了 `project.private.config.json`，注意其中同名 AppID 配置会优先于公共配置。
6. 使用当前稳定基础库编译，查看控制台是否有异常，再在模拟器中测试方向按钮、滑动、等待、撤销、提示、声音与通关。
7. 点击开发者工具提供的预览或真机调试入口，用有权限的微信账号扫码，在真实手机上测试。

AppID 和开发成员权限即可支持正常协作。身份资料在微信官方后台填写；登录扫码由账号持有人完成，工程不需要保存账号密码或 AppSecret。

## 没有 AppID 时

可以先阅读源码或运行附带的本地逻辑检查。开发者工具是否提供无 AppID／测试项目导入选项，以当前工具实际界面为准；本工程不将占位 AppID 视为真实账号，也不承诺无账号能生成可转发的体验版。

如电脑已安装 Node.js，可在小游戏工程目录运行；从完整仓库根目录运行时，为路径添加 `apps/wechat/` 前缀：

```text
node tools/check-project.cjs
node tests/logic.test.js
node tests/runtime.test.js
```

这些命令检查工程文件、规则及模拟微信宿主运行，不代表微信真机验证。游戏运行本身不需要用户安装 Node.js。

## 重新打包工程

完整仓库中运行 `python apps/wechat/tools/package.py`，默认输出到仓库的 `releases/v1.0.0/wechat/three-beats-wechat-1.0.0.zip`。脚本按自身位置定位工程，因此可以从任意工作目录调用。独立解压工程需通过 `--out` 明确指定输出文件，例如在工程目录运行：

```text
python tools/package.py --out ./dist/three-beats-wechat-1.0.0.zip
```

生成的独立 ZIP 保留导入文档、隐私草稿及真机测试清单；私有开发工具配置与缓存不进入 ZIP。正常使用不需要运行素材生成工具，已经交付的头像、分享图和音效可以直接使用。

## 体验版与正式版

先上传开发版本，在小游戏后台按当前功能入口选为体验版，并添加获准测试的体验成员。体验版用于指定成员测试，不等于任意群友都能打开。

正式发布前，应在后台完成游戏名称、图标、简介、实际截图、联系信息、用户隐私保护指引、适龄提示和当前主体／类目所需的材料。根据微信官方当前流程，小游戏备案相关前置审批、小程序备案和版本审核是不同环节；完成版本审核和小程序备案后才能正式发布。

本工程未加入虚拟支付、广告或登录能力。是否能正式发布、需要哪些资质，由账号主体、所选类目、实际功能和后台当前清单共同确定。不要仅因为游戏免费就认定无须备案或资质；将来加入充值支付、广告、排行榜或云同步，应重新核对接入和隐私要求。

## 进度与分享

- 关卡完成情况、最佳步数、当前关卡和声音偏好保存在当前微信的本地缓存中。
- 重启从当前关卡起点开始；本版本没有跨设备云同步。
- 本地缓存可能被微信或系统清理，不能当成永久云备份。
- 分享由用户主动选择，分享给谁由微信界面处理。分享不作为解锁或继续游戏的条件。
- 真正的微信分享卡片、扫码进入和体验版权限，必须在绑定真实账号后验证。

## 工程配置依据

核对日期：2026-10-30。

- [项目配置文件](https://developers.weixin.qq.com/minigame/dev/devtools/projectconfig.html)：当前文档将普通小游戏编译类型列为 `minigame`，并说明私有配置的优先级。
- [小游戏配置](https://developers.weixin.qq.com/minigame/dev/reference/configuration/app.html)：入口根目录中的 `game.json` 配置竖屏方向与状态栏等选项。
- [小游戏开发指南](https://developers.weixin.qq.com/minigame/dev/guide/)：建议开发与接入资料准备并行开展。
- [小游戏备案](https://developers.weixin.qq.com/minigame/introduction/guide/nrjs.html)、[小程序备案](https://developers.weixin.qq.com/minigame/introduction/guide/xcxba.html)、[版本审核及发布](https://developers.weixin.qq.com/minigame/introduction/guide/bbsh.html)。
- [不开通虚拟支付的资质要求](https://developers.weixin.qq.com/minigame/introduction/guide/zzsh-iaa.html)、[开通虚拟支付的资质要求](https://developers.weixin.qq.com/minigame/introduction/guide/zzsh-iap.html)。

开发者工具与后台界面可能变化；遇到界面名称不同，以当前官方工具和账号后台显示为准。
