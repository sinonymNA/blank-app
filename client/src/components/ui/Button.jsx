export default function Button({ children, variant = 'primary', size = 'md', onClick, disabled, className = '', type = 'button', loading }) {
  const base = 'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[#6366F1] text-white hover:bg-[#4F46E5] active:bg-[#4338CA]',
    secondary: 'bg-white text-[#18181B] border border-[#E4E4E7] hover:bg-[#F4F4F5] hover:border-[#D4D4D8]',
    danger: 'bg-[#EF4444] text-white hover:bg-[#DC2626]',
    ghost: 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]',
    success: 'bg-[#22C55E] text-white hover:bg-[#16A34A]'
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-sm px-3.5 py-2',
    lg: 'text-sm px-5 py-2.5'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}
