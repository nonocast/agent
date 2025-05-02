const Koa = require('koa');
const http = require('http');
const { Server } = require('socket.io');
const morgan = require('koa-morgan');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const Router = require('koa-router');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { useTool } = require('./mcp-client');

const systemPandasPrompt = fs.readFileSync(
  path.resolve(__dirname, '../core/prompts/system.pandas.txt'),
  'utf-8'
);

const app = new Koa();
const router = new Router();

app.use(morgan('dev'));
app.use(cors());
app.use(bodyParser());

router.get('/', (ctx) => {
  ctx.type = 'text';
  ctx.body = 'agent-backend running (deepseek-chat via websocket)';
});

app.use(router.routes()).use(router.allowedMethods());

// 创建 HTTP server + socket.io
const server = http.createServer(app.callback());
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

io.on('connection', (socket) => {
  console.log('✅ WebSocket connected:', socket.id);

  let buffer = ''; // 用于流式累计 AI 回复内容

  socket.on('chat', async (data) => {
    const message = data.message;
    buffer = ''; // 每次新对话清空 buffer

    try {
      const res = await axios.post(
        "https://api.deepseek.com/v1/chat/completions",
        {
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPandasPrompt },
            { role: "user", content: message },
          ],
          stream: true,
        },
        {
          responseType: "stream",
          headers: {
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      res.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim().startsWith('data: '));
        for (const line of lines) {
          const json = line.replace(/^data:\s*/, '');
          if (json === '[DONE]') {
            socket.emit('done');
            return;
          }

          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              buffer += delta;
              socket.emit('chunk', delta);
            }
          } catch (err) {
            console.error('❌ JSON parse error:', err.message);
          }
        }
      });

      res.data.on('end', async () => {
        socket.emit('done');

        // 判断 buffer 是否为可执行 pandas 代码
        if (buffer.includes('df')) {
          const result = await useTool('exec_pandas_code', { code: buffer });
          socket.emit('mcp_result', result);
        }

        buffer = ''; // 清空缓存，准备下一次对话
      });

    } catch (err) {
      console.error('❌ DeepSeek Error:', err.message);
      socket.emit('error', 'Stream failed');
      buffer = ''; // 出错时也清空
    }
  });

  socket.on('disconnect', () => {
    console.log('❎ Disconnected:', socket.id);
    buffer = ''; // 清空当前 socket 的缓存
  });
});

server.listen(7005, () => {
  console.log('🚀 Backend running at http://0.0.0.0:7005');
});