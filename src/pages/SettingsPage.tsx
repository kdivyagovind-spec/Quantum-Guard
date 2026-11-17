import React, { useState } from 'react';
import { RotateCcw, Save, Server } from 'lucide-react';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';
import { API_ENDPOINTS } from '../config/api';
import { useWorkspace } from '../context/WorkspaceContext';

export const SettingsPage: React.FC = () => {
  const { demoSettings, updateDemoSettings, resetAllDemoData, pushToast } =
    useWorkspace();

  const [apiBaseUrl, setApiBaseUrl] = useState(demoSettings.apiBaseUrl);
  const [latencyMs, setLatencyMs] = useState(demoSettings.simulatedLatencyMs);
  const [simulateError, setSimulateError] = useState(demoSettings.simulateNetworkError);
  const [timeoutSec, setTimeoutSec] = useState(demoSettings.defaultTestTimeoutSec);
  const [strictFips, setStrictFips] = useState(demoSettings.strictFipsMode);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateDemoSettings({
      apiBaseUrl: apiBaseUrl.trim() || '/api',
      simulatedLatencyMs: latencyMs,
      simulateNetworkError: simulateError,
      defaultTestTimeoutSec: timeoutSec,
      strictFipsMode: strictFips,
    });
    pushToast({
      title: 'Prototype Settings Updated',
      description: simulateError
        ? 'Simulated API error injection enabled for testing error states.'
        : `Service latency set to ${latencyMs}ms.`,
      variant: simulateError ? 'warning' : 'success',
    });
  };

  const endpointContracts = [
    { method: 'POST', path: API_ENDPOINTS.projects, purpose: 'Register project & repository metadata' },
    { method: 'GET', path: API_ENDPOINTS.projects, purpose: 'List analyzed migration projects' },
    { method: 'GET', path: '/projects/:id', purpose: 'Retrieve single project details' },
    { method: 'POST', path: API_ENDPOINTS.analyses, purpose: 'Trigger backend PQC regression analysis job' },
    { method: 'GET', path: '/analyses/:id', purpose: 'Poll analysis job status & metadata' },
    { method: 'GET', path: '/analyses/:id/discovery', purpose: 'Fetch AST cryptographic discovery inventory' },
    { method: 'GET', path: '/analyses/:id/comparison', purpose: 'Fetch code diffs and execution comparison' },
    { method: 'GET', path: '/analyses/:id/regressions', purpose: 'Fetch detected regressions and impact traces' },
    { method: 'GET', path: '/analyses/:id/pqc-verification', purpose: 'Fetch ML-KEM, ML-DSA, SLH-DSA verification matrix' },
    { method: 'GET', path: '/analyses/:id/report', purpose: 'Assemble structured technical report payload' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Workspace & Prototype Settings
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Configure Phase 1 mock service behavior, inspect future backend API contracts, and reset local demonstration state.
        </p>
      </div>

      <DemoNoticeBanner contextLabel="Phase 1 Service Layer Configuration" />

      {/* Settings Form */}
      <form
        onSubmit={handleSave}
        className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-6 space-y-5 text-xs"
      >
        <h2 className="text-sm font-semibold text-slate-100 border-b border-slate-800 pb-3">
          Mock Service Provider Controls
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block font-medium text-slate-300 mb-1.5">
              Future API Base URL
            </label>
            <input
              type="text"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-[#060B14] px-3 py-2 font-mono text-slate-100 focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Centralized in src/config/api.ts for Phase 2 backend cutover.
            </p>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1.5">
              Default Test Timeout Target (seconds)
            </label>
            <input
              type="number"
              min={5}
              max={300}
              value={timeoutSec}
              onChange={(e) => setTimeoutSec(Number(e.target.value))}
              className="w-full rounded-md border border-slate-700 bg-[#060B14] px-3 py-2 font-mono tabular-nums text-slate-100 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="font-medium text-slate-300">
              Simulated Service Latency (ms)
            </label>
            <span className="font-mono tabular-nums text-cyan-300">
              {latencyMs} ms
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1500}
            step={50}
            value={latencyMs}
            onChange={(e) => setLatencyMs(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <p className="text-[11px] text-slate-500">
            Adjust simulated async delay to preview loading skeletons across pages.
          </p>
        </div>

        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <label className="flex items-center gap-2.5 text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={strictFips}
              onChange={(e) => setStrictFips(e.target.checked)}
              className="accent-blue-600"
            />
            <span>Enforce NIST FIPS 203 / 204 / 205 parameter checks in demo verification</span>
          </label>

          <label className="flex items-center gap-2.5 text-amber-300 cursor-pointer">
            <input
              type="checkbox"
              checked={simulateError}
              onChange={(e) => setSimulateError(e.target.checked)}
              className="accent-amber-500"
            />
            <span>
              Simulate API Network Error (tests ErrorStatePanel and Retry UX across workspace)
            </span>
          </label>
        </div>

        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => void resetAllDemoData()}
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-[#0D1526] px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset All Demo Data</span>
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* Proposed Future Backend Contracts */}
      <section className="rounded-lg border border-slate-800/80 bg-[#0B1220] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-100">
              Proposed Backend Integration Contracts (Phase 2)
            </h2>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            Base: {demoSettings.apiBaseUrl}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 bg-[#0D1526] text-[11px] font-medium text-slate-400">
                <th className="py-2.5 px-5 w-24">Method</th>
                <th className="py-2.5 px-4">Endpoint Path</th>
                <th className="py-2.5 px-5">Responsibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {endpointContracts.map((ep) => (
                <tr key={`${ep.method}-${ep.path}`}>
                  <td className="py-2.5 px-5 font-mono font-semibold text-cyan-300">
                    {ep.method}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-200">
                    {demoSettings.apiBaseUrl}
                    {ep.path}
                  </td>
                  <td className="py-2.5 px-5 text-slate-400">{ep.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
