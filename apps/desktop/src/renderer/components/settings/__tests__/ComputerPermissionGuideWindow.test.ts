// @vitest-environment jsdom

import { createElement } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ComputerPermissionGuideWindow,
  PERMISSION_APP_DRAG_UI_FALLBACK_MS,
  PERMISSION_APP_DRAGGED_STORAGE_KEY,
  resolveComputerPermissionGuideInitialAwaitingUser,
  resolveComputerPermissionGuideInteraction,
  resolveComputerPermissionGuideStep,
} from '../ComputerPermissionGuideWindow';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: { permission?: string; current?: number; total?: number }) =>
      ({
        'settings.computerUse.directControl.permissions.accessibilityLabel': '辅助功能',
        'settings.computerUse.directControl.permissions.screenRecordingLabel': '屏幕录制',
        'settings.computerUse.directControl.permissionGuide.step': '打开自动操作电脑',
        'settings.computerUse.directControl.permissionGuide.dragTitle': `将 CuaDriver 拖入「${params?.permission}」`,
        'settings.computerUse.directControl.permissionGuide.turnOnAppTitle': `在「${params?.permission}」中打开 CuaDriver`,
        'settings.computerUse.directControl.permissionGuide.dragHint': '拖拽',
        'settings.computerUse.directControl.permissionGuide.draggingTitle': '正在拖拽 CuaDriver',
        'settings.computerUse.directControl.permissionGuide.draggingHint': `放入「${params?.permission}」列表`,
        'settings.computerUse.directControl.permissionGuide.appName': 'CuaDriver',
        'settings.computerUse.directControl.permissionGuide.waiting': '等待你开启',
        'commonUi.confirmDialog.cancel': '取消',
      })[key] ?? key,
  }),
}));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('resolveComputerPermissionGuideInteraction', () => {
  it('separates the idle demo, native drag, and user follow-up', () => {
    expect(resolveComputerPermissionGuideInteraction(false, false)).toBe('drag');
    expect(resolveComputerPermissionGuideInteraction(true, false)).toBe('dragging');
    expect(resolveComputerPermissionGuideInteraction(false, true)).toBe('turn-on');
  });

  it('keeps the native drag state authoritative until dragend', () => {
    expect(resolveComputerPermissionGuideInteraction(true, true)).toBe('dragging');
  });
});

describe('resolveComputerPermissionGuideInitialAwaitingUser', () => {
  it('resumes the turn-on flow after the app was already dragged', () => {
    expect(resolveComputerPermissionGuideInitialAwaitingUser('?view=computer-permission-guide&dragged=1')).toBe(true);
    expect(resolveComputerPermissionGuideInitialAwaitingUser('?view=computer-permission-guide')).toBe(false);
    expect(resolveComputerPermissionGuideInitialAwaitingUser(
      '?view=computer-permission-guide',
      '1',
    )).toBe(true);
    expect(PERMISSION_APP_DRAGGED_STORAGE_KEY).toBe('xdmaker.computer-permission-app-dragged');
  });
});

