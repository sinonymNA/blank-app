import { formatDistanceToNow, format } from 'date-fns';

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function formatDate(dateStr, fmt = 'MMM d, yyyy') {
  if (!dateStr) return '';
  return format(new Date(dateStr), fmt);
}

export function platformLabel(platform) {
  const labels = {
    reddit: 'Reddit',
    pinterest: 'Pinterest',
    facebook: 'Facebook',
    twitter: 'Twitter/X',
    linkedin: 'LinkedIn',
    email: 'Email',
    blog: 'Blog'
  };
  return labels[platform] || platform;
}

export function platformColor(platform) {
  const colors = {
    reddit: '#FF4500',
    pinterest: '#E60023',
    facebook: '#1877F2',
    twitter: '#1DA1F2',
    linkedin: '#0A66C2',
    email: '#6366F1',
    blog: '#22C55E'
  };
  return colors[platform] || '#71717A';
}

export function urgencyColor(urgency) {
  if (urgency === 'urgent') return { bg: '#FEF2F2', text: '#EF4444', border: '#FECACA' };
  if (urgency === 'low') return { bg: '#F4F4F5', text: '#71717A', border: '#E4E4E7' };
  return { bg: '#FFFBEB', text: '#F59E0B', border: '#FDE68A' };
}

export function engagementStars(predicted) {
  return '★'.repeat(predicted) + '☆'.repeat(5 - predicted);
}

export function truncate(str, len = 120) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

export function formatMoney(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
}

export function formatNumber(val) {
  if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
  return String(val || 0);
}
