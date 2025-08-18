import { createContext, useContext, useState, ReactNode } from "react";

export interface IError {
    message: string;
    type?: "error" | "warning" | "info";
}

interface IErrorsContext {
    notifyError: (error: IError) => void;
}

const ErrorsContext = createContext<IErrorsContext | undefined>(undefined);

export const useErrors = () => {
    const context = useContext(ErrorsContext);
    if (!context) throw new Error("useErrors must be used within ErrorsProvider");
    return context;
};

export const ErrorsProvider = ({ children }: { children: ReactNode }) => {
    const [errors, setErrors] = useState<IError[]>([]);

    const notifyError = (error: IError) => {
        setErrors((prev) => [...prev, error]);
        setTimeout(() => {
            setErrors((prev) => prev.filter((e) => e !== error));
        }, 4000);
    };

    return (
        <ErrorsContext.Provider value={{ notifyError }}>
            {children}
            <div className="fixed bottom-4 left-0 w-full flex flex-col items-center gap-2 z-50 pointer-events-none">
                {errors.map((e, i) => (
                    <div
                        key={i}
                        className={`max-w-sm w-full px-4 py-2 rounded shadow-lg text-white pointer-events-auto transition-all
                            ${e.type === "error" ? "bg-red-500" :
                              e.type === "warning" ? "bg-yellow-500" : "bg-gray-500"}`}
                    >
                        {e.message}
                    </div>
                ))}
            </div>
        </ErrorsContext.Provider>
    );
};
