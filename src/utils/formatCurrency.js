// Simple currency formatter for INR (rupee symbol)
export default function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return `₹ ${n}`;
}
