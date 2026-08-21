import { useCallback, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { jwtDecode } from "jwt-decode";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/Input";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import { buttonClassName } from "../../components/Button";
import { formatPhoneMask, onlyPhoneDigits } from "../../utils/formatPhone";
import {
  formatCpfMask,
  isValidCpf,
  onlyCpfDigits,
} from "../../utils/formatCpf";
import { googleAuth, signup } from "../../api/auth";
import { getAccessToken, setAccessToken } from "../../utils/authCookie";
import {
  isValidPassword,
  PASSWORD_HINT,
} from "../../utils/passwordPolicy";
import { MPN_PRIVACY_URL, MPN_TERMS_URL } from "../../constants/legal";
import { MPN_LOGO_URL } from "../../constants/brand";

type LoginTokenPayload = {
  updatedPassword?: boolean;
  companyPublicId?: string | null;
  termsAccepted?: boolean;
};

function routeAfterLogin(token: string): string {
  const payload = jwtDecode<LoginTokenPayload>(token);
  if (payload.termsAccepted === false) return "/cadastro/completar";
  if (payload.updatedPassword === false) return "/alterar-senha";
  return payload.companyPublicId ? "/reservas" : "/comecar";
}

type FieldError =
  | "email"
  | "ownerName"
  | "ownerPhone"
  | "ownerCpf"
  | "password"
  | "terms"
  | null;

function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerCpf, setOwnerCpf] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formError, setFormError] = useState("");
  const [errorField, setErrorField] = useState<FieldError>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [linkGoogleToken, setLinkGoogleToken] = useState<string | null>(null);
  const [linkPassword, setLinkPassword] = useState("");
  const [linkEmail, setLinkEmail] = useState("");
  const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim());

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      navigate(routeAfterLogin(token), { replace: true });
    }
  }, [navigate]);

  const phoneDigits = onlyPhoneDigits(ownerPhone);
  const cpfDigits = onlyCpfDigits(ownerCpf);
  const passwordOk = isValidPassword(password);
  const passwordPolicyError = useMemo(() => {
    if (!touchedPassword || !password) return undefined;
    if (!passwordOk) return PASSWORD_HINT;
    return undefined;
  }, [password, passwordOk, touchedPassword]);

  const clearErrors = useCallback(() => {
    setFormError("");
    setErrorField(null);
  }, []);

  const setFieldError = useCallback((field: FieldError, message: string) => {
    setErrorField(field);
    setFormError(message);
  }, []);

  const finishGoogleAuth = useCallback(
    (result: { access_token: string; needsProfileCompletion: boolean }) => {
      setAccessToken(result.access_token);
      navigate(routeAfterLogin(result.access_token), { replace: true });
    },
    [navigate],
  );

  const handleGoogleCredential = useCallback(
    async (idToken: string, linkPass?: string) => {
      clearErrors();
      setGoogleLoading(true);
      try {
        const result = await googleAuth({
          idToken,
          ...(linkPass ? { password: linkPass } : {}),
        });
        setLinkGoogleToken(null);
        setLinkPassword("");
        finishGoogleAuth(result);
      } catch (error) {
        const data = (error as AxiosError<{
          code?: string;
          email?: string;
          message?: string;
        }>)?.response?.data;

        if (data?.code === "GOOGLE_LINK_REQUIRED") {
          setLinkGoogleToken(idToken);
          setLinkEmail(data.email ?? "");
          setFieldError(
            null,
            data.message ||
              "Já existe uma conta com este e-mail. Informe a senha para vincular o Google.",
          );
          return;
        }

        const message =
          (typeof data?.message === "string" && data.message) ||
          "Não foi possível continuar com Google. Tente novamente.";
        setFieldError(null, message);
      } finally {
        setGoogleLoading(false);
      }
    },
    [clearErrors, finishGoogleAuth, setFieldError],
  );

  const canSubmit =
    Boolean(
      email.trim() &&
        ownerName.trim() &&
        phoneDigits.length === 11 &&
        isValidCpf(cpfDigits) &&
        passwordOk &&
        acceptedTerms,
    ) && !loading;

  const handleLinkSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!linkGoogleToken || !linkPassword) {
      setFieldError(null, "Informe a senha da conta para vincular o Google.");
      return;
    }
    await handleGoogleCredential(linkGoogleToken, linkPassword);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearErrors();
    setTouchedPassword(true);

    if (!ownerName.trim()) {
      setFieldError("ownerName", "Informe seu nome.");
      return;
    }

    if (!email.trim()) {
      setFieldError("email", "Informe um e-mail.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldError("email", "Informe um e-mail válido.");
      return;
    }

    if (phoneDigits.length !== 11) {
      setFieldError("ownerPhone", "Informe um celular com DDD (11 dígitos).");
      return;
    }

    if (!isValidCpf(cpfDigits)) {
      setFieldError(
        "ownerCpf",
        cpfDigits.length === 11
          ? "Informe um CPF válido."
          : "Informe um CPF válido com 11 dígitos.",
      );
      return;
    }

    if (!password) {
      setFieldError("password", "Informe uma senha.");
      return;
    }

    if (!passwordOk) {
      setFieldError("password", PASSWORD_HINT);
      return;
    }

    if (!acceptedTerms) {
      setFieldError(
        "terms",
        "Aceite os Termos de Uso e a Política de Privacidade para continuar.",
      );
      return;
    }

    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      await signup({
        name: ownerName.trim(),
        email: normalizedEmail,
        phone: phoneDigits,
        cpf: cpfDigits,
        password,
        acceptedTerms: true,
      });
      navigate("/cadastro/codigo", { state: { email: normalizedEmail } });
    } catch (error) {
      const status = (error as AxiosError)?.response?.status;
      const raw =
        (error as AxiosError<{ message?: string | string[] }>)?.response?.data
          ?.message;
      const text = Array.isArray(raw) ? raw.join(" ") : String(raw || "");

      if (status === 409 || /já existe|já cadastrad/i.test(text)) {
        setFieldError(
          "email",
          "Já existe uma conta com este e-mail. Faça login ou recupere o acesso.",
        );
      } else if (/cpf/i.test(text)) {
        setFieldError("ownerCpf", text);
      } else if (/should not exist|must be|valid/i.test(text)) {
        setFieldError(
          null,
          "Não foi possível criar a conta. Verifique os dados e tente novamente.",
        );
      } else if (text) {
        if (/e-?mail/i.test(text)) {
          setFieldError("email", text);
        } else {
          setFieldError(null, text);
        }
      } else {
        setFieldError(null, "Não foi possível criar a conta. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (field: Exclude<FieldError, null>) =>
    errorField === field ? formError || undefined : undefined;
  const generalError = errorField === null && formError ? formError : undefined;

  return (
    <div className="relative flex min-h-full flex-col items-center bg-master px-4 py-8 text-text-light sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,84,160,0.18),_transparent_55%)]" />

      <div className="relative z-10 my-auto w-full max-w-md sm:max-w-xl">
        <div className="mb-3 flex flex-col items-center text-center sm:mb-4">
          <div className="mb-2 flex w-24 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 sm:mb-3 sm:w-28 sm:rounded-2xl">
            <img
              src={MPN_LOGO_URL}
              alt="Marca Pra Nós"
              className="h-auto w-full object-contain"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-light sm:text-2xl">
            Criar sua conta
          </h1>
        </div>

        <div className="rounded-2xl bg-master-light p-4 sm:p-6">
          {googleEnabled && !linkGoogleToken && (
            <>
              <GoogleSignInButton
                onCredential={(token) => handleGoogleCredential(token)}
                disabled={loading || googleLoading}
                text="signup_with"
              />
              <div className="my-5 flex items-center gap-3 text-sm text-text-light/45">
                <div className="h-px flex-1 bg-text-light/15" />
                <span>ou</span>
                <div className="h-px flex-1 bg-text-light/15" />
              </div>
            </>
          )}

          {linkGoogleToken ? (
            <form onSubmit={handleLinkSubmit} noValidate>
              <p className="mb-3 text-sm leading-5 text-text-light/80">
                Já existe uma conta
                {linkEmail ? (
                  <>
                    {" "}
                    para <strong className="text-text-light">{linkEmail}</strong>
                  </>
                ) : null}
                . Informe a senha para vincular o Google.
              </p>
              <Input
                name="linkPassword"
                title="Senha da conta"
                placeholder="Sua senha"
                type="password"
                mode="dark"
                disabled={googleLoading}
                value={linkPassword}
                onChange={(e) => {
                  setLinkPassword(e.target.value);
                  clearErrors();
                }}
                required
                autoComplete="current-password"
                error={generalError}
              />
              <button
                type="submit"
                disabled={!linkPassword || googleLoading}
                className={buttonClassName({
                  variant: "primary",
                  className: "mt-4",
                })}
              >
                {googleLoading ? "Vinculando…" : "Vincular e continuar"}
              </button>
              <button
                type="button"
                disabled={googleLoading}
                className="mt-3 w-full text-center text-sm font-semibold text-accent-blue-soft underline-offset-2 hover:underline disabled:opacity-50"
                onClick={() => {
                  setLinkGoogleToken(null);
                  setLinkPassword("");
                  clearErrors();
                }}
              >
                Cancelar
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              aria-busy={loading || undefined}
            >
              <div className="sm:grid sm:grid-cols-2 sm:gap-x-3">
                <Input
                  name="ownerName"
                  title="Seu nome"
                  placeholder="João Silva"
                  type="text"
                  mode="dark"
                  disabled={loading || googleLoading}
                  value={ownerName}
                  onChange={(e) => {
                    setOwnerName(e.target.value);
                    clearErrors();
                  }}
                  required
                  autoComplete="name"
                  enterKeyHint="next"
                  error={fieldError("ownerName")}
                />
                <Input
                  name="email"
                  title="E-mail"
                  placeholder="seu@email.com"
                  type="email"
                  mode="dark"
                  disabled={loading || googleLoading}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearErrors();
                  }}
                  required
                  autoComplete="email"
                  inputMode="email"
                  enterKeyHint="next"
                  error={fieldError("email")}
                />
                <Input
                  name="ownerPhone"
                  title="Seu telefone"
                  placeholder="(00) 90000-0000"
                  type="tel"
                  mode="dark"
                  disabled={loading || googleLoading}
                  value={ownerPhone}
                  onChange={(e) => {
                    setOwnerPhone(formatPhoneMask(e.target.value));
                    clearErrors();
                  }}
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  enterKeyHint="next"
                  error={fieldError("ownerPhone")}
                />
                <Input
                  name="ownerCpf"
                  title="Seu CPF"
                  placeholder="000.000.000-00"
                  type="text"
                  mode="dark"
                  disabled={loading || googleLoading}
                  value={ownerCpf}
                  onChange={(e) => {
                    setOwnerCpf(formatCpfMask(e.target.value));
                    clearErrors();
                  }}
                  required
                  autoComplete="off"
                  inputMode="numeric"
                  enterKeyHint="next"
                  error={
                    fieldError("ownerCpf") ||
                    (ownerCpf &&
                    cpfDigits.length === 11 &&
                    !isValidCpf(cpfDigits)
                      ? "Informe um CPF válido."
                      : undefined)
                  }
                />
                <div className="sm:col-span-2">
                  <Input
                    name="password"
                    title="Senha"
                    placeholder="Senha segura"
                    type="password"
                    mode="dark"
                    disabled={loading || googleLoading}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearErrors();
                    }}
                    onBlur={() => setTouchedPassword(true)}
                    required
                    autoComplete="new-password"
                    enterKeyHint="go"
                    error={fieldError("password") || passwordPolicyError}
                  />
                  {!passwordPolicyError && errorField !== "password" && (
                    <p className="-mt-1 mb-1 text-sm leading-5 text-text-light/55">
                      {PASSWORD_HINT}
                    </p>
                  )}
                </div>
              </div>

              <label
                className={`mt-4 flex items-start gap-3 text-base leading-6 text-text-light/80 ${
                  loading || googleLoading
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer"
                }`}
              >
                <input
                  type="checkbox"
                  name="acceptedTerms"
                  checked={acceptedTerms}
                  disabled={loading || googleLoading}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    clearErrors();
                  }}
                  className="mt-0.5 size-4 shrink-0 rounded border-text-light/30 bg-master accent-accent-blue disabled:cursor-not-allowed"
                />
                <span>
                  Li e aceito os{" "}
                  <a
                    href={MPN_TERMS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-accent-blue-soft underline-offset-2 hover:underline"
                  >
                    Termos de Uso
                  </a>{" "}
                  e a{" "}
                  <a
                    href={MPN_PRIVACY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-accent-blue-soft underline-offset-2 hover:underline"
                  >
                    Política de Privacidade
                  </a>
                  .
                </span>
              </label>
              {errorField === "terms" && formError && (
                <p
                  className="mt-2 text-base font-medium text-danger-400"
                  role="alert"
                >
                  {formError}
                </p>
              )}

              {generalError && (
                <p
                  className="mt-2 text-base font-medium text-danger-400"
                  role="alert"
                >
                  {generalError}
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
                {loading ? "Enviando…" : "Continuar"}
              </button>

              <p className="mt-5 text-center text-base text-text-light/70">
                Já tem conta?{" "}
                <Link
                  to="/"
                  className="font-semibold text-accent-blue-soft underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
                >
                  Entrar
                </Link>
              </p>
            </form>
          )}
        </div>

        <nav
          className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-sm text-text-light/55"
          aria-label="Documentos legais"
        >
          <a
            href={MPN_PRIVACY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:text-text-light/70 hover:underline"
          >
            Privacidade
          </a>
          <a
            href={MPN_TERMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:text-text-light/70 hover:underline"
          >
            Termos de Uso
          </a>
        </nav>
      </div>
    </div>
  );
}

export default SignUp;
