import { useRef, useState } from "react";
import {
  MdClose,
  MdOutlineEdit,
  MdOutlinePhotoCamera,
  MdOutlineShare,
} from "react-icons/md";
import {
  deleteCompanyPhoto,
  IInfo,
  IInfoPhoto,
  uploadCompanyLogo,
  uploadCompanyPhoto,
} from "../../api/companies";
import { useErrors } from "../../contexts/ErrorsContext";
import {
  useCompanyBranding,
  useCompanyCapabilities,
} from "../../contexts/CompanyBrandingContext";
import { formatPhoneMask } from "../../utils/formatPhone";
import {
  COMPANY_PHOTO_MAX_COUNT,
  IMAGE_UPLOAD_ACCEPT,
  IMAGE_UPLOAD_MAX_BYTES,
  imageUploadTooLargeMessage,
  isAllowedImageFile,
} from "../../utils/imageUpload";
import CompanyAvatar from "../../components/CompanyAvatar";
import { resolveCompanyPortalStatus } from "../../utils/portalVisibility";
import EditCompanySection, {
  type EditCompanySectionHandle,
} from "../Info/EditCompanySection";

type ArenaProfileProps = {
  publicId: string;
  info: IInfo;
  onChange: (partial: Partial<IInfo>) => void;
  onShare?: () => void;
};

function ArenaProfile({
  publicId,
  info,
  onChange,
  onShare,
}: ArenaProfileProps) {
  const { notifyError } = useErrors();
  const { setLogoUrl } = useCompanyBranding();
  const caps = useCompanyCapabilities();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<EditCompanySectionHandle>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [removingPhotoId, setRemovingPhotoId] = useState<number | null>(null);

  const photos: IInfoPhoto[] = info.photos ?? [];
  const photoSlotsLeft = COMPANY_PHOTO_MAX_COUNT - photos.length;
  const canAddPhoto = photoSlotsLeft > 0;
  const portalStatus = resolveCompanyPortalStatus({
    isActive: info.isActive,
    capabilities: caps.ready ? caps : info.capabilities,
    courts: info.courts,
  });

  const handleLogoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
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
      onChange({ logoUrl });
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

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
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
        onChange({
          photos: [...photos, ...uploaded].slice(0, COMPANY_PHOTO_MAX_COUNT),
        });
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
      onChange({ photos: photos.filter((photo) => photo.id !== imageId) });
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

  return (
    <div>
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

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={uploadingLogo || !publicId || !caps.canMutate}
          onClick={() => logoInputRef.current?.click()}
          aria-label={
            uploadingLogo
              ? "Enviando logo"
              : info.logoUrl
                ? "Alterar logo"
                : "Enviar logo"
          }
          className="rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        >
          <CompanyAvatar
            sizeClass="size-16"
            roundedClass="rounded-2xl"
            decorative
          />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold leading-7">
            {info.companyName || "—"}
          </h1>
          <p className="truncate text-base text-text-light/70">
            {info.companyPhone
              ? `${formatPhoneMask(info.companyPhone)} · `
              : null}
            <span
              className={
                portalStatus.onSite ? "text-accent-green-ink" : undefined
              }
            >
              {portalStatus.label}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onShare ? (
            <button
              type="button"
              aria-label="Compartilhar"
              onClick={onShare}
              className="flex size-11 items-center justify-center rounded-xl bg-master-light text-text-light transition hover:bg-text-light/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <MdOutlineShare size={22} aria-hidden />
            </button>
          ) : null}
          {caps.canMutate ? (
            <button
              type="button"
              aria-label="Editar"
              onClick={() => editRef.current?.open()}
              className="flex size-11 items-center justify-center rounded-xl bg-master-light text-text-light transition hover:bg-text-light/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <MdOutlineEdit size={22} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <EditCompanySection
        ref={editRef}
        publicId={publicId}
        info={info}
        canMutate={caps.canMutate}
        onSaved={onChange}
      />

      <ul className="mt-4 flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {canAddPhoto && caps.canMutate ? (
          <li className="shrink-0">
            <button
              type="button"
              disabled={uploadingPhoto || !publicId}
              onClick={() => photoInputRef.current?.click()}
              aria-label={
                uploadingPhoto
                  ? "Enviando fotos"
                  : `Adicionar foto, ${photos.length} de ${COMPANY_PHOTO_MAX_COUNT}`
              }
              className="flex size-20 flex-col items-center justify-center gap-1 rounded-xl bg-master-light text-text-light/70 transition hover:bg-text-light/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
            >
              <MdOutlinePhotoCamera size={22} aria-hidden />
              <span className="text-sm">
                {uploadingPhoto
                  ? "…"
                  : `${photos.length}/${COMPANY_PHOTO_MAX_COUNT}`}
              </span>
            </button>
          </li>
        ) : null}
        {photos.map((photo) => (
          <li
            key={photo.id}
            className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-master-light"
          >
            <img src={photo.url} alt="" className="size-full object-cover" />
            {caps.canMutate ? (
              <button
                type="button"
                disabled={removingPhotoId === photo.id}
                onClick={() => void handleRemovePhoto(photo.id)}
                aria-label="Remover foto"
                className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-master/85 text-text-light disabled:opacity-60"
              >
                <MdClose size={16} aria-hidden />
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ArenaProfile;
