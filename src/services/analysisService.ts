import {
  MOCK_DIFFS_BY_PROJECT,
  MOCK_DISCOVERY_BY_PROJECT,
  MOCK_EXECUTION_BY_PROJECT,
  MOCK_PQC_VERIFICATION_BY_PROJECT,
  MOCK_REGRESSIONS_BY_PROJECT,
} from '../mocks/analysisMock';
import {
  CodeDiffFile,
  CryptoDiscoveryItem,
  ExecutionRunSnapshot,
  NewAnalysisRequest,
  PqcVerificationRecord,
  Project,
  RegressionFinding,
  TriageStatus,
} from '../types';
import { simulateServiceCall } from './httpClient';
import { projectService } from './projectService';

const TRIAGE_STORAGE_KEY = 'qg_demo_triage_v1';

function readTriageOverrides(): Record<string, TriageStatus> {
  try {
    const raw = localStorage.getItem(TRIAGE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, TriageStatus>) : {};
  } catch {
    return {};
  }
}

function writeTriageOverride(findingId: string, status: TriageStatus): void {
  try {
    const current = readTriageOverrides();
    current[findingId] = status;
    localStorage.setItem(TRIAGE_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage errors
  }
}

function buildDynamicFallbackDiscovery(project: Project): CryptoDiscoveryItem[] {
  return [
    {
      id: `disc-dyn-${project.id}-1`,
      projectId: project.id,
      library: project.language === 'Java' ? 'BouncyCastle BCPQC 1.79' : 'OpenSSL + liboqs-provider',
      libraryVersion: project.language === 'Java' ? '1.79' : '3.5.0-dev',
      algorithm: 'ML-KEM-768 (FIPS 203)',
      classification: 'Post-Quantum',
      domain: 'Key Establishment',
      apiUsage: 'KEM.encapsulate(peerPublicKey)',
      imports: ['pqc.kem.mlkem768'],
      dependencies: ['liboqs / pqc-provider'],
      filePath: `src/crypto/key_exchange.${project.language === 'Python' ? 'py' : project.language === 'Java' ? 'java' : 'ts'}`,
      lineNumber: 42,
      codeSnippet: 'const { ciphertext, sharedSecret } = mlkem768.encapsulate(peerKey);',
      supportStatus: 'Supported',
      notes: 'Simulated discovery entry generated for demonstration project.',
    },
    {
      id: `disc-dyn-${project.id}-2`,
      projectId: project.id,
      library: 'Standard Crypto Provider',
      libraryVersion: '2.x',
      algorithm: 'ML-DSA-65 (FIPS 204)',
      classification: 'Post-Quantum',
      domain: 'Digital Signature',
      apiUsage: 'Signature.sign(payload, mlDsaKey)',
      imports: ['pqc.sign.mldsa65'],
      dependencies: ['pqc-sig-provider'],
      filePath: `src/auth/token_signer.${project.language === 'Python' ? 'py' : project.language === 'Java' ? 'java' : 'ts'}`,
      lineNumber: 88,
      codeSnippet: 'signature = mldsa65.sign(privateKey, canonicalPayload)',
      supportStatus: 'Supported',
      notes: 'Simulated signature primitive replacing classical ECDSA/RSA.',
    },
    {
      id: `disc-dyn-${project.id}-3`,
      projectId: project.id,
      library: 'Legacy TLS Wrapper',
      libraryVersion: '1.x',
      algorithm: 'RSA-2048',
      classification: 'Classical',
      domain: 'Key Establishment',
      apiUsage: 'rsa.verify(legacyDigest)',
      imports: ['crypto.rsa'],
      dependencies: ['stdlib'],
      filePath: `src/compat/legacy_handshake.${project.language === 'Python' ? 'py' : project.language === 'Java' ? 'java' : 'ts'}`,
      lineNumber: 19,
      codeSnippet: 'rsa.verify(partnerCert, payloadDigest)',
      supportStatus: 'Partial',
      notes: 'Retained fallback primitive flagged for deprecation review.',
    },
  ];
}

function buildDynamicFallbackDiffs(project: Project): CodeDiffFile[] {
  return [
    {
      id: `diff-dyn-${project.id}-1`,
      projectId: project.id,
      filePath: `src/crypto/session_manager.${project.language === 'Java' ? 'java' : project.language === 'Rust' ? 'rs' : 'go'}`,
      changeType: 'source',
      summary: `Simulated migration diff comparing ${project.originalVersion.branch} to ${project.migratedVersion.branch}.`,
      apiChanges: [
        {
          before: 'KeyExchange.negotiateClassical("X25519")',
          after: 'KeyExchange.negotiateHybrid("X25519MLKEM768")',
          impactNote: 'Key share size expanded from 32 B to 1,216 B.',
        },
      ],
      lines: [
        { lineOriginal: 21, lineMigrated: 21, type: 'context', content: 'function negotiateSession(peerConfig) {' },
        { lineOriginal: 22, lineMigrated: null, type: 'removed', content: '  const group = "X25519";' },
        { lineOriginal: null, lineMigrated: 22, type: 'added', content: '  const group = "X25519MLKEM768";', annotation: 'Hybrid PQC KEM enabled' },
        { lineOriginal: 23, lineMigrated: 23, type: 'context', content: '  const bufferLimit = 2048;' },
        { lineOriginal: 24, lineMigrated: 24, type: 'context', content: '  return handshake.execute(group, bufferLimit);' },
        { lineOriginal: 25, lineMigrated: 25, type: 'context', content: '}' },
      ],
    },
    {
      id: `diff-dyn-${project.id}-2`,
      projectId: project.id,
      filePath: 'config/pqc_policy.yaml',
      changeType: 'configuration',
      summary: 'Updated algorithm allowlist and fallback policy.',
      apiChanges: [
        {
          before: 'allow_legacy_tls12: true',
          after: 'allow_legacy_tls12: false',
          impactNote: 'Enforces TLS 1.3 for hybrid ML-KEM negotiation.',
        },
      ],
      lines: [
        { lineOriginal: 1, lineMigrated: 1, type: 'context', content: 'crypto_policy:' },
        { lineOriginal: 2, lineMigrated: null, type: 'removed', content: '  allow_legacy_tls12: true' },
        { lineOriginal: null, lineMigrated: 2, type: 'added', content: '  allow_legacy_tls12: false', annotation: 'Strict PQC enforcement' },
        { lineOriginal: 3, lineMigrated: 3, type: 'context', content: '  kem_preference: "X25519MLKEM768"' },
      ],
    },
  ];
}

function buildDynamicFallbackExecution(project: Project): ExecutionRunSnapshot[] {
  return [
    {
      runId: `SIM-RUN-${project.id.toUpperCase()}`,
      timestamp: project.lastAnalysisDate,
      trigger: `Simulated Demo Run (${project.originalVersion.branch} vs ${project.migratedVersion.branch})`,
      originalSummary: {
        buildStatus: 'Succeeded',
        passedTests: 64,
        failedTests: 0,
        totalTests: 64,
        executionTimeSec: 11.4,
        exceptionsCount: 0,
        stdoutSample: 'Baseline suite completed: 64 passed, 0 failed.',
        runtimeExceptions: [],
      },
      migratedSummary: {
        buildStatus: 'Succeeded',
        passedTests: 62,
        failedTests: Math.max(1, project.regressionCount),
        totalTests: 64,
        executionTimeSec: 14.8,
        exceptionsCount: 1,
        stdoutSample: 'Simulated PQC suite detected payload/policy regression in integration harness.',
        runtimeExceptions: ['SimulatedWarning: PQC handshake payload exceeded baseline 2 KB assumption'],
      },
      testCases: [
        {
          id: `tc-dyn-${project.id}-1`,
          suite: 'integration/crypto',
          name: 'TestHybridKemNegotiation_PayloadBound',
          originalStatus: 'Passed',
          migratedStatus: 'Failed',
          originalDurationMs: 8.4,
          migratedDurationMs: 13.9,
          originalOutput: 'negotiated=classical bytes=320',
          migratedOutput: 'error=frame_limit_warning bytes=2408',
          hasOutputDiff: true,
          failureReason: 'Simulated payload expansion above legacy framing threshold.',
        },
        {
          id: `tc-dyn-${project.id}-2`,
          suite: 'unit/aead',
          name: 'TestSymmetricCipher_AES256GCM',
          originalStatus: 'Passed',
          migratedStatus: 'Passed',
          originalDurationMs: 1.1,
          migratedDurationMs: 1.1,
          originalOutput: 'tag_verified=true',
          migratedOutput: 'tag_verified=true',
          hasOutputDiff: false,
        },
      ],
      benchmarks: [
        { operation: 'KeyGen', originalMs: 18.0, migratedMs: 1.4, originalBytes: 256, migratedBytes: 1184 },
        { operation: 'Encap / Sign', originalMs: 1.1, migratedMs: 3.2, originalBytes: 64, migratedBytes: 2420 },
        { operation: 'Handshake', originalMs: 10.2, migratedMs: 15.6, originalBytes: 980, migratedBytes: 3940 },
      ],
    },
  ];
}

function buildDynamicFallbackRegressions(project: Project): RegressionFinding[] {
  return [
    {
      id: `QG-REG-${project.id.slice(-3).toUpperCase()}1`,
      projectId: project.id,
      title: 'PQC Handshake Payload Exceeds Legacy Frame Allocation (Demo Finding)',
      category: 'Wire Format & Payload Size',
      severity: project.criticalCount > 0 ? 'Critical' : 'Medium',
      confidence: 92,
      triageStatus: 'Open',
      summary: `Simulated regression for ${project.name}: migrating from ${project.originalVersion.label} to ${project.migratedVersion.label} increased handshake/signature sizes past existing framing assumptions.`,
      originalExecutionResult: 'Baseline test suite passed within 2,048 B buffer threshold.',
      migratedExecutionResult: 'Migrated simulation triggered frame threshold warning (2,408 B > 2,048 B).',
      filePath: 'src/crypto/session_manager',
      lineRange: 'L21–L25',
      codeChangeSummary: 'Algorithm updated to ML-KEM/ML-DSA without resizing downstream transport buffer.',
      originalSnippet: 'const group = "X25519"; // 32 B key share',
      migratedSnippet: 'const group = "X25519MLKEM768"; // 1,216 B key share',
      dependencyOrConfigChanges: ['config/pqc_policy.yaml: allow_legacy_tls12 set to false'],
      logs: [
        {
          timestamp: '09:42:10.101',
          level: 'WARN',
          source: 'Migrated',
          message: 'Simulated framing check: payload size 2,408 B exceeded 2,048 B warning threshold',
        },
      ],
      reproductionSteps: [
        `Compare ${project.originalVersion.branch} against ${project.migratedVersion.branch}.`,
        'Inspect framing limit in session_manager.',
      ],
      impactTrace: [
        {
          stage: 'Changed Cryptographic Component',
          title: `${project.originalVersion.label} → ${project.migratedVersion.label}`,
          detail: 'Post-quantum key share and signature artifacts increased payload size.',
          reference: project.migratedVersion.commitHash,
        },
        {
          stage: 'Related Application Code',
          title: 'Session frame buffer check',
          detail: 'Fixed buffer limit remains sized for classical cryptography.',
          reference: 'session_manager:23',
        },
        {
          stage: 'Observed Behaviour Change',
          title: 'Wire envelope exceeds baseline threshold',
          detail: 'Simulated test suite records size boundary violation.',
          reference: 'TestHybridKemNegotiation_PayloadBound',
        },
        {
          stage: 'Detected Regression',
          title: 'Transport framing regression',
          detail: 'Requires buffer expansion or chunked handshake framing.',
          reference: `QG-REG-${project.id.slice(-3).toUpperCase()}1`,
        },
      ],
    },
  ];
}

function buildDynamicFallbackPqcVerification(project: Project): PqcVerificationRecord[] {
  return [
    {
      id: `pqc-dyn-${project.id}-1`,
      projectId: project.id,
      standard: 'ML-KEM',
      fipsReference: 'NIST FIPS 203',
      domain: 'Key Establishment',
      expectedOperation: 'Hybrid Key Encapsulation',
      detectedImplementation: 'X25519MLKEM768 (Simulated)',
      cryptographicProvider: 'Configured PQC Provider',
      executionStatus: 'Verified',
      configuredAlgorithm: 'ML-KEM-768',
      fallbackPolicy: 'Hybrid X25519 enabled',
      validationEvidence: {
        oid: '2.16.840.1.101.3.4.4.2',
        publicKeyBytes: 1184,
        ciphertextOrSignatureBytes: 1088,
        katSimulationNote: 'Simulated Phase 1 parameter verification record.',
        policyCheck: 'Compliant with FIPS 203 parameter table (Demo)',
      },
    },
    {
      id: `pqc-dyn-${project.id}-2`,
      projectId: project.id,
      standard: 'ML-DSA',
      fipsReference: 'NIST FIPS 204',
      domain: 'Digital Signature',
      expectedOperation: 'Service Token Signing',
      detectedImplementation: 'ML-DSA-65 (Simulated)',
      cryptographicProvider: 'Configured PQC Provider',
      executionStatus: 'Warning',
      configuredAlgorithm: 'ML-DSA-65',
      fallbackPolicy: 'Dual-signature transition active',
      validationEvidence: {
        oid: '2.16.840.1.101.3.4.3.18',
        publicKeyBytes: 1952,
        ciphertextOrSignatureBytes: 3309,
        katSimulationNote: 'Simulated signature size warning flagged for transport header checks.',
        policyCheck: 'Algorithm compliant · Transport sizing review recommended',
      },
    },
    {
      id: `pqc-dyn-${project.id}-3`,
      projectId: project.id,
      standard: 'SLH-DSA',
      fipsReference: 'NIST FIPS 205',
      domain: 'Digital Signature',
      expectedOperation: 'Long-Term Root Verification',
      detectedImplementation: 'Not configured',
      cryptographicProvider: 'None',
      executionStatus: 'Failed',
      configuredAlgorithm: 'Not detected',
      fallbackPolicy: 'Classical fallback only',
      validationEvidence: {
        oid: 'N/A',
        publicKeyBytes: 0,
        ciphertextOrSignatureBytes: 0,
        katSimulationNote: 'No SLH-DSA usage found in simulated repository scan.',
        policyCheck: 'Optional unless long-term stateless signatures are required',
      },
    },
  ];
}

/**
 * Service interface aligned with proposed backend endpoints:
 * POST /api/analyses
 * GET /api/analyses/:id/discovery
 * GET /api/analyses/:id/comparison
 * GET /api/analyses/:id/regressions
 * GET /api/analyses/:id/pqc-verification
 */
export const analysisService = {
  async getDiscovery(project: Project): Promise<CryptoDiscoveryItem[]> {
    return simulateServiceCall(`GET /api/analyses/${project.id}/discovery`, () => {
      return MOCK_DISCOVERY_BY_PROJECT[project.id] ?? buildDynamicFallbackDiscovery(project);
    });
  },

  async getCodeDiffs(project: Project): Promise<CodeDiffFile[]> {
    return simulateServiceCall(`GET /api/analyses/${project.id}/comparison/diffs`, () => {
      return MOCK_DIFFS_BY_PROJECT[project.id] ?? buildDynamicFallbackDiffs(project);
    });
  },

  async getExecutionSnapshots(project: Project): Promise<ExecutionRunSnapshot[]> {
    return simulateServiceCall(`GET /api/analyses/${project.id}/comparison`, () => {
      return MOCK_EXECUTION_BY_PROJECT[project.id] ?? buildDynamicFallbackExecution(project);
    });
  },

  async getRegressions(project: Project): Promise<RegressionFinding[]> {
    return simulateServiceCall(`GET /api/analyses/${project.id}/regressions`, () => {
      const base = MOCK_REGRESSIONS_BY_PROJECT[project.id] ?? buildDynamicFallbackRegressions(project);
      const overrides = readTriageOverrides();
      return base.map((item) =>
        overrides[item.id] ? { ...item, triageStatus: overrides[item.id] } : item
      );
    });
  },

  async updateRegressionTriage(
    findingId: string,
    triageStatus: TriageStatus
  ): Promise<void> {
    return simulateServiceCall(`PATCH /api/regressions/${findingId}`, () => {
      writeTriageOverride(findingId, triageStatus);
    });
  },

  async getAllRegressionsSummary(): Promise<RegressionFinding[]> {
    return simulateServiceCall('GET /api/analyses/regressions-summary', () => {
      const all = Object.values(MOCK_REGRESSIONS_BY_PROJECT).flat();
      const overrides = readTriageOverrides();
      return all.map((item) =>
        overrides[item.id] ? { ...item, triageStatus: overrides[item.id] } : item
      );
    });
  },

  async getPqcVerification(project: Project): Promise<PqcVerificationRecord[]> {
    return simulateServiceCall(`GET /api/analyses/${project.id}/pqc-verification`, () => {
      return (
        MOCK_PQC_VERIFICATION_BY_PROJECT[project.id] ??
        buildDynamicFallbackPqcVerification(project)
      );
    });
  },

  async initiateSimulatedAnalysis(request: NewAnalysisRequest): Promise<Project> {
    return projectService.createProject({
      name: request.projectName,
      description:
        request.comparisonSummary ||
        `Simulated migration analysis (${request.originalBranch} → ${request.migratedBranch}) covering ${request.selectedLibraries.join(', ')}.`,
      repositoryUrl:
        request.repositorySource === 'archive'
          ? request.archiveFileName || 'uploaded-repository-archive.zip'
          : request.repositoryUrl,
      repositorySource: request.repositorySource,
      language: request.language,
      originalVersion: {
        branch: request.originalBranch,
        commitHash: request.originalCommit || 'a1b2c3d',
        label: `${request.originalBranch} (Classical)`,
        timestamp: 'Baseline snapshot',
      },
      migratedVersion: {
        branch: request.migratedBranch,
        commitHash: request.migratedCommit || 'f9e8d7c',
        label: `${request.migratedBranch} (PQC)`,
        timestamp: 'Target snapshot',
      },
      status: 'Regressions Detected',
      totalFilesScanned: 96,
      detectedPrimitivesCount: Math.max(3, request.selectedLibraries.length * 2),
      regressionCount: 1,
      criticalCount: request.enableNistParameterCheck ? 1 : 0,
    });
  },

  resetTriageOverrides(): void {
    localStorage.removeItem(TRIAGE_STORAGE_KEY);
  },
};
