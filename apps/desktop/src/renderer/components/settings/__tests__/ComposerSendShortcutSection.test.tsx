// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const toastMocks = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { shortcut?: string }) => {
      const translations: Record<string, string> = {
        'settings.composer.title': '消息输入',
        'settings.composer.sendShortcut.label': '使用 {{shortcut}} 发送',
        'settings.composer.sendShortcut.hint':
          '开启后按 {{shortcut}} 发送消息；关闭后按 Enter 发送消息，按 Shift+Enter 换行。',
        'settings.composer.sendShortcut.ariaLabel': '使用 {{shortcut}} 发送消息',
        'settings.defaults.customizedBadge': '已自定义',
        'settings.defaults.restore': '恢复默认',
        'settings.defaults.restored': '已恢复默认设置',
        'settings.shortcuts.errors.composerVoiceConflict':
          '与语音输入快捷键冲突，请修改发送或语音输入快捷键。',
      };
      return (translations[key] ?? key).replace('{{shortcut}}', options?.shortcut ?? '');
    },
  }),
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tip: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/lib/toast', () => ({
  toast: toastMocks,
}));

import {
  COMPOSER_SEND_SHORTCUT_STORAGE_KEY,
  _resetComposerSendShortcutPreferenceForTests,
} from '@/hooks/useComposerSendShortcutPreference';
import { ComposerSendShortcutSection } from '../ComposerSendShortcutSection';

function setPlatform(platform: string): void {
  Object.defineProperty(window, 'electronAPI', {
    configurable: true,
    value: { platform },
  });
}

function setVoiceInputShortcut(shortcut: object | null): void {
  Object.defineProperty(window, 'electronAPI', {
    configurable: true,
    value: {
      platform: 'darwin',
      voiceInput: {
        getDataSnapshot: () => ({ settings: { shortcut } }),
      },
    },
  });
}

describe('ComposerSendShortcutSection', () => {
  beforeEach(() => {
    localStorage.clear();
    _resetComposerSendShortcutPreferenceForTests();
    toastMocks.error.mockReset();
    toastMocks.success.mockReset();
    setPlatform('win32');
  });

  it('shows the default Enter mode and platform-specific shortcut copy', () => {
    setPlatform('darwin');

    render(<ComposerSendShortcutSection />);

    expect(
      screen.getByRole('switch', { name: '使用 ⌘+Enter 发送消息' }).getAttribute('data-state'),
    ).toBe('unchecked');
    expect(screen.queryByText('使用 ⌘+Enter 发送')).not.toBeNull();
    expect(
      screen.queryByText(
        '开启后按 ⌘+Enter 发送消息；关闭后按 Enter 发送消息，按 Shift+Enter 换行。',
      ),
    ).not.toBeNull();
  });

  it('synchronizes mode B across subscribers and restores the default override', () => {
    render(
      <>
        <ComposerSendShortcutSection />
        <ComposerSendShortcutSection />
      </>,
    );

    const switches = screen.getAllByRole('switch', { name: '使用 Ctrl+Enter 发送消息' });
    fireEvent.click(switches[0]);

    expect(localStorage.getItem(COMPOSER_SEND_SHORTCUT_STORAGE_KEY)).toBe('modifier-enter');
    expect(switches[0].getAttribute('data-state')).toBe('checked');
    expect(switches[1].getAttribute('data-state')).toBe('checked');
    expect(screen.getAllByText('已自定义')).toHaveLength(2);

    fireEvent.click(screen.getAllByRole('button', { name: '恢复默认' })[0]);

    expect(localStorage.getItem(COMPOSER_SEND_SHORTCUT_STORAGE_KEY)).toBeNull();
    expect(switches[0].getAttribute('data-state')).toBe('unchecked');
    expect(switches[1].getAttribute('data-state')).toBe('unchecked');
    expect(toastMocks.success).toHaveBeenCalledWith('已恢复默认设置');
  });

  it('rejects a Composer shortcut that is already used by Voice Input', () => {
    setVoiceInputShortcut({
      trigger: 'keyboard',
      code: 'Enter',
      key: 'Enter',
      modifiers: { meta: true, ctrl: false, alt: false, shift: false, fn: false },
    });

    render(<ComposerSendShortcutSection />);

    const switchControl = screen.getByRole('switch', { name: '使用 ⌘+Enter 发送消息' });
    fireEvent.click(switchControl);

    expect(localStorage.getItem(COMPOSER_SEND_SHORTCUT_STORAGE_KEY)).toBeNull();
    expect(switchControl.getAttribute('data-state')).toBe('unchecked');
    expect(toastMocks.error).toHaveBeenCalledWith(
      '与语音输入快捷键冲突，请修改发送或语音输入快捷键。',
    );
  });
});
