import { useNavigate } from "react-router";
import Button from "../../components/Button";
import Input from "../../components/Input";

function Login() {
  const navigate = useNavigate();
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate("/reservas");
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
        onSubmit={(event) => handleSubmit(event)}
      >
        <Input
          name="username"
          title="Usuário"
          placeholder="Digite seu usuário"
          type="text"
          mode="light"
        />
        <Input
          name="password"
          title="Senha"
          placeholder="Digite seu senha"
          type="password"
          mode="light"
        />
        <Button type="submit">Entrar</Button>
      </form>
    </div>
  );
}
export default Login;
