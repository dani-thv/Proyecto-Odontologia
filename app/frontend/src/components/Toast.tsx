import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CheckIcon, CloseIcon } from "./icons";

type Tone = "success" | "error";
const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; tone: Tone } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((message: string, tone: Tone = "success") => {
    setToast({ message, tone });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), tone === "error" ? 5000 : 3000);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div role="status" aria-live="polite">
        {toast && (
          <div className="toast-msg">
            {toast.tone === "error" ? (
              <CloseIcon size={18} strokeWidth={2.5} className="text-red-500" />
            ) : (
              <CheckIcon size={18} strokeWidth={2.5} className="text-green-500" />
            )}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
