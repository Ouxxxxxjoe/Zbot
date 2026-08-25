import { describe, expect, it } from 'vitest';

import zhCN from '../i18n/locales/zh-CN/common.json';

const catalogs = { 'zh-CN': zhCN } as const;

describe('desktop model-picker compact translations', () => {
  it.each(Object.entries(catalogs))(
    '%s keeps subscription and effort labels short enough for a narrow model row',
    (_locale, catalog) => {
      expect(
        Array.from(catalog.newChat.modelSelector.meta.subscriptionBadgeCompact).length,
      ).toBeLessThanOrEqual(4);
      for (const label of Object.values(catalog.effortLevels)) {
        expect(Array.from(label).length).toBeLessThanOrEqual(4);
      }
    },
  );
});
