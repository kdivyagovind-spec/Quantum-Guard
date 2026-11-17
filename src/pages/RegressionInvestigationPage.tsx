import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronRight,
  Copy,
  FileCode2,
  GitCommit,
  Search,
  Terminal,
  Wrench,
} from 'lucide-react';
import {
  EmptyStatePanel,
  ErrorStatePanel,
  LoadingSkeleton,
} from '../components/AsyncStatePanel';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';
import { SeverityText, TriageStatusText } from '../components/StatusIndicator';
import { useWorkspace } from '../context/WorkspaceContext';
import { analysisService } from '../services/analysisService';
import {
  RegressionCategory,
  RegressionFinding,
  Severity,
  TriageStatus,
} from '../types';

const SEVERITIES: Severity[] = ['Critical', 'High', 'Medium', 'Low'];
const CATEGORIES: RegressionCategory[] = [
  'Wire Format & Payload Size',
  'Signature Verification',
  'Key Encapsulation',
  'Performance & Latency',
  'Fallback & Interop',
  'Configuration & Policy',
];

export const RegressionInvestigationPage: React.FC = () => {
  const { activeProject, pushToast } = useWorkspace();

  const [findings, setFindings] = useState<RegressionFinding[]>([]);
  const [selectedFindingId, setSelectedFindingId] = useState<string>('');
  const [activeTraceIndex, setActiveTraceIndex] = useState<number>(3);
  const [evidenceTab, setEvidenceTab] = useState<'code' | 'logs' | 'repro'>('code');
  const [logFilter, setLogFilter] = useState<'ALL' | 'Original' | 'Migrated'>('ALL');

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | Severity>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | RegressionCategory>('ALL');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRegressions = async () => {
    if (!activeProject) return;
    setLoading(true);
    setError(null);
    try {
      const list = await analysisService.getRegressions(activeProject);
      setFindings(list);
      setSelectedFindingId(list[0]?.id ?? '');
      setActiveTraceIndex(3);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load regression findings.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRegressions();
  }, [activeProject?.id]);

  const filteredFindings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return findings.filter((f) => {
      const matchesQuery =
        !q ||
        f.id.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q) ||
        f.filePath.toLowerCase().includes(q) ||
        f.summary.toLowerCase().includes(q);
      const matchesSeverity = severityFilter === 'ALL' || f.severity === severityFilter;
      const matchesCategory = categoryFilter === 'ALL' || f.category === categoryFilter;
      return matchesQuery && matchesSeverity && matchesCategory;
    });
  }, [findings, searchQuery, severityFilter, categoryFilter]);

  const selectedFinding =
    filteredFindings.find((f) => f.id === selectedFindingId) ??
    filteredFindings[0] ??
    null;

  const filteredLogs = useMemo(() => {
    if (!selectedFinding) return [];
    if (logFilter === 'ALL') return selectedFinding.logs;
    return selectedFinding.logs.filter((l) => l.source === logFilter);
  }, [selectedFinding, logFilter]);

  const handleTriageChange = async (findingId: string, nextStatus: TriageStatus) => {
    try {
      await analysisService.updateRegressionTriage(findingId, nextStatus);
      setFindings((prev) =>
        prev.map((f) => (f.id === findingId ? { ...f, triageStatus: nextStatus } : f))
      );
      pushToast({
        title: `Finding ${findingId} updated`,
        description: `Demo triage status set to "${nextStatus}".`,
        variant: 'info',
      });
    } catch (err) {
      pushToast({
        title: 'Unable to update triage status',
        description: err instanceof Error ? err.message : 'Unexpected error',
        variant: 'error',
      });
    }
  };

  const handleCopyRepro = async (steps: string[]) => {
    try {
      await navigator.clipboard.writeText(steps.map((s, i) => `${i + 1}. ${s}`).join('\n'));
      pushToast({
        title: 'Reproduction steps copied',
        description: 'Copied demonstration steps to clipboard.',
        variant: 'success',
      });
    } catch {
      pushToast({
        title: 'Copy unavailable',
        description: 'Clipboard access blocked by browser context.',
        variant: 'warning',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Regression Investigation Workspace
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Interactive root-cause tracing from cryptographic component changes to behavioural execution regressions.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400">
          {filteredFindings.length} of {findings.length} demonstration finding(s)
        </div>
      </div>

      <DemoNoticeBanner
        contextLabel={
          activeProject
            ? `DEMO FINDINGS · ${activeProject.name} (${activeProject.originalVersion.branch} → ${activeProject.migratedVersion.branch})`
            : 'DEMO FINDINGS'
        }
      />

      {/* Search & Filter Toolbar */}
      <div className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search finding ID (e.g., QG-REG-001), file path, or symptom..."
            className="w-full rounded-md border border-slate-800 bg-[#060B14] pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as 'ALL' | Severity)}
            aria-label="Filter by severity"
            className="rounded-md border border-slate-800 bg-[#060B14] px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            {SEVERITIES.map((sev) => (
              <option key={sev} value={sev}>
                {sev}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as 'ALL' | RegressionCategory)
            }
            aria-label="Filter by regression category"
            className="rounded-md border border-slate-800 bg-[#060B14] px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <ErrorStatePanel message={error} onRetry={() => void loadRegressions()} />
      ) : loading ? (
        <LoadingSkeleton rows={6} />
      ) : filteredFindings.length === 0 ? (
        <EmptyStatePanel
          title="No regression findings match your filters"
          description="Reset your search or severity/category filters to view all demonstration findings."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearchQuery('');
            setSeverityFilter('ALL');
            setCategoryFilter('ALL');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Left Findings List */}
          <aside className="xl:col-span-4 rounded-lg border border-slate-800/80 bg-[#0B1220] overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800/80 bg-[#0D1526] flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                Detected Regressions (Demo)
              </span>
              <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                {filteredFindings.length}
              </span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {filteredFindings.map((finding) => {
                const isSelected = selectedFinding?.id === finding.id;
                return (
                  <button
                    key={finding.id}
                    type="button"
                    onClick={() => {
                      setSelectedFindingId(finding.id);
                      setActiveTraceIndex(3);
                    }}
                    className={`w-full text-left p-4 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/15'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-semibold text-cyan-300">
                        {finding.id}
                      </span>
                      <SeverityText severity={finding.severity} />
                    </div>

                    <h3 className="mt-1.5 text-xs font-semibold text-slate-100 leading-snug">
                      {finding.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
                      <span>{finding.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {finding.confidence}% confidence
                      </span>
                      <span aria-hidden="true">·</span>
                      <TriageStatusText status={finding.triageStatus} />
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Detailed Investigation Workspace */}
          {selectedFinding && (
            <div className="xl:col-span-8 space-y-5 min-w-0">
              {/* Finding Summary Header Card */}
              <section className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                      <span className="font-mono font-semibold text-cyan-300">
                        {selectedFinding.id}
                      </span>
                      <span className="text-slate-600">/</span>
                      <SeverityText severity={selectedFinding.severity} />
                      <span className="text-slate-600">/</span>
                      <span className="text-slate-300">{selectedFinding.category}</span>
                      <span className="text-slate-600">/</span>
                      <span className="font-mono tabular-nums text-slate-300">
                        Confidence: {selectedFinding.confidence}%
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-slate-100 leading-snug">
                      {selectedFinding.title}
                    </h2>
                  </div>

                  {/* Triage Status Selector */}
                  <div className="shrink-0">
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Triage Status (Demo)
                    </label>
                    <select
                      value={selectedFinding.triageStatus}
                      onChange={(e) =>
                        void handleTriageChange(
                          selectedFinding.id,
                          e.target.value as TriageStatus
                        )
                      }
                      className="rounded-md border border-slate-700 bg-[#060B14] px-3 py-1.5 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
                    >
                      {(['Open', 'Investigating', 'Accepted Risk', 'Resolved'] as TriageStatus[]).map(
                        (st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedFinding.summary}
                </p>

                {/* Original vs Migrated Execution Outcome Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="rounded-md border border-slate-800 bg-[#060B14] p-3.5">
                    <div className="text-[11px] font-semibold text-emerald-400">
                      Original Execution Result
                    </div>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      {selectedFinding.originalExecutionResult}
                    </p>
                  </div>
                  <div className="rounded-md border border-red-500/25 bg-[#120A10] p-3.5">
                    <div className="text-[11px] font-semibold text-red-400">
                      Migrated Execution Result
                    </div>
                    <p className="mt-1 text-xs text-red-200/90 leading-relaxed">
                      {selectedFinding.migratedExecutionResult}
                    </p>
                  </div>
                </div>
              </section>

              {/* Interactive Migration Impact Tracing Visualization */}
              <section className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">
                      Migration Impact Tracing
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Click any stage along the causal chain to inspect the traced artifact
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400">
                    Interactive Trace · Demo
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch">
                  {selectedFinding.impactTrace.map((node, idx) => {
                    const isFocused = activeTraceIndex === idx;
                    return (
                      <div key={node.stage} className="flex items-stretch gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTraceIndex(idx);
                            if (idx <= 1) setEvidenceTab('code');
                            else if (idx === 2) setEvidenceTab('logs');
                            else setEvidenceTab('repro');
                          }}
                          className={`flex-1 rounded-md border p-3.5 text-left transition-colors cursor-pointer flex flex-col justify-between ${
                            isFocused
                              ? 'border-cyan-400/60 bg-cyan-950/25'
                              : 'border-slate-800 bg-[#060B14] hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="text-[10px] font-mono text-cyan-400">
                              0{idx + 1}. {node.stage}
                            </div>
                            <div className="mt-1.5 text-xs font-semibold text-slate-100 leading-snug">
                              {node.title}
                            </div>
                            <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
                              {node.detail}
                            </p>
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-slate-800/70 font-mono text-[10.5px] text-blue-300 truncate">
                            {node.reference}
                          </div>
                        </button>

                        {idx < selectedFinding.impactTrace.length - 1 && (
                          <div className="hidden md:flex items-center justify-center text-slate-600 shrink-0">
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Focused Stage Callout */}
                <div className="rounded-md border border-slate-800 bg-[#060B14] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span className="font-semibold text-slate-200">
                      {selectedFinding.impactTrace[activeTraceIndex].stage}:
                    </span>
                    <span className="text-slate-300">
                      {selectedFinding.impactTrace[activeTraceIndex].detail}
                    </span>
                  </div>
                  <code className="font-mono text-[11px] text-blue-300">
                    {selectedFinding.impactTrace[activeTraceIndex].reference}
                  </code>
                </div>
              </section>

              {/* Expandable Evidence Tabs: Code & Config / Logs / Reproduction */}
              <section className="rounded-lg border border-slate-800/80 bg-[#0B1220] overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-800/80 bg-[#0D1526] flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-[#060B14] p-1">
                    <button
                      type="button"
                      onClick={() => setEvidenceTab('code')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium cursor-pointer ${
                        evidenceTab === 'code'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileCode2 className="h-3.5 w-3.5" />
                      <span>Code & Config Changes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEvidenceTab('logs')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium cursor-pointer ${
                        evidenceTab === 'logs'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Terminal className="h-3.5 w-3.5" />
                      <span>Execution Logs ({selectedFinding.logs.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEvidenceTab('repro')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium cursor-pointer ${
                        evidenceTab === 'repro'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      <span>Reproduction Steps</span>
                    </button>
                  </div>

                  <span className="font-mono text-[11px] text-slate-400">
                    {selectedFinding.filePath} · {selectedFinding.lineRange}
                  </span>
                </div>

                <div className="p-5">
                  {evidenceTab === 'code' && (
                    <div className="space-y-4 text-xs">
                      <p className="text-slate-300 leading-relaxed">
                        {selectedFinding.codeChangeSummary}
                      </p>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <div className="text-[11px] font-medium text-slate-400 mb-1.5">
                            Original Code Reference
                          </div>
                          <pre className="rounded-md border border-slate-800 bg-[#050911] p-3 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                            {selectedFinding.originalSnippet}
                          </pre>
                        </div>
                        <div>
                          <div className="text-[11px] font-medium text-cyan-300 mb-1.5">
                            Migrated Code Reference
                          </div>
                          <pre className="rounded-md border border-amber-500/25 bg-[#050911] p-3 font-mono text-[11px] text-amber-200 overflow-x-auto leading-relaxed">
                            {selectedFinding.migratedSnippet}
                          </pre>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-2">
                          <GitCommit className="h-3.5 w-3.5" />
                          <span>Dependency & Configuration Changes</span>
                        </div>
                        <ul className="space-y-1 font-mono text-[11px] text-slate-300">
                          {selectedFinding.dependencyOrConfigChanges.map((item, i) => (
                            <li key={i}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {evidenceTab === 'logs' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs text-slate-400">
                          Simulated execution output captured during comparison
                        </div>
                        <div className="inline-flex rounded border border-slate-800 bg-[#060B14] p-0.5 text-[11px]">
                          {(['ALL', 'Original', 'Migrated'] as const).map((src) => (
                            <button
                              key={src}
                              type="button"
                              onClick={() => setLogFilter(src)}
                              className={`px-2.5 py-1 rounded cursor-pointer ${
                                logFilter === src
                                  ? 'bg-blue-600 text-white'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {src}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-md border border-slate-800 bg-[#050911] divide-y divide-slate-800/60 font-mono text-[11px]">
                        {filteredLogs.map((log, i) => (
                          <div
                            key={i}
                            className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                          >
                            <span className="text-slate-500 tabular-nums shrink-0">
                              {log.timestamp}
                            </span>
                            <span
                              className={`font-semibold w-16 shrink-0 ${
                                log.level === 'ERROR'
                                  ? 'text-red-400'
                                  : log.level === 'WARN'
                                  ? 'text-amber-400'
                                  : 'text-cyan-400'
                              }`}
                            >
                              {log.level}
                            </span>
                            <span className="text-slate-400 w-20 shrink-0">
                              [{log.source}]
                            </span>
                            <span className="text-slate-200 break-all">
                              {log.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {evidenceTab === 'repro' && (
                    <div className="space-y-4 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-slate-300">
                          Simulated Reproduction Sequence
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            void handleCopyRepro(selectedFinding.reproductionSteps)
                          }
                          className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-[#0D1526] px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-800 cursor-pointer"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Copy Steps</span>
                        </button>
                      </div>
                      <ol className="space-y-2.5">
                        {selectedFinding.reproductionSteps.map((step, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 rounded-md border border-slate-800 bg-[#060B14] p-3"
                          >
                            <span className="font-mono text-[11px] font-semibold text-cyan-400 shrink-0">
                              0{i + 1}.
                            </span>
                            <span className="text-slate-200 leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
