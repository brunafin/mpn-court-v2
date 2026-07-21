import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { buttonClassName } from "../../../components/Button";
import { formatPhoneMask } from "../../../utils/formatPhone";
import {
  clearMockSession,
  saveMockOnboarding,
} from "../../../onboarding/mockStore";
import {
  clearPendingSignup,
  getPendingSignup,
  PendingSignup,
  resendPendingSmsCode,
  verifyPendingSmsCode,
} from "../../../onboarding/signupSmsMock";
import { getAccessToken } from "../../../utils/authCookie";

const CODE_LENGTH = 6;

function SignUpVerifyCode() {
  const navigate = useNavigate();
  const [pending, setPending] = useState<PendingSignup | null>(null);
  const [digits, setDigits] = useState<string[]>(
    Array.from({ length: CODE_LENGTH }, () => "")
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (getAccessToken()) {
      navigate("/reservas");
      return;
    }
    const current = getPendingSignup();
    if (!current) {
      navigate("/cadastro");
      return;
    }
    setPending(current);
    window.setTimeout(() => inputsRef.current[0]?.focus(), 50);
  }, [navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(
      () => setResendCooldown((s) => Math.max(0, s - 1)),
      1000
    );
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const code = digits.join("");
  const canSubmit = code.length === CODE_LENGTH && !loading;

  const maskedPhone = useMemo(() => {
    if (!pending) return "";
    return formatPhoneMask(pending.ownerPhone);
  }, [pending]);

  const applyCode = (value: string) => {
    const next = value.replace(/\D/g, "").slice(0, CODE_LENGTH).split("");
    const filled = Array.from(
      { length: CODE_LENGTH },
      (_, i) => next[i] || ""
    );
    setDigits(filled);
    if (error) setError("");
    const focusAt = Math.min(next.length, CODE_LENGTH - 1);
    inputsRef.current[focusAt]?.focus();
  };

  const handleChange = (index: number, raw: string) => {
    if (raw.length > 1) {
      applyCode(raw);
      return;
    }
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (error) setError("");
    if (digit && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    applyCode(event.clipboardData.getData("text"));
  };

  const handleVerify = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      const result = verifyPendingSmsCode(code);
      if (!result.ok || !result.pending) {
        if (result.reason === "expired") {
          setError("Código expirado. Reenvie um novo.");
        } else if (result.reason === "missing") {
          navigate("/cadastro");
        } else {
          setError("Código inválido. Tente de novo.");
          setDigits(Array.from({ length: CODE_LENGTH }, () => ""));
          inputsRef.current[0]?.focus();
        }
        return;
      }

      const { pending: confirmed } = result;
      clearMockSession();
      saveMockOnboarding({
        email: confirmed.email,
        ownerName: confirmed.ownerName,
        ownerPhone: confirmed.ownerPhone,
        password: confirmed.password,
        arenaName: "",
        courtCount: 1,
        hasScheduleTemplate: false,
        courts: [],
        isPublished: false,
        createdAt: new Date().toISOString(),
      });
      clearPendingSignup();
      navigate("/", {
        state: {
          signupOk: true,
          email: confirmed.email,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    const next = resendPendingSmsCode();
    if (!next) {
      navigate("/cadastro");
      return;
    }
    setPending(next);
    setDigits(Array.from({ length: CODE_LENGTH }, () => ""));
    setError("");
    setResendCooldown(30);
    inputsRef.current[0]?.focus();
  };

  if (!pending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-master text-text-light/70">
        Carregando…
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-master px-4 py-4 text-text-light sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(61,111,184,0.18),_transparent_55%)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-4 flex flex-col items-center text-center sm:mb-6">
          <div className="mb-3 flex size-16 items-center justify-center overflow-hidden rounded-xl bg-neutral-100 p-2 sm:mb-4 sm:size-20 sm:rounded-2xl sm:p-2.5">
            <img
              src={import.meta.env.VITE_LOGO_URL}
              alt="Marca Pra Nós"
              className="size-full object-contain"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-light sm:text-2xl">
            Código de confirmação
          </h1>
          <p className="mt-1 text-base text-text-light/70">
            Enviado para {maskedPhone}
          </p>
          {import.meta.env.VITE_ENVIRONMENT !== "production" && (
            <p className="mt-2 rounded-lg bg-warning-500/15 px-3 py-1.5 text-sm font-medium text-warning-500">
              Protótipo · código {pending.smsCode}
            </p>
          )}
        </div>

        <form
          onSubmit={handleVerify}
          className="rounded-2xl bg-master-light p-4 sm:p-6"
          noValidate
        >
          <fieldset>
            <legend className="sr-only">Digite o código de 6 dígitos</legend>
            <div className="flex justify-between gap-2 sm:gap-3">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={CODE_LENGTH}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  aria-label={`Dígito ${index + 1}`}
                  className="size-12 rounded-xl border-0 bg-master text-center text-2xl font-semibold text-text-light outline-none ring-1 ring-inset ring-text-light/15 focus:ring-2 focus:ring-accent-blue sm:size-14"
                />
              ))}
            </div>
          </fieldset>

          {error && (
            <p className="mt-4 text-center text-base text-danger-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={buttonClassName({
              variant: "primary",
              className: "mt-6",
            })}
          >
            {loading ? "Confirmando…" : "Confirmar"}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="mt-4 w-full text-center text-base font-semibold text-accent-blue-soft disabled:text-text-light/40"
          >
            {resendCooldown > 0
              ? `Reenviar em ${resendCooldown}s`
              : "Reenviar código"}
          </button>

          <p className="mt-5 text-center text-base text-text-light/70">
            <Link
              to="/cadastro"
              className="font-semibold text-accent-blue-soft underline-offset-2 hover:underline"
            >
              Voltar ao cadastro
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SignUpVerifyCode;
