import Input from "../../components/Input";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { changePassword } from "../../api/auth";
import { useNavigate } from "react-router-dom";
import { useLoading } from "../../hooks/useLoading";
import Loader from "../../components/Loader";

export default function ChangePassword() {
  const { loading, withLoading } = useLoading();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [companyPublicId, setCompanyPublicId] = useState("");

  useEffect(() => {
    const accessToken = Cookies.get("access_token") || "";
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        setCompanyPublicId(payload.companyPublicId || "");
      } catch (e) {
        setCompanyPublicId("");
      }
    }
  }, []);

  const handleChangePassword = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!newPassword || !passwordRegex.test(newPassword)) {
      return alert(
        "A senha deve ter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais."
      );
    }
    if (newPassword !== confirmPassword) {
      return alert("As senhas não coincidem");
    }
    try {
      withLoading(async () => {
        await changePassword(companyPublicId, newPassword);
        alert("Senha alterada com sucesso!");
        navigate("/reservas");
      });
    } catch (error) {
      console.error("Erro ao alterar a senha:", error);
      alert(
        "Ocorreu um erro ao alterar a senha. Tente novamente ou entre em contato com a equipe da Marca pra nósI."
      );
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col justify-center items-center justify-center h-screen bg-neutral-200">
      <img
        src={import.meta.env.VITE_LOGO_URL}
        className="w-1/4 md:w-1/12 mb-4"
      />
      <h1 className="text-neutral-700 text-md text-center mb-6">
        Bem-vindo ao sistema{" "}
        <span className="font-semibold">Marca Pra Nós</span>!<br />
        Para a sua segurança, crie uma nova senha para continuar.
      </h1>
      <p className="md:w-1/2 text-center text-neutral-800 mx-auto bg-orange-100 px-2">
        A senha deve ter pelo menos 8 caracteres, incluindo maiúsculas,
        minúsculas, números e caracteres especiais.
      </p>
      <form
        className="bg-neutral-200 p-4 rounded-md w-full max-w-md"
        onSubmit={handleChangePassword}
      >
        <h2 className="text-2xl font-bold text-center mb-2 text-neutral-700">
          Alterar Senha
        </h2>
        <Input
          name="newPassword"
          title="Nova Senha:"
          placeholder="Digite sua nova senha"
          type="password"
          required
          mode="light"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Input
          name="confirmPassword"
          title="Confirmar Nova Senha:"
          placeholder="Confirme sua nova senha"
          type="password"
          required
          mode="light"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-secondary-600 text-neutral-100 py-2 rounded mt-4 hover:bg-secondary-700 transition-colors"
        >
          Alterar Senha
        </button>
      </form>
    </div>
  );
}
