import { Link, useLocation, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { jwtDecode } from "jwt-decode";
import Input from "../../components/Input";
import { useEffect, useState } from "react";
import { login } from "../../api/auth";
import { getAccessToken, setAccessToken } from "../../utils/authCookie";
import { useErrors } from "../../contexts/ErrorsContext";
import { buttonClassName } from "../../components/Button";
import { MPN_PRIVACY_URL, MPN_TERMS_URL } from "../../constants/legal";
import { MPN_LOGO_URL } from "../../constants/brand";

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
  const passwordResetOk = Boolean(
    (location.state as { passwordResetOk?: boolean } | null)?.passwordResetOk
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
      const token =
        typeof response === "object" && response !== null
          ? (response as { access_token?: string }).access_token
          : undefined;
      if (!token) {
        throw new Error("EMPTY_TOKEN");
      }
      setAccessToken(token);
      navigate(routeAfterLogin(token));
    } catch (error) {
      const axiosError = error as AxiosError<{
        code?: string;
        email?: string;
        message?: string;
      }>;
      const data = axiosError?.response?.data;

      if (data?.code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(data.email ?? username.trim());
        return;
      }

      const isNetwork =
        axiosError?.code === "ERR_NETWORK" ||
        axiosError?.message === "Network Error" ||
        !axiosError?.response;
      const message =
        (error as Error)?.message === "EMPTY_TOKEN"
          ? "A API não retornou o token. Confirme que o mpn-api está no ar (porta 3001)."
          : isNetwork && !(error as AxiosError)?.response
            ? "Não foi possível conectar à API. Verifique se o mpn-api está rodando."
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
          <div className="mb-6 flex w-48 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 sm:w-56 sm:p-2.5">
            <img
              src={MPN_LOGO_URL}
              alt="Marca Pra Nós"
              className="h-auto w-full object-contain"
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
          {passwordResetOk && (
            <p className="mt-3 rounded-lg bg-accent-green/15 px-3 py-2 text-sm font-medium text-accent-green">
              Senha redefinida. Entre com a nova senha.
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

          <p className="mt-3 text-right text-base">
            <Link
              to="/esqueci-senha"
              className="font-semibold text-accent-blue-soft underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
            >
              Esqueci minha senha
            </Link>
          </p>

          <button
            type="submit"
            disabled={!canSubmit}
            className={buttonClassName({
              variant: "primary",
              className: "mt-4",
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

export default Login;
