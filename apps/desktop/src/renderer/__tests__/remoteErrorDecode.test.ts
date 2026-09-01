import { describe, expect, it } from 'vitest';

import { decodeRemoteErrorMessage } from '@/lib/makerChatStore';

describe('decodeRemoteErrorMessage', () => {
  it('maps user-facing device-link chat errors to i18n text', () => {
    expect(decodeRemoteErrorMessage('[DEVICE_LINK_CONTROL_DISABLED] device control is disabled locally')).toBe(
      '已关闭对该设备的控制，消息未发送。',
    );
    expect(decodeRemoteErrorMessage('[DEVICE_LINK_MEDIA_TRANSFER_FAILED] upload failed')).toBe(
      '附件传输失败，消息未发送。请重试。',
    );
  });

  it('maps Electron-wrapped device-link chat errors to i18n text', () => {
    expect(
      decodeRemoteErrorMessage(
        'Error invoking remote method device-link:invoke: Error: [DEVICE_LINK_CONTROL_DISABLED] device control is disabled locally',
      ),
    ).toBe('已关闭对该设备的控制，消息未发送。');
  });

  it('keeps non-chat device-link IPC codes unchanged', () => {
    expect(decodeRemoteErrorMessage('[DEVICE_LINK_ACCESS_REVOKED] access revoked')).toBe(
      '[DEVICE_LINK_ACCESS_REVOKED] access revoked',
    );
  });

  it('decodes remote agent errors while preserving fallback text for missing keys', () => {
    expect(decodeRemoteErrorMessage('[REMOTE_UNKNOWN] fallback message')).toBe('fallback message');
  });

  it('maps a missing auto-review confirmation to i18n text, not a user rejection', () => {
    expect(
      decodeRemoteErrorMessage(
        '[AUTO_REVIEW_CONFIRM_UNDELIVERED] Automatic review was unavailable, and the confirmation request was not completed.',
      ),
    ).toBe('自动审批没完成，确认也没有送到或没有被点。这次拒绝不是你点的。');
  });
});
