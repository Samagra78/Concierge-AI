export const USD_TO_INR_RATE = 95;

export function convertUsdToInr(amount: number): number {
  return Math.round(amount * USD_TO_INR_RATE);
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
