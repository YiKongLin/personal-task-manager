<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

<!-- Copilot 项目自定义指令：个人工作计划表 -->

本项目为 Electron + React + Chart.js + PapaParse 的个人工作计划表桌面应用。

优先生成与任务管理、二维图表、CSV/JSON 导入导出、任务图标自定义、智能提示相关的代码和注释。

开发建议：
- 后端优先实现任务数据处理与本地存储，前端实现任务展示、编辑、图表渲染与智能提示
- 图表采用中心为原点的直角坐标系，横轴为缓急程度，纵轴为重要性，任务点名称与图标自适应渲染
- 任务添加后自动进入编辑状态，支持拖动点快速编辑，双击图标进入编辑
- 支持任务的 CSV/JSON 文件导入导出，导出采用 UTF-8 编码，导入自动识别格式
- 导出选项合并为下拉菜单，导入可选择文件类型
- 任务数据自动缓存到本地，支持自动/手动保存，自动保存间隔可调，刷新/关闭自动保存
- 任务图标可自定义（内置形状、图片、SVG、URL），图标大小随重要性变化，颜色随缓急变化
- 智能提示区根据任务属性给出人性化建议和计划安排
- UI 响应式美观，适配移动端和桌面端

代码规范：
- 使用现代 JavaScript 语法和 React Hooks
- 组件化设计，确保代码可复用
- 使用 Chart.js 渲染图表，确保交互流畅
- 代码需清晰易读，注释必要

如需扩展功能或优化体验，请优先考虑用户交互与数据安全。