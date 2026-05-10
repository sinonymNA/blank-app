export default function Toggle({ checked, onChange, label, disabled }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-150 ${
          checked ? 'bg-[#6366F1]' : 'bg-[#D4D4D8]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-150 ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`} />
      </div>
      {label && <span className="text-sm text-[#18181B]">{label}</span>}
    </label>
  );
}
