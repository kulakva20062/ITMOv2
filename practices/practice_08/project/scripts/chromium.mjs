import { execSync } from 'node:child_process';

function systemChromiumPath() {
  for (const candidate of ['chromium', 'chromium-browser', 'google-chrome', 'chromium-beta']) {
    try {
      return execSync(`command -v ${candidate}`, { encoding: 'utf8' }).trim();
    } catch {
      // Если системного браузера нет, Playwright возьмёт установленный им Chromium.
    }
  }
  return undefined;
}

export const chromiumLaunchOptions = {
  executablePath: systemChromiumPath(),
  chromiumSandbox: false,
  // На Linux подписи нативных полей даты зависят от языка процесса Chromium.
  env: { ...process.env, LANGUAGE: 'ru' },
};
