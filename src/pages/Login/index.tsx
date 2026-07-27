import { Link, useLocation, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { jwtDecode } from "jwt-decode";
import Input from "../../components/Input";
import { useEffect, useState } from "react";
import { login } from "../../api/auth";
import { getAccessToken, setAccessToken } from "../../utils/authCookie";
import { useErrors } from "../../contexts/ErrorsContext";
import { buttonClassName } from "../../components/Button";

type LoginTokenPayload = {
  updatedPassword?: boolean;
  companyPublicId?: string | null;
};

function routeAfterLogin(token: string): string {
  const payload = jwtDecode<LoginTokenPayload>(token);
  if (payload.updatedPassword === false) return "/alterar-senha";
  return payload.companyPublicId ? "/reservas" : "/comecar";
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifyError } = useErrors();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const signupOk = Boolean(
    (location.state as { signupOk?: boolean } | null)?.signupOk
  );
  const signupEmail = (location.state as { email?: string } | null)?.email;

  useEffect(() => {
    if (signupEmail) setUsername(signupEmail);
  }, [signupEmail]);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      try {
        navigate(routeAfterLogin(token));
      } catch {
        // token inválido no cookie — permanece no login
      }
    }
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setUnverifiedEmail(null);
    if (!username || !password) {
      setFormError("Preencha usuário e senha.");
      return;
    }
    setLoading(true);

    try {
      const response = await login(username, password);
      const token = response?.access_token as string | undefined;
      if (!token) {
        throw new Error("EMPTY_TOKEN");
      }
      setAccessToken(token);
      navigate(routeAfterLogin(token));
    } catch (error) {
      const data = (
        error as AxiosError<{ code?: string; email?: string; message?: string }>
      )?.response?.data;

      if (data?.code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(data.email ?? username.trim());
        return;
      }

      const message =
        (error as Error)?.message === "EMPTY_TOKEN"
          ? "Login sem token. Verifique a API e tente novamente."
          : "Usuário ou senha inválidos.";
      setFormError(message);
      notifyError({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = Boolean(username.trim() && password) && !loading;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-master px-4 py-10 text-text-light">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,84,160,0.18),_transparent_55%)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6 flex size-28 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100 p-3 sm:size-32">
            <img
              src={import.meta.env.VITE_LOGO_URL}
              alt="Marca Pra Nós"
              className="size-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-light">
            Entrar
          </h1>
          <p className="mt-2 text-base leading-6 text-text-light/70">
            Acesse com seu e-mail e senha.
          </p>
          {signupOk && (
            <p className="mt-3 rounded-lg bg-accent-green/15 px-3 py-2 text-sm font-medium text-accent-green">
              Conta criada. Entre para configurar o estabelecimento.
            </p>
          )}
          {unverifiedEmail && (
            <div className="mt-3 rounded-lg bg-accent-blue/15 px-3 py-2 text-sm text-text-light">
              <p className="font-medium">
                Confirme seu e-mail antes de entrar.
              </p>
              <button
                type="button"
                onClick={() =>
                  navigate("/cadastro/codigo", {
                    state: { email: unverifiedEmail },
                  })
                }
                className="mt-1 font-semibold text-accent-blue-soft underline-offset-2 hover:underline"
              >
                Confirmar e-mail / reenviar código
              </button>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-master-light p-5 sm:p-6"
          noValidate
        >
          <Input
            name="username"
            title="E-mail ou usuário"
            placeholder="seu@email.com"
            type="text"
            mode="dark"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (formError) setFormError("");
            }}
            required
            autoComplete="username"
            enterKeyHint="next"
            error={formError || undefined}
          />
          <Input
            name="password"
            title="Senha"
            placeholder="Sua senha"
            type="password"
            mode="dark"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (formError) setFormError("");
            }}
            required
            autoComplete="current-password"
            enterKeyHint="go"
            className="mt-1"
          />

          <button
            type="submit"
            disabled={!canSubmit}
            className={buttonClassName({
              variant: "primary",
              className: "mt-6",
            })}
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>

          <p className="mt-5 text-center text-base text-text-light/70">
            Não tem conta?{" "}
            <Link
              to="/cadastro"
              className="font-semibold text-accent-blue-soft underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
            >
              Cadastrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
