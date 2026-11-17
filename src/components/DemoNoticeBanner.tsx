import React from 'react';
import { FlaskConical } from 'lucide-react';

interface DemoNoticeBannerProps {
  contextLabel?: string;
}

export const DemoNoticeBanner: React.FC<DemoNoticeBannerProps> = ({
  contextLabel,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cyan-500/25 bg-[#0C1729] px-4 py-2.5 text-xs text-slate-300">
      <div className="flex items-center gap-2.5">
        <FlaskConical className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
        <span className="font-semibold tracking-wide text-cyan-300">
          DEMO MODE — Results are simulated. No actual repository analysis has been performed.
        </span>
      </div>
      {contextLabel && (
        <span className="font-mono text-[11px] text-slate-400">{contextLabel}</span>
      )}
    </div>
  );
};
