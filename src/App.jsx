import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Component as ReactComponent } from 'react';
import JSZip from 'jszip';
import TopBar from './components/TopBar.jsx';
import LeftPanel from './components/LeftPanel.jsx';
import RightPanel from './components/RightPanel.jsx';
import RefinePanel from './components/RefinePanel.jsx';
import AISettingsModal from './components/AISettingsModal.jsx';
import VersionHistory from './components/VersionHistory.jsx';
import PlansHistoryModal from './components/PlansHistoryModal.jsx';
import { generateAllWireframes } from './components/PlanPreview.jsx';
import { planProject, generateProjectPages, generateSinglePage, readFileContents, capturePageAsImage, refinePage, regenerateSinglePage, buildStyleSpec, pageFileName } from './aiService.js';

const BUILTIN_PROVIDER_NAMES = { openai: 'OpenAI', claude: 'Claude', custom: 'Mimo' };

function formatTime(date) {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${date.getMonth() + 1}月${date.getDate()}日 ${h}:${m}`;
}

function safeName(name) {
  return name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
}

// ── Error Boundary ─────────────────────────────────────
class ErrorBoundary extends ReactComponent {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 48, textAlign: 'center', fontFamily: 'system-ui' }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>页面渲染出错了</h2>
          <p style={{ color: '#666', marginBottom: 20 }}>
            {this.state.error?.message || '组件渲染异常'}
          </p>
          <p style={{ color: '#999', fontSize: 13, marginBottom: 24 }}>
            已生成的数据已保存在本地，刷新页面即可恢复。
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px', borderRadius: 8, border: 'none',
              background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 14,
            }}
          >
            刷新恢复
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const PROJECTS_KEY = 'protoai_projects';
const ACTIVE_PROJECT_KEY = 'protoai_active_project';
const LEGACY_STATE_KEY = 'protoai_saved_state';
const LEGACY_PLANS_KEY = 'protoai_saved_plans';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const createEmptyProject = (name = '未命名项目') => ({
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

export default function App() {
  // Restore projects from localStorage on mount
  const [initialData] = useState(() => {
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
  });

  // Projects state
  const [projects, setProjects] = useState(initialData.projects);
  const [activeProjectId, setActiveProjectId] = useState(initialData.activeProjectId);
  const projectsRef = useRef(projects);
  useEffect(() => { projectsRef.current = projects; }, [projects]);

  const currentProject = projects[activeProjectId] || Object.values(projects)[0] || createEmptyProject();

  // Helper to update current project's data
  const updateCurrentProject = useCallback((updates) => {
    setProjects(prev => ({
      ...prev,
      [activeProjectId]: { ...prev[activeProjectId], ...updates },
    }));
  }, [activeProjectId]);

  // Theme
  const [theme, setTheme] = useState('light');

  // Project data (derived from active project)
  const projectName = currentProject.name || '';
  const contentDesc = currentProject.contentDesc || '';
  const styleDesc = currentProject.styleDesc || '';
  const selectedStyles = currentProject.selectedStyles || ['business'];
  const pages = currentProject.pages || [];
  const history = currentProject.history || [];
  const savedPlans = currentProject.savedPlans || [];
  const loadedPlanId = currentProject.loadedPlanId || null;
  const [plannedPages, setPlannedPages] = useState(null);
  const [plannedStyleSpec, setPlannedStyleSpec] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState('pc');

  // Plan preview & view mode
  const [rightViewMode, setRightViewMode] = useState('empty'); // 'empty' | 'plan' | 'prototype'
  const [wireframeHtmls, setWireframeHtmls] = useState([]);
  const [showPlansHistory, setShowPlansHistory] = useState(false);

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

  // File upload state (session-only, not project-scoped)
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const handleFilesAdd = useCallback((newFiles) => setUploadedFiles((prev) => [...prev, ...newFiles]), []);
  const handleFileRemove = useCallback((index) => setUploadedFiles((prev) => prev.filter((_, i) => i !== index)), []);

  // Generation state
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [generateProgress, setGenerateProgress] = useState('');
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);

  // Flag: user manually selected a page to preview during generation (ref to avoid stale closures)
  const userSelectedPageRef = useRef(false);
  const isGeneratingRef = useRef(false);

  // Current page html (derived)
  const generatedHtml = pages[currentPageIndex]?.html || '';

  // Refine state — restore code from saved pages
  const [code, setCode] = useState(currentProject.pages?.[0]?.html || '');
  const [messages, setMessages] = useState([]);
  const [isRefining, setIsRefining] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratingPageIndex, setRegeneratingPageIndex] = useState(null);

  // AI settings — pre-configured with default model
  const [showSettings, setShowSettings] = useState(false);
  const [aiConfig, setAiConfig] = useState({
    custom: {
      apiKey: 'tp-s8015ckz5f83j4ok8irjjb1ul18s57t6pgz8r26jog63gsb6',
      endpoint: 'https://token-plan-sgp.xiaomimimo.com/v1',
      model: 'mimo-v2.5-pro',
    },
  });
  const [activeProvider, setActiveProvider] = useState('custom');

  const activeModel = useMemo(() => {
    // Dynamic provider name: built-in names + custom provider names from config
    const cfg = aiConfig[activeProvider];
    const provider = BUILTIN_PROVIDER_NAMES[activeProvider]
      || cfg?.name
      || activeProvider;
    const model = cfg?.model || (activeProvider === 'openai' ? 'gpt-4o' : activeProvider === 'claude' ? 'claude-sonnet-4-20250514' : '未配置');
    return { provider, model };
  }, [activeProvider, aiConfig]);

  // History — full records with pages data (derived from current project)
  const [showHistory, setShowHistory] = useState(false);
  const [currentHistoryId, setCurrentHistoryId] = useState(null);

  // Saved plans — derived from current project

  // ── Refs sync ──
  isGeneratingRef.current = isGenerating;

  // ── Persist to localStorage ──
  useEffect(() => {
    try {
      const json = JSON.stringify(projects);
      if (json.length < 5 * 1024 * 1024) {
        localStorage.setItem(PROJECTS_KEY, json);
        localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
      }
    } catch (e) { /* quota exceeded — ignore */ }
  }, [projects, activeProjectId]);

  // ── Project Management ──

  const handleSwitchProject = useCallback((id) => {
    if (id === activeProjectId) return;
    setActiveProjectId(id);
    const proj = projectsRef.current[id];
    if (proj) {
      setCurrentPageIndex(0);
      setCode(proj.pages?.[0]?.html || '');
      setMessages([]);
      setPlannedPages(proj.plannedPages || null);
      setPlannedStyleSpec(proj.plannedStyleSpec || '');
      setDetectedPlatform(proj.detectedPlatform || 'pc');
      setUploadedFiles([]);
      setGenerateError('');
      setGenerateProgress('');
      setIsGenerating(false);
      setIsRefining(false);
      setIsRegenerating(false);
      // Reset view mode: show prototype if pages exist, otherwise empty
      if (proj.pages?.length > 0 && proj.pages.some(p => p?.html)) {
        setRightViewMode('prototype');
      } else if (proj.plannedPages?.length > 0) {
        const wfHtmls = generateAllWireframes(proj.plannedPages, proj.detectedPlatform || 'pc');
        setWireframeHtmls(wfHtmls);
        setRightViewMode('plan');
      } else {
        setWireframeHtmls([]);
        setRightViewMode('empty');
      }
    }
  }, [activeProjectId]);

  const handleCreateProject = useCallback(() => {
    // Count existing projects for default naming
    const count = Object.keys(projectsRef.current).length;
    const defaultName = count === 0 ? '我的项目' : `项目 ${count + 1}`;
    const proj = createEmptyProject(defaultName);
    setProjects(prev => ({ ...prev, [proj.id]: proj }));
    setActiveProjectId(proj.id);
    setCurrentPageIndex(0);
    setCode('');
    setMessages([]);
    setPlannedPages(null);
    setPlannedStyleSpec('');
    setDetectedPlatform('pc');
    setUploadedFiles([]);
    setGenerateError('');
    setGenerateProgress('');
    setIsGenerating(false);
    setIsRefining(false);
    setIsRegenerating(false);
    setWireframeHtmls([]);
    setRightViewMode('empty');
  }, []);

  const handleProjectNameChange = useCallback((newName) => {
    updateCurrentProject({ name: newName });
  }, [updateCurrentProject]);

  // ── Theme & Style ──

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  }, []);

  const toggleStyle = useCallback((id) => {
    const current = projectsRef.current[activeProjectId]?.selectedStyles || ['business'];
    const next = current.includes(id) ? current.filter((s) => s !== id) : [...current, id];
    updateCurrentProject({ selectedStyles: next });
  }, [activeProjectId, updateCurrentProject]);

  // ── Phase 1: Plan ──

  const handlePlan = useCallback(async () => {
    setIsGenerating(true);
    setGenerateError('');
    setGenerateProgress('正在读取文件内容...');
    setPlannedPages(null);

    try {
      const fileContents = uploadedFiles.length > 0 ? await readFileContents(uploadedFiles) : [];
      setGenerateProgress('正在分析需求，规划页面结构...');

      const providerConfig = aiConfig[activeProvider] || {};
      const plan = await planProject(
        activeProvider, providerConfig, contentDesc, fileContents,
        selectedStyles, styleDesc, (msg) => setGenerateProgress(msg)
      );

      setPlannedPages(plan.pages);
      setPlannedStyleSpec(plan.styleSpec);
      setDetectedPlatform(plan.platform || 'pc');
      setGenerateProgress('');
      setIsGenerating(false);

      // Generate wireframe previews for right canvas
      const wfHtmls = generateAllWireframes(plan.pages, plan.platform || 'pc');
      setWireframeHtmls(wfHtmls);
      setRightViewMode('plan');

      // Auto-save plan to project
      const planEntry = {
        id: Date.now().toString(),
        timestamp: formatTime(new Date()),
        description: contentDesc || '文件导入生成',
        selectedStyles: [...selectedStyles],
        styleDesc,
        plannedPages: plan.pages,
        styleSpec: plan.styleSpec,
        platform: plan.platform || 'pc',
      };
      const currentPlans = projectsRef.current[activeProjectId]?.savedPlans || [];
      const updatedPlans = [planEntry, ...currentPlans.filter((p) => p.id !== loadedPlanId)];
      updateCurrentProject({ savedPlans: updatedPlans, loadedPlanId: planEntry.id });
    } catch (err) {
      setGenerateError(err.message || '规划失败');
      setIsGenerating(false);
      setGenerateProgress('');
    }
  }, [contentDesc, selectedStyles, styleDesc, uploadedFiles, aiConfig, activeProvider, loadedPlanId, activeProjectId, updateCurrentProject]);

  // ── Phase 2: Generate (after plan confirmation) ──

  const handleConfirmPlan = useCallback(async () => {
    if (!plannedPages || plannedPages.length === 0) return;

    setIsGenerating(true);
    isGeneratingRef.current = true;
    setGenerateError('');
    setProgressCurrent(0);
    setProgressTotal(plannedPages.length);
    setPages([]);
    setCurrentPageIndex(0);
    userSelectedPageRef.current = false;
    // Keep plannedPages visible — user can track each page's progress

    // Local counter for accurate progress tracking across parallel completions
    let completedCount = 0;

    try {
      const fileContents = uploadedFiles.length > 0 ? await readFileContents(uploadedFiles) : [];
      const providerConfig = aiConfig[activeProvider] || {};
      const result = await generateProjectPages(
        activeProvider, providerConfig, plannedPages, plannedStyleSpec,
        contentDesc, fileContents, selectedStyles, styleDesc, detectedPlatform,
        (msg) => setGenerateProgress(msg),
        (pageResult, index, total) => {
          completedCount++;
          setProgressCurrent(completedCount);
          setPages((prev) => {
            const next = [...prev];
            next[index] = pageResult;
            return next;
          });
          // Do NOT auto-switch currentPageIndex during parallel generation
          // to prevent iframe from thrashing between different HTML documents.
          // User can manually click page tabs to preview completed pages.
        }
      );

      // Final state — switch to first page after all pages are done
      setPages(result.pages);
      if (result.pages.length > 0) {
        setCurrentPageIndex(0);
        setCode(result.pages[0].html || '');
      }

      // Save to history — never clears old entries
      const entry = {
        id: Date.now().toString(),
        timestamp: formatTime(new Date()),
        description: contentDesc
          ? contentDesc.slice(0, 80) + (contentDesc.length > 80 ? '...' : '')
          : '文件导入生成',
        styles: [...selectedStyles],
        pages: result.pages,
        pageCount: result.pages.length,
      };
      const currentHistory = projectsRef.current[activeProjectId]?.history || [];
      updateCurrentProject({ history: [entry, ...currentHistory] });
      setCurrentHistoryId(entry.id);
    } catch (err) {
      setGenerateError(err.message || '生成失败，请检查 AI 模型配置');
    } finally {
      setIsGenerating(false);
      isGeneratingRef.current = false;
      setGenerateProgress('');
      setProgressCurrent(0);
      setProgressTotal(0);
      // Keep plannedPages for plan-prototype linking, just switch view mode
      setRightViewMode('prototype');
      userSelectedPageRef.current = false;
    }
  }, [plannedPages, plannedStyleSpec, contentDesc, selectedStyles, styleDesc, aiConfig, activeProvider, uploadedFiles, detectedPlatform, activeProjectId, updateCurrentProject]);

  // Cancel plan
  const handleCancelPlan = useCallback(() => {
    setPlannedPages(null);
    setPlannedStyleSpec('');
    setDetectedPlatform('pc');
    setWireframeHtmls([]);
    setRightViewMode('empty');
    updateCurrentProject({ loadedPlanId: null });
  }, [updateCurrentProject]);

  // View mode switching: plan ↔ prototype
  const handleViewPlan = useCallback(() => {
    setRightViewMode('plan');
  }, []);

  const handleViewPagePrototype = useCallback((pageIndex) => {
    setCurrentPageIndex(pageIndex);
    setRightViewMode('prototype');
    // Sync code state with the selected page
    setPages((current) => {
      setCode(current[pageIndex]?.html || '');
      return current;
    });
    setMessages([]);
  }, []);

  // Generate wireframes for a loaded historical plan
  const handleLoadPlanWithWireframe = useCallback((plan) => {
    updateCurrentProject({
      contentDesc: plan.description || '',
      selectedStyles: plan.selectedStyles || ['business'],
      styleDesc: plan.styleDesc || '',
      loadedPlanId: plan.id,
    });
    setPlannedPages(plan.plannedPages);
    setPlannedStyleSpec(plan.styleSpec || '');
    setDetectedPlatform(plan.platform || 'pc');
    setGenerateError('');
    // Generate wireframes for the loaded plan
    if (plan.plannedPages?.length > 0) {
      const wfHtmls = generateAllWireframes(plan.plannedPages, plan.platform || 'pc');
      setWireframeHtmls(wfHtmls);
      setRightViewMode('plan');
    }
  }, [updateCurrentProject]);

  // ── Saved Plans ──

  const handleLoadPlan = useCallback((plan) => {
    updateCurrentProject({
      contentDesc: plan.description || '',
      selectedStyles: plan.selectedStyles || ['business'],
      styleDesc: plan.styleDesc || '',
      loadedPlanId: plan.id,
    });
    setPlannedPages(plan.plannedPages);
    setPlannedStyleSpec(plan.styleSpec || '');
    setDetectedPlatform(plan.platform || 'pc');
    setGenerateError('');
    // Generate wireframes for the loaded plan
    if (plan.plannedPages?.length > 0) {
      const wfHtmls = generateAllWireframes(plan.plannedPages, plan.platform || 'pc');
      setWireframeHtmls(wfHtmls);
      setRightViewMode('plan');
    }
  }, [updateCurrentProject]);

  const handleDeletePlan = useCallback((planId) => {
    const currentPlans = projectsRef.current[activeProjectId]?.savedPlans || [];
    updateCurrentProject({ savedPlans: currentPlans.filter((p) => p.id !== planId) });
    if (loadedPlanId === planId) {
      setPlannedPages(null);
      setPlannedStyleSpec('');
      updateCurrentProject({ loadedPlanId: null });
    }
  }, [loadedPlanId, activeProjectId, updateCurrentProject]);

  const handleDuplicatePlan = useCallback((plan) => {
    const currentPlans = projectsRef.current[activeProjectId]?.savedPlans || [];
    const dup = {
      ...plan,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      description: (plan.description || '未命名方案') + ' (副本)',
      timestamp: formatTime(new Date()),
    };
    updateCurrentProject({ savedPlans: [dup, ...currentPlans] });
  }, [activeProjectId, updateCurrentProject]);

  const handleRenamePlan = useCallback((planId, newName) => {
    const currentPlans = projectsRef.current[activeProjectId]?.savedPlans || [];
    updateCurrentProject({
      savedPlans: currentPlans.map((p) => p.id === planId ? { ...p, description: newName } : p),
    });
  }, [activeProjectId, updateCurrentProject]);

  // ── Code & Chat ──

  const handleCodeChange = useCallback((newCode) => {
    setCode(newCode);
    setPages((prev) => {
      const next = [...prev];
      if (next[currentPageIndex]) next[currentPageIndex] = { ...next[currentPageIndex], html: newCode };
      return next;
    });
  }, [currentPageIndex]);

  const handleSendMessage = useCallback(async (text) => {
    if (isRefining || !generatedHtml) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsRefining(true);

    try {
      const providerConfig = aiConfig[activeProvider] || {};
      const refinedHtml = await refinePage(activeProvider, providerConfig, generatedHtml, text);
      // Update the current page's HTML
      setPages((prev) => {
        const next = [...prev];
        if (next[currentPageIndex]) {
          next[currentPageIndex] = { ...next[currentPageIndex], html: refinedHtml };
        }
        return next;
      });
      setCode(refinedHtml);
      setMessages((prev) => [...prev, {
        role: 'ai',
        content: `已根据你的指令「${text}」调整了原型。你可以在右侧预览查看变化，或继续提出修改意见。`,
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'ai',
        content: `修改失败：${err.message}。请检查 AI 模型配置后重试。`,
      }]);
    } finally {
      setIsRefining(false);
    }
  }, [isRefining, generatedHtml, aiConfig, activeProvider, currentPageIndex]);

  // ── Single Page Regeneration ──

  const handleRegeneratePage = useCallback(async (pageIndex) => {
    const targetIndex = typeof pageIndex === 'number' ? pageIndex : currentPageIndex;
    if (isRegenerating || !pages[targetIndex]) return;
    const page = pages[targetIndex];
    setIsRegenerating(true);
    setRegeneratingPageIndex(targetIndex);
    setGenerateProgress(`正在重新生成「${page.name}」...`);

    try {
      const providerConfig = aiConfig[activeProvider] || {};
      const fileContents = uploadedFiles.length > 0 ? await readFileContents(uploadedFiles) : [];
      const styleSpec = plannedStyleSpec || buildStyleSpec(selectedStyles, styleDesc);
      const result = await regenerateSinglePage(
        activeProvider, providerConfig, page, styleSpec,
        contentDesc, fileContents, selectedStyles, styleDesc, pages, detectedPlatform
      );
      const html = result.html || '';
      setPages((prev) => {
        const next = [...prev];
        next[targetIndex] = { ...next[targetIndex], html, error: null };
        return next;
      });
      // If regenerating the currently viewed page, sync code
      if (targetIndex === currentPageIndex) {
        setCode(html);
      }
      // Auto-jump to the regenerated page prototype
      setCurrentPageIndex(targetIndex);
      setRightViewMode('prototype');
    } catch (err) {
      setGenerateError(`重新生成失败：${err.message}`);
    } finally {
      setIsRegenerating(false);
      setRegeneratingPageIndex(null);
      setGenerateProgress('');
    }
  }, [isRegenerating, pages, currentPageIndex, aiConfig, activeProvider, contentDesc, selectedStyles, styleDesc, plannedStyleSpec, uploadedFiles, detectedPlatform]);

  // ── Generate single page from plan ──

  const handleGenerateSinglePage = useCallback(async (pageIndex) => {
    if (!plannedPages || isRegenerating || isGenerating) return;
    const planPage = plannedPages[pageIndex];
    if (!planPage) return;

    setIsRegenerating(true);
    setRegeneratingPageIndex(pageIndex);
    setGenerateProgress(`正在生成「${planPage.name}」...`);

    try {
      const providerConfig = aiConfig[activeProvider] || {};
      const fileContents = uploadedFiles.length > 0 ? await readFileContents(uploadedFiles) : [];
      const styleSpec = plannedStyleSpec || buildStyleSpec(selectedStyles, styleDesc);
      // Use plannedPages as the allPages reference for navigation links
      const result = await generateSinglePage(
        activeProvider, providerConfig, planPage, styleSpec,
        contentDesc, fileContents, selectedStyles, styleDesc, plannedPages, detectedPlatform
      );
      const html = result.html || '';
      // Store the generated page result
      setPages((prev) => {
        const next = [...prev];
        // Ensure array is long enough
        while (next.length <= pageIndex) next.push(null);
        next[pageIndex] = { ...planPage, html, error: null };
        return next;
      });
      // Auto-jump to the generated page prototype
      setCurrentPageIndex(pageIndex);
      setCode(html);
      setRightViewMode('prototype');
    } catch (err) {
      setGenerateError(`生成失败：${err.message}`);
    } finally {
      setIsRegenerating(false);
      setRegeneratingPageIndex(null);
      setGenerateProgress('');
    }
  }, [plannedPages, isRegenerating, isGenerating, aiConfig, activeProvider, contentDesc, selectedStyles, styleDesc, plannedStyleSpec, uploadedFiles, detectedPlatform]);

  // ── Export: Current Page HTML ──

  const handleExport = useCallback(() => {
    try {
      if (!generatedHtml) return;
      const page = pages[currentPageIndex];
      const fileName = page?.name ? `${projectName || 'prototype'}_${page.name}.html` : `${projectName || 'prototype'}.html`;
      const blob = new Blob([generatedHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, [generatedHtml, projectName, pages, currentPageIndex]);

  // ── Export: All Pages as ZIP ──

  const handleExportAll = useCallback(async () => {
    try {
      const validPages = pages.filter((p) => p?.html);
      if (validPages.length === 0) return;
      if (validPages.length === 1) { handleExport(); return; }

      const zip = new JSZip();
      // Use the full pages array for indexing so filenames match injectNavigation()
      pages.forEach((page, i) => {
        if (!page?.html) return;
        zip.file(pageFileName(page, i), page.html);
      });

      const pageLinks = pages.map((page, i) => {
        if (!page?.html) return '';
        const fn = pageFileName(page, i);
        return `<a href="${fn}" class="l"><span class="n">${page.name}</span>${page.description ? `<span class="d">${page.description}</span>` : ''}<span class="a">&rarr;</span></a>`;
      }).filter(Boolean).join('\n');

      const indexHtml = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${projectName || 'ProtoAI Prototype'}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fafafa;color:#111;padding:48px 24px}.c{max-width:640px;margin:0 auto}h1{font-size:28px;font-weight:700;margin-bottom:8px}p{font-size:14px;color:#888;margin-bottom:32px}.l{display:flex;align-items:center;gap:12px;padding:16px 20px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;text-decoration:none;color:#111;margin-bottom:8px;transition:all .15s}.l:hover{border-color:#1863dc;background:#f0f5ff}.n{font-weight:600;font-size:15px;flex-shrink:0}.d{flex:1;font-size:13px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.a{color:#ccc;font-size:18px;flex-shrink:0}.f{margin-top:48px;font-size:12px;color:#bbb;text-align:center}</style></head><body><div class="c"><h1>${projectName || 'ProtoAI Prototype'}</h1><p>共 ${validPages.length} 个页面</p>${pageLinks}<div class="f">Generated by ProtoAI</div></div></body></html>`;
      zip.file('index.html', indexHtml);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${projectName || 'prototype'}.zip`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP export failed:', err);
      alert('导出 ZIP 失败：' + (err.message || '未知错误'));
    }
  }, [pages, projectName, handleExport]);

  // ── Export: Current Page as Image ──

  const handleExportImage = useCallback(async () => {
    if (!generatedHtml) return;
    try {
      setGenerateProgress('正在生成图片...');
      const blob = await capturePageAsImage(generatedHtml, 1440, 900);
      const page = pages[currentPageIndex];
      const fileName = page?.name ? `${projectName || 'prototype'}_${page.name}.png` : `${projectName || 'prototype'}.png`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Image export failed:', err);
      alert('导出图片失败：' + (err.message || '请使用 HTML 导出'));
    } finally {
      setGenerateProgress('');
    }
  }, [generatedHtml, projectName, pages, currentPageIndex]);

  // ── Export: All Pages as Images ZIP ──

  const handleExportAllImages = useCallback(async () => {
    try {
      const validPages = pages.map((p, i) => ({ page: p, originalIndex: i })).filter(({ page }) => page?.html);
      if (validPages.length === 0) return;
      if (validPages.length === 1) { await handleExportImage(); return; }

      setGenerateProgress('正在生成图片...');
      const zip = new JSZip();

      for (let i = 0; i < validPages.length; i++) {
        setGenerateProgress(`正在生成图片 ${i + 1}/${validPages.length}...`);
        try {
          const blob = await capturePageAsImage(validPages[i].page.html, 1440, 900);
          const arrayBuf = await blob.arrayBuffer();
          zip.file(pageFileName(validPages[i].page, validPages[i].originalIndex).replace('.html', '.png'), arrayBuf);
        } catch (err) {
          console.warn(`Failed to capture page ${validPages[i].page.name}:`, err);
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${projectName || 'prototype'}_images.zip`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Image ZIP export failed:', err);
      alert('导出图片 ZIP 失败：' + (err.message || '未知错误'));
    } finally {
      setGenerateProgress('');
    }
  }, [pages, projectName, handleExportImage]);

  // ── Export from history ──

  const handleExportHistory = useCallback((entry, type) => {
    try {
      if (!entry?.pages) return;
      const validPages = entry.pages.filter((p) => p?.html);
      if (validPages.length === 0) return;

      if (type === 'html' && validPages.length === 1) {
        const blob = new Blob([validPages[0].html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${entry.description || 'prototype'}.html`; a.click();
        URL.revokeObjectURL(url);
        return;
      }

      // ZIP export for history
      const zip = new JSZip();
      entry.pages.forEach((page, i) => {
        if (!page?.html) return;
        zip.file(pageFileName(page, i), page.html);
      });
      zip.generateAsync({ type: 'blob' }).then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${entry.description || 'prototype'}.zip`; a.click();
        URL.revokeObjectURL(url);
      });
    } catch (err) {
      console.error('History export failed:', err);
    }
  }, []);

  // ── Restore from history ──

  const handleRestoreFromHistory = useCallback((entry) => {
    if (!entry?.pages) return;
    updateCurrentProject({ pages: entry.pages });
    setCurrentPageIndex(0);
    setCode(entry.pages[0]?.html || '');
    setCurrentHistoryId(entry.id);
    setMessages([]);
    setShowHistory(false);
    setRightViewMode('prototype');
  }, [updateCurrentProject]);

  // ── Other ──

  const handleRefresh = useCallback(() => {
    if (!generatedHtml) return;
    setPages((prev) => {
      const next = [...prev];
      if (next[currentPageIndex]) {
        const html = next[currentPageIndex].html;
        next[currentPageIndex] = { ...next[currentPageIndex], html: '' };
        setTimeout(() => {
          setPages((p) => {
            const r = [...p];
            if (r[currentPageIndex]) r[currentPageIndex] = { ...r[currentPageIndex], html };
            return r;
          });
        }, 50);
      }
      return next;
    });
  }, [generatedHtml, currentPageIndex]);

  return (
    <div className="app-layout" data-component="App Layout" data-od-id="app-layout">
      <TopBar
        projectName={projectName}
        onProjectNameChange={handleProjectNameChange}
        projects={projects}
        activeProjectId={activeProjectId}
        onSwitchProject={handleSwitchProject}
        onCreateProject={handleCreateProject}
        onOpenSettings={() => setShowSettings(true)}
        onOpenHistory={() => setShowHistory(true)}
        onOpenPlansHistory={() => setShowPlansHistory(true)}
        onExport={handleExport}
        onExportAll={handleExportAll}
        hasMultiplePages={pages.filter((p) => p?.html).length > 1}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <ErrorBoundary>
      <div className="workspace">
        <LeftPanel
          contentDesc={contentDesc}
          onContentDescChange={(v) => updateCurrentProject({ contentDesc: v })}
          styleDesc={styleDesc}
          onStyleDescChange={(v) => updateCurrentProject({ styleDesc: v })}
          selectedStyles={selectedStyles}
          onToggleStyle={toggleStyle}
          onPlan={handlePlan}
          onConfirmPlan={handleConfirmPlan}
          onCancelPlan={handleCancelPlan}
          isGenerating={isGenerating}
          isPlanning={!!plannedPages}
          plannedPages={plannedPages}
          detectedPlatform={detectedPlatform}
          pages={pages}
          activeModel={activeModel}
          onOpenSettings={() => setShowSettings(true)}
          files={uploadedFiles}
          onFilesAdd={handleFilesAdd}
          onFileRemove={handleFileRemove}
          rightViewMode={rightViewMode}
          onViewPlan={handleViewPlan}
          onViewPagePrototype={handleViewPagePrototype}
          onRegeneratePage={handleRegeneratePage}
          onGenerateSinglePage={handleGenerateSinglePage}
          isRegenerating={isRegenerating}
          regeneratingPageIndex={regeneratingPageIndex}
          progressCurrent={progressCurrent}
          progressTotal={progressTotal}
        />

        <RightPanel
          generatedHtml={generatedHtml}
          isGenerating={isGenerating}
          detectedPlatform={detectedPlatform}
          onRefresh={handleRefresh}
          onExport={handleExport}
          onExportAll={handleExportAll}
          onExportImage={handleExportImage}
          onExportAllImages={handleExportAllImages}
          error={generateError}
          progress={generateProgress}
          progressCurrent={progressCurrent}
          progressTotal={progressTotal}
          plannedPages={plannedPages}
          pages={pages}
          currentPageIndex={currentPageIndex}
          rightViewMode={rightViewMode}
          wireframeHtmls={wireframeHtmls}
          onViewModeChange={(mode) => {
            if (mode === 'plan') {
              handleViewPlan();
            } else {
              handleViewPagePrototype(currentPageIndex);
            }
          }}
          onPageChange={(index) => {
            setCurrentPageIndex(index);
            if (!isGeneratingRef.current) {
              setPages((current) => {
                setCode(current[index]?.html || '');
                return current;
              });
            }
            setMessages([]);
          }}
          onUserSelectPage={() => { userSelectedPageRef.current = true; }}
          isRefining={isRefining}
          isRegenerating={isRegenerating}
          onRegeneratePage={handleRegeneratePage}
          refinePanel={
            <RefinePanel
              code={code}
              onCodeChange={handleCodeChange}
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          }
        />
      </div>
      </ErrorBoundary>

      {showSettings && (
        <AISettingsModal
          config={aiConfig}
          onConfigChange={setAiConfig}
          activeProvider={activeProvider}
          onActiveProviderChange={setActiveProvider}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showHistory && (
        <VersionHistory
          history={history}
          currentHistoryId={currentHistoryId}
          onRestore={handleRestoreFromHistory}
          onExport={handleExportHistory}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showPlansHistory && (
        <PlansHistoryModal
          savedPlans={savedPlans}
          loadedPlanId={loadedPlanId}
          onLoadPlan={handleLoadPlanWithWireframe}
          onDeletePlan={handleDeletePlan}
          onDuplicatePlan={handleDuplicatePlan}
          onRenamePlan={handleRenamePlan}
          onClose={() => setShowPlansHistory(false)}
        />
      )}
    </div>
  );
}
