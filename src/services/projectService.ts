import {
  INITIAL_ACTIVITY_EVENTS,
  INITIAL_MOCK_PROJECTS,
  MOCK_ANALYSIS_HISTORY,
} from '../mocks/projectsMock';
import { ActivityEvent, AnalysisHistoryPoint, Project } from '../types';
import { simulateServiceCall } from './httpClient';

const PROJECTS_STORAGE_KEY = 'qg_demo_projects_v1';
const ACTIVITY_STORAGE_KEY = 'qg_demo_activity_v1';

function readStoredProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return INITIAL_MOCK_PROJECTS;
    const parsed = JSON.parse(raw) as Project[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_MOCK_PROJECTS;
  } catch {
    return INITIAL_MOCK_PROJECTS;
  }
}

function writeStoredProjects(projects: Project[]): void {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Ignore storage issues
  }
}

function readStoredActivity(): ActivityEvent[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!raw) return INITIAL_ACTIVITY_EVENTS;
    const parsed = JSON.parse(raw) as ActivityEvent[];
    return Array.isArray(parsed) ? parsed : INITIAL_ACTIVITY_EVENTS;
  } catch {
    return INITIAL_ACTIVITY_EVENTS;
  }
}

function writeStoredActivity(events: ActivityEvent[]): void {
  try {
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Ignore storage issues
  }
}

/**
 * Service interface aligned with proposed backend endpoints:
 * GET /api/projects, GET /api/projects/:id, POST /api/projects
 */
export const projectService = {
  async listProjects(): Promise<Project[]> {
    return simulateServiceCall('GET /api/projects', () => readStoredProjects());
  },

  async getProjectById(id: string): Promise<Project | undefined> {
    return simulateServiceCall(`GET /api/projects/${id}`, () =>
      readStoredProjects().find((p) => p.id === id)
    );
  },

  async createProject(
    input: Omit<Project, 'id' | 'lastAnalysisDate' | 'isDemoData'>
  ): Promise<Project> {
    return simulateServiceCall('POST /api/projects', () => {
      const projects = readStoredProjects();
      const newProject: Project = {
        ...input,
        id: `proj-${Date.now().toString(36)}`,
        lastAnalysisDate: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC',
        isDemoData: true,
      };
      const updated = [newProject, ...projects];
      writeStoredProjects(updated);

      const activity = readStoredActivity();
      writeStoredActivity([
        {
          id: `act-${Date.now().toString(36)}`,
          projectId: newProject.id,
          projectName: newProject.name,
          action: 'Demo project registered',
          detail: `${newProject.originalVersion.branch} vs ${newProject.migratedVersion.branch} (${newProject.language})`,
          timestamp: newProject.lastAnalysisDate,
          severity: newProject.criticalCount > 0 ? 'Critical' : 'Info',
        },
        ...activity,
      ]);

      return newProject;
    });
  },

  async updateProject(id: string, patch: Partial<Project>): Promise<Project> {
    return simulateServiceCall(`PATCH /api/projects/${id}`, () => {
      const projects = readStoredProjects();
      const index = projects.findIndex((p) => p.id === id);
      if (index === -1) {
        throw new Error(`Project ${id} not found`);
      }
      const updatedProject: Project = { ...projects[index], ...patch };
      projects[index] = updatedProject;
      writeStoredProjects(projects);
      return updatedProject;
    });
  },

  async deleteProject(id: string): Promise<void> {
    return simulateServiceCall(`DELETE /api/projects/${id}`, () => {
      const projects = readStoredProjects().filter((p) => p.id !== id);
      writeStoredProjects(projects);
    });
  },

  async getRecentActivity(): Promise<ActivityEvent[]> {
    return simulateServiceCall('GET /api/projects/activity', () => readStoredActivity());
  },

  async getAnalysisHistory(): Promise<AnalysisHistoryPoint[]> {
    return simulateServiceCall('GET /api/analyses/history', () => MOCK_ANALYSIS_HISTORY);
  },

  resetDemoState(): void {
    localStorage.removeItem(PROJECTS_STORAGE_KEY);
    localStorage.removeItem(ACTIVITY_STORAGE_KEY);
  },
};
