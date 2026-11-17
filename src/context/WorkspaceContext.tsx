import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { INITIAL_NOTIFICATIONS } from '../mocks/projectsMock';
import { analysisService } from '../services/analysisService';
import {
  DEFAULT_DEMO_SETTINGS,
  getDemoSettings,
  saveDemoSettings,
} from '../services/httpClient';
import { projectService } from '../services/projectService';
import { DemoSettings, Project, WorkspaceNotification } from '../types';

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'warning' | 'error' | 'info';
}

interface WorkspaceContextValue {
  projects: Project[];
  activeProject: Project | null;
  activeProjectId: string;
  isLoadingProjects: boolean;
  projectsError: string | null;
  notifications: WorkspaceNotification[];
  toasts: ToastMessage[];
  demoSettings: DemoSettings;
  setActiveProjectId: (id: string) => void;
  refreshProjects: () => Promise<void>;
  addProject: (
    input: Omit<Project, 'id' | 'lastAnalysisDate' | 'isDemoData'>
  ) => Promise<Project>;
  updateProject: (id: string, patch: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  updateDemoSettings: (patch: Partial<DemoSettings>) => void;
  resetAllDemoData: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('proj-fincore');
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<WorkspaceNotification[]>(
    INITIAL_NOTIFICATIONS
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [demoSettings, setDemoSettings] = useState<DemoSettings>(() => getDemoSettings());

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => {
        dismissToast(id);
      }, 4800);
    },
    [dismissToast]
  );

  const refreshProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    setProjectsError(null);
    try {
      const list = await projectService.listProjects();
      setProjects(list);
      setActiveProjectId((current) => {
        if (list.some((p) => p.id === current)) return current;
        return list[0]?.id ?? '';
      });
    } catch (err) {
      setProjectsError(
        err instanceof Error ? err.message : 'Unable to load demonstration projects.'
      );
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  const addProject = useCallback(
    async (input: Omit<Project, 'id' | 'lastAnalysisDate' | 'isDemoData'>) => {
      const created = await projectService.createProject(input);
      setProjects((prev) => [created, ...prev]);
      setActiveProjectId(created.id);
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: `Demo Project Added: ${created.name}`,
          message: `Comparing ${created.originalVersion.branch} against ${created.migratedVersion.branch}.`,
          timestamp: 'Just now',
          read: false,
          type: 'success',
          route: '/projects',
        },
        ...prev,
      ]);
      return created;
    },
    []
  );

  const updateProject = useCallback(async (id: string, patch: Partial<Project>) => {
    const updated = await projectService.updateProject(id, patch);
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    await projectService.deleteProject(id);
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== id);
      setActiveProjectId((current) => (current === id ? next[0]?.id ?? '' : current));
      return next;
    });
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const updateDemoSettings = useCallback((patch: Partial<DemoSettings>) => {
    setDemoSettings((prev) => {
      const next = { ...prev, ...patch };
      saveDemoSettings(next);
      return next;
    });
  }, []);

  const resetAllDemoData = useCallback(async () => {
    projectService.resetDemoState();
    analysisService.resetTriageOverrides();
    saveDemoSettings(DEFAULT_DEMO_SETTINGS);
    setDemoSettings(DEFAULT_DEMO_SETTINGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    await refreshProjects();
    pushToast({
      title: 'Demo dataset restored',
      description: 'All demonstration projects, triage statuses, and settings were reset.',
      variant: 'info',
    });
  }, [pushToast, refreshProjects]);

  const activeProject =
    projects.find((p) => p.id === activeProjectId) ?? projects[0] ?? null;

  return (
    <WorkspaceContext.Provider
      value={{
        projects,
        activeProject,
        activeProjectId,
        isLoadingProjects,
        projectsError,
        notifications,
        toasts,
        demoSettings,
        setActiveProjectId,
        refreshProjects,
        addProject,
        updateProject,
        deleteProject,
        markNotificationRead,
        markAllNotificationsRead,
        pushToast,
        dismissToast,
        updateDemoSettings,
        resetAllDemoData,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return ctx;
}
