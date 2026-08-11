import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import { useLoading } from "../../hooks/useLoading";
import {
  IInfo,
  IInfoCourt,
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
import EditCourtSheet from "./EditCourtSheet";
import PortalStatusBanner from "../../components/PortalStatusBanner";
import {
  resolveCompanyPortalStatus,
  resolveCourtPortalStatus,
} from "../../utils/portalVisibility";

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
  portalLabel,
  portalOnSite,
  portalReason,
  coveredLabel,
  toggling,
  canMutate,
  onToggleShow,
  onEdit,
}: {
  name: string;
  floorLabel?: string | null;
  sportsLabel?: string | null;
  price?: number | null;
  show?: boolean;
  portalLabel?: string;
  portalOnSite?: boolean;
  portalReason?: string | null;
  coveredLabel?: string | null;
  toggling?: boolean;
  canMutate?: boolean;
  onToggleShow?: () => void;
  onEdit?: () => void;
}) {
  return (
    <li className="rounded-xl bg-master-light px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-lg font-semibold text-text-light">{name}</p>
        {portalLabel != null && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              portalOnSite
                ? "bg-accent-green/20 text-accent-green"
                : "bg-text-light/10 text-text-light/55"
            }`}
          >
            {portalLabel}
          </span>
        )}
      </div>
      {portalReason && !portalOnSite ? (
        <p className="mt-1.5 text-sm leading-snug text-text-light/55">
          {portalReason}
        </p>
      ) : null}
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
        {coveredLabel && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-text-light/55">Estrutura</dt>
            <dd className="text-text-light/80">{coveredLabel}</dd>
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
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {canMutate && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className={buttonClassName({
              variant: "secondary",
              size: "md",
              className: "sm:flex-1",
            })}
          >
            Editar dados
          </button>
        )}
        {onToggleShow && (
          <button
            type="button"
            disabled={toggling}
            onClick={onToggleShow}
            className={buttonClassName({
              variant: show ? "secondary" : "primary",
              size: "md",
              className: "sm:flex-1",
            })}
          >
            {toggling
              ? "Salvando…"
              : show
                ? "Ocultar do site"
                : "Ativar no site"}
          </button>
        )}
      </div>
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
  const [editingCourt, setEditingCourt] = useState<IInfoCourt | null>(null);

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
        console.error(error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicId]);

  const handleToggleCourtVisibility = async (
    courtPublicId: string,
    show: boolean,
  ) => {
    if (!info) return;
    setTogglingCourtId(courtPublicId);
    try {
      const result = await updateCourtVisibility(courtPublicId, show);
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
      notifyError({
        type: "success",
        message: show
          ? "Quadra ativada no site."
          : "Quadra oculta do site.",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setTogglingCourtId(null);
    }
  };

  const courts = info?.courts ?? [];
  const isInitialLoading = loading && !info;
  const companyPortalStatus = resolveCompanyPortalStatus({
    isActive: info?.isActive,
    capabilities: caps.ready ? caps : info?.capabilities,
    courts,
  });
  const offSiteNeedsCourts =
    !companyPortalStatus.onSite &&
    (caps.portalEligible ?? true) &&
    courts.every((c) => !c.show);
  const offSiteNeedsPlan =
    !companyPortalStatus.onSite && caps.ready && !caps.portalEligible;

  return (
    <AppLayout>
      <main className="mx-auto min-h-0 w-full max-w-lg flex-1 overflow-y-auto bg-master px-4 pb-10 pt-5 text-text-light lg:max-w-5xl lg:px-8 lg:pt-6">
        <div>
          <PageEyebrow className="mb-2">Minhas quadras</PageEyebrow>
          <p className="text-base leading-6 text-text-light/70">
            Ative no site as quadras que quer divulgar e edite nome, piso e
            esportes quando precisar.
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
            {(caps.ready || info) && (
              <PortalStatusBanner
                className="mb-3"
                status={companyPortalStatus}
                showActivateCourtsCta={false}
                showBillingCta={offSiteNeedsPlan}
                entitlement={
                  caps.ready
                    ? caps.entitlement
                    : info?.capabilities?.entitlement
                }
              />
            )}
            {offSiteNeedsCourts && (
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
                {courts.map((court) => {
                  const structureBits = [
                    court.isCovered === false ? "Descoberta" : "Coberta",
                    court.isCanHaveNet ? "com rede" : null,
                  ].filter(Boolean);
                  const courtPortal = resolveCourtPortalStatus({
                    show: court.show,
                    portalEligible: caps.ready
                      ? caps.portalEligible
                      : (info?.capabilities?.portalEligible ?? true),
                  });
                  return (
                    <CourtCard
                      key={court.publicId}
                      name={court.name}
                      floorLabel={formatFloorLabel(court.floor)}
                      sportsLabel={
                        court.sports.length > 0
                          ? court.sports.join(", ")
                          : null
                      }
                      coveredLabel={structureBits.join(" · ")}
                      price={court.price}
                      show={court.show}
                      portalLabel={courtPortal.label}
                      portalOnSite={courtPortal.onSite}
                      portalReason={
                        courtPortal.onSite ? null : courtPortal.reason
                      }
                      canMutate={caps.canMutate}
                      toggling={togglingCourtId === court.publicId}
                      onEdit={
                        caps.canMutate
                          ? () => setEditingCourt(court)
                          : undefined
                      }
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
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </main>

      <EditCourtSheet
        open={Boolean(editingCourt)}
        court={editingCourt}
        onClose={() => setEditingCourt(null)}
        onSaved={(next) => {
          setInfo((prev) =>
            prev
              ? {
                  ...prev,
                  courts: prev.courts.map((c) =>
                    c.publicId === next.publicId ? next : c,
                  ),
                }
              : prev,
          );
        }}
      />
    </AppLayout>
  );
}

export default CourtsPage;
