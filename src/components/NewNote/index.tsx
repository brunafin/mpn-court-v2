import React, { useEffect, useId, useRef } from "react";
import Textarea from "../Textarea";
import { BsX } from "react-icons/bs";
import { MdOutlinePostAdd } from "react-icons/md";
import { buttonClassName } from "../Button";
import {
  REMINDER_MESSAGE_MAX_LENGTH,
  noteTextInsertHasDisallowedChars,
  sanitizeNoteTextInput,
} from "../../utils/sanitizeNoteText";

interface NewReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  date: string;
  defaultMessage?: string;
  message: string;
  setMessage: (message: string) => void;
  isSubmitting?: boolean;
}

function sanitizeDefaultMessage(value?: string) {
  if (!value) return "";
  return sanitizeNoteTextInput(
    value
      .replace(/\bundefined\b/gi, "")
      .replace(/\s+-\s+-/g, " -")
      .replace(/\s+-\s*$/g, "")
      .replace(/\s{2,}/g, " ")
      .trim(),
    REMINDER_MESSAGE_MAX_LENGTH,
  );
}

const NewReminderModal: React.FC<NewReminderModalProps> = ({
  isOpen,
  onClose,
  handleSubmit,
  date,
  defaultMessage = "",
  message = "",
  setMessage,
  isSubmitting = false,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const setMessageRef = useRef(setMessage);
  const defaultMessageRef = useRef(defaultMessage);
  const messageRef = useRef(message);

  onCloseRef.current = onClose;
  setMessageRef.current = setMessage;
  defaultMessageRef.current = defaultMessage;
  messageRef.current = message;

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const safeDefault = sanitizeDefaultMessage(defaultMessageRef.current);
    if (!messageRef.current.trim() && safeDefault) {
      setMessageRef.current(safeDefault);
    }

    const focusTimer = window.setTimeout(() => {
      const field = dialogRef.current?.querySelector<HTMLTextAreaElement>(
        "textarea"
      );
      field?.focus();
    }, 50);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
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
  }, [isOpen, isSubmitting]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Fechar modal"
        className="absolute inset-0 bg-black/75"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        disabled={isSubmitting}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 flex w-full max-h-[92dvh] flex-col rounded-t-3xl bg-master-light text-text-light shadow-2xl sm:max-w-md sm:rounded-3xl"
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-text-light/20 sm:hidden" />

        <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-xl font-semibold leading-7 text-text-light"
            >
              Criar lembrete
            </h2>
            <p
              id={descriptionId}
              className="mt-1 text-base leading-6 text-text-light/75"
            >
              Novo lembrete para o dia{" "}
              <span className="font-semibold text-text-light">{date}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            disabled={isSubmitting}
            className="mpn-tap-solid flex size-11 shrink-0 items-center justify-center rounded-full bg-master text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue disabled:opacity-50"
          >
            <BsX size={24} aria-hidden />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2"
        >
          <Textarea
            title="Lembrar de"
            placeholder="Digite o que precisa lembrar"
            name="reminder-message"
            value={message}
            disabled={isSubmitting}
            onChange={(e) =>
              setMessage(
                sanitizeNoteTextInput(
                  e.target.value,
                  REMINDER_MESSAGE_MAX_LENGTH,
                ),
              )
            }
            onBeforeInput={(e) => {
              const native = e.nativeEvent as InputEvent;
              if (native.isComposing || native.data == null) return;
              if (noteTextInsertHasDisallowedChars(native.data)) {
                e.preventDefault();
              }
            }}
            mode="dark"
            maxLength={REMINDER_MESSAGE_MAX_LENGTH}
            rows={4}
            required
          />

          <div className="mt-auto flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
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
              disabled={isSubmitting || !message.trim()}
              className={buttonClassName({
                variant: "primary",
                className: "sm:flex-none sm:min-w-48",
              })}
            >
              <MdOutlinePostAdd size={22} className="shrink-0" aria-hidden />
              {isSubmitting ? "Criando…" : "Criar lembrete"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewReminderModal;
