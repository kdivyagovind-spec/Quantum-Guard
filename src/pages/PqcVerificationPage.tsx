import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  KeyRound,
  Lock,
  PenTool,
  ShieldCheck,
} from 'lucide-react';
import {
  EmptyStatePanel,
  ErrorStatePanel,
  LoadingSkeleton,
} from '../components/AsyncStatePanel';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';
import { VerificationStatusText } from '../components/StatusIndicator';
import { useWorkspace } from '../context/WorkspaceContext';
import { analysisService } from '../services/analysisService';
import { CryptoDomain, PqcVerificationRecord } from '../types';

export const PqcVerificationPage: React.FC = () => {
  const { activeProject } = useWorkspace();

  const [records, setRecords] = useState<PqcVerificationRecord[]>([]);
  const [domainFilter, setDomainFilter] = useState<'ALL' | CryptoDomain>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVerification = async () => {
    if (!activeProject) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analysisService.getPqcVerification(activeProject);
      setRecords(res);
      setExpandedId(res[0]?.id ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load PQC verification matrix.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadVerification();
  }, [activeProject?.id]);

  const filteredRecords = useMemo(() => {
    if (domainFilter === 'ALL') return records;
    return records.filter((r) => r.domain === domainFilter);
  }, [records, domainFilter]);

  const domainIcon = (domain: CryptoDomain) => {
    if (domain === 'Key Establishment') return <KeyRound className="h-4 w-4 text-cyan-400" />;
    if (domain === 'Digital Signature') return <PenTool className="h-4 w-4 text-blue-400" />;
    return <Lock className="h-4 w-4 text-emerald-400" />;
  };

  // Summary across the three NIST PQC standards + Symmetric
  const standardsOverview = useMemo(() => {
    const standards: Array<{
      standard: PqcVerificationRecord['standard'];
      fips: string;
      domain: string;
    }> = [
      { standard: 'ML-KEM', fips: 'FIPS 203', domain: 'Key Establishment' },
      { standard: 'ML-DSA', fips: 'FIPS 204', domain: 'Digital Signatures' },
      { standard: 'SLH-DSA', fips: 'FIPS 205', domain: 'Stateless Hash Signatures' },
      { standard: 'Symmetric / AEAD', fips: 'SP 800-38D', domain: 'Symmetric Encryption' },
    ];
    return standards.map((item) => {
      const match = records.find((r) => r.standard === item.standard);
      return {
        ...item,
        status: match?.executionStatus ?? 'Failed',
        configured: match?.configuredAlgorithm ?? 'Not detected in demo scan',
      };
    });
  }, [records]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          PQC Verification Matrix
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Technical validation structure for ML-KEM, ML-DSA, SLH-DSA, and symmetric encryption compliance. No actual cryptographic verification is executed in Phase 1.
        </p>
      </div>

      <DemoNoticeBanner
        contextLabel="Simulated Validation Evidence · No Real Cryptographic Execution"
      />

      {/* Standard Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {standardsOverview.map((card) => (
          <div
            key={card.standard}
            className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-4 flex flex-col justify-between space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-bold text-slate-100">
                  {card.standard}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {card.fips} · {card.domain}
                </div>
              </div>
              <ShieldCheck className="h-4 w-4 text-slate-500 shrink-0" />
            </div>

            <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-slate-300 truncate">
                {card.configured}
              </span>
              <VerificationStatusText status={card.status} />
            </div>
          </div>
        ))}
      </div>

      {/* Domain Separation Tabs */}
      <div className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-md border border-slate-800 bg-[#060B14] p-1">
          {(
            [
              'ALL',
              'Key Establishment',
              'Digital Signature',
              'Symmetric Encryption',
            ] as const
          ).map((dom) => (
            <button
              key={dom}
              type="button"
              onClick={() => setDomainFilter(dom)}
              className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                domainFilter === dom
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {dom === 'ALL' ? 'All Cryptographic Domains' : dom}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400">
          Showing {filteredRecords.length} simulated verification check(s)
        </div>
      </div>

      {/* Verification Table */}
      {error ? (
        <ErrorStatePanel message={error} onRetry={() => void loadVerification()} />
      ) : loading ? (
        <LoadingSkeleton rows={4} />
      ) : filteredRecords.length === 0 ? (
        <EmptyStatePanel
          title="No verification checks for this cryptographic domain"
          description="Switch to All Cryptographic Domains to inspect ML-KEM, ML-DSA, SLH-DSA, and symmetric checks."
          actionLabel="Show All Domains"
          onAction={() => setDomainFilter('ALL')}
        />
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((rec) => {
            const isOpen = expandedId === rec.id;
            return (
              <section
                key={rec.id}
                className="rounded-lg border border-slate-800/80 bg-[#0B1220] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : rec.id)}
                  className="w-full text-left px-5 py-4 hover:bg-slate-800/25 transition-colors cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-slate-500">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                    <div className="mt-0.5">{domainIcon(rec.domain)}</div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-slate-100">
                          {rec.standard} ({rec.fipsReference})
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="text-cyan-300 font-medium">{rec.domain}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-300">
                        {rec.expectedOperation}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pl-9 lg:pl-0">
                    <div className="text-left lg:text-right">
                      <div className="text-[11px] text-slate-500">Configured Algorithm</div>
                      <div className="font-mono text-xs text-slate-200">
                        {rec.configuredAlgorithm}
                      </div>
                    </div>
                    <VerificationStatusText status={rec.executionStatus} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 py-5 border-t border-slate-800/80 bg-[#080E1A] grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
                    <div className="lg:col-span-6 space-y-3">
                      <div>
                        <div className="text-[11px] text-slate-400">
                          Detected Implementation
                        </div>
                        <div className="mt-1 font-mono text-slate-100">
                          {rec.detectedImplementation}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">
                          Cryptographic Provider
                        </div>
                        <div className="mt-1 text-slate-200">
                          {rec.cryptographicProvider}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">
                          Fallback Policy
                        </div>
                        <div className="mt-1 text-amber-300/90">
                          {rec.fallbackPolicy}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-6 rounded-md border border-slate-800 bg-[#050911] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">
                          Validation Evidence (Simulated)
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          OID: {rec.validationEvidence.oid}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 font-mono tabular-nums">
                        <div>
                          <div className="text-[11px] font-sans text-slate-400">
                            Public Key Size
                          </div>
                          <div className="text-sm font-semibold text-slate-100">
                            {rec.validationEvidence.publicKeyBytes} B
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] font-sans text-slate-400">
                            Ciphertext / Signature Size
                          </div>
                          <div className="text-sm font-semibold text-cyan-300">
                            {rec.validationEvidence.ciphertextOrSignatureBytes} B
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed pt-1 border-t border-slate-800/70">
                        {rec.validationEvidence.katSimulationNote}
                      </p>
                      <div className="text-[11px] font-medium text-cyan-300">
                        Policy Assessment: {rec.validationEvidence.policyCheck}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
