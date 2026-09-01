import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getPath: (name: string) => `/tmp/cindy-${name}`,
  },
}));

vi.mock('../logger.js', () => ({
  createLogger: () => ({ info: vi.fn() }),
}));

vi.mock('../maker-host/override-settings-file.js', () => ({
  createOverrideSettingsFile: () => ({
    read: () => ({ activeMode: 'local' }),
    writePatch: vi.fn(),
  }),
}));

import { resolveStartupAppSessionMode } from '../appSessionState.js';

describe('resolveStartupAppSessionMode', () => {
  it('starts the local workspace unless a cloud session is pending verification', () => {
    expect(resolveStartupAppSessionMode('local')).toBe('local');
    expect(resolveStartupAppSessionMode('signed-out')).toBe('local');
    expect(resolveStartupAppSessionMode('cloud')).toBe('signed-out');
  });
});
