import Input from "../../components/Input";
import { useEffect, useMemo, useState } from "react";
import { changePassword } from "../../api/auth";
import { useNavigate } from "react-router-dom";
import { useLoading } from "../../hooks/useLoading";
import { MdOutlineInfo } from "react-icons/md";
import { useErrors } from "../../contexts/ErrorsContext";
import {
  getAccessToken,
} from "../../utils/authCookie";
import { buttonClassName } from "../../components/Button";
import {
  isValidPassword,
  PASSWORD_HINT,
  PASSWORD_REGEX,
} from "../../utils/passwordPolicy";

export default function ChangePassword() {
  const { loading, withLoading } = useLoading();
  const { notifyError } = useErrors();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touchedNew, setTouchedNew] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/");
    }
  }, [navigate]);

  const newPasswordError = useMemo(() => {
    if (!touchedNew || !newPassword) return undefined;
    if (!PASSWORD_REGEX.test(newPassword)) return PASSWORD_HINT;
    return undefined;
  }, [newPassword, touchedNew]);

  const confirmPasswordError = useMemo(() => {
    if (!touchedConfirm || !confirmPassword) return undefined;
    if (newPassword !== confirmPassword) return "As senhas não coincidem.";
    return undefined;
  }, [confirmPassword, newPassword, touchedConfirm]);

  const passwordValid = isValidPassword(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleChangePassword = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setSubmitError("");
    setTouchedNew(true);
    setTouchedConfirm(true);

    if (!passwordValid) {
      setSubmitError(PASSWORD_HINT);
      return;
    }
    if (!passwordsMatch) {
      setSubmitError("As senhas não coincidem.");
      return;
    }
    try {
      await withLoading(async () => {
        // Conta com senha padrão: API não exige currentPassword.
        await changePassword(newPassword);
        notifyError({
          message: "Senha alterada com sucesso!",
          type: "success",
        });
        navigate("/reservas");
      });
    } catch (error) {
      console.error("Erro ao alterar a senha:", error);
      const message =
        "Não foi possível alterar a senha. Tente novamente ou fale com a equipe da Marca Pra Nós.";
      setSubmitError(message);
      notifyError({ message, type: "error" });
    }
  };

  const canSubmit = passwordValid && passwordsMatch && !loading;

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
            Criar nova senha
          </h1>
          <p className="mt-2 text-base leading-6 text-text-light/70">
            Por segurança, defina uma nova senha para continuar.
          </p>
        </div>

        <form
          onSubmit={handleChangePassword}
          className={`rounded-2xl bg-master-light p-5 sm:p-6 transition-opacity ${
            loading ? "opacity-80" : ""
          }`}
          noValidate
          aria-busy={loading}
        >
          <div className="mb-5 flex items-start gap-2 rounded-xl bg-master px-3 py-3">
            <MdOutlineInfo
              size={20}
              className="mt-0.5 shrink-0 text-text-light/55"
              aria-hidden
            />
            <p className="text-base leading-6 text-text-light/70">
              {PASSWORD_HINT}
            </p>
          </div>

          <Input
            name="newPassword"
            title="Nova senha"
            placeholder="Digite a nova senha"
            type="password"
            required
            mode="dark"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (submitError) setSubmitError("");
            }}
            onBlur={() => setTouchedNew(true)}
            autoComplete="new-password"
            enterKeyHint="next"
            error={newPasswordError}
          />
          <Input
            name="confirmPassword"
            title="Confirmar senha"
            placeholder="Digite a senha novamente"
            type="password"
            required
            mode="dark"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (submitError) setSubmitError("");
            }}
            onBlur={() => setTouchedConfirm(true)}
            autoComplete="new-password"
            enterKeyHint="go"
            className="mt-4"
            error={confirmPasswordError || submitError || undefined}
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className={buttonClassName({
              variant: "primary",
              className: "mt-6",
            })}
          >
            {loading ? "Salvando…" : "Salvar senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
