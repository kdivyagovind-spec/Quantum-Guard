export type ProgrammingLanguage =
  | 'Go'
  | 'Rust'
  | 'Java'
  | 'C++'
  | 'TypeScript'
  | 'Python';

export type ProjectStatus =
  | 'Completed'
  | 'Regressions Detected'
  | 'Needs Review'
  | 'Running Simulation'
  | 'Draft';

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export type RegressionCategory =
  | 'Wire Format & Payload Size'
  | 'Signature Verification'
  | 'Key Encapsulation'
  | 'Performance & Latency'
  | 'Fallback & Interop'
  | 'Configuration & Policy';

export type TriageStatus = 'Open' | 'Investigating' | 'Accepted Risk' | 'Resolved';

export type CryptoClassification = 'Classical' | 'Post-Quantum' | 'Hybrid' | 'Unsupported';

export type CryptoDomain =
  | 'Key Establishment'
  | 'Digital Signature'
  | 'Symmetric Encryption'
  | 'Key Derivation / Hash';

export interface RepositoryVersion {
  branch: string;
  commitHash: string;
  label: string;
  timestamp: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  repositoryUrl: string;
  repositorySource: 'git' | 'archive';
  language: ProgrammingLanguage;
  originalVersion: RepositoryVersion;
  migratedVersion: RepositoryVersion;
  lastAnalysisDate: string;
  status: ProjectStatus;
  totalFilesScanned: number;
  detectedPrimitivesCount: number;
  regressionCount: number;
  criticalCount: number;
  isDemoData: boolean;
}

export interface ActivityEvent {
  id: string;
  projectId: string;
  projectName: string;
  action: string;
  detail: string;
  timestamp: string;
  severity?: Severity | 'Info';
}

export interface AnalysisHistoryPoint {
  date: string;
  analysesCompleted: number;
  regressionsFound: number;
  criticalFindings: number;
}

export interface CryptoDiscoveryItem {
  id: string;
  projectId: string;
  library: string;
  libraryVersion: string;
  algorithm: string;
  classification: CryptoClassification;
  domain: CryptoDomain;
  apiUsage: string;
  imports: string[];
  dependencies: string[];
  filePath: string;
  lineNumber: number;
  codeSnippet: string;
  supportStatus: 'Supported' | 'Partial' | 'Unsupported Pattern';
  notes: string;
}

export interface DiffLine {
  lineOriginal: number | null;
  lineMigrated: number | null;
  type: 'context' | 'removed' | 'added';
  content: string;
  annotation?: string;
}

export interface CodeDiffFile {
  id: string;
  projectId: string;
  filePath: string;
  changeType: 'source' | 'dependency' | 'configuration';
  summary: string;
  apiChanges: Array<{
    before: string;
    after: string;
    impactNote: string;
  }>;
  lines: DiffLine[];
}

export interface TestCaseComparison {
  id: string;
  suite: string;
  name: string;
  originalStatus: 'Passed' | 'Failed' | 'Skipped';
  migratedStatus: 'Passed' | 'Failed' | 'Skipped';
  originalDurationMs: number;
  migratedDurationMs: number;
  originalOutput: string;
  migratedOutput: string;
  hasOutputDiff: boolean;
  failureReason?: string;
}

export interface ExecutionBenchmarkPoint {
  operation: string;
  originalMs: number;
  migratedMs: number;
  originalBytes: number;
  migratedBytes: number;
}

export interface ExecutionRunSnapshot {
  runId: string;
  timestamp: string;
  trigger: string;
  originalSummary: {
    buildStatus: 'Succeeded' | 'Failed';
    passedTests: number;
    failedTests: number;
    totalTests: number;
    executionTimeSec: number;
    exceptionsCount: number;
    stdoutSample: string;
    runtimeExceptions: string[];
  };
  migratedSummary: {
    buildStatus: 'Succeeded' | 'Failed';
    passedTests: number;
    failedTests: number;
    totalTests: number;
    executionTimeSec: number;
    exceptionsCount: number;
    stdoutSample: string;
    runtimeExceptions: string[];
  };
  testCases: TestCaseComparison[];
  benchmarks: ExecutionBenchmarkPoint[];
}

export interface ImpactTraceNode {
  stage:
    | 'Changed Cryptographic Component'
    | 'Related Application Code'
    | 'Observed Behaviour Change'
    | 'Detected Regression';
  title: string;
  detail: string;
  reference: string;
}

export interface RegressionFinding {
  id: string;
  projectId: string;
  title: string;
  category: RegressionCategory;
  severity: Severity;
  confidence: number;
  triageStatus: TriageStatus;
  summary: string;
  originalExecutionResult: string;
  migratedExecutionResult: string;
  filePath: string;
  lineRange: string;
  codeChangeSummary: string;
  originalSnippet: string;
  migratedSnippet: string;
  dependencyOrConfigChanges: string[];
  logs: Array<{
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    source: 'Original' | 'Migrated';
    message: string;
  }>;
  reproductionSteps: string[];
  impactTrace: [ImpactTraceNode, ImpactTraceNode, ImpactTraceNode, ImpactTraceNode];
}

export interface PqcVerificationRecord {
  id: string;
  projectId: string;
  standard: 'ML-KEM' | 'ML-DSA' | 'SLH-DSA' | 'Symmetric / AEAD';
  fipsReference: string;
  domain: CryptoDomain;
  expectedOperation: string;
  detectedImplementation: string;
  cryptographicProvider: string;
  executionStatus: 'Verified' | 'Warning' | 'Failed';
  configuredAlgorithm: string;
  fallbackPolicy: string;
  validationEvidence: {
    oid: string;
    publicKeyBytes: number;
    ciphertextOrSignatureBytes: number;
    katSimulationNote: string;
    policyCheck: string;
  };
}

export interface TechnicalReportData {
  reportId: string;
  generatedAt: string;
  isPrototypeDemo: boolean;
  project: Project;
  executiveSummary: string;
  discoverySummary: {
    classicalCount: number;
    postQuantumCount: number;
    hybridCount: number;
    unsupportedCount: number;
    libraries: string[];
  };
  executionSummary: {
    originalPassRate: string;
    migratedPassRate: string;
    latencyDeltaPct: string;
    failedTestsCount: number;
  };
  regressions: RegressionFinding[];
  pqcVerifications: PqcVerificationRecord[];
  unsupportedAreas: Array<{
    area: string;
    reason: string;
    recommendation: string;
  }>;
}

export interface NewAnalysisRequest {
  projectName: string;
  repositoryUrl: string;
  repositorySource: 'git' | 'archive';
  archiveFileName?: string;
  language: ProgrammingLanguage;
  originalBranch: string;
  originalCommit: string;
  migratedBranch: string;
  migratedCommit: string;
  comparisonSummary: string;
  selectedLibraries: string[];
  testCommand: string;
  enableAstTracing: boolean;
  enableWireFormatDiff: boolean;
  enableNistParameterCheck: boolean;
}

export interface WorkspaceNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'warning' | 'error' | 'info' | 'success';
  route?: string;
}

export interface DemoSettings {
  simulatedLatencyMs: number;
  simulateNetworkError: boolean;
  apiBaseUrl: string;
  defaultTestTimeoutSec: number;
  strictFipsMode: boolean;
}
