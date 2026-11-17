import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileArchive,
  GitBranch,
  Loader2,
  Play,
  ShieldAlert,
  Upload,
} from 'lucide-react';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';
import { useWorkspace } from '../context/WorkspaceContext';
import { analysisService } from '../services/analysisService';
import { NewAnalysisRequest, ProgrammingLanguage, Project } from '../types';

const CRYPTO_LIBRARIES = [
  'OpenSSL 3.5 + liboqs-provider',
  'cloudflare/circl (Go PQC)',
  'BouncyCastle BCPQC (Java)',
  'pqcrypto-rs / RustCrypto',
  'BoringSSL (X25519MLKEM768)',
  'wolfCrypt PQC',
];

const SIMULATION_STAGES = [
  {
    title: 'Repository Review',
    detail: 'Indexing source tree and parsing version metadata (simulated)',
  },
  {
    title: 'Cryptographic Discovery',
    detail: 'Matching classical, hybrid, and NIST PQC library imports (simulated)',
  },
  {
    title: 'Baseline Comparison',
    detail: 'Diffing cryptographic call-sites, dependencies, and config policies (simulated)',
  },
  {
    title: 'Behavioural Analysis',
    detail: 'Comparing original vs migrated test execution outputs and wire sizes (simulated)',
  },
  {
    title: 'PQC Validation',
    detail: 'Checking ML-KEM, ML-DSA, and SLH-DSA compliance rules (simulated)',
  },
];

