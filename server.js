const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const serveFile = (filePath, res) => {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'text/html; charset=utf-8';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        const baseName = path.basename(filePath);
        let fallbackPath = null;

        if (ext === '.html') fallbackPath = path.join(PUBLIC_DIR, 'html', baseName);
        if (ext === '.css') fallbackPath = path.join(PUBLIC_DIR, 'css', baseName);
        if (ext === '.js') fallbackPath = path.join(PUBLIC_DIR, 'js', baseName);

        if (fallbackPath && fallbackPath !== filePath && fs.existsSync(fallbackPath)) {
          return serveFile(fallbackPath, res);
        }

        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`500 Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  let reqUrl = req.url.split('?')[0];

  if (reqUrl === '/') reqUrl = '/html/index.html';
  if (reqUrl === '/index.html' || reqUrl === '/index') reqUrl = '/html/index.html';
  if (reqUrl === '/admin.html' || reqUrl === '/admin') reqUrl = '/html/admin.html';
  if (reqUrl === '/onboarding.html' || reqUrl === '/onboarding') reqUrl = '/html/onboarding.html';
  if (reqUrl === '/dashboard.html' || reqUrl === '/dashboard') reqUrl = '/html/dashboard.html';

  let filePath = path.normalize(path.join(PUBLIC_DIR, reqUrl));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  serveFile(filePath, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
