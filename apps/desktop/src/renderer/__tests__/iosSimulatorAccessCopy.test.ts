import { describe, expect, it } from 'vitest';

import zhCN from '../i18n/locales/zh-CN/common.json';

describe('iOS Simulator access copy', () => {
  it('explains that viewing is retained while control needs renewed authorization', () => {
    expect(zhCN.rightSidebar.iosSimulator.accessDialogDetail).toBe(
      '此权限仅对该任务生效。切换到其他任务后会保留查看授权，但控制会暂停；返回后请再次允许控制。',
    );
  });
});
