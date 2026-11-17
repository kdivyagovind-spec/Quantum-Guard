import React, { useEffect, useState } from 'react';
import {
  Download,
  FileText,
  Printer,
} from 'lucide-react';
import {
  EmptyStatePanel,
  ErrorStatePanel,
  LoadingSkeleton,
} from '../components/AsyncStatePanel';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';
import { SeverityText, VerificationStatusText } from '../components/StatusIndicator';
import { useWorkspace } from '../context/WorkspaceContext';
import { reportService } from '../services/reportService';
import { TechnicalReportData } from '../types';

type ReportSectionKey =
  | 'executive'
  | 'repository'
  | 'discovery'
  | 'execution'
  | 'regressions'
  | 'impact'
  | 'pqc'
  | 'unsupported';

const SECTION_LABELS: Array<{ key: ReportSectionKey; label: string }> = [
  { key: 'executive', label: '1. Executive Summary' },
  { key: 'repository', label: '2. Repository Details' },
  { key: 'discovery', label: '3. Cryptographic Discovery' },
  { key: 'execution', label: '4. Execution Comparison' },
  { key: 'regressions', label: '5. Regression Findings' },
  { key: 'impact', label: '6. Migration Impact Evidence' },
  { key: 'pqc', label: '7. PQC Verification' },
  { key: 'unsupported', label: '8. Unsupported Areas' },
];

