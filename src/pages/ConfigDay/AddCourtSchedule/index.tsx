import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "../../../components/Select";
import { createNewCourtSchedule } from "../../../api/companies";
import { useLoading } from "../../../hooks/useLoading";
import Loader from "../../../components/Loader";
import Input from "../../../components/Input";

interface IAddCourtScheduleProps {
  show: boolean;
  onClose: () => void;
  date: Date;
  courts: { id: number; name: string }[];
}

function AddCourtSchedule({ show, onClose, date, courts }: IAddCourtScheduleProps) {
  const { loading, withLoading } = useLoading();
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);

  const [selectedCourt, setSelectedCourt] = useState<{ id: number; name: string } | null>(null);
  const [selectedHour, setSelectedHour] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    if (show && modalRef.current) {
      modalRef.current.focus();
    }
  }, [show]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((courtOptions.length > 1 && !selectedCourt) || !selectedHour) {
      setError('Preencha os campos obrigatórios.');
      return;
    }

    const obj = {
      start_hour: selectedHour.id,
      date: format(date, "yyyy-MM-dd"),
      court_id: selectedCourt?.id ?? courtOptions[0].id,
      price: price ?? 0
    };

    await withLoading(async () => {
      const response = await createNewCourtSchedule(obj);

      if (response !== undefined) {
        onClose();
        navigate("/reservas", {
          state: {
            date: format(date, "yyyy-MM-dd"),
          },
        });
      }
    });
  };


  if (!show) return null;

  const courtOptions = courts.map((c) => ({ id: c.id, name: c.name }));
  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const hourStr = `${String(i).padStart(2, "0")}:00`;
    return { id: hourStr, name: hourStr };
  });

  if (loading) return <Loader />;

  return (
    <div
      className="fixed inset-0 bg-neutral-800 bg-opacity-50 z-10 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      ref={modalRef}
      tabIndex={-1}
    >
      <div className="bg-neutral-200 w-full max-w-md rounded-lg p-6 relative z-20 flex flex-col">
        <h1 className="text-center text-lg font-bold mb-2 text-neutral-800">
          Adicionar Horário de Quadra
        </h1>
        <p className="mb-4 text-center text-neutral-800">{format(date, "dd/MM/yyyy")}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {courtOptions.length > 1 && (
            <Select
              name="court"
              title="*Quadra:"
              required
              value={selectedCourt?.id}
              options={courtOptions}
              mode="light"
              onChange={(e) => {
                const selectedId = Number(e.target.value);
                const selectedCourt = courtOptions.find(
                  (court) => court.id === selectedId
                );
                setSelectedCourt(selectedCourt || null);
              }}
            />
          )}

          <Select
            name="hour"
            title="*Horário:"
            required
            value={selectedHour?.id}
            options={hourOptions}
            mode="light"
            onChange={(e) => {
              const selectedValue = e.target.value;
              const selectedHour = hourOptions.find(
                (hour) => hour.id === selectedValue
              );
              setSelectedHour(selectedHour || null);
            }}
          />
          <Input
            name="price"
            title="Preço*:"
            placeholder="Digite o valor do horário"
            type="number"
            required
            mode="light"
            value={price?.toString()}
            onChange={(e) => setPrice(e.target.value === "" ? null : Number(e.target.value))}
          />
          {error && <p className="text-red-600 font-semibold text-sm">{error}</p>}

          <div className="flex gap-4 justify-between mt-4">
            <button
              type="button"
              onClick={onClose}
              className="border-2 border-neutral-500 text-neutral-600 rounded sm py-2 px-4"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full bg-secondary-600 hover:bg-secondary-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Adicionar Horário
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCourtSchedule;
