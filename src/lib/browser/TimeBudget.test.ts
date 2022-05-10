import { wait } from '../../helpers/wait';

import { TimeBudget } from './TimeBudget';

describe('consume()', () => {
  it('should consume correctly', async () => {
    const tb = new TimeBudget(100);
    tb.consume();
    expect(tb.get()).toBeGreaterThan(98);
    expect(tb.consumed).toBeGreaterThanOrEqual(0);
    expect(tb.consumed).toBeLessThanOrEqual(2);

    await wait(10);
    tb.consume();
    expect(tb.get()).toBeGreaterThanOrEqual(80);
    expect(tb.get()).toBeLessThanOrEqual(90);

    expect(tb.consumed).toBeGreaterThanOrEqual(10);
  });
});

describe('get()', () => {
  it('shoumd return correct get', async () => {
    const tb = new TimeBudget(100);
    expect(tb.get()).toBeGreaterThanOrEqual(99);

    await wait(100);
    tb.consume();

    // Still 99 even if budget does not allow
    expect(tb.get()).toBeGreaterThanOrEqual(1);
    expect(tb.get()).toBeLessThanOrEqual(2);
  });
});

describe('min()', () => {
  it('shoumd return correct min', async () => {
    const tb = new TimeBudget(100);
    expect(tb.min(99)).toBeGreaterThanOrEqual(99);

    await wait(60);
    tb.consume();

    // Still 99 even if budget does not allow
    expect(tb.min(99)).toBeGreaterThanOrEqual(99);
  });
});

describe('minmax()', () => {
  it('shoumd return correct inside range', () => {
    const tb = new TimeBudget(100);
    expect(tb.minmax(0, 10)).toBe(10);
  });
  it('shoumd return correct outside range', () => {
    const tb = new TimeBudget(100);
    expect(tb.minmax(0, 200)).toBe(100);
  });
  it('shoumd return correct outside range but forced', () => {
    const tb = new TimeBudget(100);
    expect(tb.minmax(200, 300)).toBe(200);
  });
});
