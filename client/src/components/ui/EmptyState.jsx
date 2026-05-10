import Button from './Button.jsx';

export default function EmptyState({ icon = '◈', title, description, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-4xl mb-4 opacity-30">{icon}</div>
      <h3 className="font-semibold text-[#18181B] mb-1">{title}</h3>
      {description && <p className="text-sm text-[#71717A] max-w-xs mb-6">{description}</p>}
      {action && <Button onClick={action}>{actionLabel}</Button>}
    </div>
  );
}
