const axios = require('axios');

// MCP Server 地址（后续可扩展多个 MCP 服务）
const MCP_BASE_URL = 'http://127.0.0.1:5001';

/**
 * 通用调用 MCP Tool 的函数（兼容简化 HTTP 协议）
 * @param {string} tool 工具名，如 "exec_pandas_code"
 * @param {object} args 参数对象，如 { code: "print(df.head())" }
 * @returns {Promise<string>} MCP Server 返回的 result 字段内容
 */
async function useTool(tool, args) {
  // console.log(">>> useTool", args);
  try {
    const res = await axios.post(`${MCP_BASE_URL}/tools/use`, {
      tool,
      args,
    });

    if (res.data.status === 'success') {
      console.log(">>> mcp call OK", res.data.result);
      return res.data.result;
    } else {
      return `[错误] MCP 调用失败：${res.data.result}`;
    }
  } catch (err) {
    console.error('❌ MCP Client Error:', err.message);
    return '[网络异常] MCP Server 无法连接';
  }
}

module.exports = { useTool };
