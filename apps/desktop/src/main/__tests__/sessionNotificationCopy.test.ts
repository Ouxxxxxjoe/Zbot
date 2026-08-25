import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getPreferredSystemLanguages: () => ['en'],
    getLocale: () => 'en',
  },
}));

import { setMainLocale } from '../i18n';
import {
  getSessionExternalNotificationText,
  getSessionNotificationBody,
  getSessionNotificationUntitled,
} from '../sessionNotificationCopy';
import type { SupportedLocale } from '../../shared/locale';

const CASES: Array<{
  locale: SupportedLocale;
  title: string;
  untitled: string;
  done: string;
  error: string;
  needsReply: string;
  externalDone: string;
  externalError: string;
  externalNeedsReply: string;
}> = [
  {
    locale: 'zh-CN',
    title: '整理报告',
    untitled: '未命名任务',
    done: '已完成 ✓',
    error: '执行失败',
    needsReply: '需要你回复',
    externalDone: 'Zbot · 任务「整理报告」已完成 ✓',
    externalError: 'Zbot · 任务「整理报告」执行失败',
    externalNeedsReply: 'Zbot · 任务「整理报告」需要你回复',
  },
];

describe('session notification copy', () => {
  it.each(CASES)('$locale 使用当前语言生成三种状态与外部通知', (entry) => {
    setMainLocale(entry.locale);

    expect(getSessionNotificationUntitled()).toBe(entry.untitled);
    expect(getSessionNotificationBody('done')).toBe(entry.done);
    expect(getSessionNotificationBody('error')).toBe(entry.error);
    expect(getSessionNotificationBody('needs-reply')).toBe(entry.needsReply);
    expect(getSessionExternalNotificationText(entry.title, 'done')).toBe(entry.externalDone);
    expect(getSessionExternalNotificationText(entry.title, 'error')).toBe(entry.externalError);
    expect(getSessionExternalNotificationText(entry.title, 'needs-reply')).toBe(
      entry.externalNeedsReply,
    );
  });

  it('下一条通知立即跟随当前语言', () => {
    setMainLocale('zh-CN');
    expect(getSessionNotificationBody('needs-reply')).toBe('需要你回复');
  });

  it.each(['foo$&bar', 'foo$`bar', "foo$'bar", 'foo$$bar'])(
    '将包含 JavaScript replacement token 的标题 %s 原样插入三种外部通知',
    (title) => {
      setMainLocale('zh-CN');
      expect(getSessionExternalNotificationText(title, 'done')).toBe(
        `Zbot · 任务「${title}」已完成 ✓`,
      );
      expect(getSessionExternalNotificationText(title, 'error')).toBe(
        `Zbot · 任务「${title}」执行失败`,
      );
      expect(getSessionExternalNotificationText(title, 'needs-reply')).toBe(
        `Zbot · 任务「${title}」需要你回复`,
      );
    },
  );
});
