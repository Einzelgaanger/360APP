/**
 * Production static server with SPA fallback (all routes → index.html).
 * Used on Render when `vite preview` does not receive PORT correctly.
 */
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist');
const port = Number(process.env.PORT) || 4173;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
};

createServer((req, res) => {
  const url = (req.url ?? '/').split('?')[0];
  let path = join(root, url === '/' ? 'index.html' : url);

  if (existsSync(path) && statSync(path).isFile()) {
    const ext = extname(path);
    res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
    res.end(readFileSync(path));
    return;
  }

  const index = join(root, 'index.html');
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(readFileSync(index));
}).listen(port, '0.0.0.0', () => {
  console.log(`SPA server listening on ${port}`);
});
