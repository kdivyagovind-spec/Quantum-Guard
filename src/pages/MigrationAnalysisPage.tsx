import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Columns2,
  FileCode2,
  FileCog,
  Package,
  Rows3,
} from 'lucide-react';
import {
  EmptyStatePanel,
  ErrorStatePanel,
  LoadingSkeleton,
} from '../components/AsyncStatePanel';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';
import { useWorkspace } from '../context/WorkspaceContext';
import { analysisService } from '../services/analysisService';
import { CodeDiffFile, DiffLine } from '../types';

export const MigrationAnalysisPage: React.FC = () => {
  const { activeProject } = useWorkspace();

  const [files, setFiles] = useState<CodeDiffFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [changeFilter, setChangeFilter] = useState<'all' | 'source' | 'dependency' | 'configuration'>('all');
  const [diffMode, setDiffMode] = useState<'split' | 'unified'>('split');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDiffs = async () => {
    if (!activeProject) return;
    setLoading(true);
    setError(null);
    try {
      const data = await analysisService.getCodeDiffs(activeProject);
      setFiles(data);
      setSelectedFileId(data[0]?.id ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load migration diffs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDiffs();
  }, [activeProject?.id]);

  const filteredFiles = useMemo(() => {
    if (changeFilter === 'all') return files;
    return files.filter((f) => f.changeType === changeFilter);
  }, [files, changeFilter]);

  const selectedFile =
    filteredFiles.find((f) => f.id === selectedFileId) ?? filteredFiles[0] ?? null;

  // Build aligned pairs for side-by-side rendering
  const splitRows = useMemo(() => {
    if (!selectedFile) return [];
    const rows: Array<{ left: DiffLine | null; right: DiffLine | null }> = [];
    const lines = selectedFile.lines;
    let i = 0;

    while (i < lines.length) {
      const current = lines[i];
      if (current.type === 'context') {
        rows.push({ left: current, right: current });
        i++;
      } else if (current.type === 'removed') {
        const removedBatch: DiffLine[] = [];
        const addedBatch: DiffLine[] = [];
        while (i < lines.length && lines[i].type === 'removed') {
          removedBatch.push(lines[i]);
          i++;
        }
        while (i < lines.length && lines[i].type === 'added') {
          addedBatch.push(lines[i]);
          i++;
        }
        const maxLen = Math.max(removedBatch.length, addedBatch.length);
        for (let k = 0; k < maxLen; k++) {
          rows.push({
            left: removedBatch[k] ?? null,
            right: addedBatch[k] ?? null,
          });
        }
      } else {
        rows.push({ left: null, right: current });
        i++;
      }
    }
    return rows;
  }, [selectedFile]);

  const fileIcon = (type: CodeDiffFile['changeType']) => {
    if (type === 'dependency') return <Package className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
    if (type === 'configuration') return <FileCog className="h-3.5 w-3.5 text-cyan-400 shrink-0" />;
    return <FileCode2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Migration Analysis & Code Diff
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Side-by-side comparison of original vs migrated source code, cryptographic APIs, dependencies, and configuration policies.
          </p>
        </div>

        {/* View Toggle */}
        <div className="inline-flex items-center rounded-md border border-slate-800 bg-[#0B1220] p-1 gap-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setDiffMode('split')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
              diffMode === 'split'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns2 className="h-3.5 w-3.5" />
            <span>Side-by-Side</span>
          </button>
          <button
            type="button"
            onClick={() => setDiffMode('unified')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
              diffMode === 'unified'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Rows3 className="h-3.5 w-3.5" />
            <span>Unified</span>
          </button>
        </div>
      </div>

      <DemoNoticeBanner
        contextLabel={
          activeProject
            ? `${activeProject.originalVersion.branch} (${activeProject.originalVersion.commitHash}) → ${activeProject.migratedVersion.branch} (${activeProject.migratedVersion.commitHash})`
            : undefined
        }
      />

      {error ? (
        <ErrorStatePanel message={error} onRetry={() => void loadDiffs()} />
      ) : loading ? (
        <LoadingSkeleton rows={6} />
      ) : files.length === 0 ? (
        <EmptyStatePanel
          title="No diff artifacts available"
          description="Select a project with simulated migration changes."
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Left File Navigator */}
          <aside className="xl:col-span-3 rounded-lg border border-slate-800/80 bg-[#0B1220] overflow-hidden">
            <div className="p-3 border-b border-slate-800/80">
              <div className="text-xs font-semibold text-slate-200 mb-2">
                Modified Artifacts ({filteredFiles.length})
              </div>
              <div className="grid grid-cols-2 gap-1 bg-[#060B14] p-1 rounded border border-slate-800">
                {(['all', 'source', 'dependency', 'configuration'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setChangeFilter(cat)}
                    className={`px-2 py-1 rounded text-[11px] font-medium capitalize cursor-pointer ${
                      changeFilter === cat
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat === 'dependency' ? 'Deps' : cat === 'configuration' ? 'Config' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-800/60">
              {filteredFiles.map((file) => {
                const isSelected = selectedFile?.id === file.id;
                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setSelectedFileId(file.id)}
                    className={`w-full text-left px-3.5 py-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/15 text-slate-100'
                        : 'text-slate-300 hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {fileIcon(file.changeType)}
                      <span className="font-mono text-xs truncate">{file.filePath}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400 capitalize">
                      {file.changeType} · {file.apiChanges.length} API/Policy change
                      {file.apiChanges.length === 1 ? '' : 's'}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Diff + API Changes Workspace */}
          <div className="xl:col-span-9 space-y-5 min-w-0">
            {selectedFile ? (
              <>
                {/* Changed APIs / Dependencies Summary */}
                <section className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      {fileIcon(selectedFile.changeType)}
                      <h2 className="font-mono text-sm font-semibold text-slate-100">
                        {selectedFile.filePath}
                      </h2>
                    </div>
                    <span className="text-[11px] text-slate-400 capitalize">
                      {selectedFile.changeType} diff (Demo)
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedFile.summary}
                  </p>

                  {selectedFile.apiChanges.length > 0 && (
                    <div className="space-y-2.5 pt-1">
                      <div className="text-[11px] font-semibold text-slate-400">
                        Changed Cryptographic APIs & Configuration Entries
                      </div>
                      <div className="space-y-2">
                        {selectedFile.apiChanges.map((change, idx) => (
                          <div
                            key={idx}
                            className="rounded-md border border-slate-800 bg-[#060B14] p-3 text-xs space-y-1.5"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center gap-2 font-mono text-[11px]">
                              <code className="text-red-300 bg-red-950/30 px-2 py-1 rounded break-all">
                                - {change.before}
                              </code>
                              <ArrowRight className="h-3.5 w-3.5 text-slate-500 hidden lg:block shrink-0" />
                              <code className="text-emerald-300 bg-emerald-950/30 px-2 py-1 rounded break-all">
                                + {change.after}
                              </code>
                            </div>
                            <p className="text-[11px] text-cyan-300/90">
                              Impact: {change.impactNote}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* Code Diff Viewer */}
                <section className="rounded-lg border border-slate-800/80 bg-[#0B1220] overflow-hidden">
                  <div className="grid grid-cols-2 border-b border-slate-800/80 bg-[#0D1526] text-[11px] font-medium text-slate-400">
                    {diffMode === 'split' ? (
                      <>
                        <div className="px-4 py-2.5 border-r border-slate-800/80">
                          Original ({activeProject?.originalVersion.branch})
                        </div>
                        <div className="px-4 py-2.5 text-cyan-300">
                          Migrated ({activeProject?.migratedVersion.branch})
                        </div>
                      </>
                    ) : (
                      <div className="col-span-2 px-4 py-2.5">
                        Unified Diff ({activeProject?.originalVersion.branch} →{' '}
                        {activeProject?.migratedVersion.branch})
                      </div>
                    )}
                  </div>

                  {diffMode === 'split' ? (
                    <div className="overflow-x-auto font-mono text-[11.5px] leading-6">
                      <table className="w-full border-collapse">
                        <tbody>
                          {splitRows.map((row, idx) => (
                            <tr key={idx} className="border-b border-slate-800/40 last:border-0">
                              {/* Left: Original */}
                              <td
                                className={`w-12 select-none text-right pr-3 pl-2 text-slate-500 tabular-nums border-r border-slate-800/60 ${
                                  row.left?.type === 'removed'
                                    ? 'bg-red-950/35 text-red-400'
                                    : 'bg-[#080E1A]'
                                }`}
                              >
                                {row.left?.lineOriginal ?? ''}
                              </td>
                              <td
                                className={`w-1/2 px-3 whitespace-pre border-r border-slate-800/80 ${
                                  row.left?.type === 'removed'
                                    ? 'bg-red-950/25 text-red-200'
                                    : row.left
                                    ? 'text-slate-300'
                                    : 'bg-[#050911]'
                                }`}
                              >
                                {row.left ? (
                                  <span>
                                    {row.left.type === 'removed' ? '- ' : '  '}
                                    {row.left.content}
                                  </span>
                                ) : (
                                  ''
                                )}
                              </td>

                              {/* Right: Migrated */}
                              <td
                                className={`w-12 select-none text-right pr-3 pl-2 text-slate-500 tabular-nums border-r border-slate-800/60 ${
                                  row.right?.type === 'added'
                                    ? 'bg-emerald-950/35 text-emerald-400'
                                    : 'bg-[#080E1A]'
                                }`}
                              >
                                {row.right?.lineMigrated ?? ''}
                              </td>
                              <td
                                className={`w-1/2 px-3 whitespace-pre ${
                                  row.right?.type === 'added'
                                    ? 'bg-emerald-950/25 text-emerald-200'
                                    : row.right
                                    ? 'text-slate-300'
                                    : 'bg-[#050911]'
                                }`}
                              >
                                {row.right ? (
                                  <div>
                                    <span>
                                      {row.right.type === 'added' ? '+ ' : '  '}
                                      {row.right.content}
                                    </span>
                                    {row.right.annotation && (
                                      <div className="text-[10.5px] font-sans text-cyan-300 bg-cyan-950/40 border border-cyan-500/25 rounded px-2 py-0.5 my-1 inline-block ml-3">
                                        {row.right.annotation}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  ''
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="overflow-x-auto font-mono text-[11.5px] leading-6">
                      <table className="w-full border-collapse">
                        <tbody>
                          {selectedFile.lines.map((line, idx) => (
                            <tr
                              key={idx}
                              className={`border-b border-slate-800/40 last:border-0 ${
                                line.type === 'removed'
                                  ? 'bg-red-950/25 text-red-200'
                                  : line.type === 'added'
                                  ? 'bg-emerald-950/25 text-emerald-200'
                                  : 'text-slate-300'
                              }`}
                            >
                              <td className="w-11 text-right pr-2 pl-2 text-slate-500 tabular-nums select-none border-r border-slate-800/60">
                                {line.lineOriginal ?? ''}
                              </td>
                              <td className="w-11 text-right pr-2 pl-2 text-slate-500 tabular-nums select-none border-r border-slate-800/60">
                                {line.lineMigrated ?? ''}
                              </td>
                              <td className="px-3 whitespace-pre">
                                {line.type === 'removed'
                                  ? '- '
                                  : line.type === 'added'
                                  ? '+ '
                                  : '  '}
                                {line.content}
                                {line.annotation && (
                                  <span className="ml-3 font-sans text-[10.5px] text-cyan-300 bg-cyan-950/40 border border-cyan-500/25 rounded px-2 py-0.5">
                                    {line.annotation}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            ) : (
              <EmptyStatePanel
                title="No matching file diffs"
                description="Switch the filter tab on the left to inspect all modified source, dependency, and configuration files."
                actionLabel="Show All Files"
                onAction={() => setChangeFilter('all')}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
