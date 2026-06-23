# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.setup.ts >> authenticate as user
- Location: tests\auth.setup.ts:1:152

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[id="email"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - heading "404" [level=1] [ref=e4]
    - heading "This page could not be found." [level=2] [ref=e6]
  - button "Open Next.js Dev Tools" [ref=e12] [cursor=pointer]:
    - img [ref=e13]
  - alert [ref=e16]
```

# Test source

```ts
> 1 | import { test as setup, expect } from '@playwright/test';import * as fs from 'fs';import * as path from 'path';const authDir = 'playwright/.auth';setup('authenticate as user', async ({ page }) => {if (!fs.existsSync(authDir)) {fs.mkdirSync(authDir, { recursive: true });}await page.goto('/auth/signin');const email = process.env.TEST_USER_EMAIL || 'edamoke@gmail.com';const password = process.env.TEST_USER_PASSWORD || 'HobbitKing@1980';await page.fill('input[id="email"]', email);await page.fill('input[id="password"]', password);await page.click('button[type="submit"]');await page.waitForURL('**/dashboard**', { timeout: 30000 });await page.context().storageState({ path: path.join(authDir, 'user.json') });});setup('authenticate as admin', async ({ page }) => {if (!fs.existsSync(authDir)) {fs.mkdirSync(authDir, { recursive: true });}await page.goto('/auth/signin');const email = process.env.TEST_ADMIN_EMAIL || 'sbirzhan@gmail.com';const password = process.env.TEST_ADMIN_PASSWORD || 'HobbitKing@1980';await page.fill('input[id="email"]', email);await page.fill('input[id="password"]', password);await page.click('button[type="submit"]');await page.waitForURL('**/dashboard**', { timeout: 30000 });await page.context().storageState({ path: path.join(authDir, 'admin.json') });});
    |                                                                                                                                                                                                                                                                                                                                                                                                                                                                 ^ Error: page.fill: Test timeout of 30000ms exceeded.
```