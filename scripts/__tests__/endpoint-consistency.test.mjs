import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

test('dev endpoint 模板保留 Telegram 字段但默认不启用', () => {
  const manifest = JSON.parse(
    fs.readFileSync(new URL('../../config/endpoint.dev.json.example', import.meta.url), 'utf8'),
  );

  assert.equal(manifest.telegramHookWsUrl, '');
});
