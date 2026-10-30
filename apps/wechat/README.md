# 慢三拍 · 微信小游戏工程 1.0.0

一个和三步前的自己合作的八关解谜游戏。原生微信小游戏 Canvas 2D 绘制，CommonJS 模块，不包含网页容器，不依赖原来的网页域名。

## 账号准备好后

从完整仓库使用时，小游戏工程目录是 `apps/wechat/`；使用独立发行 ZIP 时，工程目录是解压后的 `three-beats-wechat/`。导入这一级目录，不要将完整仓库根目录当作小游戏工程。

1. 克隆完整仓库，或将微信工程发行 ZIP 解压到一个独立目录。
2. 打开 `project.config.json`，将 `appid` 的空字符串填为小游戏后台的真实 AppID。
3. 打开微信开发者工具，用管理员或已授权开发者的微信扫码登录，导入包含 `game.js` 的工程根目录，确认项目类型为「小游戏」。
4. 编译后先检查模拟器，再进行安卓/iPhone真机预览，按 `docs/真机测试清单.md` 验证。

也可在项目目录运行 `node tools/set-appid.cjs 你的真实AppID` 配置。AppID 尚未填写是有意保留的状态；它不是能直接给朋友玩的体验版。无需提供密码或 AppSecret。

本项目无需安装 npm 依赖，不需要 npm 构建。项目配置采用当前微信官方文档的 `compileType: "minigame"`。如果开发工具里另有 `project.private.config.json`，请核对它是否覆盖 AppID 等配置。

## 当前包含

- 全部八关、三步延迟回声、等待、机关门、无限撤销、动态下一步提示。
- 金色种子与青色回声的 Canvas 图形，手机竖屏自适应布局。
- 触控按钮、棋盘滑动、开关音效与音频中断处理。
- 已完成关卡、最佳步数、所在关卡和声音设置的微信本地存储；冷启动重置当前关卡内的脚步。
- 微信好友分享入口、500 × 400 分享卡片、256 × 256 头像图标。
- 本地生成的 WAV 音效，无远程字体或图片，无登录、广告、充值、云同步和服务器请求。

资源都在代码包内，不需要购买服务器或配置请求域名。微信客户端自身的联网、账号能力和平台规则仍然由微信管理。

## 目录

```text
game.js                  微信小游戏入口、生命周期和触控调度
game.json                竖屏与状态栏配置
project.config.json      微信开发者工具配置，待填真实AppID
js/engine.js             八关数据、纯规则和BFS求解器
js/controller.js         游玩状态、撤销、提示、进度管理
js/renderer.js           Canvas界面、角色、棋盘、弹层
js/platform.js           wx存储、音效、分享和窗口适配
assets/                  头像、分享卡片和本地音效
docs/                    导入发布说明、隐私草稿、真机清单
tests/                   规则和wx模拟运行检查
tools/                   配置AppID、校验工程和资源生成工具
dev/                     浏览器适配预览，上传时忽略
```

## 本地检查

需要 Node.js；检查工具不需要安装第三方包。以下命令在小游戏工程目录中运行；在仓库根目录运行时，为路径添加 `apps/wechat/` 前缀。

```text
node tools/check-project.cjs
node tests/logic.test.js
node tests/runtime.test.js
```

浏览器预览：运行 `node tools/serve-preview.cjs` 后打开它输出的本地地址。预览中的微信接口由模拟适配层提供，页面上已标明「非微信真机验证」，不能代替微信开发工具编译、真机调试或审核。

`dev/preview.js` 已提供。如修改了小游戏源码，可用 esbuild 重新生成：

```text
esbuild dev/preview-entry.js --bundle --format=iife --target=es2018 --charset=utf8 --outfile=dev/preview.js
```

这只影响浏览器预览，不是微信工程的构建步骤。

## 打包独立工程与可选素材生成

在完整仓库中，可以从任意工作目录调用 `apps/wechat/tools/package.py` 的完整或相对路径。它默认生成仓库内的 `releases/v1.0.0/wechat/three-beats-wechat-1.0.0.zip` 和对应 `.sha256` 文件，ZIP 内的工程根目录是 `three-beats-wechat/`。脚本会排除私有开发工具配置、Git 元数据、模块缓存与 Python 缓存。

从仓库根目录打包：

```text
python apps/wechat/tools/package.py
```

独立解压工程不推断其他目录，重新打包时需要显式指定输出 ZIP；相对输出路径按当前工作目录解析：

```text
python tools/package.py --out ./dist/three-beats-wechat-1.0.0.zip
```

头像、分享图和音效已经包含在 `assets/` 中，正常导入或打包不需要重新生成。只有修改这些素材时才运行 `tools/generate-assets.py`；该可选工具需要 Python、Pillow，以及可读取的中文字体。它会尝试 Windows、macOS、Linux 的标准字体位置，也可以明确指定字体：

```text
python tools/generate-assets.py --font /path/to/chinese-font.ttf
```

找不到字体时会明确报错，不会先改写已交付素材。不同字体可能使重新生成的图片外观发生变化；本次整理未重新生成素材。

## 发布前仍需完成

本工程已完成代码移植、规则与模拟运行检查。当前没有真实 AppID，尚未在微信开发者工具或微信真机内完成编译、预览、上传、体验版和审核。

账号所有者需要核对真实主体、服务类目、备案/前置审批、隐私保护指引、适龄提示和该路线要求的资质。隐私文件是草稿，运营主体、联系方式和后台声明需由账号所有者核对填写。体验版的体验成员与正式发布的公众访问规则不同。

**已知设计边界：** 关卡内当前脚步只保存在运行内存，关闭后从当前关卡起点开始；卸载微信、清理存储或系统回收可能清除本地进度。没有跨设备同步。

代码、美术图形、关卡文字和音效均为本项目制作；设计调研参考了既有时间回放解谜作品，未将「回声协作」机制宣称为首创。
