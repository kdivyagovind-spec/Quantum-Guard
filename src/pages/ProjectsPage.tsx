import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit3,
  Eye,
  GitBranch,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  EmptyStatePanel,
  ErrorStatePanel,
  LoadingSkeleton,
} from '../components/AsyncStatePanel';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';
import { ProjectStatusText } from '../components/StatusIndicator';
import { useWorkspace } from '../context/WorkspaceContext';
import { ProgrammingLanguage, Project, ProjectStatus } from '../types';

const LANGUAGES: ProgrammingLanguage[] = [
  'Go',
  'Rust',
  'Java',
  'C++',
  'TypeScript',
  'Python',
];

const STATUSES: ProjectStatus[] = [
  'Completed',
  'Regressions Detected',
  'Needs Review',
  'Draft',
];

export const ProjectsPage: React.FC = () => {
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    isLoadingProjects,
    projectsError,
    refreshProjects,
    addProject,
    updateProject,
    deleteProject,
    pushToast,
  } = useWorkspace();

  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formRepoUrl, setFormRepoUrl] = useState('');
  const [formLanguage, setFormLanguage] = useState<ProgrammingLanguage>('Go');
  const [formOriginalBranch, setFormOriginalBranch] = useState('main');
  const [formOriginalCommit, setFormOriginalCommit] = useState('a1b2c3d');
  const [formMigratedBranch, setFormMigratedBranch] = useState('feat/pqc-migration');
  const [formMigratedCommit, setFormMigratedCommit] = useState('f9e8d7c');
  const [formError, setFormError] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingProject(null);
    setFormName('');
    setFormDescription('');
    setFormRepoUrl('https://github.com/org/pqc-service');
    setFormLanguage('Go');
    setFormOriginalBranch('main');
    setFormOriginalCommit('a1b2c3d');
    setFormMigratedBranch('feat/pqc-mlkem');
    setFormMigratedCommit('f9e8d7c');
    setFormError(null);
    setFormModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormName(project.name);
    setFormDescription(project.description);
    setFormRepoUrl(project.repositoryUrl);
    setFormLanguage(project.language);
    setFormOriginalBranch(project.originalVersion.branch);
    setFormOriginalCommit(project.originalVersion.commitHash);
    setFormMigratedBranch(project.migratedVersion.branch);
    setFormMigratedCommit(project.migratedVersion.commitHash);
    setFormError(null);
    setFormModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formRepoUrl.trim() || !formOriginalBranch.trim() || !formMigratedBranch.trim()) {
      setFormError('Project name, repository URL/archive, and both branch versions are required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingProject) {
        await updateProject(editingProject.id, {
          name: formName.trim(),
          description: formDescription.trim() || editingProject.description,
          repositoryUrl: formRepoUrl.trim(),
          language: formLanguage,
          originalVersion: {
            ...editingProject.originalVersion,
            branch: formOriginalBranch.trim(),
            commitHash: formOriginalCommit.trim() || 'baseline',
          },
          migratedVersion: {
            ...editingProject.migratedVersion,
            branch: formMigratedBranch.trim(),
            commitHash: formMigratedCommit.trim() || 'migrated',
          },
        });
        pushToast({
          title: 'Project updated',
          description: `${formName.trim()} details saved in local demo state.`,
          variant: 'success',
        });
      } else {
        await addProject({
          name: formName.trim(),
          description:
            formDescription.trim() ||
            `Demonstration PQC migration project (${formOriginalBranch} → ${formMigratedBranch}).`,
          repositoryUrl: formRepoUrl.trim(),
          repositorySource: formRepoUrl.endsWith('.zip') || formRepoUrl.endsWith('.tar.gz') ? 'archive' : 'git',
          language: formLanguage,
          originalVersion: {
            branch: formOriginalBranch.trim(),
            commitHash: formOriginalCommit.trim() || 'a1b2c3d',
            label: `${formOriginalBranch.trim()} (Classical)`,
            timestamp: 'Baseline snapshot',
          },
          migratedVersion: {
            branch: formMigratedBranch.trim(),
            commitHash: formMigratedCommit.trim() || 'f9e8d7c',
            label: `${formMigratedBranch.trim()} (PQC)`,
            timestamp: 'Target snapshot',
          },
          status: 'Needs Review',
          totalFilesScanned: 84,
          detectedPrimitivesCount: 6,
          regressionCount: 1,
          criticalCount: 0,
        });
        pushToast({
          title: 'Demo project added',
          description: `${formName.trim()} is now active in the workspace.`,
          variant: 'success',
        });
      }
      setFormModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProject) return;
    setIsSubmitting(true);
    try {
      await deleteProject(deletingProject.id);
      pushToast({
        title: 'Project removed',
        description: `${deletingProject.name} was deleted from local demo storage.`,
        variant: 'info',
      });
      setDeletingProject(null);
    } catch (err) {
      pushToast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Unexpected error',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.repositoryUrl.toLowerCase().includes(q) ||
        p.originalVersion.branch.toLowerCase().includes(q) ||
        p.migratedVersion.branch.toLowerCase().includes(q);
      const matchesLang = languageFilter === 'ALL' || p.language === languageFilter;
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchesSearch && matchesLang && matchesStatus;
    });
  }, [projects, searchQuery, languageFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Projects & Repository Pairs
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage baseline and post-quantum migration version pairs in frontend demo state.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-[#0D1526] px-3.5 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add Project</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/new-analysis')}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>New Migration Analysis</span>
          </button>
        </div>
      </div>

      <DemoNoticeBanner contextLabel="Frontend State Management · Mock Repository Registry" />

      {/* Search and Filter Bar */}
      <div className="rounded-lg border border-slate-800/80 bg-[#0B1220] p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search
            className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project name, repository URL, or branch..."
            className="w-full rounded-md border border-slate-800 bg-[#060B14] pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            aria-label="Filter by programming language"
            className="rounded-md border border-slate-800 bg-[#060B14] px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Languages</option>
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by analysis status"
            className="rounded-md border border-slate-800 bg-[#060B14] px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table / Error / Loading / Empty */}
      {projectsError ? (
        <ErrorStatePanel message={projectsError} onRetry={() => void refreshProjects()} />
      ) : isLoadingProjects ? (
        <LoadingSkeleton rows={5} />
      ) : filteredProjects.length === 0 ? (
        <EmptyStatePanel
          title="No matching projects found"
          description="Adjust your search filter or add a new demonstration project to explore migration analysis."
          actionLabel="Add Project"
          onAction={openAddModal}
        />
      ) : (
        <div className="rounded-lg border border-slate-800/80 bg-[#0B1220] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-[#0D1526] text-[11px] font-medium text-slate-400">
                  <th className="py-3 px-5">Project Name & Repository</th>
                  <th className="py-3 px-4">Original Version</th>
                  <th className="py-3 px-4">Migrated Version</th>
                  <th className="py-3 px-4">Language</th>
                  <th className="py-3 px-4">Last Analysis</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredProjects.map((proj) => {
                  const isActive = proj.id === activeProjectId;
                  return (
                    <tr
                      key={proj.id}
                      className={`transition-colors ${
                        isActive ? 'bg-blue-950/20' : 'hover:bg-slate-800/30'
                      }`}
                    >
                      <td className="py-3.5 px-5 max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-100">{proj.name}</span>
                          {isActive && (
                            <span className="text-[10px] font-mono text-cyan-400">
                              · Active
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-slate-400 truncate">
                          {proj.repositoryUrl}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                        <div className="inline-flex items-center gap-1">
                          <GitBranch className="h-3 w-3 text-slate-500" />
                          <span>{proj.originalVersion.branch}</span>
                        </div>
                        <div className="text-slate-500">{proj.originalVersion.commitHash}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-cyan-300">
                        <div className="inline-flex items-center gap-1">
                          <GitBranch className="h-3 w-3 text-cyan-500" />
                          <span>{proj.migratedVersion.branch}</span>
                        </div>
                        <div className="text-slate-400">{proj.migratedVersion.commitHash}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-200">{proj.language}</td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-[11px] text-slate-400 whitespace-nowrap">
                        {proj.lastAnalysisDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <ProjectStatusText status={proj.status} />
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingProject(proj)}
                            title="View project details"
                            className="p-1.5 rounded border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                            aria-label={`View ${proj.name}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(proj)}
                            title="Edit project details"
                            className="p-1.5 rounded border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                            aria-label={`Edit ${proj.name}`}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingProject(proj)}
                            title="Delete project"
                            className="p-1.5 rounded border border-slate-800 text-red-400 hover:text-red-300 hover:bg-red-950/40 cursor-pointer"
                            aria-label={`Delete ${proj.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Project Detail Modal */}
      {viewingProject && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl rounded-lg border border-slate-700 bg-[#0B1220] shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  {viewingProject.name}
                </h2>
                <p className="text-xs text-slate-400">
                  Demonstration Project Record · {viewingProject.language}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingProject(null)}
                className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-300 leading-relaxed">{viewingProject.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                <div>
                  <div className="text-slate-400">Repository</div>
                  <div className="mt-1 font-mono text-slate-200 break-all">
                    {viewingProject.repositoryUrl}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Status</div>
                  <div className="mt-1">
                    <ProjectStatusText status={viewingProject.status} />
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Original Version</div>
                  <div className="mt-1 font-mono text-slate-200">
                    {viewingProject.originalVersion.branch} ({viewingProject.originalVersion.commitHash})
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Migrated Version</div>
                  <div className="mt-1 font-mono text-cyan-300">
                    {viewingProject.migratedVersion.branch} ({viewingProject.migratedVersion.commitHash})
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 font-mono tabular-nums">
                <div>
                  <div className="text-slate-400 font-sans">Files Scanned</div>
                  <div className="text-base font-semibold text-slate-100 mt-0.5">
                    {viewingProject.totalFilesScanned}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-sans">Primitives</div>
                  <div className="text-base font-semibold text-cyan-300 mt-0.5">
                    {viewingProject.detectedPrimitivesCount}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-sans">Regressions</div>
                  <div className="text-base font-semibold text-amber-400 mt-0.5">
                    {viewingProject.regressionCount}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-[#080E1A] flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setViewingProject(null)}
                className="rounded-md border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveProjectId(viewingProject.id);
                  setViewingProject(null);
                  navigate('/discovery');
                }}
                className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
              >
                Set Active & Inspect Discovery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {formModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveForm}
            className="w-full max-w-lg rounded-lg border border-slate-700 bg-[#0B1220] shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">
                {editingProject ? 'Edit Project Details' : 'Add Demonstration Project'}
              </h2>
              <button
                type="button"
                onClick={() => setFormModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="rounded-md border border-red-500/35 bg-red-950/30 px-3 py-2 text-red-300">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., CoreAuth Session Service"
                  className="w-full rounded-md border border-slate-700 bg-[#060B14] px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  Repository URL or Archive Name
                </label>
                <input
                  type="text"
                  value={formRepoUrl}
                  onChange={(e) => setFormRepoUrl(e.target.value)}
                  placeholder="https://github.com/org/repo"
                  className="w-full rounded-md border border-slate-700 bg-[#060B14] px-3 py-2 font-mono text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">
                    Programming Language
                  </label>
                  <select
                    value={formLanguage}
                    onChange={(e) => setFormLanguage(e.target.value as ProgrammingLanguage)}
                    className="w-full rounded-md border border-slate-700 bg-[#060B14] px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Optional migration scope summary"
                    className="w-full rounded-md border border-slate-700 bg-[#060B14] px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">
                    Original Branch
                  </label>
                  <input
                    type="text"
                    value={formOriginalBranch}
                    onChange={(e) => setFormOriginalBranch(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-[#060B14] px-3 py-2 font-mono text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">
                    Original Commit
                  </label>
                  <input
                    type="text"
                    value={formOriginalCommit}
                    onChange={(e) => setFormOriginalCommit(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-[#060B14] px-3 py-2 font-mono text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">
                    Migrated Branch
                  </label>
                  <input
                    type="text"
                    value={formMigratedBranch}
                    onChange={(e) => setFormMigratedBranch(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-[#060B14] px-3 py-2 font-mono text-cyan-300 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">
                    Migrated Commit
                  </label>
                  <input
                    type="text"
                    value={formMigratedCommit}
                    onChange={(e) => setFormMigratedCommit(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-[#060B14] px-3 py-2 font-mono text-cyan-300 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-[#080E1A] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setFormModalOpen(false)}
                className="rounded-md border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProject && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-lg border border-red-500/35 bg-[#0B1220] p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-slate-100">
              Delete Demonstration Project?
            </h2>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              This will remove <span className="font-semibold text-slate-200">{deletingProject.name}</span> from your local demonstration workspace. You can restore default demo projects anytime in Settings.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingProject(null)}
                className="rounded-md border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
