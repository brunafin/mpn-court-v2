import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  type Ref,
} from "react";
import Input from "../../components/Input";
import CheckboxGroup from "../../components/CheckboxGroup";
import { buttonClassName } from "../../components/Button";
import { lookupCep } from "../../api/viaCep";
import { IInfo, patchCompany } from "../../api/companies";
import {
  formatCepMask,
  isValidCep,
  onlyCepDigits,
} from "../../utils/formatCep";
import { formatPhoneMask, onlyPhoneDigits } from "../../utils/formatPhone";
import { useErrors } from "../../contexts/ErrorsContext";
import { useCompanyBranding } from "../../contexts/CompanyBrandingContext";
import InfoSheet from "./Sheet";
import { COMPANY_CHARACTERISTICS } from "../../constants/companyCharacteristics";
import { normalizeInstagramUrl } from "../../utils/normalizeInstagramUrl";
import {
  collapseSpaces,
  sanitizeTitleInput,
  uppercaseAddressInput,
} from "../../utils/normalizeFormText";

type EditCompanySectionProps = {
  publicId: string;
  info: IInfo;
  canMutate: boolean;
  onSaved: (partial: Partial<IInfo>) => void;
};

export type EditCompanySectionHandle = {
  open: () => void;
};

function EditCompanySection(
  { publicId, info, canMutate, onSaved }: EditCompanySectionProps,
  ref: Ref<EditCompanySectionHandle>,
) {
  const { notifyError } = useErrors();
  const { setCompanyName: setBrandingCompanyName } = useCompanyBranding();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [characteristics, setCharacteristics] = useState<string[]>([]);
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepHint, setCepHint] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const syncFromInfo = () => {
    setName(info.companyName || "");
    setPhone(info.companyPhone ? formatPhoneMask(info.companyPhone) : "");
    setInstagram(info.instagramUrl || "");
    setCharacteristics(info.characteristics ?? []);
    setCep(info.address?.cep ? formatCepMask(info.address.cep) : "");
    setStreet(info.address?.street || "");
    setNumber(info.address?.number || "");
    setNeighborhood(info.address?.neighborhood || "");
    setCity(info.address?.city || "");
    setUf(info.address?.uf || "");
    setFormError("");
    setCepHint("");
  };

  useEffect(() => {
    if (!editing) syncFromInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info]);

  const instagramLabel = (() => {
    const url = info.instagramUrl;
    if (!url) return "";
    try {
      const handle = new URL(url).pathname.replace(/^\//, "").split("/")[0];
      if (handle) return `@${handle}`;
    } catch {
      return url;
    }
    return url;
  })();

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
    } catch {
      setCepHint("Não foi possível consultar o CEP. Tente novamente.");
    } finally {
      setCepLoading(false);
    }
  };

  const handleSave = async () => {
    const phoneDigits = onlyPhoneDigits(phone);
    const cepDigits = onlyCepDigits(cep);
    if (name.trim().length < 2) {
      setFormError("Informe o nome do estabelecimento.");
      return;
    }
    if (name.trim().length > 50) {
      setFormError("O nome deve ter no máximo 50 caracteres.");
      return;
    }
    if (phoneDigits && phoneDigits.length !== 11) {
      setFormError("Telefone deve ter 11 dígitos (DDD + número).");
      return;
    }
    if (cepDigits && !isValidCep(cepDigits)) {
      setFormError("CEP inválido.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const instagramUrl = normalizeInstagramUrl(instagram);
      await patchCompany(publicId, {
        name: collapseSpaces(sanitizeTitleInput(name, 50)),
        phone: phoneDigits || undefined,
        instagram_url: instagramUrl,
        cep: cepDigits ? formatCepMask(cepDigits) : undefined,
        street: collapseSpaces(uppercaseAddressInput(street, 100)) || undefined,
        number: number.replace(/\D/g, "").slice(0, 10) || undefined,
        neighborhood:
          collapseSpaces(uppercaseAddressInput(neighborhood, 50)) || undefined,
        city: collapseSpaces(uppercaseAddressInput(city, 50)) || undefined,
        uf: uf.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2) || undefined,
        characteristics,
      });
      const nextPartial: Partial<IInfo> = {
        companyName: collapseSpaces(sanitizeTitleInput(name, 50)),
        companyPhone: phoneDigits || null,
        instagramUrl,
        characteristics,
        address: {
          cep: cepDigits ? formatCepMask(cepDigits) : null,
          street: collapseSpaces(uppercaseAddressInput(street, 100)) || null,
          number: number.replace(/\D/g, "").slice(0, 10) || null,
          neighborhood:
            collapseSpaces(uppercaseAddressInput(neighborhood, 50)) || null,
          city: collapseSpaces(uppercaseAddressInput(city, 50)) || null,
          uf: uf.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2) || null,
        },
      };
      onSaved(nextPartial);
      setBrandingCompanyName(collapseSpaces(sanitizeTitleInput(name, 50)));
      notifyError({ message: "Dados atualizados.", type: "success" });
      setEditing(false);
    } catch (error) {
      console.error(error);
      setFormError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const hasProfile =
    Boolean(info.instagramUrl) || (info.characteristics?.length ?? 0) > 0;

  const profileFacts = hasProfile ? (
    <div className="min-w-0 space-y-1 text-base text-text-light">
      {info.instagramUrl ? (
        <a
          href={info.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-accent-badge underline-offset-2 hover:underline"
        >
          {instagramLabel}
        </a>
      ) : null}
      {(info.characteristics?.length ?? 0) > 0 ? (
        <p className="text-text-light/70">{info.characteristics!.join(" · ")}</p>
      ) : null}
    </div>
  ) : null;

  useImperativeHandle(ref, () => ({
    open() {
      if (!canMutate) return;
      syncFromInfo();
      setEditing(true);
    },
  }));

  if (!canMutate && !editing) {
    if (!profileFacts) return null;
    return <div className="mt-3">{profileFacts}</div>;
  }

  return (
    <div>
      {profileFacts ? <div className="mt-3">{profileFacts}</div> : null}

      <InfoSheet
        open={editing}
        title="Editar"
        onClose={() => {
          if (saving) return;
          syncFromInfo();
          setEditing(false);
        }}
      >
        <form
          className="space-y-1"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
        >
          <Input
            name="companyName"
            title="Nome"
            mode="dark"
            required
            maxLength={50}
            showCount
            value={name}
            onChange={(e) => setName(sanitizeTitleInput(e.target.value, 50))}
          />
          <Input
            name="companyPhone"
            title="Telefone / WhatsApp"
            mode="dark"
            value={phone}
            onChange={(e) => setPhone(formatPhoneMask(e.target.value))}
            inputMode="tel"
          />
          <Input
            name="instagram"
            title="Instagram"
            mode="dark"
            placeholder="@suaarena ou URL"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
          />
          <Input
            name="cep"
            title="CEP"
            mode="dark"
            value={cep}
            onChange={(e) => {
              const next = formatCepMask(e.target.value);
              setCep(next);
              if (isValidCep(next)) void fillAddressFromCep(next);
            }}
            inputMode="numeric"
          />
          {cepLoading ? (
            <p className="mb-2 text-base text-text-light/55">Buscando CEP…</p>
          ) : null}
          {cepHint ? (
            <p className="mb-2 text-base text-danger-soft">{cepHint}</p>
          ) : null}
          <Input
            name="street"
            title="Rua"
            mode="dark"
            value={street}
            onChange={(e) =>
              setStreet(uppercaseAddressInput(e.target.value, 100))
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              name="number"
              title="Número"
              mode="dark"
              value={number}
              onChange={(e) =>
                setNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
            />
            <Input
              name="uf"
              title="UF"
              mode="dark"
              value={uf}
              onChange={(e) =>
                setUf(
                  e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2),
                )
              }
              maxLength={2}
            />
          </div>
          <Input
            name="neighborhood"
            title="Bairro"
            mode="dark"
            value={neighborhood}
            onChange={(e) =>
              setNeighborhood(uppercaseAddressInput(e.target.value, 50))
            }
          />
          <Input
            name="city"
            title="Cidade"
            mode="dark"
            value={city}
            onChange={(e) => setCity(uppercaseAddressInput(e.target.value, 50))}
          />
          <CheckboxGroup
            name="characteristics"
            title="Comodidades no site"
            mode="dark"
            options={COMPANY_CHARACTERISTICS.map((label) => ({
              value: label,
              label,
            }))}
            value={characteristics}
            onChange={setCharacteristics}
          />
          {formError ? (
            <p className="text-base text-danger-soft" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="mt-3 flex flex-col gap-1">
            <button
              type="submit"
              disabled={saving}
              className={buttonClassName({ variant: "primary" })}
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                syncFromInfo();
                setEditing(false);
              }}
              className="inline-flex min-h-11 items-center justify-center text-base font-semibold text-text-light/70"
            >
              Cancelar
            </button>
          </div>
        </form>
      </InfoSheet>
    </div>
  );
}

export default forwardRef(EditCompanySection);
