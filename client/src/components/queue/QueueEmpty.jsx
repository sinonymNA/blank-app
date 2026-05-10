export default function QueueEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="text-5xl mb-5">✓</div>
      <h2 className="text-xl font-bold text-[#18181B] mb-2">Queue is clear</h2>
      <p className="text-sm text-[#71717A] max-w-xs">
        All caught up. Ampere is monitoring Reddit and generating new content in the background.
        Check back tomorrow morning.
      </p>
    </div>
  );
}
