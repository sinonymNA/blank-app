export default function FunnelChart({ posts, clicks, signups, conversions }) {
  const steps = [
    { label: 'Posts Published', value: posts, color: '#6366F1' },
    { label: 'Clicks', value: clicks, color: '#22C55E' },
    { label: 'Signups', value: signups, color: '#F59E0B' },
    { label: 'Paid', value: conversions, color: '#EF4444' }
  ];

  const max = Math.max(...steps.map(s => s.value), 1);

  return (
    <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-5">Conversion Funnel</div>
      <div className="space-y-3">
        {steps.map((step, i) => {
          const pct = (step.value / max) * 100;
          const convRate = i > 0 && steps[i - 1].value > 0
            ? ((step.value / steps[i - 1].value) * 100).toFixed(1)
            : null;

          return (
            <div key={step.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[#18181B]">{step.label}</span>
                <span className="text-sm font-semibold text-[#18181B]">
                  {step.value.toLocaleString()}
                  {convRate && <span className="ml-2 text-xs font-normal text-[#71717A]">({convRate}%)</span>}
                </span>
              </div>
              <div className="h-2 bg-[#F4F4F5] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: step.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
