import { spawn } from 'node:child_process';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';

const baseUrl = process.env.CYPRESS_BASE_URL || 'http://127.0.0.1:3000';
const readyUrl = `${baseUrl}/login`;

function runNpmScript(scriptName, options = {}) {
  const command = process.platform === 'win32' ? `npm run ${scriptName}` : 'npm';
  const args = process.platform === 'win32' ? [] : ['run', scriptName];

  return spawn(command, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      CYPRESS_BASE_URL: baseUrl,
    },
    ...options,
  });
}

async function waitForReady(url, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
      });

      if (response.ok) {
        return;
      }
    } catch {
      // Server is still starting.
    }

    await delay(1000);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function isReady(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function killServer(childProcess) {
  if (!childProcess?.pid) {
    return;
  }

  if (process.platform === 'win32') {
    await new Promise((resolve) => {
      const killer = spawn('taskkill', ['/pid', String(childProcess.pid), '/t', '/f'], {
        stdio: 'ignore',
        shell: false,
      });

      killer.on('exit', () => resolve());
      killer.on('error', () => resolve());
    });
    return;
  }

  childProcess.kill('SIGTERM');
  await delay(1000);

  if (!childProcess.killed) {
    childProcess.kill('SIGKILL');
  }
}

async function main() {
  const shouldStartServer = !(await isReady(readyUrl));
  const serverProcess = shouldStartServer ? runNpmScript('dev:e2e') : null;
  let shuttingDown = false;

  const shutdown = async () => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    await killServer(serverProcess);
  };

  process.on('SIGINT', async () => {
    await shutdown();
    process.exit(130);
  });

  process.on('SIGTERM', async () => {
    await shutdown();
    process.exit(143);
  });

  try {
    if (shouldStartServer) {
      await waitForReady(readyUrl);
    }

    const testProcess = runNpmScript('test:e2e:publish:only');
    const exitCode = await new Promise((resolve, reject) => {
      testProcess.on('exit', (code) => resolve(code ?? 1));
      testProcess.on('error', reject);
    });

    await shutdown();
    process.exit(exitCode);
  } catch (error) {
    console.error('[E2E Publish Runner] Failed:', error);
    await shutdown();
    process.exit(1);
  }
}

await main();
