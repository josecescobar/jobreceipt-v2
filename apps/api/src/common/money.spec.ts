import { fromMoneyCents, toMoneyCents } from '@jobreceipt/shared';

describe('money helpers', () => {
  it('converts decimals to cents with rounding', () => {
    expect(toMoneyCents(10.129)).toBe(1013);
    expect(toMoneyCents(0)).toBe(0);
  });

  it('converts cents to decimal dollars', () => {
    expect(fromMoneyCents(1234 as never)).toBe(12.34);
  });
});
