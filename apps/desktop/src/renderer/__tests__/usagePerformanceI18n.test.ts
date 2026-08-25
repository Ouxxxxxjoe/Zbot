import { describe, expect, it } from 'vitest';

import zhCN from '../i18n/locales/zh-CN/common.json';

const KEYS = ['timeAndRateValue', 'performanceLine', 'performanceRateLine'] as const;

describe('usage performance units', () => {
  it.each([
    ['zh-CN', zhCN, 'tokens/秒'],
  ] as const)('uses a localized token-per-second unit in %s', (_locale, messages, unit) => {
    const values = [
      messages.quotaCard[KEYS[0]],
      messages.usageDetails[KEYS[1]],
      messages.usageDetails[KEYS[2]],
    ];
    for (const value of values) {
      expect(value).toContain(unit);
      expect(value).not.toContain('TPS');
    }
  });
});
