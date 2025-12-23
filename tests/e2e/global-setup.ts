import { startTestContainer } from './test-container';
import { spawn, ChildProcess, execSync } from 'child_process';
import fetch from 'node-fetch';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

let serverProcess: ChildProcess | null = null;

/**
 * Kill any process using the specified port (cross-platform)
 */
function killProcessOnPort(port: number): void {
  const isWindows = process.platform === 'win32';

  try {
    if (isWindows) {
      // Windows: Find PID using netstat and kill with taskkill
      const netstatOutput = execSync(`netstat -ano | findstr :${port}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

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

async function globalSetup() {
  console.log('🚀 Starting global test setup...');

  // 1. Start test container
  const databaseUrl = await startTestContainer();
  process.env.DATABASE_URL = databaseUrl;
  process.env.TEST_DATABASE_URL = databaseUrl;

  console.log('✅ Container ready:', databaseUrl);

  // Verify database connection before starting server
  console.log('🔍 Verifying database connection...');
  try {
    const { PrismaClient } = await import('@prisma/client');
    const testPrisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
    await testPrisma.$connect();
    await testPrisma.$disconnect();
    console.log('✅ Database connection verified');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw new Error(`Database connection failed: ${error}`);
  }

  // 2. Clean up any existing Next.js processes and lock files
  console.log('🧹 Cleaning up any existing Next.js processes...');
  killProcessOnPort(3050);

  // Remove Next.js lock file if it exists
  const lockFile = join(process.cwd(), '.next', 'dev', 'lock');
  if (existsSync(lockFile)) {
    console.log('🧹 Removing stale Next.js lock file...');
    try {
      unlinkSync(lockFile);
    } catch (error) {
      console.warn('⚠️  Could not remove lock file:', error);
    }
  }

  // 3. Generate Prisma Client to ensure it's up to date
  console.log('🔄 Generating Prisma Client...');
  try {
    execSync('npx prisma generate', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
    });
    console.log('✅ Prisma Client generated');
  } catch (error) {
    console.warn('⚠️  Prisma generate failed, continuing anyway:', error);
  }

  // 4. Start Next.js server with test DATABASE_URL
  console.log('🚀 Starting Next.js server on port 3050...');
  console.log(`📝 Using DATABASE_URL: ${databaseUrl.substring(0, 30)}...`);

  // Create environment with test DATABASE_URL taking precedence
  // This ensures the test database URL overrides any existing DATABASE_URL
  const serverEnv: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: databaseUrl, // Must come after spread to override
    TEST_DATABASE_URL: databaseUrl,
    NODE_ENV: 'test' as const,
    JWT_SECRET: 'test-secret-key-change-in-production',
    PORT: '3050',
  };

  // Use shell: true to ensure npm works correctly on all platforms
  serverProcess = spawn('npm', ['run', 'dev', '--', '-p', '3050'], {
    env: serverEnv,
    stdio: ['ignore', 'pipe', 'pipe'], // stdin: ignore, stdout/stderr: pipe
    detached: false, // Don't detach so we can properly manage the process
    shell: true, // Use shell for better cross-platform compatibility
  });

  if (!serverProcess) {
    throw new Error('Failed to spawn server process');
  }

  // Collect server output for error reporting
  const serverOutput: string[] = [];
  const serverErrors: string[] = [];

  // Consume stdout and stderr to prevent buffer overflow
  // This prevents the process from hanging when buffers fill up
  if (serverProcess.stdout) {
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      serverOutput.push(output);
      // Log server output for debugging
      process.stdout.write(data);
    });
  }

  if (serverProcess.stderr) {
    serverProcess.stderr.on('data', (data) => {
      const output = data.toString();
      serverErrors.push(output);
      // Log server errors for debugging
      process.stderr.write(data);
    });
  }

  // Handle process errors
  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    throw error;
  });

  // Handle process exit
  let exitCode: number | null = null;
  serverProcess.on('exit', (code) => {
    exitCode = code;
  });

  // Store process globally so teardown can access it
  (global as { __SERVER_PROCESS__?: ChildProcess }).__SERVER_PROCESS__ =
    serverProcess;

  // Give the server a moment to start before checking
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Wait for server to be ready
  const maxRetries = 60;
  let serverReady = false;
  for (let i = 0; i < maxRetries; i++) {
    // Check if process died before attempting connection
    if (
      serverProcess &&
      (serverProcess.exitCode !== null || exitCode !== null)
    ) {
      const code = serverProcess.exitCode ?? exitCode;
      const output = serverOutput.join('\n');
      const errors = serverErrors.join('\n');

      console.error('\n❌ Server process exited unexpectedly!');
      console.error(`Exit code: ${code}`);
      if (output) {
        console.error('\n--- Server Output ---');
        console.error(output);
      }
      if (errors) {
        console.error('\n--- Server Errors ---');
        console.error(errors);
      }

      throw new Error(
        `Server process exited with code ${code}. Check the output above for details.`
      );
    }

    try {
      const response = await fetch('http://localhost:3050', {
        signal: AbortSignal.timeout(5000), // 5 second timeout per request
      });
      if (response.ok || response.status === 404) {
        console.log('✅ Next.js server ready');
        serverReady = true;
        break;
      }
    } catch (error) {
      // Check if process died during the fetch attempt
      if (
        serverProcess &&
        (serverProcess.exitCode !== null || exitCode !== null)
      ) {
        const code = serverProcess.exitCode ?? exitCode;
        const output = serverOutput.join('\n');
        const errors = serverErrors.join('\n');

        console.error('\n❌ Server process exited unexpectedly!');
        console.error(`Exit code: ${code}`);
        if (output) {
          console.error('\n--- Server Output ---');
          console.error(output);
        }
        if (errors) {
          console.error('\n--- Server Errors ---');
          console.error(errors);
        }

        throw new Error(
          `Server process exited with code ${code}. Check the output above for details.`
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (i === maxRetries - 1) {
        const output = serverOutput.join('\n');
        const errors = serverErrors.join('\n');

        console.error('\n❌ Server failed to start after maximum retries!');
        if (output) {
          console.error('\n--- Server Output ---');
          console.error(output);
        }
        if (errors) {
          console.error('\n--- Server Errors ---');
          console.error(errors);
        }

        throw new Error(
          `Server failed to start after ${maxRetries} attempts. Last error: ${errorMessage}. Check the output above for details.`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  if (!serverReady) {
    throw new Error('Server failed to become ready');
  }

  console.log('✅ Global setup complete');
}

export default globalSetup;
