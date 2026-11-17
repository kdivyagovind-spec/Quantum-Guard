import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Code2,
  Search,
} from 'lucide-react';
import {
  EmptyStatePanel,
  ErrorStatePanel,
  LoadingSkeleton,
} from '../components/AsyncStatePanel';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';
import { useWorkspace } from '../context/WorkspaceContext';
import { analysisService } from '../services/analysisService';
import { CryptoClassification, CryptoDiscoveryItem } from '../types';

export const DiscoveryPage: React.FC = () => {
  const { activeProject } = useWorkspace();

  const [items, setItems] = useState<CryptoDiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<'ALL' | CryptoClassification>('ALL');
  const [libraryFilter, setLibraryFilter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadDiscovery = async () => {
    if (!activeProject) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analysisService.getDiscovery(activeProject);
      setItems(res);
      setExpandedId(res[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load discovery inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDiscovery();
  }, [activeProject?.id]);

  const uniqueLibraries = useMemo(
    () => Array.from(new Set(items.map((i) => i.library))),
    [items]
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery =
        !q ||
        item.algorithm.toLowerCase().includes(q) ||
        item.library.toLowerCase().includes(q) ||
        item.apiUsage.toLowerCase().includes(q) ||
        item.filePath.toLowerCase().includes(q);
      const matchesClass =
        classificationFilter === 'ALL' || item.classification === classificationFilter;
      const matchesLib = libraryFilter === 'ALL' || item.library === libraryFilter;
      return matchesQuery && matchesClass && matchesLib;
    });
  }, [items, searchQuery, classificationFilter, libraryFilter]);

  const counts = useMemo(() => {
    return {
      classical: items.filter((i) => i.classification === 'Classical').length,
      pqc: items.filter((i) => i.classification === 'Post-Quantum').length,
      hybrid: items.filter((i) => i.classification === 'Hybrid').length,
      unsupported: items.filter((i) => i.classification === 'Unsupported').length,
    };
  }, [items]);

  const classificationColor = (c: CryptoClassification) => {
    switch (c) {
      case 'Post-Quantum':
        return 'text-cyan-300';
      case 'Hybrid':
        return 'text-blue-300';
      case 'Classical':
        return 'text-slate-300';
      case 'Unsupported':
        return 'text-amber-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Cryptographic Discovery
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Detected cryptographic libraries, algorithm classifications, API call sites, imports, and unsupported patterns for{' '}
          <span className="text-slate-200 font-medium">{activeProject?.name ?? 'Active Project'}</span>.
        </p>
      </div>

      <DemoNoticeBanner
        contextLabel={
          activeProject
            ? `${activeProject.name} · ${activeProject.migratedVersion.branch}`
            : undefined
        }
      />

      {/* Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-4">
          <div className="text-xs text-slate-400">Post-Quantum Primitives</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-cyan-300">
            {counts.pqc}
          </div>
        </div>
        <div className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-4">
          <div className="text-xs text-slate-400">Hybrid Patterns</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-blue-400">
            {counts.hybrid}
          </div>
        </div>
        <div className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-4">
          <div className="text-xs text-slate-400">Classical Primitives</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-200">
            {counts.classical}
          </div>
        </div>
        <div className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-4">
          <div className="text-xs text-slate-400">Unsupported Patterns</div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-amber-400">
            {counts.unsupported}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-md border border-slate-800 bg-[#060B14] p-1">
          {(['ALL', 'Post-Quantum', 'Hybrid', 'Classical', 'Unsupported'] as const).map(
            (tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setClassificationFilter(tab)}
                className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                  classificationFilter === tab
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'ALL' ? 'All Primitives' : tab}
              </button>
            )
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:max-w-xl">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search algorithm, API call, or file path..."
              className="w-full rounded-md border border-slate-800 bg-[#060B14] pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={libraryFilter}
            onChange={(e) => setLibraryFilter(e.target.value)}
            aria-label="Filter by cryptographic library"
            className="rounded-md border border-slate-800 bg-[#060B14] px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Libraries</option>
            {uniqueLibraries.map((lib) => (
              <option key={lib} value={lib}>
                {lib}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Discovery Table */}
      {error ? (
        <ErrorStatePanel message={error} onRetry={() => void loadDiscovery()} />
      ) : loading ? (
        <LoadingSkeleton rows={5} />
      ) : filteredItems.length === 0 ? (
        <EmptyStatePanel
          title="No cryptographic primitives match current filters"
          description="Clear the search filter or switch classification tabs to inspect all discovered entries."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearchQuery('');
            setClassificationFilter('ALL');
            setLibraryFilter('ALL');
          }}
        />
      ) : (
        <div className="rounded-lg border border-slate-800/80 bg-[#0B1220] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-[#0D1526] text-[11px] font-medium text-slate-400">
                  <th className="py-3 px-4 w-8"></th>
                  <th className="py-3 px-4">Algorithm & Domain</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Detected Library</th>
                  <th className="py-3 px-4">API Usage</th>
                  <th className="py-3 px-4">Source Reference</th>
                  <th className="py-3 px-5 text-right">Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredItems.map((item) => {
                  const isExpanded = expandedId === item.id;
                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4 text-slate-500">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-100">
                            {item.algorithm}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {item.domain}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`font-semibold ${classificationColor(item.classification)}`}>
                            {item.classification}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-200">{item.library}</div>
                          <div className="font-mono text-[11px] text-slate-500">
                            {item.libraryVersion}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-[260px]">
                          <code className="font-mono text-[11px] text-slate-300 truncate block">
                            {item.apiUsage}
                          </code>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-blue-300 whitespace-nowrap">
                          {item.filePath}:{item.lineNumber}
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <span
                            className={`text-xs font-medium ${
                              item.supportStatus === 'Supported'
                                ? 'text-emerald-400'
                                : item.supportStatus === 'Partial'
                                ? 'text-amber-400'
                                : 'text-red-400'
                            }`}
                          >
                            {item.supportStatus}
                          </span>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#080E1A]">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
                              <div className="lg:col-span-6 space-y-2">
                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                                  <Code2 className="h-3.5 w-3.5 text-cyan-400" />
                                  <span>Extracted Call Site (Simulated AST)</span>
                                </div>
                                <pre className="rounded-md border border-slate-800 bg-[#050911] p-3 font-mono text-[11px] text-slate-200 overflow-x-auto">
                                  {item.codeSnippet}
                                </pre>
                                <p className="text-slate-400 leading-relaxed pt-1">
                                  {item.notes}
                                </p>
                              </div>

                              <div className="lg:col-span-3 space-y-2">
                                <div className="text-[11px] font-medium text-slate-400">
                                  Detected Imports
                                </div>
                                <ul className="space-y-1 font-mono text-[11px] text-slate-300">
                                  {item.imports.map((imp) => (
                                    <li key={imp} className="truncate">
                                      {imp}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="lg:col-span-3 space-y-2">
                                <div className="text-[11px] font-medium text-slate-400">
                                  Manifest Dependencies
                                </div>
                                <ul className="space-y-1 font-mono text-[11px] text-cyan-300">
                                  {item.dependencies.map((dep) => (
                                    <li key={dep} className="truncate">
                                      {dep}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
