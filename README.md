# 个人工作计划表

本项目是一个基于 Electron、React、Chart.js 和 PapaParse 的桌面个人工作计划表应用，支持任务可视化、智能优先级建议、CSV/JSON 导入导出、自动/手动本地缓存、任务图标自定义等功能，适用于日常工作与自我管理。

## 主要功能

- 任务以二维坐标图展示（横轴：缓急程度，纵轴：重要性），中心为原点，直观区分任务优先级
- 支持添加、编辑、删除任务，添加后自动进入编辑状态
- 支持任务的 CSV/JSON 文件导入与导出，导出采用 UTF-8 编码，避免乱码
- 导出选项合并为下拉菜单，导入可自动识别文件类型
- 任务图标可自定义（内置形状、图片、SVG、URL），图标大小随重要性变化，颜色随缓急变化
- 支持任务点拖动快速编辑，移动端/PC端均可流畅操作
- 任务数据自动缓存到本地，支持自动保存和手动保存，自动保存间隔可调，刷新/关闭自动保存
- 智能提示区根据任务属性给出人性化建议和计划安排
- 响应式美观 UI，适配移动端和桌面端

## 启动开发环境

1. 安装依赖：`npm install`
2. 启动前端开发服务器：`npm run dev`
3. 构建前端后启动桌面端：`npm run build && npm run start`


## 打包与分发

### 通用准备
1. 安装 electron-builder：`npm install --save-dev electron-builder`
2. 构建前端：`npm run build`

### macOS 平台
打包为 DMG/ZIP（arm64 架构）：

```sh
npm run electron:build -- --mac
```
打包产物在 `dist/` 目录下，包含 `.dmg` 和 `.zip` 文件。

### Windows 平台
打包为 EXE 安装包（x64 架构）：

```sh
npm run electron:build -- --win --x64
```
打包产物在 `dist/` 目录下，包含 `.exe` 文件。

### Linux 平台
打包为 AppImage/DEB 等格式（x64 架构）：

```sh
npm run electron:build -- --linux
```
打包产物在 `dist/` 目录下，包含 `.AppImage`、`.deb` 等文件。

> 如需多平台同时打包，可用：
> ```sh
> npm run electron:build -- -mwl
> ```
> 其中 `-mwl` 代表 mac、win、linux。

## 未来计划

- 深度集成 Electron 与前端通信
- 增强智能推荐与自动计划能力
- 支持多端同步与云备份
- 增加更多动画与自定义配置

---

如有建议或需求，欢迎反馈与交流。
