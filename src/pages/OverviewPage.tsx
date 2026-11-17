import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  GitCompareArrows,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
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
import { ProjectStatusText, SeverityText } from '../components/StatusIndicator';
import { useWorkspace } from '../context/WorkspaceContext';
import { analysisService } from '../services/analysisService';
import { projectService } from '../services/projectService';
import { ActivityEvent, AnalysisHistoryPoint, RegressionFinding } from '../types';

export const OverviewPage: React.FC = () => {
  const {
    projects,
    isLoadingProjects,
    projectsError,
    refreshProjects,
    setActiveProjectId,
  } = useWorkspace();

  const navigate = useNavigate();

  const [history, setHistory] = useState<AnalysisHistoryPoint[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [allRegressions, setAllRegressions] = useState<RegressionFinding[]>([]);
  const [loadingTelemetry, setLoadingTelemetry] = useState(true);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);

  const loadOverviewData = async () => {
    setLoadingTelemetry(true);
    setTelemetryError(null);
    try {
      const [histData, actData, regData] = await Promise.all([
        projectService.getAnalysisHistory(),
        projectService.getRecentActivity(),
        analysisService.getAllRegressionsSummary(),
      ]);
      setHistory(histData);
      setActivity(actData);
      setAllRegressions(regData);
    } catch (err) {
      setTelemetryError(
        err instanceof Error ? err.message : 'Unable to load simulated overview metrics.'
      );
    } finally {
      setLoadingTelemetry(false);
    }
  };

  useEffect(() => {
    void loadOverviewData();
  }, [projects.length]);

  const totalProjects = projects.length;
  const completedComparisons = projects.filter(
    (p) => p.status !== 'Draft' && p.status !== 'Running Simulation'
  ).length;
  const detectedRegressions = projects.reduce((sum, p) => sum + p.regressionCount, 0);
  const criticalFindings = projects.reduce((sum, p) => sum + p.criticalCount, 0);

  // Aggregate regression category counts from demo findings
  const categoryDistribution = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const reg of allRegressions) {
      counts.set(reg.category, (counts.get(reg.category) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([category, count]) => ({
      category: category.replace(' & ', ' / '),
      count,
    }));
  }, [allRegressions]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Migration Regression Overview
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Cross-project post-quantum migration telemetry and simulated regression summary.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/new-analysis')}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>New Migration Analysis</span>
        </button>
      </div>

      <DemoNoticeBanner contextLabel="Demonstration Portfolio · Sample Metrics" />

      {(projectsError || telemetryError) && (
        <ErrorStatePanel
          message={projectsError || telemetryError || 'Error loading data'}
          onRetry={() => {
            void refreshProjects();
            void loadOverviewData();
          }}
        />
      )}

      {/* 4 KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-5">
          <div className="text-xs font-medium text-slate-400">
            Total Analysed Projects (Demo)
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-100">
              {totalProjects}
            </span>
            <span className="text-xs text-slate-400">Repositories tracked</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-5">
          <div className="text-xs font-medium text-slate-400">
            Completed Comparisons (Demo)
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tabular-nums text-cyan-300">
              {completedComparisons}
            </span>
            <span className="text-xs text-slate-400">Baseline vs PQC branch</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-5">
          <div className="text-xs font-medium text-slate-400">
            Detected Regressions (Demo)
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tabular-nums text-amber-400">
              {detectedRegressions}
            </span>
            <button
              type="button"
              onClick={() => navigate('/regressions')}
              className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Investigate</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-5">
          <div className="text-xs font-medium text-slate-400">
            Critical Findings (Demo)
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tabular-nums text-red-400">
              {criticalFindings}
            </span>
            <span className="text-xs text-red-400/80">Immediate triage</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      {loadingTelemetry ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Analysis History Chart */}
          <section className="lg:col-span-7 rounded-lg border border-slate-800/80 bg-[#0B1220] p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Simulated Analysis History
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comparison runs vs detected regressions over recent demonstration cycles
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Demo Time Series</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="qgBlueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="qgAmberGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
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
                  <Area
                    type="monotone"
                    dataKey="analysesCompleted"
                    name="Analyses Run"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#qgBlueGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="regressionsFound"
                    name="Regressions Found"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#qgAmberGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Regression Category Distribution */}
          <section className="lg:col-span-5 rounded-lg border border-slate-800/80 bg-[#0B1220] p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Regression Category Distribution
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Classification across active demonstration findings
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {allRegressions.length} Findings
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryDistribution}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    width={150}
                    stroke="#64748B"
                    tick={{ fill: '#CBD5E1', fontSize: 11 }}
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
                  <Bar
                    dataKey="count"
                    name="Findings"
                    fill="#22D3EE"
                    radius={[0, 4, 4, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}

      {/* Bottom Split: Project Status Table + Recent Project Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Project Status */}
        <section className="xl:col-span-7 rounded-lg border border-slate-800/80 bg-[#0B1220] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Project Status (Demo Portfolio)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select a project to inspect its migration diffs and findings
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
            >
              View all projects →
            </button>
          </div>

          {isLoadingProjects ? (
            <div className="p-5">
              <LoadingSkeleton rows={4} />
            </div>
          ) : projects.length === 0 ? (
            <div className="p-5">
              <EmptyStatePanel
                title="No demonstration projects configured"
                description="Create a simulated migration analysis to populate the workspace."
                actionLabel="New Migration Analysis"
                onAction={() => navigate('/new-analysis')}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-[11px] font-medium text-slate-400 bg-[#0D1526]">
                    <th className="py-3 px-5">Project</th>
                    <th className="py-3 px-4">Versions Compared</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Regressions</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {projects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-100">{project.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {project.language} · {project.totalFilesScanned} files
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                        <div>{project.originalVersion.branch}</div>
                        <div className="text-cyan-400">→ {project.migratedVersion.branch}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <ProjectStatusText status={project.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        <span
                          className={
                            project.regressionCount > 0
                              ? 'text-amber-400 font-semibold'
                              : 'text-slate-400'
                          }
                        >
                          {project.regressionCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveProjectId(project.id);
                            navigate('/regressions');
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer whitespace-nowrap"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Investigate</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent Project Activity */}
        <section className="xl:col-span-5 rounded-lg border border-slate-800/80 bg-[#0B1220] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Recent Project Activity (Demo)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Latest simulated comparison events
              </p>
            </div>
            <GitCompareArrows className="h-4 w-4 text-slate-500" aria-hidden="true" />
          </div>

          <div className="divide-y divide-slate-800/60 flex-1">
            {activity.slice(0, 5).map((event) => (
              <div
                key={event.id}
                className="px-5 py-3.5 hover:bg-slate-800/20 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveProjectId(event.projectId);
                      navigate('/regressions');
                    }}
                    className="text-xs font-semibold text-slate-100 hover:text-blue-300 text-left cursor-pointer"
                  >
                    {event.projectName}
                  </button>
                  {event.severity && event.severity !== 'Info' ? (
                    <SeverityText severity={event.severity} />
                  ) : (
                    <span className="text-[11px] text-cyan-400 font-medium">Event</span>
                  )}
                </div>
                <div className="mt-1 text-xs text-slate-300">{event.action}</div>
                <p className="mt-0.5 text-[11px] text-slate-400 leading-relaxed">
                  {event.detail}
                </p>
                <div className="mt-1.5 text-[11px] font-mono text-slate-500">
                  {event.timestamp}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
