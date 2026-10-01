import { useCallback, useEffect, useState } from "react";
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
import EmptyState, {
  emptyStateActionClassName,
} from "../../components/EmptyState";
import { CourtFloor, courtFloorLabel } from "../../onboarding/mockStore";
import { useCompanyCapabilities } from "../../contexts/CompanyBrandingContext";
import ConfirmSheet from "../../components/ConfirmSheet";
import EditCourtSheet from "./EditCourtSheet";
import {
  resolveCompanyPortalStatus,
  resolveCourtPortalStatus,
} from "../../utils/portalVisibility";

/** Temporário: edição pós-onboarding fica oculta; dados vêm do fluxo /comecar. */
const SHOW_EDIT_COURT_DATA = false;
/** Temporário: novas quadras só no onboarding. */
const SHOW_ADD_COURT = false;

function formatFloorLabel(floor: string | null | undefined): string | null {
  if (!floor) return null;
  return courtFloorLabel(floor as CourtFloor) || floor;
}

function CourtVisibilityDetails({ court }: { court: IInfoCourt }) {
  const floor = formatFloorLabel(court.floor);
  const sports = court.sports.length > 0 ? court.sports.join(", ") : null;
  const structure = [
    court.isCovered === false ? "Descoberta" : "Coberta",
    court.isCanHaveNet ? "Pode ter rede" : "Sem rede",
  ].join(" · ");
  const price =
    court.price != null && Number.isFinite(court.price)
      ? `${formatCurrencyBRL(court.price)}/hora`
      : null;
  const rows = [
    ["Piso", floor],
    ["Esportes", sports],
    ["Estrutura", structure],
    ["Preço", price],
    ["No site agora", court.show ? "Sim" : "Não"],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <>
      <p>
        {court.show
          ? `${court.name} deixa de aparecer no site. A agenda e as reservas continuam.`
          : `${court.name} passa a aparecer no site. O cliente vê os horários livres.`}
      </p>
      <div className="-mx-5 mt-4 bg-master-light px-5 py-1 sm:-mx-6 sm:px-6">
        <p className="pb-1 pt-2.5 text-base font-semibold text-text-light">
          {court.name}
        </p>
        <dl>
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex min-h-11 items-center justify-between gap-4"
            >
              <dt>{label}</dt>
              <dd className="text-right font-semibold text-text-light">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}

function CourtCard({
  name,
  floorLabel,
  sportsLabel,
  price,
  show,
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
  portalOnSite?: boolean;
  portalReason?: string | null;
  coveredLabel?: string | null;
  toggling?: boolean;
  canMutate?: boolean;
  onToggleShow?: () => void;
  onEdit?: () => void;
}) {
  const meta = [
    floorLabel,
    sportsLabel,
    coveredLabel,
    price != null && Number.isFinite(price)
      ? `${formatCurrencyBRL(price)}/hora`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex min-h-14 items-center gap-3 rounded-xl bg-master-light px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-text-light">{name}</p>
        {meta ? (
          <p className="truncate text-base text-text-light">{meta}</p>
        ) : null}
        {portalReason && !portalOnSite ? (
          <p className="truncate text-base text-text-light">{portalReason}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {SHOW_EDIT_COURT_DATA && canMutate && onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="text-base text-text-light/55"
          >
            Editar
          </button>
        ) : null}
        {onToggleShow ? (
          <button
            type="button"
            disabled={toggling}
            onClick={onToggleShow}
            className="mpn-tap inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-master px-3.5 text-base font-semibold text-text-light transition hover:bg-text-light/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue disabled:cursor-not-allowed disabled:opacity-50"
          >
            {toggling ? "…" : show ? "Ocultar" : "Ativar"}
          </button>
        ) : null}
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
  const [addingCourt, setAddingCourt] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [pendingVisibility, setPendingVisibility] = useState<IInfoCourt | null>(
    null,
  );

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const payload = getAccessTokenPayload<{ companyPublicId?: string }>();
    setPublicId(payload?.companyPublicId || "");
  }, []);

  const loadCourts = useCallback(async () => {
    if (!publicId) return;
    setLoadError(false);
    await withLoading(async () => {
      try {
        const response = await infosByCompanyPublicId(publicId);
        setInfo(response);
        setLoadError(false);
      } catch (error) {
        setLoadError(true);
        console.error(error);
      }
    });
  }, [publicId, withLoading]);

  useEffect(() => {
    void loadCourts();
  }, [loadCourts]);

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
      setPendingVisibility(null);
    } catch (error) {
      console.error(error);
    } finally {
      setTogglingCourtId(null);
    }
  };

  const courts = info?.courts ?? [];
  const isInitialLoading = loading && !info && !loadError;
  const companyPortalStatus = resolveCompanyPortalStatus({
    isActive: info?.isActive,
    capabilities: caps.ready ? caps : info?.capabilities,
    courts,
  });
  const offSiteNeedsCourts =
    !companyPortalStatus.onSite &&
    (caps.portalEligible ?? true) &&
    courts.every((c) => !c.show);

  return (
    <AppLayout>
      <main className="mx-auto min-h-0 w-full max-w-6xl flex-1 overflow-y-auto bg-master px-3 pb-10 pt-4 text-text-light lg:px-8 lg:pt-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-text-light">
            Quadras
          </h1>
          <p className="mt-1 text-base leading-5 text-text-light">
            {offSiteNeedsCourts
              ? "Marque na agenda o que já está ocupado e ative a quadra."
              : "Ative no site as que quer divulgar."}
          </p>
          {SHOW_ADD_COURT && caps.canMutate && publicId ? (
            <button
              type="button"
              onClick={() => {
                setEditingCourt(null);
                setAddingCourt(true);
              }}
              className={buttonClassName({
                variant: "secondary",
                className: "mt-3",
              })}
            >
              Adicionar quadra
            </button>
          ) : null}
        </div>

        {isInitialLoading ? (
          <div
            className="mt-4 animate-pulse space-y-1.5"
            aria-label="Carregando quadras"
          >
            <div className="h-14 rounded-xl bg-master-light/70" />
            <div className="h-14 rounded-xl bg-master-light/70" />
          </div>
        ) : (
          <section className="mt-4">
            {loadError && !info ? (
              <EmptyState
                title="Não foi possível carregar as quadras."
                description="Tente de novo. Nada foi apagado."
                action={
                  <button
                    type="button"
                    onClick={() => void loadCourts()}
                    className={emptyStateActionClassName()}
                  >
                    Tentar de novo
                  </button>
                }
              />
            ) : courts.length === 0 ? (
              <EmptyState title="Nenhuma quadra cadastrada." />
            ) : (
              <ul className="space-y-1.5">
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
                      portalOnSite={courtPortal.onSite}
                      portalReason={
                        courtPortal.onSite ? null : courtPortal.reason
                      }
                      canMutate={caps.canMutate}
                      toggling={togglingCourtId === court.publicId}
                      onEdit={
                        SHOW_EDIT_COURT_DATA && caps.canMutate
                          ? () => setEditingCourt(court)
                          : undefined
                      }
                      onToggleShow={
                        caps.canMutate
                          ? () => setPendingVisibility(court)
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

      <ConfirmSheet
        isOpen={pendingVisibility != null}
        title={
          pendingVisibility?.show
            ? "Ocultar do site?"
            : "Ativar no site?"
        }
        description={
          pendingVisibility ? (
            <CourtVisibilityDetails court={pendingVisibility} />
          ) : (
            ""
          )
        }
        confirmLabel={
          pendingVisibility?.show ? "Ocultar quadra" : "Ativar quadra"
        }
        tone={pendingVisibility?.show ? "danger" : "primary"}
        loading={
          pendingVisibility != null &&
          togglingCourtId === pendingVisibility.publicId
        }
        onClose={() => {
          if (!togglingCourtId) setPendingVisibility(null);
        }}
        onConfirm={() => {
          if (!pendingVisibility) return;
          return handleToggleCourtVisibility(
            pendingVisibility.publicId,
            !pendingVisibility.show,
          );
        }}
      />

      <EditCourtSheet
        open={Boolean(editingCourt) || addingCourt}
        court={addingCourt ? null : editingCourt}
        companyPublicId={publicId}
        onClose={() => {
          setEditingCourt(null);
          setAddingCourt(false);
        }}
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
        onCreated={() => {
          setAddingCourt(false);
          void loadCourts();
        }}
      />
    </AppLayout>
  );
}

export default CourtsPage;
