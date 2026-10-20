import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdChevronLeft, MdOutlinePhotoCamera } from "react-icons/md";
import Input from "../../../components/Input";
import { buttonClassName } from "../../../components/Button";
import OnboardingFooter from "../../../components/OnboardingFooter";
import { lookupCep } from "../../../api/viaCep";
import {
  getMockOnboarding,
  getOrCreateOnboardingDraft,
  updateMockOnboarding,
} from "../../../onboarding/mockStore";
import {
  getPendingLogoPreviewUrl,
  setPendingLogo,
} from "../../../onboarding/pendingLogo";
import { getAccessToken } from "../../../utils/authCookie";
import {
  formatCepMask,
  isValidCep,
  onlyCepDigits,
} from "../../../utils/formatCep";
import { formatPhoneMask, onlyPhoneDigits } from "../../../utils/formatPhone";
import {
  IMAGE_UPLOAD_ACCEPT,
  IMAGE_UPLOAD_MAX_BYTES,
  imageUploadHint,
  imageUploadTooLargeMessage,
  isAllowedImageFile,
} from "../../../utils/imageUpload";
import { normalizeInstagramUrl } from "../../../utils/normalizeInstagramUrl";
import {
  collapseSpaces,
  sanitizeTitleInput,
  uppercaseAddressInput,
} from "../../../utils/normalizeFormText";

const MAX_COURTS = 15;
const SUPPORT_WHATSAPP =
  import.meta.env.VITE_WHATSAPP_CONTRACT_URL ||
  "https://wa.me/5551989589197?text=Ol%C3%A1%2C%20preciso%20cadastrar%20mais%20de%2015%20quadras";

