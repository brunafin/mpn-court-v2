import { useEffect, useId, useRef, useState } from "react";
import { BsX } from "react-icons/bs";
import Input from "../../components/Input";
import Select from "../../components/Select";
import CheckboxGroup from "../../components/CheckboxGroup";
import { ChoiceCheck, choiceRowClass } from "../../components/ChoiceCheck";
import { buttonClassName } from "../../components/Button";
import {
  createOwnedCourt,
  IInfoCourt,
  patchCourt,
} from "../../api/companies";
import {
  COURT_FLOORS,
  COURT_SPORTS,
  COURT_SPORTS_PREVIEW_COUNT,
  CourtFloor,
  CourtSport,
  courtSportLabel,
  sportPayloadFromKey,
} from "../../onboarding/mockStore";
import { useErrors } from "../../contexts/ErrorsContext";
import { formatCurrencyBRL } from "../../utils/formatCurrency";
import { MAX_COURT_PRICE_REAIS } from "../../utils/courtPrice";
import {
  collapseSpaces,
  COURT_NAME_MAX_LENGTH,
  sanitizeTitleInput,
} from "../../utils/normalizeFormText";

type EditCourtSheetProps = {
  court: IInfoCourt | null;
  open: boolean;
  companyPublicId?: string;
  onClose: () => void;
  onSaved: (next: IInfoCourt) => void;
  onCreated?: () => void;
};

function sportKeysFromLabels(labels: string[]): string[] {
  const byLabel = new Map(
    COURT_SPORTS.map((s) => [courtSportLabel(s.key).toLowerCase(), s.key]),
  );
  byLabel.set("society", "fut7");
  byLabel.set("fut7 (society)", "fut7");
  byLabel.set("fut6", "fut6");
  byLabel.set("fut7", "fut7");
  byLabel.set("fut11", "fut11");
  byLabel.set("futebol de campo", "fut11");
  byLabel.set("futebol de campo 11", "fut11");
  const keys: string[] = [];
  for (const label of labels) {
    const key = byLabel.get(label.trim().toLowerCase());
    if (key && !keys.includes(key)) keys.push(key);
  }
  return keys;
}

