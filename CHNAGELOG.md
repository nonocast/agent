# Changelog

本项目使用 [Semantic Versioning](https://semver.org/lang/zh-CN/) 进行版本管理。

---

## 0.0.4 - 2025-05-03

### ✨ 新增
- 增加 MCP Client（Node.js）：通过 HTTP 调用 pandas-exec 工具
- 后端使用 buffer 累积 DeepSeek 回复，并自动触发 useTool 分析执行
- MCP Tool Server（pandas-exec）采用简化协议 `/tools/use`，使用 FastAPI + pandas 执行代码
- 前端增加 `mcp_result` 展示区域，用于显示分析输出
- 支持通过 curl + jq 直接调用 Tool 进行调试

### 🛠 优化
- AI 回复流式滚动优化
- WebSocket 响应结构清晰拆分（chunk / done / mcp_result）

---

## 0.0.3 - 2025-05-02

### ✨ 新增
- DeepSeek Chat + WebSocket 后端实现
- React 前端支持增量显示 AI 回复
- Markdown 渲染支持切换

---

## 0.0.2 - 2025-05-01

- 搭建前端框架（React + socket.io）
- 搭建后端服务（Koa + WebSocket）
- 基础消息收发功能

---

## 0.0.1 - 初始版本

- 项目初始化结构搭建
