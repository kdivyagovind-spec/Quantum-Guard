import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useWorkspace();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 w-full max-w-sm pointer-events-none px-4 sm:px-0 no-print"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const styles = {
          success: {
            border: 'border-emerald-500/35',
            icon: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />,
          },
          warning: {
            border: 'border-amber-500/35',
            icon: <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />,
          },
          error: {
            border: 'border-red-500/35',
            icon: <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />,
          },
          info: {
            border: 'border-cyan-500/35',
            icon: <Info className="h-4 w-4 text-cyan-400 shrink-0" />,
          },
        }[toast.variant];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 rounded-lg border ${styles.border} bg-[#0F172A] p-3.5 shadow-xl`}
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5">{styles.icon}</div>
              <div>
                <p className="text-xs font-semibold text-slate-100">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-[11px] text-slate-400 leading-relaxed">
                    {toast.description}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
