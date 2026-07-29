import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/Input";
import { buttonClassName } from "../../components/Button";
import { forgotPassword } from "../../api/auth";
import { getAccessToken } from "../../utils/authCookie";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function apiMessage(error: unknown, fallback: string): string {
  const raw = (error as AxiosError<{ message?: string | string[] }>)?.response
    ?.data?.message;
  if (Array.isArray(raw)) return raw.join(" ") || fallback;
  return (typeof raw === "string" && raw) || fallback;
}

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAccessToken()) {
      navigate("/reservas");
    }
  }, [navigate]);

  const canSubmit = Boolean(email.trim()) && !loading;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError("Informe um e-mail válido.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await forgotPassword(normalizedEmail);
      navigate("/esqueci-senha/redefinir", {
        state: { email: normalizedEmail },
      });
    } catch (err) {
      setError(apiMessage(err, "Não foi possível enviar o código. Tente de novo."));
    } finally {
      setLoading(false);
    }
  };

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
            Esqueci minha senha
          </h1>
          <p className="mt-2 text-base leading-6 text-text-light/70">
            Informe o e-mail da sua conta. Se ele estiver cadastrado, enviamos
            um código para redefinir a senha.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-master-light p-4 sm:p-6"
          noValidate
        >
          <Input
            name="email"
            title="E-mail"
            placeholder="seu@email.com"
            type="email"
            mode="dark"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
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
            disabled={!canSubmit}
            className={buttonClassName({
              variant: "primary",
              className: "mt-6",
            })}
          >
            {loading ? "Enviando…" : "Enviar código"}
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

export default ForgotPassword;
