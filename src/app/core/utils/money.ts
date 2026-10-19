export const formatCurrency = (amount: number, currency = 'INR'): string => {
  if (!Number.isFinite(amount)) {
    return currency === 'INR' ? '₹0.00' : `0.00 ${currency}`;
  }

  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatCompactCurrency = (amount: number, currency = 'INR'): string => {
  const safe = Number.isFinite(amount) ? amount : 0;
  const prefix = currency === 'INR' ? '₹' : '';
  const formatter = new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  const sign = safe < 0 ? '-' : '';
  return `${sign}${prefix}${formatter.format(Math.abs(safe))}`;
};
