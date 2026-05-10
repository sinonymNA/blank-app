import { platformLabel, platformColor } from '../../lib/utils';

export default function PlatformBadge({ platform, status = 'active' }) {
  const statusColors = {
    active: '#22C55E',
    pending: '#F59E0B',
    error: '#EF4444',
    inactive: '#A1A1AA'
  };

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F4F4F5] text-[#71717A]">
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColors[status] || statusColors.inactive }} />
      {platformLabel(platform)}
    </span>
  );
}
