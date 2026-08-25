import { describe, expect, it } from 'vitest';

import zhCN from '../i18n/locales/zh-CN/common.json';

describe('Pi package compatibility copy', () => {
  it.each([
    ['zh-CN', zhCN, '选择卡', '定时', '任务消息流'],
  ])('%s describes the implemented dialog and notification bridges', (
    _locale,
    catalog,
    cardCopy,
    timedCopy,
    transcriptCopy,
  ) => {
    const issues = catalog.settings.piPackages.issues;
    expect(issues['interactive-dialogs']).toContain(cardCopy);
    expect(issues['interactive-dialogs']).toContain(timedCopy);
    expect(issues.notifications).toContain(transcriptCopy);
  });
});
