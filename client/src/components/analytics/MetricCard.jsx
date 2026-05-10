export default function MetricCard({ label, value, change, changeLabel, color = '#18181B', prefix = '', suffix = '' }) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-3">{label}</div>
      <div className="text-3xl font-bold" style={{ color }}>
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
          isPositive ? 'text-[#22C55E]' : isNegative ? 'text-[#EF4444]' : 'text-[#71717A]'
        }`}>
          <span>{isPositive ? '↑' : isNegative ? '↓' : '→'}</span>
          <span>{Math.abs(change)}% {changeLabel || 'vs last period'}</span>
        </div>
      )}
    </div>
  );
}
