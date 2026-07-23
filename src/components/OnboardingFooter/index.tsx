import { logoutAndRedirect } from "../../utils/authCookie";

/** Rodapé discreto das telas de configuração (full, sem header de app). */
function OnboardingFooter() {
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
    </footer>
  );
}

export default OnboardingFooter;
