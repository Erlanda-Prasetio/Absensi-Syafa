const http = require('http');
const { spawn } = require('child_process');
const os = require('os');

const HOST = 'localhost';
const PORT = 3000;
const PATH = '/login';
const CHECK_INTERVAL = 500; // ms
const TIMEOUT = 120000; // 2 minutes

function openBrowser(url) {
  const platform = os.platform();
  let cmd;
  if (platform === 'win32') {
    cmd = 'start';
    spawn('cmd', ['/c', 'start', '""', url], { shell: true, detached: true });
  } else if (platform === 'darwin') {
    spawn('open', [url], { detached: true });
  } else {
    spawn('xdg-open', [url], { detached: true });
  }
}

function checkOnce(resolve, reject) {
  const req = http.request({ hostname: HOST, port: PORT, path: '/', method: 'GET', timeout: 2000 }, res => {
    // Accept any response as "ready" (200, 404, etc.)
    resolve();
  });
  req.on('error', () => reject());
  req.on('timeout', () => {
    req.destroy();
    reject();
  });
  req.end();
}

function waitForReady() {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function poll() {
      checkOnce(
        () => resolve(),
        () => {
          if (Date.now() - start > TIMEOUT) return reject(new Error('Timeout waiting for server'));
          setTimeout(poll, CHECK_INTERVAL);
        }
      );
    })();
  });
}

(async function () {
  const url = `http://${HOST}:${PORT}${PATH}`;
  try {
    await waitForReady();
    console.log('Server appears ready — opening', url);
    openBrowser(url);
    process.exit(0);
  } catch (err) {
    console.error('Timed out waiting for server to become ready');
    process.exit(1);
  }
})();
