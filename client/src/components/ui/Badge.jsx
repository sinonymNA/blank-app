export default function Badge({ children, color = 'default', className = '' }) {
  const colors = {
    default: 'bg-[#F4F4F5] text-[#71717A]',
    accent: 'bg-[#EEF2FF] text-[#6366F1]',
    green: 'bg-[#F0FDF4] text-[#22C55E]',
    red: 'bg-[#FEF2F2] text-[#EF4444]',
    amber: 'bg-[#FFFBEB] text-[#F59E0B]',
    reddit: 'bg-orange-50 text-orange-600',
    pinterest: 'bg-red-50 text-red-600',
    facebook: 'bg-blue-50 text-blue-600',
    email: 'bg-[#EEF2FF] text-[#6366F1]',
    blog: 'bg-green-50 text-green-600'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[color] || colors.default} ${className}`}>
      {children}
    </span>
  );
}
