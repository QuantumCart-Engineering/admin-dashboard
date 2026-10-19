import { formatCompactCurrency, formatCurrency } from './money';

describe('formatCurrency', () => {
  it('formats INR amounts with the rupee symbol', () => {
    expect(formatCurrency(999)).toContain('999');
    expect(formatCurrency(0)).toContain('0.00');
  });

  it('falls back gracefully for non-finite input', () => {
    expect(formatCurrency(Number.NaN)).toBe('₹0.00');
  });
});

describe('formatCompactCurrency', () => {
  it('abbreviates large amounts with a rupee prefix', () => {
    expect(formatCompactCurrency(125000)).toContain('₹');
    expect(formatCompactCurrency(125000)).not.toContain('125000');
  });

  it('handles zero and non-finite input', () => {
    expect(formatCompactCurrency(0)).toBe('₹0');
    expect(formatCompactCurrency(Number.POSITIVE_INFINITY)).toBe('₹0');
  });
});

