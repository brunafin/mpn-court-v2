import { format } from "date-fns";
import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "../../../components/Select";
import { createNewCourtSchedule } from "../../../api/companies";
import { useLoading } from "../../../hooks/useLoading";
import Input from "../../../components/Input";
import { BsX } from "react-icons/bs";
import { MdOutlineAdd } from "react-icons/md";
import { buttonClassName } from "../../../components/Button";
import { invalidateSchedulesDayCache } from "../../../utils/schedulesDayCache";
import {
  getAccessTokenPayload,
} from "../../../utils/authCookie";
import {
  capCourtPriceDigits,
  MAX_COURT_PRICE_REAIS,
} from "../../../utils/courtPrice";
import { formatCurrencyBRL } from "../../../utils/formatCurrency";

interface IAddCourtScheduleProps {
  show: boolean;
  onClose: () => void;
  date: Date;
  courts: { id: number; name: string }[];
  onSuccess?: () => void;
}

function AddCourtSchedule({
  show,
  onClose,
  date,
  courts,
  onSuccess,
}: IAddCourtScheduleProps) {
  const { loading, withLoading } = useLoading();
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

  const [selectedCourt, setSelectedCourt] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [selectedHour, setSelectedHour] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [error, setError] = useState<string>("");
  const [price, setPrice] = useState<number | null>(null);

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!show) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    setError("");
    setSelectedCourt(courts.length === 1 ? courts[0] : null);
    setSelectedHour(null);
    setPrice(null);

    const focusTimer = window.setTimeout(() => {
      const field = dialogRef.current?.querySelector<HTMLElement>(
        "select, input, button"
      );
      field?.focus();
    }, 50);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
    // Reset só ao abrir o modal; `courts` é lido nesse momento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  if (!show) return null;

  const courtOptions = courts.map((c) => ({ id: c.id, name: c.name }));
  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const hourStr = `${String(i).padStart(2, "0")}:00`;
    return { id: hourStr, name: hourStr };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const missingCourt = courtOptions.length > 1 && !selectedCourt;
    const missingHour = !selectedHour;
    const missingPrice = price === null;

    if (missingCourt || missingHour || missingPrice) {
      setError("Preencha os campos obrigatórios.");
      return;
    }

    if (price !== null && price > MAX_COURT_PRICE_REAIS) {
      setError(
        `O valor máximo por horário é ${formatCurrencyBRL(MAX_COURT_PRICE_REAIS)}.`,
      );
      return;
    }

    const obj = {
      start_hour: selectedHour.id,
      date: format(date, "yyyy-MM-dd"),
      court_id: selectedCourt?.id ?? courtOptions[0].id,
      price,
    };

    await withLoading(async () => {
      const response = await createNewCourtSchedule(obj);

      if (response !== undefined) {
        const dateKey = format(date, "yyyy-MM-dd");
        const companyPublicId =
          getAccessTokenPayload<{ companyPublicId?: string }>()
            ?.companyPublicId;
        if (companyPublicId) {
          invalidateSchedulesDayCache(companyPublicId, dateKey);
        } else {
          invalidateSchedulesDayCache();
        }
        onClose();
        onSuccess?.();
        navigate("/reservas", {
          state: {
            date: dateKey,
          },
        });
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Fechar modal"
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        disabled={loading}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={loading}
        className="relative z-10 flex w-full max-h-[92dvh] flex-col rounded-t-3xl bg-master-light text-text-light shadow-2xl sm:max-w-md sm:rounded-3xl"
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-text-light/20 sm:hidden" />

        <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-xl font-semibold leading-7 text-text-light"
            >
              Adicionar horário
            </h2>
            <p
              id={descriptionId}
              className="mt-1 text-base leading-6 text-text-light/75"
            >
              Novo horário para{" "}
              <span className="font-semibold text-text-light">
                {format(date, "dd/MM/yyyy")}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            disabled={loading}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-master text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue disabled:opacity-50"
          >
            <BsX size={24} aria-hidden />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2"
          noValidate
        >
          {courtOptions.length > 1 && (
            <Select
              name="court"
              title="Quadra"
              required
              value={selectedCourt?.id}
              options={courtOptions}
              mode="dark"
              disabled={loading}
              onChange={(e) => {
                const selectedId = Number(e.target.value);
                const court = courtOptions.find((c) => c.id === selectedId);
                setSelectedCourt(court || null);
                setError("");
              }}
            />
          )}

          <Select
            name="hour"
            title="Horário"
            required
            value={selectedHour?.id}
            options={hourOptions}
            mode="dark"
            disabled={loading}
            onChange={(e) => {
              const selectedValue = e.target.value;
              const hour = hourOptions.find((h) => h.id === selectedValue);
              setSelectedHour(hour || null);
              setError("");
            }}
          />

          <Input
            name="price"
            title="Preço"
            placeholder="Digite o valor"
            type="text"
            inputMode="numeric"
            required
            mode="dark"
            disabled={loading}
            value={
              price !== null
                ? price.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })
                : ""
            }
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              if (val === "") {
                setPrice(null);
                return;
              }
              const capped = capCourtPriceDigits(val);
              setPrice(Number(capped) / 100);
              setError("");
            }}
          />

          {error && (
            <p
              role="alert"
              className="mb-3 text-base font-semibold text-danger-400"
            >
              {error}
            </p>
          )}

          <div className="mt-auto flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={buttonClassName({
                variant: "ghost",
                fullWidth: false,
                className: "bg-master",
              })}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={buttonClassName({
                variant: "primary",
                className: "sm:flex-none sm:min-w-48",
              })}
            >
              <MdOutlineAdd size={22} aria-hidden />
              {loading ? "Adicionando…" : "Adicionar horário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCourtSchedule;
