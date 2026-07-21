import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/Input";
import { buttonClassName } from "../../components/Button";
import { formatPhoneMask, onlyPhoneDigits } from "../../utils/formatPhone";
import { signup } from "../../api/auth";
import { getAccessToken } from "../../utils/authCookie";
import {
  isValidPassword,
  PASSWORD_HINT,
} from "../../utils/passwordPolicy";

function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);

  useEffect(() => {
    if (getAccessToken()) {
      navigate("/reservas");
    }
  }, [navigate]);

  const phoneDigits = onlyPhoneDigits(ownerPhone);
  const passwordOk = isValidPassword(password);
  const passwordError = useMemo(() => {
    if (!touchedPassword || !password) return undefined;
    if (!passwordOk) return PASSWORD_HINT;
    return undefined;
  }, [password, passwordOk, touchedPassword]);

  const canSubmit =
    Boolean(
      email.trim() &&
        ownerName.trim() &&
        phoneDigits.length === 11 &&
        passwordOk
    ) && !loading;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setTouchedPassword(true);

    if (!email.trim() || !ownerName.trim() || !password) {
      setFormError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError("Informe um e-mail válido.");
      return;
    }

    if (phoneDigits.length !== 11) {
      setFormError("Informe um celular com DDD (11 dígitos).");
      return;
    }

    if (!passwordOk) {
      setFormError(PASSWORD_HINT);
      return;
    }

    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      await signup({
        name: ownerName.trim(),
        email: normalizedEmail,
        phone: phoneDigits,
        password,
      });
      navigate("/cadastro/codigo", { state: { email: normalizedEmail } });
    } catch (error) {
      const message =
        (error as AxiosError<{ message?: string }>)?.response?.data?.message ||
        "Não foi possível criar a conta. Tente novamente.";
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

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
              if (formError) setFormError("");
            }}
            required
            autoComplete="name"
            enterKeyHint="next"
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
              if (formError) setFormError("");
            }}
            required
            autoComplete="email"
            inputMode="email"
            enterKeyHint="next"
            className="mt-1"
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
              if (formError) setFormError("");
            }}
            required
            autoComplete="tel"
            inputMode="tel"
            enterKeyHint="next"
            className="mt-1"
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
              if (formError) setFormError("");
            }}
            onBlur={() => setTouchedPassword(true)}
            required
            autoComplete="new-password"
            enterKeyHint="go"
            className="mt-1"
            error={passwordError || formError || undefined}
          />
          {!passwordError && !formError && (
            <p className="-mt-1 mb-1 text-sm leading-5 text-text-light/55">
              {PASSWORD_HINT}
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
