/**
 * ============================================================
 * 实验5 · 零依赖静态服务器
 * ------------------------------------------------------------
 * 本实验是纯前端实验，不需要后端接口，但直接双击 HTML 会以
 * file:// 协议打开，localStorage、fetch 等行为与 http:// 不一致，
 * 部分浏览器还会限制本地文件读取，因此附一个静态服务器，
 * 用 node 启动即可获得与正式环境一致的运行条件。
 *
 * 用法：
 *   node server.js           默认端口 5173
 *   node server.js 8080      指定端口
 * 退出：Ctrl + C
 * ============================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = __dirname;
const PORT = Number(process.argv[2]) || 5173;

/** 常见静态资源的 MIME 类型 */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // 1. 解析路径，去掉查询字符串
  const pathname = decodeURIComponent(url.parse(req.url).pathname);

  // 2. 默认首页
  let rel = pathname === '/' ? '/index.html' : pathname;

  // 3. 防目录穿越：解析后的绝对路径必须仍在 ROOT 内
  const filePath = path.join(ROOT, rel);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('403 Forbidden');
  }

  // 4. 读取文件
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(
        '<meta charset="utf-8"><div style="font:16px/1.8 system-ui;padding:40px">' +
        '<h2>404 Not Found</h2><p>找不到：' + rel + '</p>' +
        '<p><a href="/">返回实验首页</a></p></div>'
      );
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
      // 开发期禁用缓存，改完代码刷新即生效
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  const line = '='.repeat(52);
  console.log(line);
  console.log('  实验5 · Vue.js 基本语法和常用指令');
  console.log('  服务已启动： http://localhost:' + PORT);
  console.log('  实验首页  ： http://localhost:' + PORT + '/index.html');
  console.log('  根目录    ： ' + ROOT);
  console.log('  停止服务  ： Ctrl + C');
  console.log(line);
});
