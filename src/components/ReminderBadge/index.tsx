type ReminderBadgeProps = {
  count: number;
  className?: string;
};

function ReminderBadge({ count, className = "" }: ReminderBadgeProps) {
  if (!count || count <= 0) return null;

  const label = count > 99 ? "99+" : String(count);
  const ariaLabel = `${count} lembrete${count > 1 ? "s" : ""}`;

  return (
    <span
      className={`flex min-h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-warning-500 px-2 text-sm font-bold tabular-nums leading-none text-master shadow-[0_0_0_1px_rgba(8,20,37,0.35)] ${className}`}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {label}
    </span>
  );
}

export default ReminderBadge;
