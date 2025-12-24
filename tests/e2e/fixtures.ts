/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, Page, BrowserContext } from '@playwright/test';
import { cleanupTestData } from './test-container';
import { loginAndSetCookies } from './utils/auth';
import { TEST_USERS } from './utils/test-data';

type MyFixtures = {
  userPage: Page;
  adminPage: Page;
  userContext: BrowserContext;
  adminContext: BrowserContext;
};

type MyWorkerFixtures = {
  testContainer: string; // DATABASE_URL
};

export const test = base.extend<MyFixtures, MyWorkerFixtures>({
  // Database URL from global setup
  testContainer: [
    async ({}, use) => {
      const databaseUrl =
        process.env.TEST_DATABASE_URL || process.env.DATABASE_URL!;
      await use(databaseUrl);
    },
    { scope: 'worker', auto: true },
  ],

  // Clean data before each test
  userContext: async ({ browser, testContainer }, use) => {
    await cleanupTestData();
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },

  adminContext: async ({ browser, testContainer }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },

  userPage: async ({ userContext, request, testContainer }, use) => {
    await loginAndSetCookies(
      userContext,
      request,
      TEST_USERS.user.email,
      TEST_USERS.user.password
    );
    const page = await userContext.newPage();
    await use(page);
    await page.close();
  },

  adminPage: async ({ adminContext, request, testContainer }, use) => {
    await loginAndSetCookies(
      adminContext,
      request,
      TEST_USERS.admin.email,
      TEST_USERS.admin.password
    );
    const page = await adminContext.newPage();
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';