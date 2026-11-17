export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  useMockProvider: true,
  defaultSimulatedDelayMs: 280,
};

/**
 * Proposed future backend API contract endpoints.
 * Phase 1 uses dedicated mock service implementations matching these contracts.
 */
export const API_ENDPOINTS = {
  projects: '/projects',
  projectById: (id: string) => `/projects/${id}`,
  analyses: '/analyses',
  analysisById: (id: string) => `/analyses/${id}`,
  analysisDiscovery: (id: string) => `/analyses/${id}/discovery`,
  analysisComparison: (id: string) => `/analyses/${id}/comparison`,
  analysisRegressions: (id: string) => `/analyses/${id}/regressions`,
  analysisPqcVerification: (id: string) => `/analyses/${id}/pqc-verification`,
  analysisReport: (id: string) => `/analyses/${id}/report`,
} as const;
