当然 ✅ 以下是完整可用的 `README.md`（基于你当前项目结构与功能），你可以直接复制粘贴使用：

---

```markdown
# Agent

一个基于 [DeepSeek Chat](https://deepseek.com) 和 MCP 协议的智能数据分析助手，支持通过自然语言提问并自动执行 pandas 代码，对 Excel 表格进行分析。

---

## ✨ 功能特性

- 🤖 使用 DeepSeek 生成 pandas 分析代码（自然语言驱动）
- 📦 MCP Tool（`pandas-exec`）自动执行 Python 代码
- 🔌 Node.js WebSocket 后端流式连接 DeepSeek 与 MCP
- 🌐 前端 React 显示 AI 回复与 MCP 执行结果
- 📊 支持 Excel 表格结构预定义 + 简化 Tool HTTP 协议

---

## 📂 项目结构

```

agent/
├── backend/           # Node.js + Koa + WebSocket 后端
│   └── mcp-client/    # MCP 客户端 (HTTP 版)
├── frontend/          # React + socket.io 前端
├── core/              # prompt & system role 配置
├── mcp-servers/
│   └── pandas-exec/   # MCP Tool Server（运行 pandas 分析）
└── README.md

````

---

## 🚀 快速开始

### 1. 启动 MCP Tool Server

```bash
cd mcp-servers/pandas-exec
uvicorn main:app --host 0.0.0.0 --port 5001
````

### 2. 启动后端服务

```bash
cd backend
node index.js
```

### 3. 启动前端开发环境

```bash
cd frontend
yarn install
yarn dev
```

浏览器访问：[http://localhost:5173](http://localhost:5173)

---

## 📦 MCP Tool 示例调用

你也可以单独通过 curl 调用 pandas-exec：

```bash
curl -s -X POST http://127.0.0.1:5001/tools/use \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "exec_pandas_code",
    "args": {
      "code": "print(df.head())"
    }
  }' | jq -r .result
```

---

## 🧠 工作流程

```
用户提问 →
  DeepSeek 生成 pandas 代码 →
    WebSocket 后端接收 →
      MCP Client 执行代码 →
        pandas-exec MCP Server 执行 →
          返回结果展示在前端
```

---

## 📌 依赖

* Node.js >= 18
* Python >= 3.10 + uvicorn + pandas + fastapi
* DeepSeek API Key
* Excel 文件：Financial Sample.xlsx

---

## 📜 协议说明

MCP 工具使用简化的 HTTP 协议：

```http
POST /tools/use
{
  "tool": "exec_pandas_code",
  "args": { "code": "..." }
}
```

返回：

```json
{
  "status": "success",
  "result": "代码输出内容"
}
```

---

## 🏷️ 版本信息

当前版本：`v0.0.4`
更新内容详见 [CHANGELOG.md](./CHANGELOG.md)
