import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    forbidOnly: !!process.env['CI'],
    retries: process.env['CI'] ? 2 : 0,
    workers: 1,
    reporter: 'html',
    use: {
        baseURL: 'http://127.0.0.1:4200',
        trace: 'on-first-retry',
        launchOptions: process.env['PW_SLOWMO']
            ? { slowMo: Number(process.env['PW_SLOWMO']) }
            : undefined,
    },
    webServer: {
        command: 'npm run start -- --host 127.0.0.1 --port 4200',
        url: 'http://127.0.0.1:4200',
        reuseExistingServer: !process.env['CI'],
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
