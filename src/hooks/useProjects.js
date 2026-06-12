import { useState, useCallback, useEffect, useRef } from 'react';
import { generateAllWireframes } from '../components/PlanPreview.jsx';

// ── Constants ──
const PROJECTS_KEY = 'protoai_projects';
const ACTIVE_PROJECT_KEY = 'protoai_active_project';
const LEGACY_STATE_KEY = 'protoai_saved_state';
const LEGACY_PLANS_KEY = 'protoai_saved_plans';

export const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const createEmptyProject = (name = '未命名项目') => ({
  id: generateId(),
  name,
  contentDesc: '',
  styleDesc: '',
  selectedStyles: ['business'],
  pages: [],
  history: [],
  savedPlans: [],
  loadedPlanId: null,
  plannedPages: null,
  plannedStyleSpec: '',
  detectedPlatform: 'pc',
  timestamp: Date.now(),
});

// ── Initial data loader (localStorage → projects map) ──

function loadInitialData() {
  try {
    let projects = null;
    let activeProjectId = null;

    const savedProjects = localStorage.getItem(PROJECTS_KEY);
    if (savedProjects) {
      const parsed = JSON.parse(savedProjects);
      if (typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length > 0) {
        projects = parsed;
        activeProjectId = localStorage.getItem(ACTIVE_PROJECT_KEY) || Object.keys(parsed)[0];
        if (!projects[activeProjectId]) activeProjectId = Object.keys(projects)[0];
      }
    }

    // Migrate from legacy flat state format
    if (!projects) {
      const saved = localStorage.getItem(LEGACY_STATE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.pages?.length > 0 && (Date.now() - (data.timestamp || 0) < 72 * 3600 * 1000)) {
          if (data.pages) data.pages = data.pages.filter(Boolean);
          const legacyPlans = (() => {
            try { return JSON.parse(localStorage.getItem(LEGACY_PLANS_KEY) || '[]'); } catch { return []; }
          })();
          const proj = createEmptyProject(data.projectName || '我的项目');
          Object.assign(proj, {
            contentDesc: data.contentDesc || '',
            styleDesc: data.styleDesc || '',
            selectedStyles: data.selectedStyles || ['business'],
            pages: data.pages || [],
            savedPlans: legacyPlans,
            timestamp: data.timestamp || Date.now(),
          });
          projects = { [proj.id]: proj };
          activeProjectId = proj.id;
        }
      }
    }

    if (!projects) {
      const proj = createEmptyProject('我的项目');
      projects = { [proj.id]: proj };
      activeProjectId = proj.id;
    }

    return { projects, activeProjectId };
  } catch (e) {
    const proj = createEmptyProject('我的项目');
    return { projects: { [proj.id]: proj }, activeProjectId: proj.id };
  }
}

// ── Hook ──

export default function useProjects() {
  const [initialData] = useState(loadInitialData);
  const [projects, setProjects] = useState(initialData.projects);
  const [activeProjectId, setActiveProjectId] = useState(initialData.activeProjectId);
  const projectsRef = useRef(projects);
  useEffect(() => { projectsRef.current = projects; }, [projects]);

  const currentProject = projects[activeProjectId] || Object.values(projects)[0] || createEmptyProject();

  // Helper to update current project fields
  const updateCurrentProject = useCallback((updates) => {
    setProjects(prev => ({
      ...prev,
      [activeProjectId]: { ...prev[activeProjectId], ...updates },
    }));
  }, [activeProjectId]);

  // Derived project data
  const projectName = currentProject.name || '';
  const contentDesc = currentProject.contentDesc || '';
  const styleDesc = currentProject.styleDesc || '';
  const selectedStyles = currentProject.selectedStyles || ['business'];
  const pages = currentProject.pages || [];
  const pagesRef = useRef(pages);
  useEffect(() => { pagesRef.current = pages; }, [pages]);
  const history = currentProject.history || [];
  const savedPlans = currentProject.savedPlans || [];
  const loadedPlanId = currentProject.loadedPlanId || null;

  // Wrapper setter for pages that updates current project
  const setPages = useCallback((valueOrFn) => {
    if (typeof valueOrFn === 'function') {
      setProjects(prev => {
        const proj = prev[activeProjectId];
        if (!proj) return prev;
        const newPages = valueOrFn(proj.pages || []);
        return { ...prev, [activeProjectId]: { ...proj, pages: newPages } };
      });
    } else {
      updateCurrentProject({ pages: valueOrFn });
    }
  }, [activeProjectId, updateCurrentProject]);

  // Persist to localStorage
  useEffect(() => {
    try {
      const json = JSON.stringify(projects);
      if (json.length < 5 * 1024 * 1024) {
        localStorage.setItem(PROJECTS_KEY, json);
        localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
      }
    } catch (e) { /* quota exceeded — ignore */ }
  }, [projects, activeProjectId]);

  // Toggle a style tag on the current project
  const toggleStyle = useCallback((id) => {
    const current = projectsRef.current[activeProjectId]?.selectedStyles || ['business'];
    const next = current.includes(id) ? current.filter((s) => s !== id) : [...current, id];
    updateCurrentProject({ selectedStyles: next });
  }, [activeProjectId, updateCurrentProject]);

  const handleProjectNameChange = useCallback((newName) => {
    updateCurrentProject({ name: newName });
  }, [updateCurrentProject]);

  return {
    // State
    projects, setProjects, activeProjectId, setActiveProjectId,
    projectsRef, currentProject,
    // Derived
    projectName, contentDesc, styleDesc, selectedStyles,
    pages, pagesRef, history, savedPlans, loadedPlanId,
    // Helpers
    updateCurrentProject, setPages, toggleStyle,
    handleProjectNameChange,
  };
}
