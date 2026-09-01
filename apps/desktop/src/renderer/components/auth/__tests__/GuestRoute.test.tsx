// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({
  current: {
    mode: 'signed-out' as 'signed-out' | 'local' | 'cloud',
    isInitializing: false,
    enterLocalMode: vi.fn(async () => undefined),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState.current,
}));

import { GuestRoute } from '../GuestRoute';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<div data-testid="app-shell" />} />
        <Route path="/login" element={<GuestRoute />}>
          <Route index element={<div data-testid="login-page" />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('GuestRoute', () => {
  afterEach(() => {
    cleanup();
    authState.current = {
      mode: 'signed-out',
      isInitializing: false,
      enterLocalMode: vi.fn(async () => undefined),
    };
  });

  it('hides cloud login and requests local mode instead', async () => {
    renderAt('/login');
    expect(screen.queryByTestId('login-page')).toBeNull();
    expect(screen.queryByTestId('app-shell')).toBeNull();
    await waitFor(() => expect(authState.current.enterLocalMode).toHaveBeenCalledTimes(1));
  });

  it('leaves login once skip-sign-in has committed local mode', () => {
    authState.current = {
      mode: 'local',
      isInitializing: false,
      enterLocalMode: vi.fn(async () => undefined),
    };
    renderAt('/login');
    expect(screen.getByTestId('app-shell')).toBeTruthy();
    expect(screen.queryByTestId('login-page')).toBeNull();
  });

  it('leaves login for a cloud session', () => {
    authState.current = {
      mode: 'cloud',
      isInitializing: false,
      enterLocalMode: vi.fn(async () => undefined),
    };
    renderAt('/login');
    expect(screen.getByTestId('app-shell')).toBeTruthy();
    expect(screen.queryByTestId('login-page')).toBeNull();
  });
});