function OnboardingArena() {
  const navigate = useNavigate();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [arenaName, setArenaName] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [courtCount, setCourtCount] = useState("1");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepHint, setCepHint] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/");
      return;
    }
    const mock = getOrCreateOnboardingDraft();
    setArenaName(mock.arenaName);
    setCompanyPhone(
      mock.companyPhone ? formatPhoneMask(mock.companyPhone) : ""
    );
    setInstagram(mock.instagramUrl || "");
    setCourtCount(String(mock.courtCount || 1));
    setCep(formatCepMask(mock.cep));
    setStreet(mock.street);
    setNumber(mock.number);
    setNeighborhood(mock.neighborhood);
    setCity(mock.city);
    setUf(mock.uf);
    setLogoPreview(getPendingLogoPreviewUrl());
  }, [navigate]);

  const phoneDigits = onlyPhoneDigits(companyPhone);
  const courtCountNumber = Number.parseInt(courtCount, 10);
  const courtCountTooMany =
    Number.isInteger(courtCountNumber) && courtCountNumber > MAX_COURTS;
  const courtCountTooSmall =
    courtCount !== "" &&
    (!Number.isInteger(courtCountNumber) || courtCountNumber < 1);
  const courtCountValid =
    Number.isInteger(courtCountNumber) &&
    courtCountNumber >= 1 &&
    courtCountNumber <= MAX_COURTS;

  const fillAddressFromCep = async (rawCep: string) => {
    if (!isValidCep(rawCep)) return;
    setCepLoading(true);
    setCepHint("");
    try {
      const address = await lookupCep(rawCep);
      if (!address) {
        setCepHint("CEP não encontrado. Confira e tente de novo.");
        return;
      }
      setStreet(uppercaseAddressInput(address.street, 100));
      setNeighborhood(uppercaseAddressInput(address.neighborhood, 50));
      setCity(uppercaseAddressInput(address.city, 50));
      setUf(address.uf.toUpperCase().slice(0, 2));
      setCep(formatCepMask(address.cep));
      setCepHint("");
      if (formError) setFormError("");
    } catch {
      setCepHint("Não foi possível consultar o CEP. Tente novamente.");
    } finally {
      setCepLoading(false);
    }
  };

  const handleCepChange = (value: string) => {
    const masked = formatCepMask(value);
    setCep(masked);
    setCepHint("");
    if (formError) setFormError("");
    if (onlyCepDigits(masked).length === 8) {
      void fillAddressFromCep(masked);
    }
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Logo: sempre 1 arquivo (input sem `multiple`).
    const file = event.target.files?.[0];
    event.target.value = "";
    setLogoError("");
    if (!file) return;

    if (!isAllowedImageFile(file)) {
      setLogoError("Use uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
      setLogoError(imageUploadTooLargeMessage());
      return;
    }

    setLogoPreview(setPendingLogo(file));
  };

  const handleClearLogo = () => {
    setPendingLogo(null);
    setLogoPreview(null);
    setLogoError("");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");

    if (!arenaName.trim()) {
      setFormError("Informe o nome.");
      return;
    }
    if (arenaName.trim().length > 50) {
      setFormError("O nome deve ter no máximo 50 caracteres.");
      return;
    }
    if (!isValidCep(cep)) {
      setFormError("Informe um CEP válido.");
      return;
    }
    if (
      !street.trim() ||
      !neighborhood.trim() ||
      !city.trim() ||
      uf.trim().length !== 2
    ) {
      setFormError("Informe o CEP para preencher o endereço.");
      return;
    }
    if (!number.trim()) {
      setFormError("Informe o número do endereço.");
      return;
    }
    if (phoneDigits.length !== 11) {
      setFormError("Informe um celular com DDD (11 dígitos).");
      return;
    }
    if (courtCountTooMany) {
      return;
    }
    if (!courtCountValid) {
      setFormError("Informe pelo menos 1 quadra.");
      return;
    }

    const current = getMockOnboarding();
    const nextCourts = (current?.courts ?? []).slice(0, courtCountNumber);

    updateMockOnboarding({
      arenaName: collapseSpaces(sanitizeTitleInput(arenaName, 50)),
      companyPhone: phoneDigits,
      instagramUrl: normalizeInstagramUrl(instagram) ?? "",
      courtCount: courtCountNumber,
      cep: formatCepMask(cep),
      street: collapseSpaces(uppercaseAddressInput(street, 100)),
      number: number.trim(),
      neighborhood: collapseSpaces(uppercaseAddressInput(neighborhood, 50)),
      city: collapseSpaces(uppercaseAddressInput(city, 50)),
      uf: uf.trim().toUpperCase(),
      courts: nextCourts,
      isPublished: false,
    });
    navigate("/comecar");
  };

  return (
    <div className="min-h-dvh bg-master px-4 py-6 text-text-light lg:h-full lg:min-h-0 lg:overflow-y-auto">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-lg flex-col lg:min-h-full">
        <div className="-ml-2 flex items-center gap-1">
          <Link
            to="/comecar"
            aria-label="Voltar"
            className="mpn-tap flex size-11 shrink-0 items-center justify-center rounded-xl text-text-light/70"
          >
            <MdChevronLeft size={28} aria-hidden />
          </Link>
          <h1 className="min-w-0 truncate text-2xl font-bold tracking-tight">
            Estabelecimento
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5 rounded-xl bg-master-light p-5"
          noValidate
        >
          <Input
            name="arenaName"
            title="Nome"
            placeholder="Arena Marca Pra Nós"
            type="text"
            mode="dark"
            value={arenaName}
            onChange={(e) => {
              setArenaName(sanitizeTitleInput(e.target.value, 50));
              if (formError) setFormError("");
            }}
            required
            autoComplete="organization"
            maxLength={50}
            showCount
          />

          <Input
            name="courtCount"
            title="Número de quadras"
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
            error={
              courtCountTooSmall ? "Informe pelo menos 1 quadra." : undefined
            }
          />
          {courtCountTooMany && (
            <p className="-mt-1 text-base font-medium text-danger-soft" role="alert">
              Para mais de {MAX_COURTS} quadras,{" "}
              <a
                href={SUPPORT_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-2"
              >
                fale com o suporte
              </a>
              .
            </p>
          )}

          <Input
            name="companyPhone"
            title="Contato"
            placeholder="(00) 90000-0000"
            type="tel"
            mode="dark"
            value={companyPhone}
            onChange={(e) => {
              setCompanyPhone(formatPhoneMask(e.target.value));
              if (formError) setFormError("");
            }}
            required
            autoComplete="tel"
            inputMode="tel"
          />

          <Input
            name="instagram"
            title="Instagram"
            placeholder="@suaarena ou URL"
            type="text"
            mode="dark"
            value={instagram}
            onChange={(e) => {
              setInstagram(e.target.value);
              if (formError) setFormError("");
            }}
            autoComplete="off"
            maxLength={200}
          />

          <div className="pt-4">
            <p className="mb-3 text-base font-medium text-text-light/70">
              Endereço
            </p>
            <Input
              name="cep"
              title="CEP"
              placeholder="00000-000"
              type="text"
              inputMode="numeric"
              mode="dark"
              value={cep}
              onChange={(e) => handleCepChange(e.target.value)}
              onBlur={() => {
                if (isValidCep(cep)) void fillAddressFromCep(cep);
              }}
              required
              autoComplete="postal-code"
            />
            {(cepLoading || cepHint) && (
              <p
                className={`-mt-1 mb-2 text-base ${
                  cepHint ? "text-danger-soft" : "text-text-light/55"
                }`}
              >
                {cepLoading ? "Buscando endereço…" : cepHint}
              </p>
            )}
            <Input
              name="street"
              title="Rua"
              placeholder="Rua / avenida"
              type="text"
              mode="dark"
              value={street}
              onChange={(e) => {
                setStreet(uppercaseAddressInput(e.target.value, 100));
                if (formError) setFormError("");
              }}
              required
              className="mt-1"
              autoComplete="address-line1"
            />
            <div className="mt-1 grid grid-cols-2 gap-3">
              <Input
                name="number"
                title="Número"
                placeholder="123"
                type="text"
                inputMode="numeric"
                mode="dark"
                value={number}
                onChange={(e) => {
                  setNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
                  if (formError) setFormError("");
                }}
                required
                autoComplete="address-line2"
              />
              <Input
                name="neighborhood"
                title="Bairro"
                placeholder="Bairro"
                type="text"
                mode="dark"
                value={neighborhood}
                onChange={(e) => {
                  setNeighborhood(uppercaseAddressInput(e.target.value, 50));
                  if (formError) setFormError("");
                }}
                required
              />
            </div>
            <div className="mt-1 grid grid-cols-[1fr_5rem] gap-3">
              <Input
                name="city"
                title="Cidade"
                placeholder="Cidade"
                type="text"
                mode="dark"
                value={city}
                onChange={(e) => {
                  setCity(uppercaseAddressInput(e.target.value, 50));
                  if (formError) setFormError("");
                }}
                required
                autoComplete="address-level2"
              />
              <Input
                name="uf"
                title="UF"
                placeholder="RS"
                type="text"
                mode="dark"
                value={uf}
                onChange={(e) => {
                  setUf(
                    e.target.value
                      .replace(/[^a-zA-Z]/g, "")
                      .toUpperCase()
                      .slice(0, 2)
                  );
                  if (formError) setFormError("");
                }}
                required
                autoComplete="address-level1"
                autoCapitalize="characters"
              />
            </div>
          </div>

          <div className="pt-4">
            <p className="mb-3 text-base font-medium text-text-light/70">
              Logo
            </p>
            <input
              ref={logoInputRef}
              type="file"
              accept={IMAGE_UPLOAD_ACCEPT}
              className="sr-only"
              onChange={handleLogoChange}
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              aria-label={
                logoPreview
                  ? "Alterar logo do estabelecimento"
                  : "Enviar logo do estabelecimento"
              }
              className="group relative flex min-h-36 w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed border-text-light/20 bg-master/40 px-4 py-6 transition hover:border-accent-blue/50 hover:bg-master/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Prévia do logo"
                  className="max-h-24 max-w-[min(100%,10rem)] object-contain"
                />
              ) : (
                <MdOutlinePhotoCamera
                  size={36}
                  className="text-text-light/55"
                  aria-hidden
                />
              )}
              <span className="text-center text-base leading-5 text-text-light/70">
                {logoPreview
                  ? "Clique para alterar o logo"
                  : "Clique para enviar o logo"}
                <br />
                {imageUploadHint()} · 1 foto
              </span>
            </button>
            {logoPreview && (
              <button
                type="button"
                onClick={handleClearLogo}
                className="mt-2 text-base font-medium text-text-light/70 underline-offset-2 hover:text-text-light hover:underline"
              >
                Remover logo
              </button>
            )}
            {logoError && (
              <p className="mt-2 text-base text-danger-soft" role="alert">
                {logoError}
              </p>
            )}
          </div>

          {formError && (
            <p className="text-base text-danger-soft" role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            className={buttonClassName({
              variant: "primary",
              className: "mt-1",
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
