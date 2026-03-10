#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile, exec } = require('child_process');

const args = process.argv.slice(2);
const PORT = (() => {
  const p = args.indexOf('--port');
  return p !== -1 ? parseInt(args[p + 1]) : 3737;
})();
const NO_OPEN = args.includes('--no-open');

function runCcusage(cmdArgs, cb) {
  execFile('npx', ['ccusage', ...cmdArgs, '--json'], { shell: true, maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
    if (err) return cb(err, null);
    try { cb(null, JSON.parse(stdout)); }
    catch (e) { cb(e, null); }
  });
}

function buildArgs(cmd, query) {
  const a = [cmd];
  if (query.since) a.push('--since', query.since);
  if (query.until) a.push('--until', query.until);
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
    const html = fs.readFileSync(path.join(__dirname, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(html);
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
