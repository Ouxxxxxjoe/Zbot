/**
 * deepLinkSchemes:双 scheme(cindy 主 + 历史 xdt-maker)收敛单点的行为契约。
 * 生成一律主 scheme;解析两种 scheme 都认;切片按实际命中前缀长度。
 */

import { describe, expect, it } from 'vitest';

import {
  DEEP_LINK_PRIMARY_SCHEME,
  DEEP_LINK_PROVIDER_CONNECT_ID_MAX_LENGTH,
  DEEP_LINK_SCHEMES,
  DEEP_LINK_SCHEME_RE_GROUP,
  DEEP_LINK_URL_PREFIX,
  DEEP_LINK_URL_PREFIXES,
  buildDeepLink,
  hasDeepLinkPathPrefix,
  isDeepLinkProtocol,
  isDeepLinkProviderConnectId,
  isDeepLinkUrl,
  matchDeepLinkPrefix,
  stripDeepLinkPathPrefix,
  textContainsDeepLink,
} from '../deepLinkSchemes';

describe('deepLinkSchemes constants', () => {
  it('primary scheme is zbot; Zbot 无 legacy scheme', () => {
    expect(DEEP_LINK_PRIMARY_SCHEME).toBe('zbot');
    expect(DEEP_LINK_SCHEMES[0]).toBe('zbot');
    expect(DEEP_LINK_SCHEMES).toEqual(['zbot']);
    expect(DEEP_LINK_URL_PREFIX).toBe('zbot://');
    expect(DEEP_LINK_URL_PREFIXES).toContain('zbot://');
  });

  it('regex scheme group matches every registered scheme', () => {
    const re = new RegExp(`^${DEEP_LINK_SCHEME_RE_GROUP}$`);
    for (const scheme of DEEP_LINK_SCHEMES) {
      expect(re.test(scheme)).toBe(true);
    }
    expect(re.test('http')).toBe(false);
  });
});

describe('matchDeepLinkPrefix / isDeepLinkUrl', () => {
  it('matches both primary and legacy prefixes', () => {
    expect(matchDeepLinkPrefix('zbot://session/a')).toBe('zbot://');
    expect(matchDeepLinkPrefix('zbot://session/a')).toBe('zbot://');
    expect(isDeepLinkUrl('zbot://project/x')).toBe(true);
    expect(isDeepLinkUrl('zbot://project/x')).toBe(true);
  });

  it('rejects other schemes, including in-process resource schemes', () => {
    expect(matchDeepLinkPrefix('https://example.com')).toBeNull();
    expect(matchDeepLinkPrefix('xdt-image://blobs/x.png')).toBeNull();
    expect(matchDeepLinkPrefix('cindy-media://blobs/x.png')).toBeNull();
    expect(isDeepLinkUrl('')).toBe(false);
  });
});

describe('isDeepLinkProtocol', () => {
  it('accepts WHATWG URL.protocol values for both schemes only', () => {
    expect(isDeepLinkProtocol('zbot:')).toBe(true);
    expect(isDeepLinkProtocol('xdt-maker:')).toBe(false);
    expect(isDeepLinkProtocol('https:')).toBe(false);
    expect(isDeepLinkProtocol('cindy')).toBe(false); // 旧品牌 scheme 不再认；必须带冒号
  });
});

describe('textContainsDeepLink', () => {
  it('detects either scheme anywhere in free text', () => {
    expect(textContainsDeepLink('见 zbot://session/abc 这个任务')).toBe(true);
    expect(textContainsDeepLink('老链接 zbot://session/abc 仍可点')).toBe(true);
    expect(textContainsDeepLink('普通文本 https://example.com')).toBe(false);
  });
});

describe('stripDeepLinkPathPrefix / hasDeepLinkPathPrefix', () => {
  it('slices by the actually matched prefix length (schemes differ in length)', () => {
    expect(stripDeepLinkPathPrefix('zbot://session/abc?m=1', 'session/')).toBe('abc?m=1');
    expect(stripDeepLinkPathPrefix('zbot://session/abc?m=1', 'session/')).toBe('abc?m=1');
  });

  it('returns null on path-type mismatch and empty string on empty rest', () => {
    expect(stripDeepLinkPathPrefix('zbot://project/x', 'session/')).toBeNull();
    expect(stripDeepLinkPathPrefix('https://x/session/a', 'session/')).toBeNull();
    expect(stripDeepLinkPathPrefix('zbot://session/', 'session/')).toBe('');
    expect(hasDeepLinkPathPrefix('zbot://session-card/a?wake=created', 'session-card/')).toBe(
      true,
    );
    expect(hasDeepLinkPathPrefix('zbot://session/a', 'session-card/')).toBe(false);
  });
});

describe('isDeepLinkProviderConnectId', () => {
  it('accepts provider and preset ids while bounding untrusted URL input', () => {
    expect(isDeepLinkProviderConnectId('openrouter')).toBe(true);
    expect(isDeepLinkProviderConnectId('Vendor_2')).toBe(true);
    expect(
      isDeepLinkProviderConnectId('a'.repeat(DEEP_LINK_PROVIDER_CONNECT_ID_MAX_LENGTH)),
    ).toBe(true);
    expect(isDeepLinkProviderConnectId('')).toBe(false);
    expect(isDeepLinkProviderConnectId('a.b')).toBe(false);
    expect(isDeepLinkProviderConnectId('a b')).toBe(false);
    expect(
      isDeepLinkProviderConnectId('a'.repeat(DEEP_LINK_PROVIDER_CONNECT_ID_MAX_LENGTH + 1)),
    ).toBe(false);
  });
});

describe('buildDeepLink', () => {
  it('always generates with the primary scheme', () => {
    expect(buildDeepLink('session/abc')).toBe('zbot://session/abc');
  });
});
