/**
 * Formats a numerical amount with the given currency symbol.
 */
export function formatCurrency(amount, currencySymbol = '₹') {
  const num = Math.abs(parseFloat(amount) || 0);
  const formatted = num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
  });

  return `${currencySymbol}${formatted}`;
}

/**
 * Generates initials from a name (e.g. "Aman Sharma" => "AS", "Pooja" => "PO")
 */
export function getInitials(name = '') {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return trimmed.slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Returns formatted friendly date (e.g. "Today", "Yesterday", or "Oct 01, 2026")
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Generates a valid UPI deep-link URI for Indian payment apps (GPay, PhonePe, Paytm).
 */
export function generateUpiLink(upiId, payeeName, amount, note = 'Trip Settlement') {
  if (!upiId) return null;
  const cleanUpi = encodeURIComponent(upiId.trim());
  const cleanName = encodeURIComponent(payeeName.trim());
  const cleanAmount = (parseFloat(amount) || 0).toFixed(2);
  const cleanNote = encodeURIComponent(note);

  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${cleanAmount}&tn=${cleanNote}&cu=INR`;
}
