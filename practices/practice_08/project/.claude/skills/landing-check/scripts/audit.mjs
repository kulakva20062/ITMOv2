// Статический аудит index.html по правилам AGENTS.md и критериям docs/requirements.md.
// Запуск из корня проекта: node .claude/skills/landing-check/scripts/audit.mjs [index.html]
// Печатает JSON с результатами; код выхода 1, если есть FAIL.
import { readFileSync, existsSync } from 'node:fs';

const file = process.argv[2] ?? 'index.html';
if (!existsSync(file)) {
  console.log(JSON.stringify({ file, error: 'файл не найден' }, null, 2));
  process.exit(2);
}
const html = readFileSync(file, 'utf8');
const checks = [];
const add = (name, ok, details = '') => checks.push({ name, status: ok ? 'PASS' : 'FAIL', details });

const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
add('ровно один h1', h1 === 1, `найдено ${h1}`);

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
add('id уникальны', dupIds.length === 0, dupIds.join(', '));

const required = ['hero', 'fleet', 'benefits', 'how', 'faq', 'contacts'];
const missing = required.filter((id) => !ids.includes(id));
add('обязательные секции', missing.length === 0, missing.length ? `нет: ${missing.join(', ')}` : required.join(', '));

const anchors = [...new Set([...html.matchAll(/href="#([^"]*)"/g)].map((m) => m[1]).filter(Boolean))];
const broken = anchors.filter((a) => !ids.includes(a));
add('якоря ведут на существующие id', broken.length === 0, broken.length ? `битые: ${broken.join(', ')}` : `${anchors.length} якорей`);

const external = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
const cssImports = [...html.matchAll(/@import\s+url\(["']?(https?:[^)"']+)/g)].map((m) => m[1]);
add('нет внешних ресурсов', external.length + cssImports.length === 0, [...external, ...cssImports].join(', '));

const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
const imgNoAlt = imgs.filter((t) => !/\salt="/.test(t));
const svgs = [...html.matchAll(/<svg\b[^>]*>/g)].map((m) => m[0]);
const svgUnlabeled = svgs.filter((t) => !/aria-label="|aria-hidden="true"|aria-labelledby="/.test(t));
add('img/svg подписаны или скрыты', imgNoAlt.length + svgUnlabeled.length === 0,
  `img без alt: ${imgNoAlt.length}, svg без aria: ${svgUnlabeled.length} из ${svgs.length}`);

const text = html.replace(/<[^>]+>/g, ' ');
const phones = [...text.matchAll(/\+7[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/g)].map((m) => m[0].trim());
const realPhones = phones.filter((p) => p.replace(/\D/g, '') !== '70000000000');
const emails = [...html.matchAll(/[\w.+-]+@[\w-]+\.[\w.]+/g)].map((m) => m[0]);
const realEmails = emails.filter((e) => !/@example\.(com|org|net)$/.test(e));
add('только заглушки контактов', realPhones.length + realEmails.length === 0,
  [...realPhones, ...realEmails].join(', ') || `телефонов ${phones.length}, e-mail ${emails.length}`);

const faq = html.match(/id="faq"[\s\S]*?<\/section>/)?.[0] ?? '';
const details = (faq.match(/<details[\s>]/g) ?? []).length;
add('FAQ: 4 details/summary', details === 4, `найдено ${details}`);

const viewport = /<meta\s+name="viewport"/.test(html);
add('meta viewport', viewport);
const lang = /<html[^>]*\slang="ru"/.test(html);
add('html lang="ru"', lang);

const failed = checks.filter((c) => c.status === 'FAIL').length;
console.log(JSON.stringify({ file, passed: checks.length - failed, failed, checks }, null, 2));
process.exit(failed ? 1 : 0);
