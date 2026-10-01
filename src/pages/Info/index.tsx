import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import { MdClose, MdOutlinePhotoCamera } from "react-icons/md";
import { useLoading } from "../../hooks/useLoading";
import {
  deleteCompanyPhoto,
  IInfo,
  IInfoPhoto,
  infosByCompanyPublicId,
  updatePreferencesByCompanyPublicId,
  uploadCompanyLogo,
  uploadCompanyPhoto,
} from "../../api/companies";
import { formatCurrencyBRL } from "../../utils/formatCurrency";
import { formatDateToDDMMYYYY } from "../../utils/formatDateToDDMMYYYY";
import { useErrors } from "../../contexts/ErrorsContext";
import {
  getAccessToken,
  getAccessTokenPayload,
} from "../../utils/authCookie";
import { PageEyebrow } from "../../components/PageTitle";
import { formatPhoneMask } from "../../utils/formatPhone";
import { useCompanyBranding } from "../../contexts/CompanyBrandingContext";
import { useCompanyCapabilities } from "../../contexts/CompanyBrandingContext";
import {
  COMPANY_PHOTO_MAX_COUNT,
  IMAGE_UPLOAD_ACCEPT,
  IMAGE_UPLOAD_MAX_BYTES,
  imageUploadHint,
  imageUploadTooLargeMessage,
  isAllowedImageFile,
} from "../../utils/imageUpload";
import { MPN_PUBLIC_SITE_URL } from "../../constants/legal";
import EditCompanySection from "./EditCompanySection";
import { emptyStateActionClassName } from "../../components/EmptyState";
import { resolveCompanyPortalStatus } from "../../utils/portalVisibility";
import { billingNavLabel, billingNavPath } from "../../utils/billingNav";

function arenaPublicUrl(info: IInfo | null): string | null {
  if (!info) return null;
  if (info.slug) {
    return `${MPN_PUBLIC_SITE_URL}/encontre-onde-jogar/${info.slug}`;
  }
  return info.link || null;
}

