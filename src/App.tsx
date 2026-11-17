/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { AppLayout } from './layouts/AppLayout';
import { DiscoveryPage } from './pages/DiscoveryPage';
import { ExecutionComparisonPage } from './pages/ExecutionComparisonPage';
import { MigrationAnalysisPage } from './pages/MigrationAnalysisPage';
import { NewMigrationAnalysisPage } from './pages/NewMigrationAnalysisPage';
import { OverviewPage } from './pages/OverviewPage';
import { PqcVerificationPage } from './pages/PqcVerificationPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { RegressionInvestigationPage } from './pages/RegressionInvestigationPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <WorkspaceProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/new-analysis" element={<NewMigrationAnalysisPage />} />
            <Route path="/discovery" element={<DiscoveryPage />} />
            <Route path="/migration" element={<MigrationAnalysisPage />} />
            <Route path="/execution" element={<ExecutionComparisonPage />} />
            <Route path="/regressions" element={<RegressionInvestigationPage />} />
            <Route path="/pqc-verification" element={<PqcVerificationPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </WorkspaceProvider>
  );
}
