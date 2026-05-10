import { platformLabel, platformColor, truncate } from '../../lib/utils';

export default function ContentTable({ data }) {
  if (!data?.length) return (
    <div className="bg-white border border-[#E4E4E7] rounded-xl p-8 text-center shadow-sm">
      <p className="text-sm text-[#71717A]">No performance data yet. Post some content to see results.</p>
    </div>
  );

  return (
    <div className="bg-white border border-[#E4E4E7] rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E4E4E7]">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">Best Performing Content</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E4E4E7]">
              {['#', 'Content', 'Platform', 'Clicks', 'Signups'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#71717A] uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((row, i) => (
              <tr key={row.id} className="border-b border-[#E4E4E7] last:border-0 hover:bg-[#FAFAFA]">
                <td className="px-4 py-3 text-[#A1A1AA] font-medium">{i + 1}</td>
                <td className="px-4 py-3 max-w-xs">
                  <span className="text-[#18181B] line-clamp-2">{truncate(row.content_queue?.body, 100)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: platformColor(row.platform) }} />
                    <span className="text-[#71717A]">{platformLabel(row.platform)}</span>
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{row.clicks}</td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${row.signups > 0 ? 'text-[#22C55E]' : 'text-[#71717A]'}`}>
                    {row.signups}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
