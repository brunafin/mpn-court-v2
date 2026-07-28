import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import { useLoading } from "../../hooks/useLoading";
import {
  IInfo,
  infosByCompanyPublicId,
  updateCourtVisibility,
} from "../../api/companies";
import { formatCurrencyBRL } from "../../utils/formatCurrency";
import { useErrors } from "../../contexts/ErrorsContext";
import {
  getAccessToken,
  getAccessTokenPayload,
} from "../../utils/authCookie";
import { buttonClassName } from "../../components/Button";
import { PageEyebrow } from "../../components/PageTitle";
import { CourtFloor, courtFloorLabel } from "../../onboarding/mockStore";
import { useCompanyCapabilities } from "../../contexts/CompanyBrandingContext";

function formatFloorLabel(floor: string | null | undefined): string | null {
  if (!floor) return null;
  return courtFloorLabel(floor as CourtFloor) || floor;
}

function CourtCard({
  name,
  floorLabel,
  sportsLabel,
  price,
  show,
  toggling,
  onToggleShow,
}: {
  name: string;
  floorLabel?: string | null;
  sportsLabel?: string | null;
  price?: number | null;
  show?: boolean;
  toggling?: boolean;
  onToggleShow?: () => void;
}) {
  return (
    <li className="rounded-xl bg-master-light px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-lg font-semibold text-text-light">{name}</p>
        {show != null && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              show
                ? "bg-accent-green/20 text-accent-green"
                : "bg-text-light/10 text-text-light/55"
            }`}
          >
            {show ? "No site" : "Oculta"}
          </span>
        )}
      </div>
      <dl className="mt-2 space-y-1.5 text-base text-text-light/70">
        {floorLabel && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-text-light/55">Piso</dt>
            <dd className="text-text-light/80">{floorLabel}</dd>
          </div>
        )}
        {sportsLabel && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-text-light/55">Esportes</dt>
            <dd className="text-text-light/80">{sportsLabel}</dd>
          </div>
        )}
        {price != null && Number.isFinite(price) && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-text-light/55">Preço padrão</dt>
            <dd className="font-semibold text-text-light">
              {formatCurrencyBRL(price)}/hora
            </dd>
          </div>
        )}
      </dl>
      {onToggleShow && (
        <button
          type="button"
          disabled={toggling}
          onClick={onToggleShow}
          className={buttonClassName({
            variant: show ? "secondary" : "primary",
            size: "md",
            className: "mt-3",
          })}
        >
          {toggling
            ? "Salvando…"
            : show
              ? "Ocultar do site"
              : "Ativar no site"}
        </button>
      )}
    </li>
  );
}

function CourtsPage() {
  const navigate = useNavigate();
  const { loading, withLoading } = useLoading();
  const { notifyError } = useErrors();
  const caps = useCompanyCapabilities();
  const [publicId, setPublicId] = useState("");
  const [info, setInfo] = useState<IInfo | null>(null);
  const [togglingCourtId, setTogglingCourtId] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const payload = getAccessTokenPayload<{ companyPublicId?: string }>();
    setPublicId(payload?.companyPublicId || "");
  }, []);

  useEffect(() => {
    if (!publicId) return;
    withLoading(async () => {
      try {
        const response = await infosByCompanyPublicId(publicId);
        setInfo(response);
      } catch (error) {
        console.error("Erro ao buscar quadras:", error);
        notifyError({ message: "Não foi possível carregar as quadras." });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- evita loop com withLoading instável
  }, [publicId]);

  const handleToggleCourtVisibility = async (
    courtPublicId: string,
    nextShow: boolean,
  ) => {
    setTogglingCourtId(courtPublicId);
    try {
      const result = await updateCourtVisibility(courtPublicId, nextShow);
      setInfo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isActive: result.companyActive,
          courts: prev.courts.map((court) =>
            court.publicId === courtPublicId
              ? { ...court, show: result.show }
              : court,
          ),
        };
      });
    } catch {
      notifyError({
        message: "Não foi possível atualizar a visibilidade da quadra.",
      });
    } finally {
      setTogglingCourtId(null);
    }
  };

  const courts = info?.courts ?? [];
  const isInitialLoading = loading && !info;

  return (
    <AppLayout>
      <main
        className={`mx-auto min-h-0 w-full max-w-lg flex-1 overflow-y-auto bg-master px-4 pb-10 pt-5 text-text-light transition-opacity lg:max-w-5xl lg:px-8 lg:pt-6 ${
          loading && info ? "opacity-80" : ""
        }`}
        aria-busy={loading}
      >
        <div>
          <PageEyebrow>Quadras</PageEyebrow>
          <p className="mt-2 max-w-xl text-base leading-7 text-text-light/70">
            Gerencie quais quadras aparecem no site da Marca Pra Nós.
          </p>
        </div>

        {isInitialLoading ? (
          <div
            className="mt-5 animate-pulse space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0"
            aria-label="Carregando quadras"
          >
            <div className="h-36 rounded-2xl bg-master-light/70" />
            <div className="h-36 rounded-2xl bg-master-light/70" />
          </div>
        ) : (
          <section className="mt-5">
            {courts.length > 0 && courts.every((court) => !court.show) && (
              <p className="mb-3 rounded-lg bg-master-light px-3 py-2 text-sm leading-5 text-text-light/70">
                Cadastre na agenda o que já está ocupado e compartilhe só os
                horários livres no site.
              </p>
            )}
            {courts.length === 0 ? (
              <p className="rounded-2xl bg-master-light px-4 py-5 text-base text-text-light/65">
                Nenhuma quadra cadastrada.
              </p>
            ) : (
              <ul className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                {courts.map((court) => (
                  <CourtCard
                    key={court.publicId}
                    name={court.name}
                    floorLabel={formatFloorLabel(court.floor)}
                    sportsLabel={
                      court.sports.length > 0 ? court.sports.join(", ") : null
                    }
                    price={court.price}
                    show={court.show}
                    toggling={togglingCourtId === court.publicId}
                    onToggleShow={
                      caps.canMutate
                        ? () =>
                            handleToggleCourtVisibility(
                              court.publicId,
                              !court.show,
                            )
                        : undefined
                    }
                  />
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </AppLayout>
  );
}

export default CourtsPage;
