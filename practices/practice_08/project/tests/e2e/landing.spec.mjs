import { expect, test } from '@playwright/test';

const SECTIONS = ['hero', 'fleet', 'calculator', 'booking', 'benefits', 'how', 'faq', 'contacts'];

test.describe('лендинг и автопарк', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('каркас React и каскад типографики h1–h3 соответствуют контракту на 1280 и 360px', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Берёте машину — цену видите сразу');
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', 'data:,');

    const ids = await page.locator('section[id]').evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(ids).toEqual(SECTIONS);

    const nav = page.getByRole('navigation', { name: 'Разделы страницы' });
    await expect(nav.getByRole('link')).toHaveCount(7);
    for (const id of SECTIONS.slice(1)) {
      await expect(nav.locator(`a[href="#${id}"]`)).toHaveCount(1);
    }

    const missingAnchors = await page.locator('a[href^="#"]').evaluateAll((links) =>
      links.filter((link) => !document.getElementById(link.getAttribute('href').slice(1))).length,
    );
    expect(missingAnchors).toBe(0);

    for (const viewport of [
      { width: 1280, h1FontSize: '41.6px', h1LineHeight: '49.92px' },
      { width: 360, h1FontSize: '28.8px', h1LineHeight: '34.56px' },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: 900 });
      const headings = await page.locator('h1, h2, h3').evaluateAll((nodes) =>
        nodes.map((node) => {
          const style = getComputedStyle(node);
          return {
            tagName: node.tagName,
            text: node.textContent,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
          };
        }),
      );

      for (const heading of headings) {
        const expected = heading.tagName === 'H1'
          ? { fontSize: viewport.h1FontSize, lineHeight: viewport.h1LineHeight }
          : heading.tagName === 'H2'
            ? { fontSize: '24px', lineHeight: '28.8px' }
            : { fontSize: '16.8px', lineHeight: '20.16px' };
        expect(
          heading,
          `${viewport.width}px, ${heading.tagName}: ${heading.text}`,
        ).toMatchObject({ ...expected, fontWeight: '650' });
      }
    }
  });

  test('внешних ресурсов нет, SVG подписаны, инфо-секции и контакты сохранены', async ({ page }) => {
    const external = await page.locator('[src], [href]').evaluateAll((nodes) =>
      nodes
        .flatMap((node) => [node.getAttribute('src'), node.getAttribute('href')])
        .filter((value) => value && /^https?:\/\//.test(value)),
    );
    expect(external).toEqual([]);

    const unsignedSvg = await page.locator('svg').evaluateAll((nodes) =>
      nodes.filter((node) => !node.getAttribute('aria-label') && node.getAttribute('aria-hidden') !== 'true').length,
    );
    expect(unsignedSvg).toBe(0);

    await expect(page.locator('#benefits li')).toHaveCount(4);
    await expect(page.locator('#how li')).toHaveCount(3);
    await expect(page.locator('#faq details')).toHaveCount(4);
    await expect(page.locator('#faq summary')).toHaveCount(4);
    await expect(page.locator('#contacts')).toContainText('+7 000 000-00-00');
    await expect(page.locator('#contacts')).toContainText('hello@example.com');
    await expect(page.locator('.disclaimer')).toContainText('вымышленные');
  });

  test('карточки содержат данные автопарка, а калькулятор всегда имеет полный список', async ({ page }) => {
    const cards = page.locator('#fleet-list .car.card');
    await expect(cards).toHaveCount(8);
    await expect(page.locator('#fleet input')).toHaveCount(0);
    await expect(page.locator('#calc-car option')).toHaveCount(8);

    const first = cards.first();
    await expect(first).toHaveAttribute('data-car-id', 'larus-16');
    await expect(first).toContainText('Ларус 1.6');
    await expect(first).toContainText('эконом');
    await expect(first).toContainText('механика');
    await expect(first).toContainText('5 мест');
    await expect(first).toContainText('2 400 ₽');
    await expect(first.getByRole('button', { name: 'Рассчитать' })).toHaveAttribute('data-calc-for', 'larus-16');
  });

  test('фильтры сочетаются по И и выводят точный счётчик', async ({ page }) => {
    await expect(page.locator('#fleet-count')).toHaveAttribute('role', 'status');
    await expect(page.locator('#fleet-status')).toHaveAttribute('role', 'status');
    await expect(page.locator('label[for="fleet-filter-class"]')).toHaveText('Класс');
    await expect(page.locator('label[for="fleet-filter-gearbox"]')).toHaveText('Коробка');

    await page.selectOption('#fleet-filter-class', 'business');
    await expect(page.locator('#fleet-list .car.card')).toHaveCount(2);
    await expect(page.locator('#fleet-count')).toHaveText('Показано 2 из 8');

    await page.selectOption('#fleet-filter-class', 'economy');
    await page.selectOption('#fleet-filter-gearbox', 'manual');
    await expect(page.locator('#fleet-list .car.card')).toHaveCount(1);
    await expect(page.locator('#fleet-list .car.card')).toHaveAttribute('data-car-id', 'larus-16');
    await expect(page.locator('#fleet-count')).toHaveText('Показано 1 из 8');
    await expect(page.locator('#calc-car option')).toHaveCount(8);
  });

  test('пустой фильтр показывает сообщение без карточек и устаревшей шапки реестра', async ({ page }) => {
    await page.selectOption('#fleet-filter-class', 'business');
    await page.selectOption('#fleet-filter-gearbox', 'manual');

    await expect(page.locator('#fleet-list .car.card')).toHaveCount(0);
    await expect(page.locator('#fleet-list .fleet__empty')).toHaveText(
      'Под эти условия машин нет — выберите «Любой класс» или «Любая коробка»',
    );
    await expect(page.locator('#fleet-count')).toHaveText('Показано 0 из 8');
    await expect(page.locator('.fleet__head')).toHaveCount(0);
  });

  test('выбор из карточки синхронизирует калькулятор, сбрасывает заявку и переживает фильтр', async ({ page }) => {
    await page.getByRole('button', { name: 'Рассчитать стоимость' }).click();
    await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'editing');

    await page.locator('[data-car-id="prima-sedan"] [data-calc-for]').click();
    await expect(page.locator('#calc-car')).toHaveValue('prima-sedan');
    await expect(page.locator('#calc-car')).toBeFocused();
    await expect(page.locator('[data-car-id="prima-sedan"]')).toHaveAttribute('data-chosen', 'true');
    await expect(page.locator('[data-chosen="true"]')).toHaveCount(1);
    await expect(page.locator('#fleet-status')).toHaveText('Выбрана Прима Седан — 7 200 ₽ за сутки.');
    await expect(page.locator('#booking-form')).toHaveAttribute('data-state', 'no-estimate');

    await page.selectOption('#fleet-filter-class', 'economy');
    await expect(page.locator('[data-car-id="prima-sedan"]')).toHaveCount(0);
    await expect(page.locator('[data-chosen="true"]')).toHaveCount(0);
    await expect(page.locator('#fleet-status')).toHaveText('Выбрана Прима Седан — 7 200 ₽ за сутки.');

    await page.selectOption('#calc-car', 'korda-mini');
    await expect(page.locator('[data-car-id="korda-mini"]')).toHaveAttribute('data-chosen', 'true');
    await expect(page.locator('#fleet-status')).toHaveText('Выбрана Прима Седан — 7 200 ₽ за сутки.');
  });

  test('FAQ раскрывается мышью и клавишей Enter', async ({ page }) => {
    const first = page.locator('#faq details').first();
    await first.locator('summary').click();
    await expect(first).toHaveAttribute('open', '');
    await expect(first).toContainText('Два года и возраст от 21 года');

    await first.locator('summary').press('Enter');
    await expect(first).not.toHaveAttribute('open', '');
    await first.locator('summary').press('Space');
    await expect(first).toHaveAttribute('open', '');
  });

  test('noscript секции заявки имеет текст в DOM, а не только в accessibility tree', async ({ page }) => {
    const text = await page.locator('#booking noscript').evaluate((node) => node.textContent);
    expect(text).toContain('Для отправки заявки нужен включённый JavaScript.');
    const childCount = await page.locator('#booking noscript').evaluate((node) => node.childNodes.length);
    expect(childCount).toBeGreaterThan(0);
  });

  test('без JavaScript виден статический запасной вариант', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const noJsPage = await context.newPage();
    await noJsPage.goto(baseURL);
    // innerText читается у body: Playwright не выбирает текст внутри noscript обычным getByText.
    const text = await noJsPage.locator('body').evaluate((node) => node.innerText);
    expect(text).toContain('Для работы страницы нужен включённый JavaScript.');
    await expect(noJsPage.locator('#root')).toBeEmpty();
    await context.close();
  });

  test('продакшен-страница не даёт console-ошибок и не запрашивает /favicon.ico', async ({ page }) => {
    const errors = [];
    const faviconResponses = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('response', (response) => {
      if (new URL(response.url()).pathname === '/favicon.ico') faviconResponses.push(response.status());
    });

    await page.reload();
    await expect(page.locator('#fleet-list .car.card')).toHaveCount(8);
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
    expect(faviconResponses).toEqual([]);
  });
});
