import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import { MdClose, MdOutlineInfo, MdOutlinePhotoCamera } from "react-icons/md";
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
import { buttonClassName } from "../../components/Button";
import { PageEyebrow } from "../../components/PageTitle";
import { formatPhoneMask } from "../../utils/formatPhone";
import { useCompanyBranding } from "../../contexts/CompanyBrandingContext";

function RealInfo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, withLoading } = useLoading();
  const { notifyError } = useErrors();
  const { setLogoUrl, setCompanyName: setBrandingCompanyName } =
    useCompanyBranding();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [publicId, setPublicId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isHiddenInactiveHours, setIsHiddenInactiveHours] = useState(false);
  const [info, setInfo] = useState<IInfo | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [removingPhotoId, setRemovingPhotoId] = useState<number | null>(null);

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
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !publicId) return;

    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      notifyError({
        message: "Use uma imagem JPG, PNG ou WebP.",
        type: "error",
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      notifyError({
        message: "A imagem deve ter no máximo 2 MB.",
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
  const canAddPhoto = photos.length < 3;

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !publicId) return;

    if (!canAddPhoto) {
      notifyError({
        message: "Você já enviou 3 fotos. Remova uma para enviar outra.",
        type: "error",
      });
      return;
    }
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      notifyError({
        message: "Use uma imagem JPG, PNG ou WebP.",
        type: "error",
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      notifyError({
        message: "A imagem deve ter no máximo 2 MB.",
        type: "error",
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      const photo = await uploadCompanyPhoto(publicId, file);
      setInfo((prev) =>
        prev
          ? { ...prev, photos: [...(prev.photos ?? []), photo].slice(0, 3) }
          : prev
      );
    } catch (error) {
      console.error(error);
      notifyError({
        message: "Não foi possível enviar a foto. Tente novamente.",
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

  return (
    <AppLayout>
      <section
        className={`mx-auto min-h-0 w-full max-w-lg flex-1 overflow-y-auto bg-master px-4 pb-10 pt-5 text-text-light transition-opacity lg:max-w-5xl lg:px-8 lg:pt-6 ${
          loading && info ? "opacity-80" : ""
        }`}
        aria-busy={loading}
      >
        <PageEyebrow className="mb-5">Minhas informações</PageEyebrow>

        {isInitialLoading ? (
          <div
            className="animate-pulse space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0"
            aria-label="Carregando informações"
          >
            <div className="h-28 rounded-2xl bg-master-light/70 lg:col-span-2" />
            <div className="h-48 rounded-2xl bg-master-light/70 lg:col-span-2" />
            <div className="h-36 rounded-2xl bg-master-light/70" />
            <div className="h-32 rounded-2xl bg-master-light/70" />
          </div>
        ) : (
          <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            <div className="rounded-2xl bg-master-light px-4 py-5 lg:col-span-2 lg:px-6">
              <p className="text-base font-medium text-text-light/70">
                Estabelecimento
              </p>
              <div className="mt-3 min-w-0">
                <p className="text-2xl font-bold leading-snug text-text-light">
                  {companyName || info?.companyName || "—"}
                </p>
                {info?.companyPhone && (
                  <p className="mt-2 text-base text-text-light/70">
                    {formatPhoneMask(info.companyPhone)}
                  </p>
                )}

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handleLogoChange}
                />
                <button
                  type="button"
                  disabled={uploadingLogo || !publicId}
                  onClick={() => logoInputRef.current?.click()}
                  aria-label={
                    logoUrl
                      ? "Alterar logo do estabelecimento"
                      : "Enviar logo do estabelecimento"
                  }
                  className="group relative mt-4 flex min-h-40 w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed border-text-light/20 bg-master/40 px-4 py-6 transition hover:border-accent-blue/50 hover:bg-master/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue disabled:opacity-60"
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={`Logo de ${companyName || info?.companyName || "estabelecimento"}`}
                      className="max-h-28 max-w-[min(100%,12rem)] object-contain"
                    />
                  ) : (
                    <MdOutlinePhotoCamera
                      size={40}
                      className="text-text-light/40"
                      aria-hidden
                    />
                  )}
                  <span className="text-center text-sm leading-5 text-text-light/60">
                    {uploadingLogo
                      ? "Enviando…"
                      : logoUrl
                        ? "Clique para alterar o logo"
                        : "Clique para enviar o logo"}
                    {!uploadingLogo && (
                      <>
                        <br />
                        JPG, PNG ou WebP · até 2 MB
                      </>
                    )}
                  </span>
                </button>

                <div className="mt-6 border-t border-text-light/10 pt-5">
                  <p className="text-base font-semibold text-text-light">
                    Fotos do espaço
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-text-light/60">
                    Até 3 fotos do espaço — aparecem na página da sua arena no
                    site.
                  </p>

                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={handlePhotoChange}
                  />

                  <ul className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                    {photos.map((photo) => (
                      <li
                        key={photo.id}
                        className="relative aspect-[4/3] overflow-hidden rounded-xl bg-master"
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
                          className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-full bg-master/85 text-text-light shadow-sm transition hover:bg-master disabled:opacity-60"
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
                          aria-label="Adicionar foto do espaço"
                          className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-text-light/20 bg-master/40 px-2 text-center transition hover:border-accent-blue/50 hover:bg-master/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue disabled:opacity-60"
                        >
                          <MdOutlinePhotoCamera
                            size={28}
                            className="text-text-light/40"
                            aria-hidden
                          />
                          <span className="text-xs leading-4 text-text-light/55">
                            {uploadingPhoto ? "Enviando…" : "Adicionar"}
                          </span>
                        </button>
                      </li>
                    ) : null}
                  </ul>
                  <p className="mt-2 text-xs text-text-light/45">
                    JPG, PNG ou WebP · até 2 MB cada · {photos.length}/3
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-master-light p-4 sm:p-5 lg:col-span-2 lg:p-6">
              <p className="mb-3 text-lg font-semibold text-text-light">
                Preferências
              </p>
              <label
                htmlFor="is-hidden-inactive-hours"
                className={`flex min-h-16 cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-3.5 transition focus-within:ring-2 focus-within:ring-accent-blue/80 ${
                  isHiddenInactiveHours
                    ? "bg-accent-blue/15 ring-2 ring-accent-blue/70"
                    : "bg-master"
                }`}
              >
                <span className="text-lg font-medium text-text-light">
                  Ocultar horários inativos
                </span>
                <input
                  type="checkbox"
                  id="is-hidden-inactive-hours"
                  checked={isHiddenInactiveHours}
                  onChange={async (e) => {
                    const next = e.target.checked;
                    setIsHiddenInactiveHours(next);
                    await updatePreferences(next);
                  }}
                  className="size-7 shrink-0 rounded accent-accent-blue"
                />
              </label>
              <div className="mt-3 flex items-start gap-2 px-1">
                <MdOutlineInfo
                  size={20}
                  className="mt-0.5 shrink-0 text-text-light/55"
                  aria-hidden
                />
                <p className="text-base leading-6 text-text-light/65">
                  Na agenda, mostram só horários disponíveis, reservados e
                  fixos.
                </p>
              </div>
            </div>

            {(info?.owner?.name ||
              info?.owner?.email ||
              info?.owner?.phone) && (
              <div className="rounded-2xl bg-master-light p-4 sm:p-5 lg:col-span-2 lg:p-6">
                <p className="mb-3 text-lg font-semibold text-text-light">
                  Meu contato
                </p>
                <dl className="space-y-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0">
                  {info.owner?.name && (
                    <div>
                      <dt className="text-base font-medium text-text-light/55">
                        Nome
                      </dt>
                      <dd className="mt-0.5 text-lg font-semibold text-text-light">
                        {info.owner.name}
                      </dd>
                    </div>
                  )}
                  {info.owner?.email && (
                    <div>
                      <dt className="text-base font-medium text-text-light/55">
                        E-mail
                      </dt>
                      <dd className="mt-0.5 break-all text-lg font-semibold text-text-light">
                        {info.owner.email}
                      </dd>
                    </div>
                  )}
                  {info.owner?.phone && (
                    <div>
                      <dt className="text-base font-medium text-text-light/55">
                        Telefone
                      </dt>
                      <dd className="mt-0.5 text-lg font-semibold text-text-light">
                        {formatPhoneMask(info.owner.phone)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            <div className="rounded-2xl bg-master-light p-4 sm:p-5 lg:col-span-2 lg:p-6">
              <p className="mb-3 text-lg font-semibold text-text-light">
                Plano
              </p>
              <p className="text-xl font-bold text-text-light">
                {info?.plan?.name || "—"}
              </p>
              <dl className="mt-4 space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                {info?.plan?.trialEndsAt ? (
                  <div>
                    <dt className="text-base font-medium text-text-light/70">
                      {info.plan.isTrial
                        ? "Período de teste até"
                        : "Período de teste encerrou em"}
                    </dt>
                    <dd className="mt-0.5 text-lg font-semibold text-text-light">
                      {formatDateToDDMMYYYY(info.plan.trialEndsAt)}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-base font-medium text-text-light/70">
                    Valor mensal
                  </dt>
                  <dd className="mt-0.5 text-lg font-semibold text-text-light">
                    {info?.plan?.price != null
                      ? `${formatCurrencyBRL(Number(info.plan.price))}/mês`
                      : "—"}
                  </dd>
                </div>
                {info?.plan?.day_due != null && (
                  <div>
                    <dt className="text-base font-medium text-text-light/70">
                      Vencimento
                    </dt>
                    <dd className="mt-0.5 text-lg font-semibold text-text-light">
                      Dia {info.plan.day_due} de cada mês
                    </dd>
                  </div>
                )}
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
