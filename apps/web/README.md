# 网页版

`src/` 为可直接编辑的HTML/CSS/JavaScript源码，采用构建无关的静态页面方式。

- `node apps/web/preview.mjs`：从仓库根目录启动本机预览。
- `node apps/web/test-engine.js`：运行八项规则检查。
- `node apps/web/build-offline.mjs`：生成 `releases/v1.0.0/web/three-beats-offline.html`。
- `node apps/web/build-offline.mjs 自定义输出路径`：指定离线HTML输出位置。

脚本按自身所在位置解析源码路径，不要求把当前工作目录切换到本文件夹。

方向键/WASD移动，空格等待，Z撤销，R重来；手机可点击按钮或滑动棋盘。浏览器本地存储保存完成关卡和最佳步数。详情见根目录README和玩法设计说明。
