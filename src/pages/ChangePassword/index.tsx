import Input from "../../components/Input";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { changePassword } from "../../api/auth";
import { useNavigate } from "react-router-dom";

export default function ChangePassword() {
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
      await changePassword(companyPublicId, newPassword);
      alert("Senha alterada com sucesso!");
      navigate("/reservas");
    } catch (error) {
      console.error("Erro ao alterar a senha:", error);
      alert(
        "Ocorreu um erro ao alterar a senha. Tente novamente ou entre em contato com a equipe da Marca pra nósI."
      );
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-neutral-900">
      <form
        className="bg-neutral-800 px-4 py-8 rounded-md w-full max-w-md"
        onSubmit={handleChangePassword}
      >
        <h1 className="text-2xl font-bold text-center mb-6 text-neutral-100">
          Alterar Senha
        </h1>
        <p className="text-neutral-200 text-center mb-6">
          Bem-vindo ao painel administrativo da{" "}
          <span className="font-semibold">Marca Pra Nós</span>!<br />
          Por favor, altere sua senha para continuar.
        </p>
        <Input
          name="newPassword"
          title="Nova Senha:"
          placeholder="Digite sua nova senha"
          type="password"
          required
          mode="dark"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Input
          name="confirmPassword"
          title="Confirmar Nova Senha:"
          placeholder="Confirme sua nova senha"
          type="password"
          required
          mode="dark"
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
