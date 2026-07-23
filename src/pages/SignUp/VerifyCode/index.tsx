import { useEffect, useRef, useState } from "react";
import { AxiosError } from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { buttonClassName } from "../../../components/Button";
import Input from "../../../components/Input";
import { resendCode, verifyEmail } from "../../../api/auth";
import { getAccessToken } from "../../../utils/authCookie";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CODE_LENGTH = 6;

function apiMessage(error: unknown, fallback: string): string {
  return (
    (error as AxiosError<{ message?: string }>)?.response?.data?.message ||
    fallback
  );
}

function SignUpVerifyCode() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [requestingCode, setRequestingCode] = useState(false);
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
    // Preferir location.state (não colocar e-mail na query string)
    const stateEmail = (location.state as { email?: string } | null)?.email;
    const initialEmail = stateEmail?.trim().toLowerCase() || null;
    if (!initialEmail) {
      // Sem e-mail no state: usuário informa manualmente para novo código
      return;
    }
    setEmail(initialEmail);
    window.setTimeout(() => inputsRef.current[0]?.focus(), 50);
  }, [navigate, location.state]);

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

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !email) return;
    setLoading(true);
    setError("");
    try {
      await verifyEmail(email, code);
      navigate("/", {
        state: {
          signupOk: true,
          email,
        },
      });
    } catch (error) {
      setError(apiMessage(error, "Código inválido. Tente de novo."));
      setDigits(Array.from({ length: CODE_LENGTH }, () => ""));
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setError("");
    try {
      await resendCode(email);
      setDigits(Array.from({ length: CODE_LENGTH }, () => ""));
      setResendCooldown(30);
      inputsRef.current[0]?.focus();
    } catch (error) {
      setError(apiMessage(error, "Não foi possível reenviar o código."));
    }
  };

  const handleRequestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = emailInput.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError("Informe um e-mail válido.");
      return;
    }
    setRequestingCode(true);
    setError("");
    try {
      await resendCode(normalizedEmail);
      setEmail(normalizedEmail);
      setResendCooldown(30);
      window.setTimeout(() => inputsRef.current[0]?.focus(), 50);
    } catch (error) {
      setError(apiMessage(error, "Não foi possível enviar o código."));
    } finally {
      setRequestingCode(false);
    }
  };

  if (!email) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-master px-4 py-4 text-text-light sm:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,84,160,0.18),_transparent_55%)]" />

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
              Confirmar e-mail
            </h1>
            <p className="mt-1 text-base text-text-light/70">
              Informe seu e-mail para receber o código de confirmação.
            </p>
          </div>

          <form
            onSubmit={handleRequestCode}
            className="rounded-2xl bg-master-light p-4 sm:p-6"
            noValidate
          >
            <Input
              name="email"
              title="E-mail"
              placeholder="seu@email.com"
              type="email"
              mode="dark"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                if (error) setError("");
              }}
              required
              autoComplete="email"
              inputMode="email"
              enterKeyHint="go"
              error={error || undefined}
            />

            <button
              type="submit"
              disabled={!emailInput.trim() || requestingCode}
              className={buttonClassName({
                variant: "primary",
                className: "mt-6",
              })}
            >
              {requestingCode ? "Enviando…" : "Enviar código"}
            </button>

            <p className="mt-5 text-center text-base text-text-light/70">
              <Link
                to="/"
                className="font-semibold text-accent-blue-soft underline-offset-2 hover:underline"
              >
                Voltar para o login
              </Link>
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-master px-4 py-4 text-text-light sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,84,160,0.18),_transparent_55%)]" />

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
            Enviamos um código para {email}
          </p>
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
                  className="size-12 rounded-xl border-0 bg-master text-center text-2xl font-semibold text-text-light outline-none ring-1 ring-inset ring-text-light/15 focus:ring-2 focus:ring-accent-blue sm:size-14 clarity-mask"
                  data-clarity-mask="true"
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
