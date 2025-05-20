import React, { useState, useEffect, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

// Types
type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  type?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
};

type ToastContextValue = {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, 'id'>) => void;
  removeToast: (id: string) => void;
};

// Context
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = ({ title, description, type = 'default', duration = 5000 }: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

// Toast Component
function Toast({ toast }: { toast: ToastProps }) {
  const { removeToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast, removeToast]);

  return (
    <div
      className={cn(
        'relative flex w-full max-w-sm overflow-hidden rounded-lg border shadow-lg',
        'p-4 pr-12 transition-all animate-in fade-in slide-in-from-top-5',
        toast.type === 'success' && 'bg-green-50 border-green-200 text-green-900',
        toast.type === 'error' && 'bg-red-50 border-red-200 text-red-900',
        toast.type === 'warning' && 'bg-yellow-50 border-yellow-200 text-yellow-900',
        toast.type === 'default' && 'bg-white border-slate-200 text-slate-900'
      )}
    >
      <div className="flex flex-col gap-1">
        {toast.title && (
          <div className="font-medium">{toast.title}</div>
        )}
        {toast.description && (
          <div className="text-sm opacity-90">{toast.description}</div>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="absolute top-2 right-2 rounded-md p-1 text-slate-500 hover:text-slate-900"
      >
        &times;
      </button>
    </div>
  );
}

// Toaster Component
export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed top-0 right-0 z-50 flex flex-col p-4 gap-2 max-h-screen overflow-hidden">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
} 