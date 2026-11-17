import React from 'react';
import { AlertTriangle, FolderOpen, RefreshCw } from 'lucide-react';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div
      className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-6 space-y-4"
      aria-busy="true"
      aria-label="Loading demonstration data"
    >
      <div className="h-5 w-48 rounded bg-slate-800/80 animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-slate-800/50 last:border-0">
            <div className="h-4 w-1/3 rounded bg-slate-800/70 animate-pulse" />
            <div className="h-4 w-1/4 rounded bg-slate-800/50 animate-pulse" />
            <div className="h-4 w-20 rounded bg-slate-800/70 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ErrorStatePanel: React.FC<{
  message: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => {
  return (
    <div className="rounded-lg border border-red-500/30 bg-[#140C14] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-semibold text-red-200">Data Service Request Failed</h3>
          <p className="mt-1 text-xs text-red-300/80 max-w-2xl">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-200 hover:bg-red-500/20 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Retry Request</span>
        </button>
      )}
    </div>
  );
};

export const EmptyStatePanel: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => {
  return (
    <div className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-10 text-center flex flex-col items-center justify-center">
      <div className="h-10 w-10 rounded-lg border border-slate-800 bg-[#111A2E] flex items-center justify-center mb-3">
        <FolderOpen className="h-5 w-5 text-slate-400" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <p className="mt-1.5 text-xs text-slate-400 max-w-md leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
