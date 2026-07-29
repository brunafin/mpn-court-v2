import { useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Input from "../../../components/Input";
import { buttonClassName } from "../../../components/Button";
import { forgotPassword, resetPassword } from "../../../api/auth";
import { getAccessToken } from "../../../utils/authCookie";
import {
  isValidPassword,
  PASSWORD_HINT,
} from "../../../utils/passwordPolicy";

const CODE_LENGTH = 6;

function apiMessage(error: unknown, fallback: string): string {
  const raw = (error as AxiosError<{ message?: string | string[] }>)?.response
    ?.data?.message;
  if (Array.isArray(raw)) return raw.join(" ") || fallback;
  return (typeof raw === "string" && raw) || fallback;
}

function ForgotPasswordReset() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState<string | null>(null);
  const [digits, setDigits] = useState<string[]>(
    Array.from({ length: CODE_LENGTH }, () => ""),
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (getAccessToken()) {
      navigate("/reservas");
      return;
    }
    const stateEmail = (location.state as { email?: string } | null)?.email;
    const initialEmail = stateEmail?.trim().toLowerCase() || null;
    if (!initialEmail) {
      navigate("/esqueci-senha", { replace: true });
      return;
    }
    setEmail(initialEmail);
    window.setTimeout(() => inputsRef.current[0]?.focus(), 50);
  }, [navigate, location.state]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(
      () => setResendCooldown((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const code = digits.join("");
  const passwordOk = isValidPassword(newPassword);
  const passwordsMatch =
    newPassword === confirmPassword && confirmPassword.length > 0;

  const passwordPolicyError = useMemo(() => {
    if (!touchedPassword || !newPassword) return undefined;
    if (!passwordOk) return PASSWORD_HINT;
    return undefined;
  }, [newPassword, passwordOk, touchedPassword]);

  const confirmError = useMemo(() => {
    if (!touchedConfirm || !confirmPassword) return undefined;
    if (newPassword !== confirmPassword) return "As senhas não coincidem.";
    return undefined;
  }, [confirmPassword, newPassword, touchedConfirm]);

  const canSubmit =
    code.length === CODE_LENGTH &&
    passwordOk &&
    passwordsMatch &&
    !loading &&
    Boolean(email);

  const applyCode = (value: string) => {
    const next = value.replace(/\D/g, "").slice(0, CODE_LENGTH).split("");
    const filled = Array.from(
      { length: CODE_LENGTH },
      (_, i) => next[i] || "",
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
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    applyCode(event.clipboardData.getData("text"));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) return;
    setTouchedPassword(true);
    setTouchedConfirm(true);
    if (!canSubmit) return;

    setLoading(true);
    setError("");
    try {
      await resetPassword({
        email,
        code,
        newPassword,
      });
      navigate("/", {
        state: {
          passwordResetOk: true,
          email,
        },
      });
    } catch (err) {
      setError(apiMessage(err, "Não foi possível redefinir a senha."));
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
      await forgotPassword(email);
      setDigits(Array.from({ length: CODE_LENGTH }, () => ""));
      setResendCooldown(30);
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(apiMessage(err, "Não foi possível reenviar o código."));
    }
  };

  if (!email) return null;

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
            Nova senha
          </h1>
          <p className="mt-2 text-base leading-6 text-text-light/70">
            Digite o código enviado para {email} e escolha uma nova senha.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-master-light p-4 sm:p-6"
          noValidate
        >
          <fieldset>
            <legend className="mb-2 text-base font-medium text-text-light">
              Código
            </legend>
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

          <Input
            name="newPassword"
            title="Nova senha"
            placeholder="Senha segura"
            type="password"
            mode="dark"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (error) setError("");
            }}
            onBlur={() => setTouchedPassword(true)}
            required
            autoComplete="new-password"
            enterKeyHint="next"
            className="mt-4"
            error={passwordPolicyError}
          />
          {!passwordPolicyError && (
            <p className="-mt-1 mb-1 text-sm leading-5 text-text-light/55">
              {PASSWORD_HINT}
            </p>
          )}

          <Input
            name="confirmPassword"
            title="Confirmar senha"
            placeholder="Repita a senha"
            type="password"
            mode="dark"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError("");
            }}
            onBlur={() => setTouchedConfirm(true)}
            required
            autoComplete="new-password"
            enterKeyHint="go"
            className="mt-1"
            error={confirmError}
          />

          {error && (
            <p className="mt-3 text-base font-medium text-danger-400" role="alert">
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
            {loading ? "Salvando…" : "Redefinir senha"}
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

export default ForgotPasswordReset;
