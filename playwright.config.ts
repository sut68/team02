import { defineConfig, devices } from '@playwright/test';
import { execSync } from 'child_process';

function checkNodeVersion(): {
  compatible: boolean;
  version: string;
  major: number;
} {
  try {
    const version = execSync('node --version', { encoding: 'utf-8' }).trim();
    const major = parseInt(version.replace('v', '').split('.')[0]);
    return {
      compatible: major >= 20,
      version,
      major,
    };
  } catch {
    return { compatible: false, version: 'unknown', major: 0 };
  }
}

const nodeInfo = checkNodeVersion();

if (!nodeInfo.compatible) {
  console.warn('⚠️  WARNING: Node.js version', nodeInfo.version, 'is too old!');
  console.warn('   Next.js 16 requires Node.js >= 20.9.0');
  console.warn('   Please use Node.js 20+ to run these tests');
  console.warn(
    '   Current:',
    execSync('which node', { encoding: 'utf-8' }).trim()
  );
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  timeout: 60000, // 1 minute timeout per test
  expect: {
    timeout: 10000, // 10 second timeout for assertions
  },
  use: {
    baseURL: 'http://localhost:3050',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
    },
  ],

  globalSetup: require.resolve('./tests/e2e/global-setup'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown'),
});
