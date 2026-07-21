import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdChevronLeft } from "react-icons/md";
import Input from "../../../components/Input";
import { buttonClassName } from "../../../components/Button";
import OnboardingFooter from "../../../components/OnboardingFooter";
import {
  getMockOnboarding,
  getOrCreateOnboardingDraft,
  updateMockOnboarding,
} from "../../../onboarding/mockStore";
import { getAccessToken } from "../../../utils/authCookie";

function OnboardingArena() {
  const navigate = useNavigate();
  const [arenaName, setArenaName] = useState("");
  const [courtCount, setCourtCount] = useState("1");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/");
      return;
    }
    const mock = getOrCreateOnboardingDraft();
    setArenaName(mock.arenaName);
    setCourtCount(String(mock.courtCount || 1));
  }, [navigate]);

  const courtCountNumber = Number.parseInt(courtCount, 10);
  const courtCountValid =
    Number.isInteger(courtCountNumber) &&
    courtCountNumber >= 1 &&
    courtCountNumber <= 20;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (!arenaName.trim()) {
      setFormError("Informe o nome da arena.");
      return;
    }
    if (!courtCountValid) {
      setFormError("Informe de 1 a 20 quadras.");
      return;
    }

    const current = getMockOnboarding();
    const nextCourts = (current?.courts ?? []).slice(0, courtCountNumber);

    updateMockOnboarding({
      arenaName: arenaName.trim(),
      courtCount: courtCountNumber,
      courts: nextCourts,
      isPublished: false,
    });
    navigate("/comecar");
  };

  return (
    <div className="min-h-dvh bg-master px-4 py-6 text-text-light">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-lg flex-col">
        <div className="-ml-2 flex items-center gap-1">
          <Link
            to="/comecar"
            aria-label="Voltar"
            className="mpn-tap flex size-11 shrink-0 items-center justify-center rounded-xl text-text-light/80"
          >
            <MdChevronLeft size={28} aria-hidden />
          </Link>
          <h1 className="min-w-0 truncate text-2xl font-bold tracking-tight">
            Estabelecimento
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-2xl bg-master-light p-5"
          noValidate
        >
          <Input
            name="arenaName"
            title="Nome da arena"
            placeholder="LR Sports"
            type="text"
            mode="dark"
            value={arenaName}
            onChange={(e) => {
              setArenaName(e.target.value);
              if (formError) setFormError("");
            }}
            required
            autoComplete="organization"
          />
          <Input
            name="courtCount"
            title="Quantas quadras?"
            placeholder="1"
            type="text"
            inputMode="numeric"
            mode="dark"
            value={courtCount}
            onChange={(e) => {
              setCourtCount(e.target.value.replace(/\D/g, "").slice(0, 2));
              if (formError) setFormError("");
            }}
            required
            className="mt-1"
            error={formError || undefined}
          />
          <p className="-mt-1 mb-2 text-sm text-text-light/55">
            Quantidade de espaços físicos (futsal, vôlei, society)
          </p>

          <button
            type="submit"
            className={buttonClassName({
              variant: "primary",
              className: "mt-4",
            })}
          >
            Salvar
          </button>
        </form>

        <OnboardingFooter />
      </div>
    </div>
  );
}

export default OnboardingArena;
