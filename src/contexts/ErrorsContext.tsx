import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";
import {
  MdCheckCircleOutline,
  MdClose,
  MdErrorOutline,
  MdInfoOutline,
  MdWarningAmber,
} from "react-icons/md";

export interface IError {
  message: string;
  type?: "error" | "warning" | "info" | "success";
}

interface IErrorsContext {
  notifyError: (error: IError) => void;
}

const ErrorsContext = createContext<IErrorsContext | undefined>(undefined);

export const useErrors = () => {
  const context = useContext(ErrorsContext);
  if (!context)
    throw new Error("useErrors must be used within ErrorsProvider");
  return context;
};

const toastMeta: Record<
  NonNullable<IError["type"]>,
  {
    Icon: typeof MdErrorOutline;
    barClass: string;
    iconWrapClass: string;
    label: string;
  }
> = {
  error: {
    Icon: MdErrorOutline,
    barClass: "bg-danger-400",
    iconWrapClass: "bg-danger-400/20 text-danger-soft",
    label: "Erro",
  },
  warning: {
    Icon: MdWarningAmber,
    barClass: "bg-warning-500",
    iconWrapClass: "bg-warning-500/20 text-warning-500",
    label: "Atenção",
  },
  info: {
    Icon: MdInfoOutline,
    barClass: "bg-accent-blue",
    iconWrapClass: "bg-accent-blue/20 text-accent-blue-soft",
    label: "Informação",
  },
  success: {
    Icon: MdCheckCircleOutline,
    barClass: "bg-accent-green",
    iconWrapClass: "bg-accent-green/20 text-accent-green",
    label: "Sucesso",
  },
};

type ToastEntry = IError & { id: number; type: NonNullable<IError["type"]> };

export const ErrorsProvider = ({ children }: { children: ReactNode }) => {
  const [errors, setErrors] = useState<ToastEntry[]>([]);

  const dismiss = useCallback((id: number) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const notifyError = useCallback(
    (error: IError) => {
      const id = Date.now() + Math.random();
      const entry: ToastEntry = {
        ...error,
        id,
        type: error.type || "error",
      };
      setErrors((prev) => [entry, ...prev]);
      window.setTimeout(() => {
        dismiss(id);
      }, 4500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notifyError }), [notifyError]);

  return (
    <ErrorsContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[1200] flex flex-col items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
        aria-live="polite"
        aria-relevant="additions"
      >
        {errors.map((e) => {
          const meta = toastMeta[e.type];
          const { Icon } = meta;
          return (
            <div
              key={e.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-md overflow-hidden rounded-2xl bg-master-light shadow-[0_8px_28px_rgba(0,0,0,0.45)] ring-1 ring-inset ring-text-light/10"
            >
              <span className={`w-1 shrink-0 ${meta.barClass}`} aria-hidden />
              <div className="flex min-w-0 flex-1 items-start gap-3 px-3.5 py-3.5">
                <span
                  className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${meta.iconWrapClass}`}
                  aria-hidden
                >
                  <Icon size={22} />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-semibold text-text-light/55">
                    {meta.label}
                  </p>
                  <p className="mt-0.5 text-base font-medium leading-6 text-text-light">
                    {e.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(e.id)}
                  aria-label="Fechar aviso"
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl text-text-light/55 transition hover:bg-master hover:text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
                >
                  <MdClose size={20} aria-hidden />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ErrorsContext.Provider>
  );
};