export const ReportsPage: React.FC = () => {
  const { activeProject, pushToast } = useWorkspace();

  const [report, setReport] = useState<TechnicalReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includedSections, setIncludedSections] = useState<Record<ReportSectionKey, boolean>>({
    executive: true,
    repository: true,
    discovery: true,
    execution: true,
    regressions: true,
    impact: true,
    pqc: true,
    unsupported: true,
  });

  const loadReport = async () => {
    if (!activeProject) return;
    setLoading(true);
    setError(null);
    try {
      const data = await reportService.generateReport(activeProject);
      setReport(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to generate demonstration report.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport();
  }, [activeProject?.id]);

  const toggleSection = (key: ReportSectionKey) => {
    setIncludedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportJson = () => {
    if (!report) return;
    reportService.exportReportAsJson(report);
    pushToast({
      title: 'JSON Report Exported',
      description: `Downloaded ${report.reportId.toLowerCase()}.json (Demo data).`,
      variant: 'success',
    });
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Technical Migration Reports
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Preview, customize sections, and export demonstration regression assessment reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            disabled={!report}
            onClick={handleExportJson}
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-[#0D1526] px-3.5 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            type="button"
            disabled={!report}
            onClick={handlePrintReport}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      <div className="no-print">
        <DemoNoticeBanner
          contextLabel={report ? `${report.reportId} · Demonstration Export` : undefined}
        />
      </div>

      {error ? (
        <ErrorStatePanel message={error} onRetry={() => void loadReport()} />
      ) : loading ? (
        <LoadingSkeleton rows={6} />
      ) : !report ? (
        <EmptyStatePanel
          title="No project selected for reporting"
          description="Select an active demonstration project from the top navigation bar."
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Left Section Filter Sidebar */}
          <aside className="no-print xl:col-span-3 rounded-lg border border-slate-800/80 bg-[#0B1220] p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 border-b border-slate-800 pb-2.5">
              <FileText className="h-4 w-4 text-blue-400" />
              <span>Report Sections</span>
            </div>

            <div className="space-y-2 text-xs">
              {SECTION_LABELS.map((sec) => (
                <label
                  key={sec.key}
                  className="flex items-center gap-2.5 text-slate-300 cursor-pointer py-1 hover:text-white"
                >
                  <input
                    type="checkbox"
                    checked={includedSections[sec.key]}
                    onChange={() => toggleSection(sec.key)}
                    className="accent-blue-600"
                  />
                  <span>{sec.label}</span>
                </label>
              ))}
            </div>
          </aside>

          {/* Right Document Preview */}
          <article className="print-only-full xl:col-span-9 rounded-lg border border-slate-800/80 bg-[#0B1220] p-6 lg:p-8 space-y-7 text-xs">
            {/* Document Masthead */}
            <header className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="font-mono text-[11px] text-cyan-400">
                  QUANTUM GUARD · DEMONSTRATION TECHNICAL REPORT
                </div>
                <h2 className="mt-1 text-xl font-bold text-slate-100">
                  {report.project.name} — PQC Migration Regression Assessment
                </h2>
                <div className="mt-1.5 text-slate-400 font-mono text-[11px]">
                  Report ID: {report.reportId} · Generated: {report.generatedAt}
                </div>
              </div>
              <div className="rounded border border-cyan-500/30 bg-cyan-950/30 px-3 py-1.5 text-[11px] font-semibold text-cyan-300 shrink-0">
                DEMO MODE · SIMULATED DATA
              </div>
            </header>

            {includedSections.executive && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-100">
                  1. Executive Summary
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  {report.executiveSummary}
                </p>
              </section>
            )}

            {includedSections.repository && (
              <section className="space-y-3 pt-4 border-t border-slate-800/80">
                <h3 className="text-sm font-semibold text-slate-100">
                  2. Repository Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-md border border-slate-800 bg-[#060B14] p-4">
                  <div>
                    <span className="text-slate-400">Repository: </span>
                    <span className="font-mono text-slate-200 break-all">
                      {report.project.repositoryUrl}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Language: </span>
                    <span className="text-slate-200 font-medium">
                      {report.project.language}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Original Version: </span>
                    <span className="font-mono text-slate-200">
                      {report.project.originalVersion.branch} ({report.project.originalVersion.commitHash})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Migrated Version: </span>
                    <span className="font-mono text-cyan-300">
                      {report.project.migratedVersion.branch} ({report.project.migratedVersion.commitHash})
                    </span>
                  </div>
                </div>
              </section>
            )}

            {includedSections.discovery && (
              <section className="space-y-3 pt-4 border-t border-slate-800/80">
                <h3 className="text-sm font-semibold text-slate-100">
                  3. Cryptographic Discovery Results
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
                  <div className="rounded border border-slate-800 bg-[#060B14] p-3">
                    <div className="text-[11px] font-sans text-slate-400">Post-Quantum</div>
                    <div className="text-base font-bold text-cyan-300 mt-0.5">
                      {report.discoverySummary.postQuantumCount}
                    </div>
                  </div>
                  <div className="rounded border border-slate-800 bg-[#060B14] p-3">
                    <div className="text-[11px] font-sans text-slate-400">Hybrid</div>
                    <div className="text-base font-bold text-blue-400 mt-0.5">
                      {report.discoverySummary.hybridCount}
                    </div>
                  </div>
                  <div className="rounded border border-slate-800 bg-[#060B14] p-3">
                    <div className="text-[11px] font-sans text-slate-400">Classical</div>
                    <div className="text-base font-bold text-slate-200 mt-0.5">
                      {report.discoverySummary.classicalCount}
                    </div>
                  </div>
                  <div className="rounded border border-slate-800 bg-[#060B14] p-3">
                    <div className="text-[11px] font-sans text-slate-400">Unsupported</div>
                    <div className="text-base font-bold text-amber-400 mt-0.5">
                      {report.discoverySummary.unsupportedCount}
                    </div>
                  </div>
                </div>
                <div className="text-slate-400">
                  Detected Providers:{' '}
                  <span className="font-mono text-slate-200">
                    {report.discoverySummary.libraries.join(' · ')}
                  </span>
                </div>
              </section>
            )}

            {includedSections.execution && (
              <section className="space-y-3 pt-4 border-t border-slate-800/80">
                <h3 className="text-sm font-semibold text-slate-100">
                  4. Execution Comparison
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
                  <div className="rounded border border-slate-800 bg-[#060B14] p-3">
                    <div className="text-[11px] font-sans text-slate-400">Original Pass Rate</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">
                      {report.executionSummary.originalPassRate}
                    </div>
                  </div>
                  <div className="rounded border border-slate-800 bg-[#060B14] p-3">
                    <div className="text-[11px] font-sans text-slate-400">Migrated Pass Rate</div>
                    <div className="text-base font-bold text-amber-400 mt-0.5">
                      {report.executionSummary.migratedPassRate}
                    </div>
                  </div>
                  <div className="rounded border border-slate-800 bg-[#060B14] p-3">
                    <div className="text-[11px] font-sans text-slate-400">Failed Tests</div>
                    <div className="text-base font-bold text-red-400 mt-0.5">
                      {report.executionSummary.failedTestsCount}
                    </div>
                  </div>
                  <div className="rounded border border-slate-800 bg-[#060B14] p-3">
                    <div className="text-[11px] font-sans text-slate-400">Execution Delta</div>
                    <div className="text-base font-bold text-cyan-300 mt-0.5">
                      {report.executionSummary.latencyDeltaPct}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {includedSections.regressions && (
              <section className="space-y-3 pt-4 border-t border-slate-800/80">
                <h3 className="text-sm font-semibold text-slate-100">
                  5. Regression Findings ({report.regressions.length})
                </h3>
                <div className="space-y-3">
                  {report.regressions.map((reg) => (
                    <div
                      key={reg.id}
                      className="rounded-md border border-slate-800 bg-[#060B14] p-4 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-cyan-300">
                            {reg.id}
                          </span>
                          <span className="font-semibold text-slate-100">
                            {reg.title}
                          </span>
                        </div>
                        <SeverityText severity={reg.severity} />
                      </div>
                      <p className="text-slate-300 leading-relaxed">{reg.summary}</p>
                      <div className="font-mono text-[11px] text-slate-400">
                        Location: {reg.filePath} ({reg.lineRange}) · Confidence: {reg.confidence}%
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {includedSections.impact && (
              <section className="space-y-3 pt-4 border-t border-slate-800/80">
                <h3 className="text-sm font-semibold text-slate-100">
                  6. Migration Impact Evidence
                </h3>
                <div className="space-y-2.5">
                  {report.regressions.map((reg) => (
                    <div
                      key={reg.id}
                      className="rounded-md border border-slate-800 bg-[#060B14] p-3.5"
                    >
                      <div className="font-mono text-[11px] text-cyan-300 mb-1.5">
                        {reg.id} Impact Chain
                      </div>
                      <div className="text-slate-300 leading-relaxed">
                        {reg.impactTrace.map((n) => n.title).join(' → ')}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {includedSections.pqc && (
              <section className="space-y-3 pt-4 border-t border-slate-800/80">
                <h3 className="text-sm font-semibold text-slate-100">
                  7. PQC Verification Summary
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                        <th className="py-2 pr-3">Standard</th>
                        <th className="py-2 px-3">Domain</th>
                        <th className="py-2 px-3">Configured</th>
                        <th className="py-2 pl-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {report.pqcVerifications.map((v) => (
                        <tr key={v.id}>
                          <td className="py-2.5 pr-3 font-semibold text-slate-100">
                            {v.standard} ({v.fipsReference})
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">{v.domain}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-300">
                            {v.configuredAlgorithm}
                          </td>
                          <td className="py-2.5 pl-3 text-right">
                            <VerificationStatusText status={v.executionStatus} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {includedSections.unsupported && (
              <section className="space-y-3 pt-4 border-t border-slate-800/80">
                <h3 className="text-sm font-semibold text-slate-100">
                  8. Unsupported Analysis Areas
                </h3>
                <div className="space-y-2.5">
                  {report.unsupportedAreas.map((area) => (
                    <div
                      key={area.area}
                      className="rounded-md border border-amber-500/20 bg-[#120F0B] p-3.5 space-y-1"
                    >
                      <div className="font-semibold text-amber-300">{area.area}</div>
                      <p className="text-slate-300">{area.reason}</p>
                      <div className="text-[11px] text-slate-400">
                        Recommendation: {area.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>
        </div>
      )}
    </div>
  );
};
