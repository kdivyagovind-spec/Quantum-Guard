import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Bell,
  ChevronDown,
  FileCode2,
  FileText,
  FlaskConical,
  FolderGit2,
  GitCompareArrows,
  LayoutDashboard,
  Menu,
  Plus,
  SearchCode,
  Settings,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { ToastContainer } from '../components/ToastContainer';
import { useWorkspace } from '../context/WorkspaceContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  badgeCount?: number;
}

export const AppLayout: React.FC = () => {
  const {
    projects,
    activeProject,
    setActiveProjectId,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useWorkspace();

  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const projectRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (projectRef.current && !projectRef.current.contains(target)) {
        setProjectMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems: NavItem[] = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderGit2 },
    { to: '/discovery', label: 'Cryptographic Discovery', icon: SearchCode },
    { to: '/migration', label: 'Migration Analysis', icon: FileCode2 },
    { to: '/execution', label: 'Execution Comparison', icon: GitCompareArrows },
    {
      to: '/regressions',
      label: 'Regression Investigation',
      icon: ShieldAlert,
      badgeCount: activeProject?.regressionCount,
    },
    { to: '/pqc-verification', label: 'PQC Verification', icon: ShieldCheck },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#060B14] text-slate-100 flex">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/65 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-50 w-[264px] shrink-0 border-r border-slate-800/80 bg-[#080E1A] flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Wordmark */}
        <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            <div className="h-8 w-8 rounded-md bg-blue-600/15 border border-blue-500/40 flex items-center justify-center shrink-0">
              <Activity className="h-4 w-4 text-blue-400" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-slate-100 whitespace-nowrap">
                QUANTUM GUARD
              </div>
              <div className="text-[11px] text-slate-400 whitespace-nowrap">
                PQC Regression Analyzer
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-200 cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Primary CTA */}
        <div className="px-4 pt-4 pb-2">
          <button
            type="button"
            onClick={() => navigate('/new-analysis')}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>New Migration Analysis</span>
          </button>
        </div>

        {/* Primary Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-300 border border-blue-500/25'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
                  }`
                }
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </span>
                {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                  <span className="font-mono tabular-nums text-[11px] font-semibold text-red-400">
                    {item.badgeCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Quiet Prototype Notice Footer */}
        <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
          <div className="font-medium text-cyan-400">Phase 1 Frontend Prototype</div>
          <div className="mt-0.5 text-slate-500">
            Simulated demonstration telemetry only. Backend engine pending Phase 2.
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Navigation Bar */}
        <header className="no-print sticky top-0 z-30 h-16 border-b border-slate-800/80 bg-[#080E1A]/95 backdrop-blur-sm px-4 lg:px-6 flex items-center justify-between gap-4">
          {/* Left: Mobile Trigger + Project Selector + Version Pair */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-md border border-slate-800 text-slate-300 hover:bg-slate-800/60 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Current Project Dropdown */}
            <div className="relative" ref={projectRef}>
              <button
                type="button"
                onClick={() => setProjectMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0D1526] px-3 py-1.5 text-left hover:border-slate-700 transition-colors cursor-pointer max-w-[240px] sm:max-w-[290px]"
                aria-expanded={projectMenuOpen}
                aria-haspopup="listbox"
              >
                <FolderGit2 className="h-3.5 w-3.5 text-blue-400 shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold text-slate-100 truncate">
                  {activeProject ? activeProject.name : 'Select Project'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-auto" />
              </button>

              {projectMenuOpen && (
                <div
                  className="absolute left-0 mt-1.5 w-80 rounded-lg border border-slate-700/80 bg-[#0D1526] shadow-2xl py-1.5 z-50"
                  role="listbox"
                >
                  <div className="px-3 py-1.5 text-[11px] font-medium text-slate-400 border-b border-slate-800/80">
                    Switch Active Demo Project
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {projects.map((proj) => {
                      const selected = activeProject?.id === proj.id;
                      return (
                        <button
                          key={proj.id}
                          type="button"
                          onClick={() => {
                            setActiveProjectId(proj.id);
                            setProjectMenuOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left transition-colors cursor-pointer flex items-start justify-between gap-2 ${
                            selected
                              ? 'bg-blue-600/15 text-blue-200'
                              : 'text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">{proj.name}</div>
                            <div className="mt-0.5 text-[11px] text-slate-400 font-mono truncate">
                              {proj.language} · {proj.originalVersion.branch} → {proj.migratedVersion.branch}
                            </div>
                          </div>
                          {proj.regressionCount > 0 && (
                            <span className="text-[11px] font-mono tabular-nums text-red-400 shrink-0">
                              {proj.regressionCount} reg
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-800/80 pt-1 px-2">
                    <button
                      type="button"
                      onClick={() => {
                        setProjectMenuOpen(false);
                        navigate('/projects');
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      Manage all projects →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Selected Original vs Migrated Version Pair */}
            {activeProject && (
              <div className="hidden xl:flex items-center gap-2 text-xs text-slate-400 border-l border-slate-800 pl-3 whitespace-nowrap">
                <span className="text-slate-500">Comparing:</span>
                <code className="font-mono text-[11px] text-slate-200 bg-slate-800/60 px-1.5 py-0.5 rounded">
                  {activeProject.originalVersion.branch} ({activeProject.originalVersion.commitHash})
                </code>
                <span className="text-slate-500" aria-hidden="true">→</span>
                <code className="font-mono text-[11px] text-cyan-300 bg-cyan-950/50 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                  {activeProject.migratedVersion.branch} ({activeProject.migratedVersion.commitHash})
                </code>
              </div>
            )}
          </div>

          {/* Right: Prototype Status Indicator + Notifications + User Profile */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className="hidden sm:flex items-center gap-1.5 rounded-md border border-cyan-500/25 bg-cyan-950/30 px-2.5 py-1 text-[11px] font-medium text-cyan-300 whitespace-nowrap"
              title="Phase 1 UI Prototype using mock datasets"
            >
              <FlaskConical className="h-3.5 w-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
              <span>Prototype · Demo Mode</span>
            </div>

            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifMenuOpen((v) => !v)}
                className="relative p-2 rounded-md border border-slate-800 bg-[#0D1526] text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
                aria-label={`Notifications (${unreadCount} unread)`}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-blue-600 text-[10px] font-mono font-semibold text-white flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-80 sm:w-96 rounded-lg border border-slate-700/80 bg-[#0D1526] shadow-2xl z-50">
                  <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-100">
                      Demo Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/70">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          markNotificationRead(n.id);
                          setNotifMenuOpen(false);
                          if (n.route) navigate(n.route);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-800/50 transition-colors cursor-pointer ${
                          n.read ? 'opacity-70' : 'bg-blue-950/15'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-100 truncate">
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-500 whitespace-nowrap">
                            {n.timestamp}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                          {n.message}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0D1526] px-2.5 py-1.5 hover:border-slate-700 transition-colors cursor-pointer"
                aria-label="User profile menu"
              >
                <div className="h-6 w-6 rounded bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-[11px] font-semibold text-blue-300">
                  SC
                </div>
                <span className="hidden md:inline text-xs font-medium text-slate-200 whitespace-nowrap">
                  Sarah Chen
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-60 rounded-lg border border-slate-700/80 bg-[#0D1526] shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <div className="text-xs font-semibold text-slate-100">Sarah Chen</div>
                    <div className="text-[11px] text-slate-400">
                      Principal Security Architect (Demo)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="h-3.5 w-3.5 text-slate-400" />
                    <span>Workspace & API Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/reports');
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer"
                  >
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>Technical Reports</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-5 lg:p-8 max-w-[1440px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};