export const NewMigrationAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveProjectId, refreshProjects, pushToast } = useWorkspace();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [form, setForm] = useState<NewAnalysisRequest>({
    projectName: 'Meridian Payment Switch',
    repositoryUrl: 'https://github.com/meridian-pay/tls-switch',
    repositorySource: 'git',
    archiveFileName: '',
    language: 'Go',
    originalBranch: 'main',
    originalCommit: '4e91a0c',
    migratedBranch: 'feat/pqc-mlkem768',
    migratedCommit: '8b23d1f',
    comparisonSummary:
      'Evaluating migration from classical X25519/ECDSA-P256 to X25519MLKEM768 and ML-DSA-65.',
    selectedLibraries: [
      'cloudflare/circl (Go PQC)',
      'OpenSSL 3.5 + liboqs-provider',
    ],
    testCommand: 'go test ./... -race -v',
    enableAstTracing: true,
    enableWireFormatDiff: true,
    enableNistParameterCheck: true,
  });

  // Simulation Runner State
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(-1);
  const [completedProject, setCompletedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!isSimulating) return;

    if (currentStageIndex < SIMULATION_STAGES.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStageIndex((idx) => idx + 1);
      }, 650);
      return () => clearTimeout(timer);
    }

    // Final stage complete -> create simulated project record
    const finalizeTimer = setTimeout(async () => {
      try {
        const created = await analysisService.initiateSimulatedAnalysis(form);
        await refreshProjects();
        setActiveProjectId(created.id);
        setCompletedProject(created);
        setIsSimulating(false);
        pushToast({
          title: 'Simulated analysis completed',
          description: `Demonstration findings generated for ${created.name}.`,
          variant: 'success',
        });
      } catch (err) {
        setIsSimulating(false);
        setValidationError(
          err instanceof Error ? err.message : 'Simulation failed.'
        );
      }
    }, 700);

    return () => clearTimeout(finalizeTimer);
  }, [isSimulating, currentStageIndex, form, pushToast, refreshProjects, setActiveProjectId]);

  const toggleLibrary = (lib: string) => {
    setForm((prev) => {
      const exists = prev.selectedLibraries.includes(lib);
      return {
        ...prev,
        selectedLibraries: exists
          ? prev.selectedLibraries.filter((l) => l !== lib)
          : [...prev.selectedLibraries, lib],
      };
    });
  };

  const handleSimulatedFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({
        ...prev,
        repositorySource: 'archive',
        archiveFileName: file.name,
      }));
    }
  };

  const handleNext = () => {
    setValidationError(null);
    if (step === 1) {
      if (!form.projectName.trim()) {
        setValidationError('Please provide a project name.');
        return;
      }
      if (form.repositorySource === 'git' && !form.repositoryUrl.trim()) {
        setValidationError('Please enter a Git repository URL or switch to archive upload.');
        return;
      }
      if (form.repositorySource === 'archive' && !form.archiveFileName) {
        setValidationError('Select a mock archive file name to simulate repository upload.');
        return;
      }
    }
    if (step === 2) {
      if (!form.originalBranch.trim() || !form.migratedBranch.trim()) {
        setValidationError('Both original and migrated branch/commit references are required.');
        return;
      }
    }
    if (step === 3) {
      if (form.selectedLibraries.length === 0) {
        setValidationError('Select at least one cryptographic library profile.');
        return;
      }
    }
    setStep((s) => Math.min(4, s + 1) as 1 | 2 | 3 | 4);
  };

  const handleStartSimulation = () => {
    setValidationError(null);
    setCompletedProject(null);
    setCurrentStageIndex(0);
    setIsSimulating(true);
  };

  const stepLabels = [
    { num: 1, title: 'Repository Selection' },
    { num: 2, title: 'Version Configuration' },
    { num: 3, title: 'Analysis Configuration' },
    { num: 4, title: 'Review & Initiate' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          New Migration Analysis
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Configure a simulated baseline-to-PQC comparison workflow. No repositories are uploaded, cloned, or executed in Phase 1.
        </p>
      </div>

      <DemoNoticeBanner contextLabel="Simulated Analysis Workflow · No Live Git Clone or Execution" />

      {/* Step Progress Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stepLabels.map((item) => {
          const isCurrent = step === item.num;
          const isDone = step > item.num || Boolean(completedProject);
          return (
            <button
              key={item.num}
              type="button"
              disabled={isSimulating || Boolean(completedProject)}
              onClick={() => {
                if (item.num < step) setStep(item.num as 1 | 2 | 3 | 4);
              }}
              className={`rounded-lg border p-3 text-left transition-colors ${
                isCurrent
                  ? 'border-blue-500/60 bg-blue-950/25 text-slate-100'
                  : isDone
                  ? 'border-emerald-500/30 bg-[#0B1220] text-slate-200 cursor-pointer'
                  : 'border-slate-800/80 bg-[#0B1220] text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span>Step 0{item.num}</span>
                {isDone && <Check className="h-3.5 w-3.5 text-emerald-400" />}
              </div>
              <div className="mt-1 text-xs font-semibold">{item.title}</div>
            </button>
          );
        })}
      </div>

      {validationError && (
        <div className="rounded-lg border border-red-500/35 bg-red-950/30 px-4 py-3 text-xs text-red-200">
          {validationError}
        </div>
      )}

      {/* Simulation Progress or Completed Result */}
      {(isSimulating || completedProject) ? (
        <div className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                {completedProject
                  ? 'Simulated Migration Analysis Complete'
                  : 'Running Simulated Analysis Pipeline...'}
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                {form.projectName} · {form.originalBranch} → {form.migratedBranch}
              </p>
            </div>
            <span className="font-mono text-xs text-cyan-400">DEMO SIMULATION</span>
          </div>

          <div className="space-y-3">
            {SIMULATION_STAGES.map((stage, idx) => {
              const isStageDone = completedProject !== null || idx < currentStageIndex;
              const isStageActive = isSimulating && idx === currentStageIndex;

              return (
                <div
                  key={stage.title}
                  className={`flex items-start gap-3 rounded-md border px-4 py-3 text-xs ${
                    isStageActive
                      ? 'border-blue-500/40 bg-blue-950/20'
                      : isStageDone
                      ? 'border-emerald-500/25 bg-[#08121A]'
                      : 'border-slate-800/70 bg-[#080E1A] opacity-60'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isStageDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : isStageActive ? (
                      <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-slate-700" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100">{stage.title}</div>
                    <div className="mt-0.5 text-slate-400">{stage.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {completedProject && (
            <div className="rounded-lg border border-emerald-500/30 bg-[#081418] p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-emerald-300">
                    Demonstration Results Generated for {completedProject.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    DEMO MODE — Simulated scan surfaced {completedProject.detectedPrimitivesCount} cryptographic primitives and {completedProject.regressionCount} demonstration regression finding. Explore the generated prototype views below.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/regressions')}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Inspect Demo Regressions</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/discovery')}
                  className="rounded-md border border-slate-700 bg-[#0D1526] px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 cursor-pointer"
                >
                  View Cryptographic Discovery
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/execution')}
                  className="rounded-md border border-slate-700 bg-[#0D1526] px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 cursor-pointer"
                >
                  View Execution Comparison
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Wizard Steps Card */
        <div className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-6 space-y-6">
          {/* Step 1: Repository Selection */}
          {step === 1 && (
            <div className="space-y-5 text-xs">
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  1. Repository Selection
                </h2>
                <p className="mt-1 text-slate-400">
                  Specify a repository URL or mock archive package to configure the demonstration target.
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-2">
                  Source Input Method
                </label>
                <div className="inline-flex rounded-md border border-slate-800 bg-[#060B14] p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, repositorySource: 'git' }))}
                    className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
                      form.repositorySource === 'git'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Git Repository URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, repositorySource: 'archive' }))}
                    className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
                      form.repositorySource === 'archive'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Upload Archive (Simulated)
                  </button>
                </div>
              </div>

              {form.repositorySource === 'git' ? (
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">
                    Git Repository URL
                  </label>
                  <input
                    type="url"
                    value={form.repositoryUrl}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, repositoryUrl: e.target.value }))
                    }
                    placeholder="https://github.com/organization/service-repo"
                    className="w-full rounded-md border border-slate-700 bg-[#060B14] px-3 py-2.5 font-mono text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">
                    Simulated Repository Archive (.zip / .tar.gz)
                  </label>
                  <label className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-[#060B14] p-6 text-center cursor-pointer hover:border-blue-500/60 transition-colors">
                    <Upload className="h-6 w-6 text-slate-400 mb-2" />
                    <span className="font-medium text-slate-200">
                      {form.archiveFileName
                        ? `Selected (local metadata only): ${form.archiveFileName}`
                        : 'Choose a local archive file or use sample bundle'}
                    </span>
                    <span className="mt-1 text-[11px] text-slate-500">
                      No file bytes are uploaded or transmitted in Phase 1
                    </span>
                    <input
                      type="file"
                      accept=".zip,.tar,.gz,.tgz"
                      onChange={handleSimulatedFileSelect}
                      className="hidden"
                    />
                  </label>
                  {!form.archiveFileName && (
                    <button
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          archiveFileName: 'sample-pqc-service-bundle.tar.gz',
                        }))
                      }
                      className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      <FileArchive className="h-3.5 w-3.5" />
                      <span>Use sample archive name (sample-pqc-service-bundle.tar.gz)</span>
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={form.projectName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, projectName: e.target.value }))
                    }
                    className="w-full rounded-md border border-slate-700 bg-[#060B14] px-3 py-2.5 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">
                    Primary Programming Language
                  </label>
                  <select
                    value={form.language}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        language: e.target.value as ProgrammingLanguage,
                      }))
                    }
                    className="w-full rounded-md border border-slate-700 bg-[#060B14] px-3 py-2.5 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    {(['Go', 'Rust', 'Java', 'C++', 'TypeScript', 'Python'] as ProgrammingLanguage[]).map(
                      (lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Version Configuration */}
          {step === 2 && (
            <div className="space-y-5 text-xs">
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  2. Version Configuration
                </h2>
                <p className="mt-1 text-slate-400">
                  Define the classical baseline reference and the post-quantum migrated branch or commit.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="rounded-lg border border-slate-800 bg-[#060B14] p-4 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-slate-200">
                    <GitBranch className="h-4 w-4 text-slate-400" />
                    <span>Original (Baseline) Version</span>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Branch / Tag</label>
                    <input
                      type="text"
                      value={form.originalBranch}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, originalBranch: e.target.value }))
                      }
                      className="w-full rounded border border-slate-700 bg-[#0B1220] px-3 py-2 font-mono text-slate-100 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Commit SHA</label>
                    <input
                      type="text"
                      value={form.originalCommit}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, originalCommit: e.target.value }))
                      }
                      className="w-full rounded border border-slate-700 bg-[#0B1220] px-3 py-2 font-mono text-slate-100 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-cyan-500/25 bg-[#060B14] p-4 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-cyan-300">
                    <GitBranch className="h-4 w-4 text-cyan-400" />
                    <span>Migrated (PQC) Version</span>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Branch / Tag</label>
                    <input
                      type="text"
                      value={form.migratedBranch}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, migratedBranch: e.target.value }))
                      }
                      className="w-full rounded border border-slate-700 bg-[#0B1220] px-3 py-2 font-mono text-cyan-200 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Commit SHA</label>
                    <input
                      type="text"
                      value={form.migratedCommit}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, migratedCommit: e.target.value }))
                      }
                      className="w-full rounded border border-slate-700 bg-[#0B1220] px-3 py-2 font-mono text-cyan-200 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  Version Comparison Summary
                </label>
                <textarea
                  rows={3}
                  value={form.comparisonSummary}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, comparisonSummary: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-700 bg-[#060B14] px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Step 3: Analysis Configuration */}
          {step === 3 && (
            <div className="space-y-5 text-xs">
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  3. Analysis Configuration
                </h2>
                <p className="mt-1 text-slate-400">
                  Select supported cryptographic libraries, simulated test command, and inspection flags.
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-2">
                  Target Cryptographic Libraries
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CRYPTO_LIBRARIES.map((lib) => {
                    const checked = form.selectedLibraries.includes(lib);
                    return (
                      <label
                        key={lib}
                        className={`flex items-center gap-2.5 rounded-md border px-3 py-2.5 cursor-pointer transition-colors ${
                          checked
                            ? 'border-blue-500/50 bg-blue-950/25 text-slate-100'
                            : 'border-slate-800 bg-[#060B14] text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleLibrary(lib)}
                          className="rounded border-slate-600 accent-blue-600"
                        />
                        <span>{lib}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  Test Execution Command (Simulated Harness Target)
                </label>
                <input
                  type="text"
                  value={form.testCommand}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, testCommand: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-700 bg-[#060B14] px-3 py-2.5 font-mono text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <label className="block font-medium text-slate-300">
                  Analysis Options
                </label>
                <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enableAstTracing}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, enableAstTracing: e.target.checked }))
                    }
                    className="accent-blue-600"
                  />
                  <span>AST Call-Graph & Migration Impact Tracing</span>
                </label>
                <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enableWireFormatDiff}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, enableWireFormatDiff: e.target.checked }))
                    }
                    className="accent-blue-600"
                  />
                  <span>Wire Format & Key/Ciphertext Buffer Boundary Checks</span>
                </label>
                <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enableNistParameterCheck}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        enableNistParameterCheck: e.target.checked,
                      }))
                    }
                    className="accent-blue-600"
                  />
                  <span>NIST FIPS 203 / 204 / 205 Parameter Validation Matrix</span>
                </label>
              </div>
            </div>
          )}

          {/* Step 4: Review and Initiate */}
          {step === 4 && (
            <div className="space-y-5 text-xs">
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  4. Review & Initiate Simulated Analysis
                </h2>
                <p className="mt-1 text-slate-400">
                  Confirm configuration details before starting the frontend demonstration workflow.
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#060B14] divide-y divide-slate-800/80">
                <div className="p-4 flex flex-col sm:flex-row sm:justify-between gap-2">
                  <span className="text-slate-400">Project & Language</span>
                  <span className="font-semibold text-slate-100">
                    {form.projectName} · {form.language}
                  </span>
                </div>
                <div className="p-4 flex flex-col sm:flex-row sm:justify-between gap-2">
                  <span className="text-slate-400">Repository Source</span>
                  <span className="font-mono text-slate-200 break-all">
                    {form.repositorySource === 'archive'
                      ? form.archiveFileName
                      : form.repositoryUrl}
                  </span>
                </div>
                <div className="p-4 flex flex-col sm:flex-row sm:justify-between gap-2">
                  <span className="text-slate-400">Version Pair</span>
                  <span className="font-mono text-cyan-300">
                    {form.originalBranch} ({form.originalCommit}) → {form.migratedBranch} ({form.migratedCommit})
                  </span>
                </div>
                <div className="p-4 flex flex-col sm:flex-row sm:justify-between gap-2">
                  <span className="text-slate-400">Selected Libraries</span>
                  <span className="text-slate-200 text-right">
                    {form.selectedLibraries.join(', ')}
                  </span>
                </div>
                <div className="p-4 flex flex-col sm:flex-row sm:justify-between gap-2">
                  <span className="text-slate-400">Test Harness Command</span>
                  <code className="font-mono text-slate-200">{form.testCommand}</code>
                </div>
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                step === 1 ? navigate('/projects') : setStep((s) => (s - 1) as 1 | 2 | 3 | 4)
              }
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{step === 1 ? 'Cancel' : 'Previous'}</span>
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartSimulation}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Start Simulated Analysis</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
