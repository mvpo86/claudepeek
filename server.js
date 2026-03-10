#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile, exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);
const PUBLIC_DIR = path.join(__dirname, 'public');

const args = process.argv.slice(2);
const PORT = (() => {
  const p = args.indexOf('--port');
  if (p === -1) return 3737;
  const n = parseInt(args[p + 1], 10);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    console.error('Error: --port must be an integer between 1 and 65535');
    process.exit(1);
  }
  return n;
})();
const NO_OPEN = args.includes('--no-open');

function runCcusage(cmdArgs, cb) {
  const safeArgs = cmdArgs.map(a => a.replace(/[^a-zA-Z0-9:_\-\.]/g, ''));
  exec(`npx ccusage ${safeArgs.join(' ')} --json`, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
    if (err) return cb(err, null);
    try { cb(null, JSON.parse(stdout)); }
    catch (e) { cb(e, null); }
  });
}

function serveStatic(res, relPath) {
  const allowed = ['.html', '.css', '.js'];
  const ext = path.extname(relPath);
  if (!allowed.includes(ext)) { res.writeHead(403); return res.end('Forbidden'); }

  const absPath = path.resolve(PUBLIC_DIR, relPath);
  if (!absPath.startsWith(PUBLIC_DIR + path.sep) && absPath !== PUBLIC_DIR) {
    res.writeHead(403); return res.end('Forbidden');
  }

  const contentTypes = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };
  fs.readFile(absPath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, {
      'Content-Type': contentTypes[ext],
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(data);
  });
}

function buildArgs(cmd, query) {
  const a = [cmd];
  const dateRe = /^\d{8}$/;
  if (query.since && dateRe.test(query.since)) a.push('--since', query.since);
  if (query.until && dateRe.test(query.until)) a.push('--until', query.until);
  return a;
}

function parseQuery(url) {
  const q = {};
  const idx = url.indexOf('?');
  if (idx === -1) return q;
  url.slice(idx + 1).split('&').forEach(p => {
    const [k, v] = p.split('=');
    if (k) q[decodeURIComponent(k)] = decodeURIComponent(v || '');
  });
  return q;
}

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? `start "" "${url}"` :
              process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(cmd);
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const query = parseQuery(req.url);

  if (url === '/') {
    return serveStatic(res, 'index.html');
  }

  if (url.startsWith('/static/')) {
    const relPath = url.slice('/static/'.length);
    return serveStatic(res, relPath);
  }

  if (url.startsWith('/api/')) {
    const cmd = url.replace('/api/', '');
    const validCmds = ['daily', 'monthly', 'session', 'weekly'];
    if (!validCmds.includes(cmd)) {
      res.writeHead(404); return res.end('Not found');
    }
    runCcusage(buildArgs(cmd, query), (err, data) => {
      res.writeHead(err ? 500 : 200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(err ? JSON.stringify({ error: err.message }) : JSON.stringify(data));
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n  claudestats running at ${url}\n`);
  console.log('  Press Ctrl+C to stop.\n');
  if (!NO_OPEN) openBrowser(url);
});

process.on('SIGINT', () => {
  console.log('\n  Stopped.');
  process.exit(0);
});