describe('ComputerPermissionGuideWindow native drag fallback', () => {
  it('does not reuse a localStorage drag hint from an earlier guide lifecycle', async () => {
    window.localStorage.setItem(PERMISSION_APP_DRAGGED_STORAGE_KEY, '1');
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      value: {
        maker: {
          computer: {
            permissionGuideStatus: vi.fn().mockResolvedValue({
              permissionState: {
                platform: 'macos',
                required: true,
                status: 'missing',
                accessibility: 'missing',
                screenRecording: 'missing',
                screenRecordingCapturable: 'missing',
                canGrant: true,
              },
            }),
            driverIcon: vi.fn().mockResolvedValue({ iconDataUrl: null }),
            startPermissionAppDrag: vi.fn(),
            finishPermissionAppDrag: vi.fn(),
            cancelPermissionGrant: vi.fn().mockResolvedValue({ cancelled: true }),
            onPermissionGuideStatusChanged: vi.fn(() => () => undefined),
          },
        },
      },
    });

    render(createElement(ComputerPermissionGuideWindow));

    expect(await screen.findByText('将 CuaDriver 拖入「辅助功能」')).toBeTruthy();
    expect(screen.queryByText('在「辅助功能」中打开 CuaDriver')).toBeNull();
  });

  it('initializes from the guide preflight snapshot without probing permissions again', async () => {
    const status = vi.fn();
    const permissionGuideStatus = vi.fn().mockResolvedValue({
      permissionState: {
        platform: 'macos',
        required: true,
        status: 'missing',
        accessibility: 'granted',
        screenRecording: 'missing',
        screenRecordingCapturable: 'missing',
        canGrant: true,
      },
    });
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      value: {
        maker: {
          computer: {
            status,
            permissionGuideStatus,
            driverIcon: vi.fn().mockResolvedValue({ iconDataUrl: null }),
            startPermissionAppDrag: vi.fn(),
            finishPermissionAppDrag: vi.fn(),
            cancelPermissionGrant: vi.fn().mockResolvedValue({ cancelled: true }),
            onPermissionGuideStatusChanged: vi.fn(() => () => undefined),
          },
        },
      },
    });

    render(createElement(ComputerPermissionGuideWindow));

    expect(await screen.findByText('将 CuaDriver 拖入「屏幕录制」')).toBeTruthy();
    expect(permissionGuideStatus).toHaveBeenCalledOnce();
    expect(status).not.toHaveBeenCalled();
  });

  it('requires Main to confirm a copied app row before entering the turn-on state', async () => {
    vi.useFakeTimers();
    const startPermissionAppDrag = vi.fn();
    const copiedDragResults = [false, true];
    const finishPermissionAppDrag = vi.fn(async (didCopy: boolean) => (
      didCopy ? copiedDragResults.shift() ?? false : false
    ));
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      value: {
        maker: {
          computer: {
            permissionGuideStatus: vi.fn(() => new Promise(() => undefined)),
            startPermissionAppDrag,
            finishPermissionAppDrag,
            cancelPermissionGrant: vi.fn().mockResolvedValue({ cancelled: true }),
          },
        },
      },
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,test');

    render(createElement(ComputerPermissionGuideWindow));
    expect(screen.getByText('打开自动操作电脑')).toBeTruthy();
    const image = document.querySelector('img');
    expect(image).not.toBeNull();
    Object.defineProperties(image!, {
      complete: { configurable: true, value: true },
      naturalWidth: { configurable: true, value: 96 },
      naturalHeight: { configurable: true, value: 96 },
    });

    fireEvent.dragStart(screen.getByRole('button', { name: 'CuaDriver' }), {
      dataTransfer: { effectAllowed: 'none' },
    });
    expect(startPermissionAppDrag).toHaveBeenCalledOnce();
    expect(screen.getByText('正在拖拽 CuaDriver')).toBeTruthy();

    act(() => vi.advanceTimersByTime(PERMISSION_APP_DRAG_UI_FALLBACK_MS));

    expect(screen.queryByText('正在拖拽 CuaDriver')).toBeNull();
    expect(screen.getByText('将 CuaDriver 拖入「辅助功能」')).toBeTruthy();

    const retryButton = screen.getByRole('button', { name: /CuaDriver/ });
    expect(retryButton).toHaveProperty('draggable', true);
    fireEvent.dragStart(retryButton, {
      dataTransfer: { effectAllowed: 'none' },
    });

    expect(startPermissionAppDrag).toHaveBeenCalledTimes(2);
    expect(screen.getByText('正在拖拽 CuaDriver')).toBeTruthy();

    fireEvent.dragEnd(retryButton, {
      dataTransfer: { dropEffect: 'none' },
    });
    expect(finishPermissionAppDrag).toHaveBeenLastCalledWith(false);
    expect(screen.getByText('将 CuaDriver 拖入「辅助功能」')).toBeTruthy();

    fireEvent.dragStart(retryButton, {
      dataTransfer: { effectAllowed: 'none' },
    });
    fireEvent.dragEnd(retryButton, {
      dataTransfer: { dropEffect: 'copy' },
    });
    expect(finishPermissionAppDrag).toHaveBeenLastCalledWith(true);
    await act(async () => Promise.resolve());
    expect(screen.getByText('将 CuaDriver 拖入「辅助功能」')).toBeTruthy();

    fireEvent.dragStart(retryButton, {
      dataTransfer: { effectAllowed: 'none' },
    });
    fireEvent.dragEnd(retryButton, {
      dataTransfer: { dropEffect: 'copy' },
    });
    await act(async () => Promise.resolve());
    expect(screen.getByText('在「辅助功能」中打开 CuaDriver')).toBeTruthy();
  });
});

describe('resolveComputerPermissionGuideStep', () => {
  it('starts with Accessibility', () => {
    expect(resolveComputerPermissionGuideStep({
      platform: 'macos',
      required: true,
      status: 'missing',
      accessibility: 'missing',
      screenRecording: 'missing',
      screenRecordingCapturable: 'missing',
      canGrant: true,
    })).toBe('accessibility');
  });

  it('moves to Screen Recording after Accessibility is granted', () => {
    expect(resolveComputerPermissionGuideStep({
      platform: 'macos',
      required: true,
      status: 'missing',
      accessibility: 'granted',
      screenRecording: 'granted',
      screenRecordingCapturable: 'missing',
      canGrant: true,
    })).toBe('screen-recording');
  });

  it('completes only after both permissions are usable', () => {
    expect(resolveComputerPermissionGuideStep({
      platform: 'macos',
      required: true,
      status: 'granted',
      accessibility: 'granted',
      screenRecording: 'granted',
      screenRecordingCapturable: 'granted',
      canGrant: true,
    })).toBe('complete');
  });
});
