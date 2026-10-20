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
      className={`flex min-h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-danger-400 px-2 text-base font-bold tabular-nums leading-none text-white ${className}`}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {label}
    </span>
  );
}

export default ReminderBadge;
