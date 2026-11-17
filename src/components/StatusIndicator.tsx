import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { ProjectStatus, Severity, TriageStatus } from '../types';

export const SeverityText: React.FC<{ severity: Severity }> = ({ severity }) => {
  const config: Record<Severity, { color: string; Icon: React.ElementType }> = {
    Critical: { color: 'text-red-400', Icon: ShieldAlert },
    High: { color: 'text-amber-400', Icon: AlertTriangle },
    Medium: { color: 'text-cyan-400', Icon: AlertCircle },
    Low: { color: 'text-slate-400', Icon: Clock },
  };
  const { color, Icon } = config[severity];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${color}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{severity}</span>
    </span>
  );
};

export const ProjectStatusText: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const config: Record<ProjectStatus, { color: string; Icon: React.ElementType }> = {
    Completed: { color: 'text-emerald-400', Icon: CheckCircle2 },
    'Regressions Detected': { color: 'text-red-400', Icon: AlertTriangle },
    'Needs Review': { color: 'text-amber-400', Icon: AlertCircle },
    'Running Simulation': { color: 'text-blue-400', Icon: Clock },
    Draft: { color: 'text-slate-400', Icon: Clock },
  };
  const { color, Icon } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${color}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
};

export const VerificationStatusText: React.FC<{
  status: 'Verified' | 'Warning' | 'Failed';
}> = ({ status }) => {
  if (status === 'Verified') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Verified (Demo)</span>
      </span>
    );
  }
  if (status === 'Warning') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Warning (Demo)</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400">
      <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Not Configured</span>
    </span>
  );
};

export const TriageStatusText: React.FC<{ status: TriageStatus }> = ({ status }) => {
  const colors: Record<TriageStatus, string> = {
    Open: 'text-red-400',
    Investigating: 'text-amber-400',
    'Accepted Risk': 'text-cyan-400',
    Resolved: 'text-emerald-400',
  };
  return <span className={`text-xs font-medium ${colors[status]}`}>{status}</span>;
};
