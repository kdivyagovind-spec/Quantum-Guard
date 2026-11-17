import { MOCK_UNSUPPORTED_AREAS } from '../mocks/analysisMock';
import { Project, TechnicalReportData } from '../types';
import { analysisService } from './analysisService';
import { simulateServiceCall } from './httpClient';

/**
 * Service interface aligned with proposed backend endpoint:
 * GET /api/analyses/:id/report
 */
export const reportService = {
  async generateReport(project: Project): Promise<TechnicalReportData> {
    const [discovery, executionSnapshots, regressions, pqcVerifications] = await Promise.all([
      analysisService.getDiscovery(project),
      analysisService.getExecutionSnapshots(project),
      analysisService.getRegressions(project),
      analysisService.getPqcVerification(project),
    ]);

    return simulateServiceCall(`GET /api/analyses/${project.id}/report`, () => {
      const latestRun = executionSnapshots[0];
      const origTotal = latestRun?.originalSummary.totalTests || 1;
      const origRate = latestRun
        ? `${Math.round((latestRun.originalSummary.passedTests / origTotal) * 100)}%`
        : '100%';
      const migRate = latestRun
        ? `${Math.round((latestRun.migratedSummary.passedTests / origTotal) * 100)}%`
        : '95%';
      const latencyDelta =
        latestRun && latestRun.originalSummary.executionTimeSec > 0
          ? `+${Math.round(
              ((latestRun.migratedSummary.executionTimeSec -
                latestRun.originalSummary.executionTimeSec) /
                latestRun.originalSummary.executionTimeSec) *
                100
            )}%`
          : '+0%';

      const classicalCount = discovery.filter((d) => d.classification === 'Classical').length;
      const postQuantumCount = discovery.filter((d) => d.classification === 'Post-Quantum').length;
      const hybridCount = discovery.filter((d) => d.classification === 'Hybrid').length;
      const unsupportedCount = discovery.filter((d) => d.classification === 'Unsupported').length;

      return {
        reportId: `QG-RPT-${project.id.toUpperCase()}-DEMO`,
        generatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC',
        isPrototypeDemo: true,
        project,
        executiveSummary: `DEMO REPORT: This simulated technical assessment compares ${project.name} (${project.originalVersion.branch} @ ${project.originalVersion.commitHash}) against the post-quantum migration branch (${project.migratedVersion.branch} @ ${project.migratedVersion.commitHash}). Simulated test execution identified ${regressions.length} behavioural regression(s), primarily driven by PQC key/signature size expansion and stricter TLS negotiation policy.`,
        discoverySummary: {
          classicalCount,
          postQuantumCount,
          hybridCount,
          unsupportedCount,
          libraries: Array.from(new Set(discovery.map((d) => `${d.library} (${d.libraryVersion})`))),
        },
        executionSummary: {
          originalPassRate: origRate,
          migratedPassRate: migRate,
          latencyDeltaPct: latencyDelta,
          failedTestsCount: latestRun?.migratedSummary.failedTests ?? 0,
        },
        regressions,
        pqcVerifications,
        unsupportedAreas: MOCK_UNSUPPORTED_AREAS,
      };
    });
  },

  exportReportAsJson(report: TechnicalReportData): void {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${report.reportId.toLowerCase()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  },
};
