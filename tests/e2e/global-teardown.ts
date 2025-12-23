import { stopTestContainer } from './test-container';
import { ChildProcess } from 'child_process';
import { execSync } from 'child_process';

/**
 * Kill any process using the specified port (cross-platform)
 */
function killProcessOnPort(port: number): void {
  const isWindows = process.platform === 'win32';
  
  try {
    if (isWindows) {
      // Windows: Find PID using netstat and kill with taskkill
      const netstatOutput = execSync(
        `netstat -ano | findstr :${port}`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
      
      const lines = netstatOutput.trim().split('\n');
      const pids = new Set<string>();
      
      for (const line of lines) {
        const match = line.trim().split(/\s+/);
        const pid = match[match.length - 1];
        if (pid && /^\d+$/.test(pid)) {
          pids.add(pid);
        }
      }
      
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, {
            stdio: 'ignore',
          });
        } catch {
          // Ignore errors if process doesn't exist
        }
      }
    } else {
      // Unix-like: Use lsof and kill
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, {
        stdio: 'ignore',
      });
    }
  } catch {
    // Ignore errors - port might be free
  }
}

async function globalTeardown() {
  console.log('🧹 Running global teardown...');

  // FORCE kill everything on port 3050 - most reliable method
  console.log('🛑 Stopping Next.js server on port 3050...');
  try {
    killProcessOnPort(3050);
    console.log('   ✓ Port 3050 processes killed');
  } catch (error) {
    console.log('   ✓ No processes on port 3050');
  }

  // Also try to kill the stored process (backup)
  const serverProcess = (global as { __SERVER_PROCESS__?: ChildProcess })
    .__SERVER_PROCESS__;
  if (serverProcess && serverProcess.pid) {
    try {
      const isWindows = process.platform === 'win32';
      if (isWindows) {
        // Windows: Use taskkill to kill the process and its children
        execSync(`taskkill /F /T /PID ${serverProcess.pid}`, {
          stdio: 'ignore',
        });
      } else {
        // Unix-like: Try to kill process group (negative PID)
        process.kill(-serverProcess.pid, 'SIGKILL');
      }
    } catch {
      // Ignore - process might already be dead
    }
  }

  // Wait a moment to ensure cleanup
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Stop test container
  console.log('🛑 Stopping test container...');
  await stopTestContainer();

  // Final verification - ensure port is free
  try {
    killProcessOnPort(3050);
  } catch {
    // Ignore
  }

  console.log('✅ Global teardown complete - all processes stopped');
}

export default globalTeardown;
