import * as React from "react";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
};

type ToastContextType = {
  toast: (props: ToastProps) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<(ToastProps & { id: number })[]>([]);
  const toastIdRef = React.useRef(0);

  const toast = React.useCallback((props: ToastProps) => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { ...props, id }]);

    // Auto-dismiss after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, props.duration || 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-md shadow-md transition-all animate-in fade-in slide-in-from-right-5 ${t.variant === "destructive" ? "bg-red-100 border-l-4 border-red-500" : "bg-white border-l-4 border-hospital-blue"}`}
            role="alert"
          >
            {t.title && <h4 className="font-medium">{t.title}</h4>}
            {t.description && <p className="text-sm text-gray-600">{t.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export const toast = (props: ToastProps) => {
  // This is a fallback for when the hook can't be used
  // It creates a temporary div and renders the toast there
  const div = document.createElement("div");
  document.body.appendChild(div);
  
  const toastElement = document.createElement("div");
  toastElement.className = `fixed bottom-4 right-4 z-50 p-4 rounded-md shadow-md transition-all animate-in fade-in slide-in-from-right-5 ${props.variant === "destructive" ? "bg-red-100 border-l-4 border-red-500" : "bg-white border-l-4 border-hospital-blue"}`;
  toastElement.role = "alert";
  
  if (props.title) {
    const title = document.createElement("h4");
    title.className = "font-medium";
    title.textContent = props.title;
    toastElement.appendChild(title);
  }
  
  if (props.description) {
    const description = document.createElement("p");
    description.className = "text-sm text-gray-600";
    description.textContent = props.description;
    toastElement.appendChild(description);
  }
  
  div.appendChild(toastElement);
  
  setTimeout(() => {
    toastElement.classList.add("fade-out");
    setTimeout(() => {
      document.body.removeChild(div);
    }, 300);
  }, props.duration || 3000);
};