function RealInfo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, withLoading } = useLoading();
  const { notifyError } = useErrors();
  const { setLogoUrl, setCompanyName: setBrandingCompanyName } =
    useCompanyBranding();
  const caps = useCompanyCapabilities();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [publicId, setPublicId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isHiddenInactiveHours, setIsHiddenInactiveHours] = useState(false);
  const [info, setInfo] = useState<IInfo | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [removingPhotoId, setRemovingPhotoId] = useState<number | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    if (location.hash === "#quadras") {
      navigate("/quadras", { replace: true });
    }
  }, [location.hash, navigate]);

  useEffect(() => {
    const payload = getAccessTokenPayload<{
      companyName?: string;
      companyPublicId?: string;
    }>();
    setPublicId(payload?.companyPublicId || "");
    setCompanyName(payload?.companyName || "");
  }, []);

  useEffect(() => {
    if (!publicId) return;
    withLoading(async () => {
      try {
        const response = await infosByCompanyPublicId(publicId);
        setInfo(response);
        setIsHiddenInactiveHours(
          response?.preferences?.isHiddenInactiveHours || false
        );
        if (response?.companyName) {
          setCompanyName(response.companyName);
          setBrandingCompanyName(response.companyName);
        }
        if (response?.logoUrl) {
          setLogoUrl(response.logoUrl);
        }
      } catch (error) {
        console.error("Erro ao buscar informações da empresa:", error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- evita loop com withLoading instável
  }, [publicId]);

  const updatePreferences = async (
    isHiddenInactiveHoursInput: boolean
  ): Promise<void> => {
    if (!publicId) {
      notifyError({
        message: "Informações da empresa não disponíveis.",
        type: "error",
      });
      return;
    }
    await withLoading(async () => {
      await updatePreferencesByCompanyPublicId(publicId, {
        isHiddenInactiveHours: isHiddenInactiveHoursInput,
      });
    });
  };

  const handleLogoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    // Logo: sempre 1 arquivo (input sem `multiple`).
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !publicId) return;

    if (!isAllowedImageFile(file)) {
      notifyError({
        message: "Use uma imagem JPG, PNG ou WebP.",
        type: "error",
      });
      return;
    }
    if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
      notifyError({
        message: imageUploadTooLargeMessage(),
        type: "error",
      });
      return;
    }

    setUploadingLogo(true);
    try {
      const { logoUrl } = await uploadCompanyLogo(publicId, file);
      setInfo((prev) => (prev ? { ...prev, logoUrl } : prev));
      setLogoUrl(logoUrl);
    } catch (error) {
      console.error(error);
      notifyError({
        message: "Não foi possível enviar o logo. Tente novamente.",
        type: "error",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const photos: IInfoPhoto[] = info?.photos ?? [];
  const photoSlotsLeft = COMPANY_PHOTO_MAX_COUNT - photos.length;
  const canAddPhoto = photoSlotsLeft > 0;

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!selected.length || !publicId) return;

    if (photoSlotsLeft <= 0) {
      notifyError({
        message: `Você já enviou ${COMPANY_PHOTO_MAX_COUNT} fotos. Remova uma para enviar outra.`,
        type: "error",
      });
      return;
    }

    if (selected.length > photoSlotsLeft) {
      notifyError({
        message:
          photoSlotsLeft === 1
            ? "Só resta 1 vaga. Selecione apenas 1 foto."
            : `Selecione no máximo ${photoSlotsLeft} fotos (limite de ${COMPANY_PHOTO_MAX_COUNT}).`,
        type: "error",
      });
      return;
    }

    const validFiles: File[] = [];
    for (const file of selected) {
      if (!isAllowedImageFile(file)) {
        notifyError({
          message: `"${file.name}" não é JPG, PNG ou WebP.`,
          type: "error",
        });
        continue;
      }
      if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
        notifyError({
          message: `${file.name}: ${imageUploadTooLargeMessage()}`,
          type: "error",
        });
        continue;
      }
      validFiles.push(file);
    }
    if (!validFiles.length) return;

    setUploadingPhoto(true);
    const uploaded: IInfoPhoto[] = [];
    try {
      for (const file of validFiles) {
        const photo = await uploadCompanyPhoto(publicId, file);
        uploaded.push(photo);
        setInfo((prev) =>
          prev
            ? {
                ...prev,
                photos: [...(prev.photos ?? []), photo].slice(
                  0,
                  COMPANY_PHOTO_MAX_COUNT
                ),
              }
            : prev
        );
      }
    } catch (error) {
      console.error(error);
      notifyError({
        message:
          uploaded.length > 0
            ? `Enviamos ${uploaded.length} foto${uploaded.length === 1 ? "" : "s"}, mas as demais falharam. Tente de novo.`
            : "Não foi possível enviar as fotos. Tente novamente.",
        type: "error",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async (imageId: number) => {
    if (!publicId) return;
    setRemovingPhotoId(imageId);
    try {
      await deleteCompanyPhoto(publicId, imageId);
      setInfo((prev) =>
        prev
          ? {
              ...prev,
              photos: (prev.photos ?? []).filter((p) => p.id !== imageId),
            }
          : prev
      );
    } catch (error) {
      console.error(error);
      notifyError({
        message: "Não foi possível remover a foto. Tente novamente.",
        type: "error",
      });
    } finally {
      setRemovingPhotoId(null);
    }
  };

  const isInitialLoading = loading && !info;
  const logoUrl = info?.logoUrl || null;
  const publicArenaUrl = arenaPublicUrl(info);
  const portalStatus = resolveCompanyPortalStatus({
    isActive: info?.isActive,
    capabilities: caps.ready ? caps : info?.capabilities,
    courts: info?.courts,
  });
  const arenaPublished = portalStatus.onSite;
  const offSiteNeedsCourts =
    !portalStatus.onSite &&
    (caps.portalEligible ?? true) &&
    !(info?.courts ?? []).some((c) => c.show);
  const offSiteNeedsPlan =
    !portalStatus.onSite && caps.ready && !caps.portalEligible;

  const copyArenaLink = async () => {
    if (!publicArenaUrl) return;
    try {
      await navigator.clipboard.writeText(publicArenaUrl);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      notifyError({
        message: "Não foi possível copiar. Selecione o link manualmente.",
        type: "error",
      });
    }
  };

  const entitlement = caps.ready
    ? caps.entitlement
    : info?.capabilities?.entitlement;

  return (
    <AppLayout>
      <section
        className={`mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto bg-master px-3 pb-10 pt-4 text-text-light transition-opacity lg:px-8 lg:pt-6 ${
          loading && info ? "opacity-80" : ""
        }`}
        aria-busy={loading}
      >
        <PageEyebrow>Minhas informações</PageEyebrow>

        {isInitialLoading ? (
          <div className="mt-6 animate-pulse space-y-6" aria-label="Carregando informações">
            <div className="h-6 w-48 rounded bg-master-light/70" />
            <div className="h-4 w-64 rounded bg-master-light/70" />
            <div className="grid grid-cols-3 gap-2">
              <div className="aspect-[4/3] rounded-xl bg-master-light/70" />
              <div className="aspect-[4/3] rounded-xl bg-master-light/70" />
              <div className="aspect-[4/3] rounded-xl bg-master-light/70" />
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            <div>
              <p className="text-xl font-semibold leading-7 text-text-light">
                {companyName || info?.companyName || "—"}
              </p>
              {info?.companyPhone ? (
                <p className="mt-1 text-base text-text-light/70">
                  {formatPhoneMask(info.companyPhone)}
                </p>
              ) : null}
              {caps.ready || info ? (
                <p className="mt-2 text-base leading-5 text-text-light/70">
                  <span
                    className={
                      portalStatus.onSite
                        ? "font-semibold text-accent-green"
                        : "font-semibold text-text-light"
                    }
                  >
                    {portalStatus.label}
                  </span>
                  {portalStatus.reason ? ` · ${portalStatus.reason}` : ""}
                </p>
              ) : null}
              {offSiteNeedsCourts || offSiteNeedsPlan ? (
                <div className="-ml-3 mt-1 flex flex-wrap">
                  {offSiteNeedsCourts ? (
                    <Link to="/quadras" className={emptyStateActionClassName()}>
                      Ativar no site
                    </Link>
                  ) : null}
                  {offSiteNeedsPlan ? (
                    <Link
                      to={billingNavPath(entitlement)}
                      className={emptyStateActionClassName()}
                    >
                      Ver {billingNavLabel(entitlement).toLowerCase()}
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>

            {publicArenaUrl ? (
              <div>
                <h3 className="text-base text-text-light/55">Link da quadra</h3>
                <a
                  href={publicArenaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all text-base text-accent-blue-soft underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
                >
                  {publicArenaUrl}
                </a>
                {arenaPublished ? (
                  <p className="mt-1 text-base leading-5 text-text-light/70">
                    Envie no WhatsApp ou Instagram. O cliente vê os horários
                    livres.
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => void copyArenaLink()}
                  className={emptyStateActionClassName("-ml-3 mt-1")}
                >
                  {linkCopied ? "Copiado" : "Copiar link"}
                </button>
              </div>
            ) : null}

            <div>
              <h3 className="text-base text-text-light/55">Imagens</h3>
              <p className="mt-1 text-base leading-5 text-text-light/70">
                Logo e fotos da página da arena. Até {COMPANY_PHOTO_MAX_COUNT}{" "}
                fotos.
              </p>
              <input
                ref={logoInputRef}
                type="file"
                accept={IMAGE_UPLOAD_ACCEPT}
                className="sr-only"
                onChange={handleLogoChange}
              />
              <input
                key={`photo-input-${photoSlotsLeft}`}
                ref={photoInputRef}
                type="file"
                accept={IMAGE_UPLOAD_ACCEPT}
                multiple={photoSlotsLeft > 1}
                className="sr-only"
                onChange={handlePhotoChange}
              />
              <ul className="mt-3 grid grid-cols-3 gap-2">
                <li>
                  <button
                    type="button"
                    disabled={uploadingLogo || !publicId}
                    onClick={() => logoInputRef.current?.click()}
                    aria-label={
                      logoUrl
                        ? "Alterar logo do estabelecimento"
                        : "Enviar logo do estabelecimento"
                    }
                    className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl bg-master-light transition hover:bg-text-light/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue disabled:opacity-60"
                  >
                    {logoUrl ? (
                      <img
                        key={logoUrl}
                        src={logoUrl}
                        alt=""
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <span className="flex flex-col items-center gap-1 text-text-light/55">
                        <MdOutlinePhotoCamera size={22} aria-hidden />
                        <span className="text-base">
                          {uploadingLogo ? "Enviando…" : "Logo"}
                        </span>
                      </span>
                    )}
                  </button>
                </li>
                {photos.map((photo) => (
                  <li
                    key={photo.id}
                    className="relative aspect-[4/3] overflow-hidden rounded-xl bg-master-light"
                  >
                    <img
                      src={photo.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      disabled={removingPhotoId === photo.id}
                      onClick={() => handleRemovePhoto(photo.id)}
                      aria-label="Remover foto"
                      className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-full bg-master/85 text-text-light transition hover:bg-master disabled:opacity-60"
                    >
                      <MdClose size={18} aria-hidden />
                    </button>
                  </li>
                ))}
                {canAddPhoto ? (
                  <li>
                    <button
                      type="button"
                      disabled={uploadingPhoto || !publicId}
                      onClick={() => photoInputRef.current?.click()}
                      aria-label={`Adicionar fotos do espaço (até ${photoSlotsLeft})`}
                      className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-xl bg-master-light text-text-light/55 transition hover:bg-text-light/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue disabled:opacity-60"
                    >
                      <MdOutlinePhotoCamera size={22} aria-hidden />
                      <span className="text-base">
                        {uploadingPhoto
                          ? "Enviando…"
                          : photoSlotsLeft === 1
                            ? "Foto"
                            : `Até ${photoSlotsLeft}`}
                      </span>
                    </button>
                  </li>
                ) : null}
              </ul>
              <p className="mt-2 text-base text-text-light/55">
                {imageUploadHint()} · {photos.length}/{COMPANY_PHOTO_MAX_COUNT}{" "}
                fotos
              </p>
            </div>

            {info ? (
              <EditCompanySection
                publicId={publicId}
                info={info}
                canMutate={caps.canMutate}
                onSaved={(partial) => {
                  setInfo((prev) => (prev ? { ...prev, ...partial } : prev));
                  if (partial.companyName) {
                    setCompanyName(partial.companyName);
                  }
                }}
              />
            ) : null}

            <div>
              <h3 className="text-base text-text-light/55">Preferências</h3>
              <label
                htmlFor="is-hidden-inactive-hours"
                aria-disabled={loading || undefined}
                className={`mt-2 flex min-h-12 items-center justify-between gap-3 rounded-xl px-1 ${
                  loading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                }`}
              >
                <span className="text-base text-text-light">
                  Ocultar horários inativos
                </span>
                <input
                  type="checkbox"
                  id="is-hidden-inactive-hours"
                  checked={isHiddenInactiveHours}
                  disabled={loading}
                  onChange={async (e) => {
                    const next = e.target.checked;
                    setIsHiddenInactiveHours(next);
                    await updatePreferences(next);
                  }}
                  className="size-5 shrink-0 accent-accent-blue disabled:cursor-not-allowed"
                />
              </label>
              <p className="px-1 text-base leading-5 text-text-light/70">
                A agenda mostra só disponíveis, reservados e fixos.
              </p>
            </div>

            {info?.owner?.name || info?.owner?.email || info?.owner?.phone ? (
              <div>
                <h3 className="text-base text-text-light/55">Meu contato</h3>
                <dl className="mt-2 space-y-3">
                  {info.owner?.name ? (
                    <div>
                      <dt className="text-base text-text-light/55">Nome</dt>
                      <dd className="text-base text-text-light">
                        {info.owner.name}
                      </dd>
                    </div>
                  ) : null}
                  {info.owner?.email ? (
                    <div>
                      <dt className="text-base text-text-light/55">E-mail</dt>
                      <dd className="break-all text-base text-text-light">
                        {info.owner.email}
                      </dd>
                    </div>
                  ) : null}
                  {info.owner?.phone ? (
                    <div>
                      <dt className="text-base text-text-light/55">Telefone</dt>
                      <dd className="text-base text-text-light">
                        {formatPhoneMask(info.owner.phone)}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            ) : null}

            <div>
              <h3 className="text-base text-text-light/55">Plano</h3>
              <p className="mt-2 text-base font-semibold text-text-light">
                {info?.plan?.name || "—"}
              </p>
              <dl className="mt-3 space-y-3">
                {info?.plan?.trialEndsAt ? (
                  <div>
                    <dt className="text-base text-text-light/55">
                      {info.plan.isTrial
                        ? "Teste até"
                        : "Teste encerrou em"}
                    </dt>
                    <dd className="text-base text-text-light">
                      {formatDateToDDMMYYYY(info.plan.trialEndsAt)}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-base text-text-light/55">Valor mensal</dt>
                  <dd className="text-base text-text-light">
                    {info?.plan?.price != null
                      ? `${formatCurrencyBRL(Number(info.plan.price))}/mês`
                      : "—"}
                  </dd>
                </div>
                {info?.plan?.day_due != null ? (
                  <div>
                    <dt className="text-base text-text-light/55">Vencimento</dt>
                    <dd className="text-base text-text-light">
                      Dia {info.plan.day_due} de cada mês
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
        )}
      </section>
    </AppLayout>
  );
}

function Info() {
  return <RealInfo />;
}

export default Info;
