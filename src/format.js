// Rupee formatting with Indian digit grouping: 5997 -> ₹5,997, 799.5 -> ₹799.50
export function money(value) {
  const n = Number(value) || 0;
  const hasPaise = Math.round(n * 100) % 100 !== 0;
  return "₹" + n.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  });
}
