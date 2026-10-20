import type { IconBaseProps } from "react-icons";

/** Calendário da logo: folha com dois anéis e o visto no centro. */
function BrandCalendarIcon({
  size = 24,
  color = "currentColor",
  className,
  ...rest
}: IconBaseProps) {
  return (
    <svg
      stroke={color}
      fill="none"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
      aria-hidden
      {...rest}
    >
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3.2v3.2" />
      <path d="M16 3.2v3.2" />
      <path d="M8 14.6 10.3 16.9 15.7 11.4" />
    </svg>
  );
}

export default BrandCalendarIcon;
