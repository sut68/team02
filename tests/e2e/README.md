# E2E Tests

## Quick Start

```bash
npm run test:e2e
```

## How It Works

Tests use **Playwright fixtures** for automatic setup:

```typescript
test('My test', async ({ userPage, adminPage }) => {
  // userPage is already logged in as user
  // adminPage is already logged in as admin
  // Database is already cleaned up
  // Just write your test!
});
```

## What Happens Automatically

1. ✅ Test database created and seeded (once per test file)
2. ✅ Data cleaned before each test
3. ✅ User logged in automatically
4. ✅ Admin logged in automatically
5. ✅ Browser contexts closed after test

## Writing New Tests

```typescript
import { test, expect } from './fixtures';

test.describe('My Feature', () => {
  test.beforeAll(async () => {
    await setupTestDatabase(); // Only needed once per file
  });

  test('should work', async ({ userPage, adminPage }) => {
    // userPage → logged in as user@test.com
    // adminPage → logged in as admin@test.com

    await userPage.goto('/some-page');
    // ... your test
  });
});
```

## Test Database

- **Name**: `testdb_e2e`
- **URL**: `postgresql://postgres:postgres@localhost:5432/testdb_e2e`
- **Users**:
  - Admin: `admin@test.com` / `password123`
  - User: `user@test.com` / `password123`

## Commands

```bash
npm run test:e2e       # Run tests (headless)
npm run test:e2e:ui    # Visual debugging
npm run test:e2e:debug # Step-by-step debugging
```

## Requirements

- Node.js >= 20
- PostgreSQL running on localhost:5432

## Architecture

```
fixtures.ts
  ├─ Auto-creates contexts
  ├─ Auto-logs in users
  └─ Auto-cleans data
```
