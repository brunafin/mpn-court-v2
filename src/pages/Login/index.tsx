import { useNavigate } from "react-router";
import Input from "../../components/Input";
import { useEffect, useState } from "react";
import { login } from "../../api/auth";
import { getAccessToken, setAccessToken } from "../../utils/authCookie";
import { useErrors } from "../../contexts/ErrorsContext";
import { buttonClassName } from "../../components/Button";

function Login() {
  const navigate = useNavigate();
  const { notifyError } = useErrors();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      navigate("/reservas");
    }
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    if (!username || !password) {
      setFormError("Preencha usuário e senha.");
      return;
    }
    setLoading(true);

    try {
      const response = await login(username, password);
      setAccessToken(response.access_token);
      const tokenPayload = JSON.parse(
        atob(response.access_token.split(".")[1])
      );
      if (tokenPayload.updatedPassword) {
        navigate("/reservas");
      } else {
        navigate("/alterar-senha");
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Usuário ou senha inválidos.";
      setFormError(message);
      notifyError({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = Boolean(username.trim() && password) && !loading;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-master px-4 py-10 text-text-light">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(61,111,184,0.18),_transparent_55%)]" />

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
            Use seu usuário e senha para acessar as reservas.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-master-light p-5 sm:p-6"
          noValidate
        >
          <Input
            name="username"
            title="Usuário"
            placeholder="Digite seu usuário"
            type="text"
            mode="dark"
            value={username}
            onChange={(e) => {
              const value = e.target.value
                .replace(/\s/g, "")
                .replace(/[A-Z]/g, (c) => c.toLowerCase())
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
              setUsername(value);
            }}
            required
            autoComplete="username"
            autoCapitalize="none"
            enterKeyHint="next"
          />
          <Input
            name="password"
            title="Senha"
            placeholder="Digite sua senha"
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
            className="mt-4"
            error={formError || undefined}
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className={buttonClassName({ variant: "primary", className: "mt-6" })}
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
