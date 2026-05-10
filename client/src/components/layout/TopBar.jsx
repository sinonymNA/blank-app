export default function TopBar({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between px-6 py-5 border-b border-[#E4E4E7] bg-white sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-bold text-[#18181B]">{title}</h1>
        {subtitle && <p className="text-sm text-[#71717A] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
