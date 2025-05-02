const Koa = require('koa');
const morgan = require('koa-morgan');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const Router = require('koa-router');
const axios = require('axios');
require('dotenv').config();

const app = new Koa();
const router = new Router();

app.use(morgan('dev'));
app.use(cors());
app.use(bodyParser());

function cleanMarkdown(text) {
  return text
    .replace(/^\s*[-•*]\s*$/gm, '')        // 清除空的列表占位项
    .replace(/\n{3,}/g, '\n\n')             // 连续空行压缩
    .replace(/^\s+$/gm, '')                 // 清空空白行
    .replace(/\u2022/g, '-')                // 将•替换为标准列表 -
    .trim();
}

router.post('/chat', async (ctx) => {
  const { message } = ctx.request.body;

  try {
    const res = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: message }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    ctx.body = {
      reply: cleanMarkdown(res.data.choices?.[0]?.message?.content) || 'No reply'
    };
  } catch (err) {
    console.error('❌ DeepSeek API error:', err.message || err);
    ctx.status = 500;
    ctx.body = {
      error: 'DeepSeek API failed',
      details: err.message
    };
  }
});


router.get('/', (ctx) => {
  ctx.type = 'text';
  ctx.body = 'agent-backend running (deepseek-chat)';
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(7005, '0.0.0.0', () => {
  console.log('Backend running at http://0.0.0.0:7005');
});
