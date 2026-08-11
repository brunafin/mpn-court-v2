import { useEffect, useState } from "react";
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
import { COMPANY_CHARACTERISTICS } from "../../constants/companyCharacteristics";

function normalizeInstagramUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, "").replace(/^instagram\.com\//i, "");
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) return trimmed;
  return `https://instagram.com/${handle}`;
}

type EditCompanySectionProps = {
  publicId: string;
  info: IInfo;
  canMutate: boolean;
  onSaved: (partial: Partial<IInfo>) => void;
};

export default function EditCompanySection({
  publicId,
  info,
  canMutate,
  onSaved,
}: EditCompanySectionProps) {
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

  const addressLine = [
    info.address?.street,
    info.address?.number,
    info.address?.neighborhood,
    info.address?.city && info.address?.uf
      ? `${info.address.city}/${info.address.uf}`
      : info.address?.city || info.address?.uf,
  ]
    .filter(Boolean)
    .join(", ");

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
      setStreet(address.street);
      setNeighborhood(address.neighborhood);
      setCity(address.city);
      setUf(address.uf);
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
        name: name.trim(),
        phone: phoneDigits || undefined,
        instagram_url: instagramUrl,
        cep: cepDigits ? formatCepMask(cepDigits) : undefined,
        street: street.trim() || undefined,
        number: number.trim() || undefined,
        neighborhood: neighborhood.trim() || undefined,
        city: city.trim() || undefined,
        uf: uf.trim().toUpperCase() || undefined,
        characteristics,
      });
      const nextPartial: Partial<IInfo> = {
        companyName: name.trim(),
        companyPhone: phoneDigits || null,
        instagramUrl,
        characteristics,
        address: {
          cep: cepDigits ? formatCepMask(cepDigits) : null,
          street: street.trim() || null,
          number: number.trim() || null,
          neighborhood: neighborhood.trim() || null,
          city: city.trim() || null,
          uf: uf.trim().toUpperCase() || null,
        },
      };
      onSaved(nextPartial);
      setBrandingCompanyName(name.trim());
      notifyError({ message: "Dados atualizados.", type: "success" });
      setEditing(false);
    } catch (error) {
      console.error(error);
      setFormError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (!canMutate && !editing) {
    return (
      <div className="rounded-2xl bg-master-light px-4 py-5 lg:px-6">
        <p className="text-base font-medium text-text-light/70">
          Dados cadastrais
        </p>
        <dl className="mt-3 space-y-2 text-base text-text-light/80">
          {info.instagramUrl ? (
            <div>
              <dt className="text-sm text-text-light/55">Instagram</dt>
              <dd className="break-all">{info.instagramUrl}</dd>
            </div>
          ) : null}
          {addressLine ? (
            <div>
              <dt className="text-sm text-text-light/55">Endereço</dt>
              <dd>{addressLine}</dd>
            </div>
          ) : null}
          {(info.characteristics?.length ?? 0) > 0 ? (
            <div>
              <dt className="text-sm text-text-light/55">Comodidades</dt>
              <dd>{info.characteristics!.join(" · ")}</dd>
            </div>
          ) : null}
          {!info.instagramUrl &&
          !addressLine &&
          !(info.characteristics?.length ?? 0) ? (
            <p className="text-text-light/55">Sem endereço, Instagram ou comodidades.</p>
          ) : null}
        </dl>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-master-light px-4 py-5 lg:px-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-medium text-text-light/70">
          Dados cadastrais
        </p>
        {canMutate && !editing ? (
          <button
            type="button"
            onClick={() => {
              syncFromInfo();
              setEditing(true);
            }}
            className={buttonClassName({
              variant: "ghost",
              size: "md",
              fullWidth: false,
              className: "!min-h-10 px-3 text-sm",
            })}
          >
            Editar
          </button>
        ) : null}
      </div>

      {!editing ? (
        <dl className="mt-3 space-y-2 text-base text-text-light/80">
          {info.instagramUrl ? (
            <div>
              <dt className="text-sm text-text-light/55">Instagram</dt>
              <dd className="break-all">{info.instagramUrl}</dd>
            </div>
          ) : (
            <p className="text-text-light/55">Instagram não informado.</p>
          )}
          {addressLine ? (
            <div>
              <dt className="text-sm text-text-light/55">Endereço</dt>
              <dd>{addressLine}</dd>
            </div>
          ) : (
            <p className="text-text-light/55">Endereço não informado.</p>
          )}
          {(info.characteristics?.length ?? 0) > 0 ? (
            <div>
              <dt className="text-sm text-text-light/55">Comodidades</dt>
              <dd>{info.characteristics!.join(" · ")}</dd>
            </div>
          ) : (
            <p className="text-text-light/55">Nenhuma comodidade marcada.</p>
          )}
        </dl>
      ) : (
        <form
          className="mt-4 space-y-1"
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
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            <p className="mb-2 text-sm text-text-light/55">Buscando CEP…</p>
          ) : null}
          {cepHint ? (
            <p className="mb-2 text-sm text-danger-400">{cepHint}</p>
          ) : null}
          <Input
            name="street"
            title="Rua"
            mode="dark"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              name="number"
              title="Número"
              mode="dark"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
            <Input
              name="uf"
              title="UF"
              mode="dark"
              value={uf}
              onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
              maxLength={2}
            />
          </div>
          <Input
            name="neighborhood"
            title="Bairro"
            mode="dark"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
          />
          <Input
            name="city"
            title="Cidade"
            mode="dark"
            value={city}
            onChange={(e) => setCity(e.target.value)}
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
            <p className="text-sm text-danger-400" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className={buttonClassName({
                variant: "primary",
                className: "sm:flex-1",
              })}
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
              className={buttonClassName({
                variant: "secondary",
                className: "sm:flex-1",
              })}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
