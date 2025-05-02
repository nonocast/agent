const Koa = require('koa');
const http = require('http');
const { Server } = require('socket.io');
const morgan = require('koa-morgan');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const Router = require('koa-router');
const axios = require('axios');
require('dotenv').config();

function cleanMarkdown(text) {
  return text
    .replace(/^\s*[-•*]\s*$/gm, '')        // 清除空的列表占位项
    .replace(/\n{3,}/g, '\n\n')             // 连续空行压缩
    .replace(/^\s+$/gm, '')                 // 清空空白行
    .replace(/\u2022/g, '-')                // 将•替换为标准列表 -
    .trim();
}

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

  socket.on('chat', async (data) => {
    const message = data.message;

    try {
      const res = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: message }],
          stream: true,
        },
        {
          responseType: 'stream',
          headers: {
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
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
              socket.emit('chunk', delta);
            }
          } catch (err) {
            console.error('❌ JSON parse error:', err.message);
          }
        }
      });

      res.data.on('end', () => {
        socket.emit('done');
      });

    } catch (err) {
      console.error('❌ DeepSeek Error:', err.message);
      socket.emit('error', 'Stream failed');
    }
  });

  socket.on('disconnect', () => {
    console.log('❎ Disconnected:', socket.id);
  });
});

server.listen(7005, () => {
  console.log('🚀 Backend running at http://0.0.0.0:7005');
});
