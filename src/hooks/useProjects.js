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

  // Persist to localStorage — with automatic pruning on quota exceeded
  useEffect(() => {
    const STORAGE_LIMIT = 4 * 1024 * 1024; // 4MB soft limit (below browser's 5MB)
    const MAX_HISTORY_PER_PROJECT = 20;

    try {
      const json = JSON.stringify(projects);

      // Happy path: fits within limit
      if (json.length < STORAGE_LIMIT) {
        localStorage.setItem(PROJECTS_KEY, json);
        localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
        return;
      }

      // ── Degradation: progressively trim data ──
      let trimmed = JSON.parse(json); // deep clone

      // Step 1: Cap history entries per project (oldest first)
      for (const pid of Object.keys(trimmed)) {
        const proj = trimmed[pid];
        if (proj.history && proj.history.length > MAX_HISTORY_PER_PROJECT) {
          proj.history = proj.history.slice(0, MAX_HISTORY_PER_PROJECT);
        }
      }
      let retry = JSON.stringify(trimmed);
      if (retry.length < STORAGE_LIMIT) {
        localStorage.setItem(PROJECTS_KEY, retry);
        localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
        // Sync trimmed data back to state
        setProjects(trimmed);
        console.warn('[ProtoAI] 存储超限，已自动裁剪旧历史记录');
        return;
      }

      // Step 2: Remove HTML from older history entries (keep metadata only)
      for (const pid of Object.keys(trimmed)) {
        const proj = trimmed[pid];
        if (proj.history) {
          proj.history = proj.history.map((entry, i) => {
            if (i >= 5) return { ...entry, pages: [] }; // keep only 5 most recent with data
            return entry;
          });
        }
      }
      retry = JSON.stringify(trimmed);
      if (retry.length < STORAGE_LIMIT) {
        localStorage.setItem(PROJECTS_KEY, retry);
        localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
        setProjects(trimmed);
        console.warn('[ProtoAI] 存储超限，已清除旧历史中的页面数据');
        return;
      }

      // Step 3: Limit saved plans per project
      for (const pid of Object.keys(trimmed)) {
        const proj = trimmed[pid];
        if (proj.savedPlans && proj.savedPlans.length > 10) {
          proj.savedPlans = proj.savedPlans.slice(0, 10);
        }
      }
      retry = JSON.stringify(trimmed);
      if (retry.length < STORAGE_LIMIT) {
        localStorage.setItem(PROJECTS_KEY, retry);
        localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
        setProjects(trimmed);
        console.warn('[ProtoAI] 存储超限，已裁剪旧方案');
        return;
      }

      // Final fallback: save what we can, warn user
      localStorage.setItem(PROJECTS_KEY, retry);
      localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
      console.warn('[ProtoAI] 存储空间不足，部分数据可能无法保存');
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.error('[ProtoAI] localStorage 配额已满，数据无法保存');
      }
    }
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
