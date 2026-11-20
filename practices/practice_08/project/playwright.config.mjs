// Конфигурация Playwright: клиентские тесты интерфейса в реальном браузере.
// Браузер — системный Chromium (в лаборатории его не скачивают); при его отсутствии
// достаточно `npx playwright install chromium`.
import { defineConfig } from '@playwright/test';
import { execSync } from 'node:child_process';

function systemChromiumPath() {
  for (const candidate of ['chromium', 'chromium-browser', 'google-chrome', 'chromium-beta']) {
    try {
      return execSync(`command -v ${candidate}`, { encoding: 'utf8' }).trim();
    } catch {
      // пробовали следующий
    }
  }
  return undefined;
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 20_000,
  expect: { timeout: 5_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://127.0.0.1:8176',
    screenshot: 'only-on-failure',
    trace: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        launchOptions: { executablePath: systemChromiumPath() },
        // Системный Chromium в контейнере лаборатории запускается без песочницы.
        chromiumSandbox: false,
      },
    },
  ],
  webServer: {
    // Перед сервером всегда собирается web/dist: корень и /ui отдают именно его.
    // Свой порт 8176 (см. PORT в server.js) не конфликтует с ручным сервером на 8000.
    command: 'npm run web:build && node server.js',
    env: { PORT: '8176' },
    url: 'http://127.0.0.1:8176/',
    // Никогда не тестируем чужой сервер на этом порту и не глушим вывод webServer.
    reuseExistingServer: false,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
