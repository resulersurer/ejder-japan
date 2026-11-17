import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import ts from 'typescript';

// Execute the application's pure locale module using the project's TS compiler.
// JSON imports are resolved locally; no browser, network, or email is involved.
const cache = new Map();
function loadModule(file) {
  if (cache.has(file)) return cache.get(file);
  if (file.endsWith('.json')) return JSON.parse(readFileSync(file, 'utf8'));
  const module = { exports: {} };
  cache.set(file, module.exports);
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const localRequire = specifier => loadModule(resolve(dirname(file), specifier.endsWith('.json') ? specifier : specifier + '.ts'));
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}
const { content, languageOptions, isLanguage, inquiryValue } = loadModule(resolve('src/app/localization.ts'));

test('six languages have every UI string and every template translation', () => {
  assert.deepEqual(languageOptions.map(option => option.code), ['tr', 'en', 'ja', 'zh-CN', 'es', 'ko']);
  const keys = Object.keys(content.translations.tr).sort();
  const template = readFileSync('src/app/app.html', 'utf8');
  const usedKeys = [...template.matchAll(/t\('([^']+)'\)/g)].map(match => match[1]);
  for (const { code } of languageOptions) {
    const strings = content.translations[code];
    assert.deepEqual(Object.keys(strings).sort(), keys, code + ': missing translation');
    for (const key of keys) assert.ok(typeof strings[key] === 'string' && strings[key].trim(), code + '.' + key);
    for (const key of usedKeys) assert.ok(strings[key], code + ': template key ' + key);
    assert.equal(isLanguage(code), true);
  }
  assert.equal(isLanguage('unknown'), false);
  assert.equal(isLanguage(null), false);
});

test('all three routes have complete localized daily itineraries', () => {
  for (const [route, count] of Object.entries({ golden: 10, sakura: 8, momiji: 9 })) {
    for (const { code } of languageOptions) {
      const details = content.itineraryData[route][code];
      assert.equal(details.days.length, count, route + '.' + code);
      assert.ok(details.badge && details.title);
      assert.equal(new Set(details.days.map(day => day.day)).size, count);
      for (const day of details.days) assert.ok(day.day && day.title && day.desc);
      if (code !== 'tr' && code !== 'en') {
        assert.notEqual(details.days[0].desc, content.itineraryData[route].en.days[0].desc);
      }
    }
  }
});

test('form summaries use each visitor language without changing SMTP field values', () => {
  for (const { code } of languageOptions) {
    const strings = content.translations[code];
    assert.equal(inquiryValue('airport', 'Tokyo (NRT/HND) Giriş - Osaka (KIX) Çıkış', code), strings.airport_tokyo_osaka);
    assert.equal(inquiryValue('airport', 'Henüz Netleşmedi', code), strings.airport_undecided);
    assert.equal(inquiryValue('inquiryType', 'B2B Acente İş Birliği / Grup Turu', code), strings.opt_b2b);
    assert.equal(inquiryValue('inquiryType', 'Özel Grup / VIP Tailor-Made', code), strings.opt_private);
    assert.equal(inquiryValue('notes', 'Customer note', code), 'Customer note');
    assert.notEqual(inquiryValue('travelDate', '2027-04-10', code), '2027-04-10');
  }
});
