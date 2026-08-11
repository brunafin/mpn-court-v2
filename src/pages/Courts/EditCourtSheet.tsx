import { useEffect, useId, useRef, useState } from "react";
import { BsX } from "react-icons/bs";
import Input from "../../components/Input";
import Select from "../../components/Select";
import CheckboxGroup from "../../components/CheckboxGroup";
import { buttonClassName } from "../../components/Button";
import {
  IInfoCourt,
  patchCourt,
} from "../../api/companies";
import {
  COURT_FLOORS,
  COURT_SPORTS,
  CourtFloor,
  courtSportLabel,
} from "../../onboarding/mockStore";
import { useErrors } from "../../contexts/ErrorsContext";

type EditCourtSheetProps = {
  court: IInfoCourt | null;
  open: boolean;
  onClose: () => void;
  onSaved: (next: IInfoCourt) => void;
};

function sportKeysFromLabels(labels: string[]): string[] {
  const byLabel = new Map(
    COURT_SPORTS.map((s) => [courtSportLabel(s.key).toLowerCase(), s.key]),
  );
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
  onClose,
  onSaved,
}: EditCourtSheetProps) {
  const { notifyError } = useErrors();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const [name, setName] = useState("");
  const [floor, setFloor] = useState<CourtFloor | "">("");
  const [sports, setSports] = useState<string[]>([]);
  const [isCovered, setIsCovered] = useState(true);
  const [isCanHaveNet, setIsCanHaveNet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open || !court) return;
    setName(court.name);
    setFloor((court.floor as CourtFloor) || "");
    setSports(sportKeysFromLabels(court.sports));
    setIsCovered(court.isCovered ?? true);
    setIsCanHaveNet(court.isCanHaveNet ?? false);
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

  if (!open || !court) return null;

  const floorOptions = COURT_FLOORS.map((f) => ({
    id: f.key,
    name: f.label,
  }));

  const canSubmit =
    name.trim().length >= 2 &&
    Boolean(floor) &&
    sports.length > 0 &&
    !saving;

  const handleSave = async () => {
    if (!canSubmit) return;
    if (name.trim().length < 2) {
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
      const sportLabels = sports.map((key) =>
        courtSportLabel(key as Parameters<typeof courtSportLabel>[0]),
      );
      await patchCourt(court.publicId, {
        name: name.trim(),
        floor,
        is_covered: isCovered,
        is_can_have_net: isCanHaveNet,
        sports: sportLabels,
      });
      onSaved({
        ...court,
        name: name.trim(),
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
      setFormError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl bg-master-light text-text-light sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-text-light/10 px-4 py-3">
          <h2 id={titleId} className="text-lg font-semibold">
            Editar quadra
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="mpn-tap flex size-10 items-center justify-center rounded-xl text-text-light/70 hover:bg-text-light/10"
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
            value={name}
            onChange={(e) => setName(e.target.value)}
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
          <CheckboxGroup
            name="sports"
            title="Esportes"
            mode="dark"
            required
            options={COURT_SPORTS.map((s) => ({
              value: s.key,
              label: s.label,
            }))}
            value={sports}
            onChange={setSports}
          />
          <div className="flex flex-col gap-2 rounded-xl bg-master px-3 py-3">
            <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 text-base">
              <span>Quadra coberta</span>
              <input
                type="checkbox"
                className="size-5 accent-accent-blue"
                checked={isCovered}
                onChange={(e) => setIsCovered(e.target.checked)}
              />
            </label>
            <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 text-base">
              <span>Pode ter rede</span>
              <input
                type="checkbox"
                className="size-5 accent-accent-blue"
                checked={isCanHaveNet}
                onChange={(e) => setIsCanHaveNet(e.target.checked)}
              />
            </label>
          </div>
          {formError ? (
            <p className="text-sm text-danger-400" role="alert">
              {formError}
            </p>
          ) : null}
        </div>

        <div className="border-t border-text-light/10 px-4 py-3">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSave}
            className={buttonClassName({ variant: "primary" })}
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
