import { useNavigate } from "react-router";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const token = Cookies.get("access_token");
    if (token) {
      navigate("/reservas");
    }
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username || !password) {
      alert("Preencha usuário e senha.");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL_BASE}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login inválido");
      }

      const data = await response.json();
      Cookies.set("access_token", data.access_token, {
        secure: true,
        sameSite: "strict",
      });
      navigate("/reservas");
    } catch (error: any) {
      alert(error.message || "Usuário ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <img
        src={import.meta.env.VITE_LOGO_URL}
        className="w-1/2 md:w-1/4 mb-4"
      />
      <h1 className="text-neutral-800 text-lg mb-4">
        Entre com seu usuário e senha.
      </h1>
      <form
        className="flex flex-col w-full md:w-1/4 px-4"
        onSubmit={handleSubmit}
      >
        <Input
          name="username"
          title="Usuário"
          placeholder="Digite seu usuário"
          type="text"
          mode="light"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <Input
          name="password"
          title="Senha"
          placeholder="Digite seu senha"
          type="password"
          mode="light"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
export default Login;
