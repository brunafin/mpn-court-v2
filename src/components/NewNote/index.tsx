import React from "react";
import Textarea from "../Textarea";

interface NewReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    date: string;
    defaultMessage?: string;
    message: string;
    setMessage: (message: string) => void;
    is24HoursBefore?: boolean;
    setIs24HoursBefore?: (is24before: boolean) => void;
    showRemind24HoursBefore?: boolean;
}

const NewReminderModal: React.FC<NewReminderModalProps> = ({
    isOpen,
    onClose,
    handleSubmit,
    date,
    defaultMessage = "",
    message = "",
    setMessage,
    is24HoursBefore = false,
    setIs24HoursBefore,
    showRemind24HoursBefore = true,
}) => {

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]"
            onMouseDown={e => e.stopPropagation()}
            tabIndex={-1}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-white p-6 rounded-lg min-w-[320px] shadow-lg"
                onMouseDown={e => e.stopPropagation()}
            >
                <h2 className="text-xl text-neutral-700 font-semibold mb-4">Criar Lembrete</h2>
                <form onSubmit={handleSubmit}>
                    <h3 className="text-neutral-700">Novo lembrete para o dia {date}</h3>
                    <div>
                        <Textarea
                            title="Lembrar de:"
                            placeholder="Digite sua mensagem aqui"
                            name="observation-edit"
                            value={message || defaultMessage}
                            onChange={async (e) => {
                                setMessage(e.target.value || defaultMessage);
                            }}
                            mode="light"
                            maxLength={100}
                            className="w-full pt-4"
                            rows={5}
                        />
                    </div>
                    {showRemind24HoursBefore && (
                        <div className="flex items-center gap-1 mb-2">
                            <input
                                type="checkbox"
                                id="is-24-hours-before"
                                checked={is24HoursBefore}
                                onChange={(e) => {
                                    if (!setIs24HoursBefore) return;
                                    setIs24HoursBefore(e.target.checked);
                                }}
                            />
                            <label
                                htmlFor="is-24-hours-before"
                                className="text-neutral-600 pt-1 ms-1"
                            >
                                Lembrar 24 horas antes
                            </label>
                        </div>
                    )}
                    <div className="flex justify-between gap-2 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-sm py-2 px-4 text-neutral-700 border-1 border-neutral-500"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="w-full rounded-sm py-2 px-4 bg-secondary-500 text-neutral-100 font-bold"
                        >
                            Criar lembrete
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default NewReminderModal;