// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Cindy user', avatar: null },
    mode: 'cloud',
    isCanary: false,
  }),
}));

vi.mock('@/hooks/useUpdateStatus', () => ({
  useUpdateStatus: () => ({ status: 'idle' }),
}));

vi.mock('@/hooks/useUpdateBannerDismiss', () => ({
  useUpdateBannerDismiss: () => ({ dismissed: false, restore: vi.fn() }),
}));

import { UserInfoSection } from '@/components/sidebar/UserInfoSection';

beforeEach(() => {
  Object.defineProperty(window, 'electronAPI', {
    configurable: true,
    value: {
      appDisplayVersion: '1.0.0',
      appDisplayVersionDetail: '1.0.0-test',
    },
  });
});

afterEach(cleanup);

describe('UserInfoSection mobile download entry', () => {
  it.each([
    ['expanded', false],
    ['collapsed', true],
  ])('does not expose a mobile download control in the %s sidebar', (_label, isCollapsed) => {
    render(<UserInfoSection isCollapsed={isCollapsed} />);

    expect(
      screen.queryByRole('button', {
        name: 'sidebar.user.downloadMobile',
      }),
    ).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
