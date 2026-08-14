import { useCompanyBranding } from "../../contexts/CompanyBrandingContext";
import { getCompanyInitials } from "../../utils/companyInitials";

type CompanyAvatarProps = {
  sizeClass?: string;
  roundedClass?: string;
  className?: string;
  /** Quando true, alt fica vazio (decorativo ao lado do nome). */
  decorative?: boolean;
};

function CompanyAvatar({
  sizeClass = "size-12",
  roundedClass = "rounded-md",
  className = "",
  decorative = false,
}: CompanyAvatarProps) {
  const { companyName, logoUrl } = useCompanyBranding();
  const initials = getCompanyInitials(companyName || "");
  const alt = decorative
    ? ""
    : companyName
      ? `Logo de ${companyName}`
      : "Estabelecimento";

  if (logoUrl) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-neutral-100 ${sizeClass} ${roundedClass} ${className}`}
      >
        <img
          key={logoUrl}
          src={logoUrl}
          alt={alt}
          aria-hidden={decorative || undefined}
          className="size-full object-contain"
        />
      </span>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center bg-accent-blue/20 font-bold uppercase tracking-wide text-accent-blue-soft ${sizeClass} ${roundedClass} ${className}`}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : alt}
      role={decorative ? undefined : "img"}
    >
      {initials ? (
        <span className="select-none text-[0.85em] leading-none">{initials}</span>
      ) : (
        <span className="size-1/2 rounded-full bg-accent-blue/35" aria-hidden />
      )}
    </span>
  );
}

export default CompanyAvatar;
