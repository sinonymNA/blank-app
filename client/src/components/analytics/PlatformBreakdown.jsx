import { platformLabel, platformColor } from '../../lib/utils.js';

export default function PlatformBreakdown({ data }) {
  const platforms = Object.entries(data || {});
  if (!platforms.length) return null;

  const maxSignups = Math.max(...platforms.map(([, d]) => d.signups || 0), 1);

  return (
    <div className="bg-white border border-[#E4E4E7] rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E4E4E7]">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">Platform Breakdown</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E4E4E7]">
              {['Platform', 'Posts', 'Clicks', 'Signups', 'Conv Rate'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#71717A] uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {platforms.sort((a, b) => (b[1].signups || 0) - (a[1].signups || 0)).map(([platform, stats]) => {
              const convRate = stats.clicks > 0 ? ((stats.signups / stats.clicks) * 100).toFixed(1) : '0.0';
              const isAboveAvg = (stats.signups || 0) > maxSignups * 0.5;

              return (
                <tr key={platform} className="border-b border-[#E4E4E7] last:border-0 hover:bg-[#FAFAFA]">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: platformColor(platform) }} />
                      <span className="font-medium">{platformLabel(platform)}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#71717A]">{stats.posts || 0}</td>
                  <td className="px-4 py-3">{(stats.clicks || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${isAboveAvg ? 'text-[#22C55E]' : 'text-[#18181B]'}`}>
                      {stats.signups || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={parseFloat(convRate) > 5 ? 'text-[#22C55E] font-medium' : 'text-[#71717A]'}>
                      {convRate}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
