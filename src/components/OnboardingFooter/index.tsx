import { ReactNode } from "react";
import { logoutAndRedirect } from "../../utils/authCookie";

type OnboardingFooterProps = {
  /** Ação secundária (ex.: apagar mock). */
  secondary?: ReactNode;
};

/** Rodapé discreto das telas de configuração (full, sem header de app). */
function OnboardingFooter({ secondary }: OnboardingFooterProps) {
  return (
    <footer className="mt-10 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center">
      <button
        type="button"
        onClick={() => {
          void logoutAndRedirect();
        }}
        className="text-base font-semibold text-text-light/55 underline-offset-2 hover:text-text-light/80 hover:underline"
      >
        Sair
      </button>
      {secondary && <div className="mt-3">{secondary}</div>}
    </footer>
  );
}

export default OnboardingFooter;