export default function EditCourtSheet({
  court,
  open,
  companyPublicId,
  onClose,
  onSaved,
  onCreated,
}: EditCourtSheetProps) {
  const { notifyError } = useErrors();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const isCreate = open && !court;
  const [name, setName] = useState("");
  const [floor, setFloor] = useState<CourtFloor | "">("");
  const [sports, setSports] = useState<string[]>([]);
  const [isCovered, setIsCovered] = useState(true);
  const [isCanHaveNet, setIsCanHaveNet] = useState(false);
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    if (court) {
      setName(
        collapseSpaces(sanitizeTitleInput(court.name, COURT_NAME_MAX_LENGTH)),
      );
      setFloor((court.floor as CourtFloor) || "");
      const catalogKeys = sportKeysFromLabels(court.sports);
      setSports(catalogKeys);
      setIsCovered(court.isCovered ?? true);
      setIsCanHaveNet(court.isCanHaveNet ?? false);
      setPrice(
        court.price != null && court.price > 0 ? String(court.price) : "",
      );
    } else {
      setName("");
      setFloor("");
      setSports([]);
      setIsCovered(true);
      setIsCanHaveNet(false);
      setPrice("");
    }
    setFormError("");
    setSaving(false);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, court]);

  if (!open) return null;

  const floorOptions = COURT_FLOORS.map((f) => ({
    id: f.key,
    name: f.label,
  }));

  const courtName = collapseSpaces(
    sanitizeTitleInput(name, COURT_NAME_MAX_LENGTH),
  );
  const parsedPrice = Number(price.replace(",", "."));
  const canSubmit =
    courtName.length >= 2 &&
    Boolean(floor) &&
    sports.length > 0 &&
    (!isCreate || (Number.isFinite(parsedPrice) && parsedPrice >= 0.01)) &&
    !saving;

  const buildSportsPayload = () => {
    return sports.map((key) => sportPayloadFromKey(key as CourtSport));
  };

  const handleSave = async () => {
    if (!canSubmit) return;
    if (courtName.length < 2) {
      setFormError("Informe o nome da quadra.");
      return;
    }
    if (!floor) {
      setFormError("Selecione o piso.");
      return;
    }
    if (sports.length === 0) {
      setFormError("Selecione ao menos um esporte.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const payload = buildSportsPayload();
      const sportLabels = payload.map((item) => item.name);

      if (isCreate) {
        if (!companyPublicId) {
          setFormError("Estabelecimento não identificado.");
          return;
        }
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0.01) {
          setFormError("Informe o valor por horário.");
          return;
        }
        if (parsedPrice > MAX_COURT_PRICE_REAIS) {
          setFormError(
            `O valor máximo por horário é ${formatCurrencyBRL(MAX_COURT_PRICE_REAIS)}.`,
          );
          return;
        }
        await createOwnedCourt(companyPublicId, {
          name: courtName,
          floor,
          price: parsedPrice,
          is_covered: isCovered,
          is_can_have_net: isCanHaveNet,
          sports: payload,
        });
        notifyError({
          message: "Quadra adicionada. A agenda está sendo montada.",
          type: "success",
        });
        onCreated?.();
        onClose();
        return;
      }

      if (!court) return;
      await patchCourt(court.publicId, {
        name: courtName,
        floor,
        is_covered: isCovered,
        is_can_have_net: isCanHaveNet,
        sports: payload,
      });
      onSaved({
        ...court,
        name: courtName,
        floor,
        isCovered,
        isCanHaveNet,
        sports: sportLabels,
      });
      notifyError({
        message: "Quadra atualizada.",
        type: "success",
      });
      onClose();
    } catch (error) {
      console.error(error);
      setFormError(
        isCreate
          ? "Não foi possível adicionar a quadra. Confira se já existe uma grade na agenda."
          : "Não foi possível salvar. Tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(92dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-master-light text-text-light shadow-2xl sm:rounded-2xl"
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-text-light/20 sm:hidden" />
        <div className="flex items-center justify-between gap-3 px-4 pb-1 pt-3 sm:pt-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {isCreate ? "Adicionar quadra" : "Editar quadra"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="mpn-tap flex size-11 items-center justify-center rounded-full border border-text-light/20 bg-master text-text-light"
            aria-label="Fechar"
          >
            <BsX size={28} aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <Input
            name="courtName"
            title="Nome"
            mode="dark"
            maxLength={COURT_NAME_MAX_LENGTH}
            showCount
            value={name}
            onChange={(e) =>
              setName(sanitizeTitleInput(e.target.value, COURT_NAME_MAX_LENGTH))
            }
            required
          />
          <Select
            name="floor"
            title="Piso"
            mode="dark"
            required
            placeholder="Selecione o piso"
            options={floorOptions}
            value={floor}
            onChange={(e) => setFloor((e.target.value as CourtFloor) || "")}
          />
          {isCreate ? (
            <Input
              name="price"
              title="Valor por horário (R$)"
              mode="dark"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          ) : null}
          <CheckboxGroup
            name="sports"
            title="Esportes"
            mode="dark"
            required
            options={COURT_SPORTS.map((s) => ({
              value: s.key,
              label: s.label,
            }))}
            previewCount={COURT_SPORTS_PREVIEW_COUNT}
            value={sports}
            onChange={setSports}
          />
          <div className="flex flex-col gap-2">
            <label className={choiceRowClass(isCovered)}>
              <input
                type="checkbox"
                className="peer sr-only"
                checked={isCovered}
                onChange={(e) => setIsCovered(e.target.checked)}
              />
              <ChoiceCheck checked={isCovered} />
              <span>Quadra coberta</span>
            </label>
            <label className={choiceRowClass(isCanHaveNet)}>
              <input
                type="checkbox"
                className="peer sr-only"
                checked={isCanHaveNet}
                onChange={(e) => setIsCanHaveNet(e.target.checked)}
              />
              <ChoiceCheck checked={isCanHaveNet} />
              <span>Pode ter rede</span>
            </label>
          </div>
          {formError ? (
            <p className="text-base text-danger-soft" role="alert">
              {formError}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void handleSave()}
            className={buttonClassName({ variant: "primary" })}
          >
            {saving
              ? isCreate
                ? "Adicionando…"
                : "Salvando…"
              : isCreate
                ? "Adicionar"
                : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
