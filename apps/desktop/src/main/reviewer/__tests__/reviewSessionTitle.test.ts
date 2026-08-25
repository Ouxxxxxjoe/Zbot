import { afterEach, describe, expect, it } from 'vitest';

import { setMainLocale } from '../../i18n.js';
import { buildReviewSessionTitle } from '../reviewSessionTitle.js';

afterEach(() => setMainLocale('zh-CN'));

describe('buildReviewSessionTitle', () => {
  it.each([
    ['zh-CN', '审查 · Source task'],
  ] as const)('uses the active %s locale', (locale, expected) => {
    setMainLocale(locale);
    expect(buildReviewSessionTitle('Source task')).toBe(expected);
  });

  it('preserves the existing persisted-title bound', () => {
    setMainLocale('zh-CN');
    expect(buildReviewSessionTitle('x'.repeat(200))).toHaveLength(120);
  });
});
