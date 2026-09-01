import { describe, expect, it } from 'vitest';

import { resolvePreferredSystemLocale, resolveSystemLocale } from '../locale';

describe('desktop locale resolution', () => {
  it('resolves every Chinese variant tag to the supported simplified Chinese locale', () => {
    for (const tag of [
      'zh',
      'zh-CN',
      'zh-Hans',
      'zh-Hans-HK',
      'zh-SG',
      'zh-Hant',
      'zh-TW',
      'zh-HK',
      'zh-MO',
      'zh-Hant-CN',
      'ZH_HANT_TW',
    ]) {
      expect(resolveSystemLocale(tag), tag).toBe('zh-CN');
    }
  });

  it('falls back to the single supported locale for any OS preference list', () => {
    expect(resolvePreferredSystemLocale(['fr-FR', 'zh-Hant-TW', 'en-US'])).toBe('zh-CN');
    expect(resolvePreferredSystemLocale(['fr-FR', 'ja-JP'])).toBe('zh-CN');
    expect(resolvePreferredSystemLocale(['fr-FR'])).toBe('zh-CN');
  });
});
