export default function Input({ label, error, textarea, className = '', ...props }) {
  const base = 'w-full px-3 py-2 text-sm bg-white border rounded-lg outline-none transition-all duration-150 placeholder:text-[#A1A1AA] disabled:opacity-50 disabled:bg-[#F4F4F5]';
  const normal = 'border-[#E4E4E7] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20';
  const errStyle = 'border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20';

  const cls = `${base} ${error ? errStyle : normal} ${className}`;

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-[#18181B] mb-1.5">{label}</label>}
      {textarea
        ? <textarea className={`${cls} resize-none`} rows={4} {...props} />
        : <input className={cls} {...props} />
      }
      {error && <p className="mt-1 text-xs text-[#EF4444]">{error}</p>}
    </div>
  );
}
