import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/Input";
import { buttonClassName } from "../../components/Button";
import { formatPhoneMask, onlyPhoneDigits } from "../../utils/formatPhone";
import { formatCpfMask, onlyCpfDigits } from "../../utils/formatCpf";
import { signup } from "../../api/auth";
import { getAccessToken } from "../../utils/authCookie";
import {
  isValidPassword,
  PASSWORD_HINT,
} from "../../utils/passwordPolicy";

type FieldError =
  | "email"
  | "ownerName"
  | "ownerPhone"
  | "ownerCpf"
  | "password"
  | null;

function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerCpf, setOwnerCpf] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [errorField, setErrorField] = useState<FieldError>(null);
  const [loading, setLoading] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);

  useEffect(() => {
    if (getAccessToken()) {
      navigate("/reservas");
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

  const clearErrors = () => {
    if (formError) setFormError("");
    if (errorField) setErrorField(null);
  };

  const setFieldError = (field: FieldError, message: string) => {
    setErrorField(field);
    setFormError(message);
  };

  const canSubmit =
    Boolean(
      email.trim() &&
        ownerName.trim() &&
        phoneDigits.length === 11 &&
        cpfDigits.length === 11 &&
        passwordOk
    ) && !loading;

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

    if (cpfDigits.length !== 11) {
      setFieldError("ownerCpf", "Informe um CPF válido com 11 dígitos.");
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

    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      await signup({
        name: ownerName.trim(),
        email: normalizedEmail,
        phone: phoneDigits,
        cpf: cpfDigits,
        password,
      });
      navigate("/cadastro/codigo", { state: { email: normalizedEmail } });
    } catch (error) {
      const status = (error as AxiosError)?.response?.status;
      const raw =
        (error as AxiosError<{ message?: string | string[] }>)?.response?.data
          ?.message;
      const text = Array.isArray(raw)
        ? raw.join(" ")
        : String(raw || "");

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
        setFieldError(
          null,
          "Não foi possível criar a conta. Tente novamente.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (field: Exclude<FieldError, null>) =>
    errorField === field ? formError || undefined : undefined;
  const generalError = errorField === null && formError ? formError : undefined;

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
            Criar sua conta
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-master-light p-4 sm:p-6"
          noValidate
        >
          <Input
            name="ownerName"
            title="Seu nome"
            placeholder="João Silva"
            type="text"
            mode="dark"
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
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearErrors();
            }}
            required
            autoComplete="email"
            inputMode="email"
            enterKeyHint="next"
            className="mt-1"
            error={fieldError("email")}
          />
          <Input
            name="ownerPhone"
            title="Seu telefone"
            placeholder="(00) 90000-0000"
            type="tel"
            mode="dark"
            value={ownerPhone}
            onChange={(e) => {
              setOwnerPhone(formatPhoneMask(e.target.value));
              clearErrors();
            }}
            required
            autoComplete="tel"
            inputMode="tel"
            enterKeyHint="next"
            className="mt-1"
            error={fieldError("ownerPhone")}
          />
          <Input
            name="ownerCpf"
            title="Seu CPF"
            placeholder="000.000.000-00"
            type="text"
            mode="dark"
            value={ownerCpf}
            onChange={(e) => {
              setOwnerCpf(formatCpfMask(e.target.value));
              clearErrors();
            }}
            required
            autoComplete="off"
            inputMode="numeric"
            enterKeyHint="next"
            className="mt-1"
            error={fieldError("ownerCpf")}
          />
          <Input
            name="password"
            title="Senha"
            placeholder="Senha segura"
            type="password"
            mode="dark"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearErrors();
            }}
            onBlur={() => setTouchedPassword(true)}
            required
            autoComplete="new-password"
            enterKeyHint="go"
            className="mt-1"
            error={fieldError("password") || passwordPolicyError}
          />
          {!passwordPolicyError && errorField !== "password" && (
            <p className="-mt-1 mb-1 text-sm leading-5 text-text-light/55">
              {PASSWORD_HINT}
            </p>
          )}

          {generalError && (
            <p className="mt-2 text-base font-medium text-danger-400" role="alert">
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
      </div>
    </div>
  );
}

export default SignUp;
