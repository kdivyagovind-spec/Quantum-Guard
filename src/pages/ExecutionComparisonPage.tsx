import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Terminal,
  XCircle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  EmptyStatePanel,
  ErrorStatePanel,
  LoadingSkeleton,
} from '../components/AsyncStatePanel';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';
import { useWorkspace } from '../context/WorkspaceContext';
import { analysisService } from '../services/analysisService';
import { ExecutionRunSnapshot } from '../types';

export const ExecutionComparisonPage: React.FC = () => {
  const { activeProject } = useWorkspace();

  const [runs, setRuns] = useState<ExecutionRunSnapshot[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [testFilter, setTestFilter] = useState<'all' | 'failed' | 'diff'>('all');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExecution = async () => {
    if (!activeProject) return;
    setLoading(true);
    setError(null);
    try {
      const snapshots = await analysisService.getExecutionSnapshots(activeProject);
      setRuns(snapshots);
      setSelectedRunId(snapshots[0]?.runId ?? '');
      setExpandedTestId(snapshots[0]?.testCases[0]?.id ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load execution comparison.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadExecution();
  }, [activeProject?.id]);

  const currentRun = runs.find((r) => r.runId === selectedRunId) ?? runs[0] ?? null;

  const filteredTestCases = useMemo(() => {
    if (!currentRun) return [];
    if (testFilter === 'failed') {
      return currentRun.testCases.filter((tc) => tc.migratedStatus === 'Failed');
    }
    if (testFilter === 'diff') {
      return currentRun.testCases.filter((tc) => tc.hasOutputDiff);
    }
    return currentRun.testCases;
  }, [currentRun, testFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header & Execution History Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Execution Comparison
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Behavioural comparison of original baseline execution versus post-quantum migrated execution.
          </p>
        </div>

        {runs.length > 0 && (
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-400 whitespace-nowrap">
              Execution History:
            </span>
            <select
              value={selectedRunId}
              onChange={(e) => setSelectedRunId(e.target.value)}
              aria-label="Select simulated execution run"
              className="rounded-md border border-slate-700 bg-[#0B1220] px-3 py-2 font-mono text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
            >
              {runs.map((run) => (
                <option key={run.runId} value={run.runId}>
                  {run.runId} · {run.timestamp}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <DemoNoticeBanner
        contextLabel={
          currentRun
            ? `${currentRun.runId} · ${currentRun.trigger}`
            : 'Simulated Execution Telemetry'
        }
      />

      {error ? (
        <ErrorStatePanel message={error} onRetry={() => void loadExecution()} />
      ) : loading ? (
        <LoadingSkeleton rows={6} />
      ) : !currentRun ? (
        <EmptyStatePanel
          title="No execution comparison runs found"
          description="Run a simulated migration analysis to populate side-by-side execution comparisons."
        />
      ) : (
        <>
          {/* Two Comparison Panels: Original vs Migrated */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            {/* Original Application Panel */}
            <section className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">
                      Original Application ({activeProject?.originalVersion.branch})
                    </h2>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {activeProject?.originalVersion.label}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Build {currentRun.originalSummary.buildStatus}</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 py-4 border-b border-slate-800/70 text-xs">
                  <div>
                    <div className="text-slate-400">Test Results</div>
                    <div className="mt-1 font-mono tabular-nums text-sm font-semibold text-emerald-400">
                      {currentRun.originalSummary.passedTests} /{' '}
                      {currentRun.originalSummary.totalTests} Passed
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Exceptions</div>
                    <div className="mt-1 font-mono tabular-nums text-sm font-semibold text-slate-200">
                      {currentRun.originalSummary.exceptionsCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Execution Time</div>
                    <div className="mt-1 font-mono tabular-nums text-sm font-semibold text-slate-200 inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{currentRun.originalSummary.executionTimeSec}s</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                    <Terminal className="h-3.5 w-3.5 text-slate-400" />
                    <span>Application Output (Simulated)</span>
                  </div>
                  <pre className="rounded-md border border-slate-800 bg-[#050911] p-3 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                    {currentRun.originalSummary.stdoutSample}
                  </pre>
                </div>
              </div>

              <div className="text-[11px] text-slate-400">
                Runtime Exceptions: None observed in baseline execution.
              </div>
            </section>

            {/* Migrated Application Panel */}
            <section className="rounded-lg border border-amber-500/25 bg-[#0B1220] p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-cyan-200">
                      Migrated Application ({activeProject?.migratedVersion.branch})
                    </h2>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {activeProject?.migratedVersion.label}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Build {currentRun.migratedSummary.buildStatus}</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 py-4 border-b border-slate-800/70 text-xs">
                  <div>
                    <div className="text-slate-400">Test Results</div>
                    <div className="mt-1 font-mono tabular-nums text-sm font-semibold text-red-400">
                      {currentRun.migratedSummary.passedTests} /{' '}
                      {currentRun.migratedSummary.totalTests} ({currentRun.migratedSummary.failedTests} Failed)
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Exceptions</div>
                    <div className="mt-1 font-mono tabular-nums text-sm font-semibold text-amber-400">
                      {currentRun.migratedSummary.exceptionsCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Execution Time</div>
                    <div className="mt-1 font-mono tabular-nums text-sm font-semibold text-cyan-300 inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-cyan-500" />
                      <span>{currentRun.migratedSummary.executionTimeSec}s</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                    <Terminal className="h-3.5 w-3.5 text-amber-400" />
                    <span>Application Output (Simulated)</span>
                  </div>
                  <pre className="rounded-md border border-slate-800 bg-[#050911] p-3 font-mono text-[11px] text-amber-200/90 overflow-x-auto leading-relaxed">
                    {currentRun.migratedSummary.stdoutSample}
                  </pre>
                </div>
              </div>

              {currentRun.migratedSummary.runtimeExceptions.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800/70">
                  <div className="text-[11px] font-semibold text-red-400">
                    Captured Runtime Exceptions (Demo)
                  </div>
                  <ul className="space-y-1 font-mono text-[11px] text-red-300/90">
                    {currentRun.migratedSummary.runtimeExceptions.map((ex, i) => (
                      <li key={i} className="truncate" title={ex}>
                        • {ex}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>

          {/* Performance Comparison Chart */}
          <section className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Performance & Wire Size Comparison (Demo Telemetry)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Operation latency (ms) across baseline classical vs migrated PQC execution
                </p>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                Unit: milliseconds (ms)
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
              <div className="xl:col-span-7 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={currentRun.benchmarks}
                    margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis
                      dataKey="operation"
                      stroke="#64748B"
                      tick={{ fill: '#CBD5E1', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#64748B"
                      tick={{ fill: '#94A3B8', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#334155',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#F1F5F9',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar
                      dataKey="originalMs"
                      name="Original (ms)"
                      fill="#64748B"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="migratedMs"
                      name="Migrated PQC (ms)"
                      fill="#22D3EE"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="xl:col-span-5 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                      <th className="py-2 pr-3">Operation</th>
                      <th className="py-2 px-3 text-right">Orig Payload</th>
                      <th className="py-2 pl-3 text-right">Migrated Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                    {currentRun.benchmarks.map((b) => (
                      <tr key={b.operation}>
                        <td className="py-2.5 pr-3 font-sans font-medium text-slate-200">
                          {b.operation}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400">
                          {b.originalBytes.toLocaleString()} B
                        </td>
                        <td className="py-2.5 pl-3 text-right text-cyan-300 font-semibold">
                          {b.migratedBytes.toLocaleString()} B
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Test Case Comparison & Output Diffs */}
          <section className="rounded-lg border border-slate-800/80 bg-[#0B1220] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Test Case Comparison & Output Differences
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any row to inspect original vs migrated output payloads
                </p>
              </div>

              <div className="inline-flex items-center rounded-md border border-slate-800 bg-[#060B14] p-1 gap-1 self-start">
                {(
                  [
                    { id: 'all', label: 'All Tests' },
                    { id: 'failed', label: 'Failed Only' },
                    { id: 'diff', label: 'Output Diffs' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTestFilter(tab.id)}
                    className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                      testFilter === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-[#0D1526] text-[11px] font-medium text-slate-400">
                    <th className="py-3 px-5">Test Case</th>
                    <th className="py-3 px-4">Original</th>
                    <th className="py-3 px-4">Migrated</th>
                    <th className="py-3 px-4 text-right">Duration Delta</th>
                    <th className="py-3 px-5 text-right">Output Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTestCases.map((tc) => {
                    const isOpen = expandedTestId === tc.id;
                    return (
                      <React.Fragment key={tc.id}>
                        <tr
                          onClick={() => setExpandedTestId(isOpen ? null : tc.id)}
                          className="hover:bg-slate-800/30 cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 px-5">
                            <div className="font-mono font-medium text-slate-100">
                              {tc.name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {tc.suite}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>{tc.originalStatus}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {tc.migratedStatus === 'Passed' ? (
                              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Passed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-red-400 font-semibold">
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Failed</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-300">
                            {tc.originalDurationMs}ms → {tc.migratedDurationMs}ms
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            {tc.hasOutputDiff ? (
                              <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span>Changed</span>
                              </span>
                            ) : (
                              <span className="text-slate-500">Identical</span>
                            )}
                          </td>
                        </tr>

                        {isOpen && (
                          <tr className="bg-[#080E1A]">
                            <td colSpan={5} className="px-6 py-4 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <div className="text-[11px] font-medium text-slate-400 mb-1">
                                    Original Output
                                  </div>
                                  <pre className="rounded border border-slate-800 bg-[#050911] p-2.5 font-mono text-[11px] text-slate-300 overflow-x-auto">
                                    {tc.originalOutput}
                                  </pre>
                                </div>
                                <div>
                                  <div className="text-[11px] font-medium text-cyan-300 mb-1">
                                    Migrated Output
                                  </div>
                                  <pre className="rounded border border-slate-800 bg-[#050911] p-2.5 font-mono text-[11px] text-amber-200 overflow-x-auto">
                                    {tc.migratedOutput}
                                  </pre>
                                </div>
                              </div>
                              {tc.failureReason && (
                                <div className="text-xs text-red-300">
                                  Root Cause Note (Demo): {tc.failureReason}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
