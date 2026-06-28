import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimit } from '../rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows requests within limit', () => {
    expect(rateLimit('test-1', 3, 60000)).toBe(true);
    expect(rateLimit('test-1', 3, 60000)).toBe(true);
    expect(rateLimit('test-1', 3, 60000)).toBe(true);
  });

  it('blocks requests exceeding limit', () => {
    rateLimit('test-2', 2, 60000);
    rateLimit('test-2', 2, 60000);
    expect(rateLimit('test-2', 2, 60000)).toBe(false);
  });

  it('resets after window expires', () => {
    rateLimit('test-3', 1, 1000);
    expect(rateLimit('test-3', 1, 1000)).toBe(false);

    vi.advanceTimersByTime(1100);
    expect(rateLimit('test-3', 1, 1000)).toBe(true);
  });

  it('tracks different keys independently', () => {
    rateLimit('key-a', 1, 60000);
    expect(rateLimit('key-a', 1, 60000)).toBe(false);
    expect(rateLimit('key-b', 1, 60000)).toBe(true);
  });
});
