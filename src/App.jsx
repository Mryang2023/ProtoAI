import { useCallback, useEffect } from 'react';
import { Component as ReactComponent } from 'react';
import TopBar from './components/TopBar.jsx';
import LeftPanel from './components/LeftPanel.jsx';
import RightPanel from './components/RightPanel.jsx';
import RefinePanel from './components/RefinePanel.jsx';
import AISettingsModal from './components/AISettingsModal.jsx';
import VersionHistory from './components/VersionHistory.jsx';
import PlansHistoryModal from './components/PlansHistoryModal.jsx';
import QrPreviewModal from './components/QrPreviewModal.jsx';
import TemplateLibrary from './components/TemplateLibrary.jsx';
import { generateAllWireframes } from './components/PlanPreview.jsx';

import useProjects from './hooks/useProjects.js';
import useTheme from './hooks/useTheme.js';
import useAiSettings from './hooks/useAiSettings.js';
import useUIState from './hooks/useUIState.js';
import useGeneration from './hooks/useGeneration.js';
import useHistory from './hooks/useHistory.js';
import useSavedPlans from './hooks/useSavedPlans.js';
import useCodeRefine from './hooks/useCodeRefine.js';
import useExport from './hooks/useExport.js';

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

export default function App() {
  // ── Core hooks ──
  const projects = useProjects();
  const theme = useTheme();
  const aiSettings = useAiSettings();
  const ui = useUIState();

  // ── Code & refine (must be created before generation, so its setters can be passed in) ──
  const codeRefine = useCodeRefine({
    aiConfig: aiSettings.aiConfig,
    activeProvider: aiSettings.activeProvider,
    pages: projects.pages,
    currentPageIndex: ui.currentPageIndex,
    generatedHtml: projects.pages[ui.currentPageIndex]?.html || '',
    setPages: projects.setPages,
  });

  // ── Generation (planning + page generation + progress) ──
  const generation = useGeneration({
    aiConfig: aiSettings.aiConfig,
    activeProvider: aiSettings.activeProvider,
    contentDesc: projects.contentDesc,
    selectedStyles: projects.selectedStyles,
    styleDesc: projects.styleDesc,
    updateCurrentProject: projects.updateCurrentProject,
    projectsRef: projects.projectsRef,
    activeProjectId: projects.activeProjectId,
    loadedPlanId: projects.loadedPlanId,
    setPages: projects.setPages,
    pagesRef: projects.pagesRef,
    currentPageIndex: ui.currentPageIndex,
    setCurrentPageIndex: ui.setCurrentPageIndex,
    setCode: codeRefine.setCode,
    setMessages: codeRefine.setMessages,
    setRightViewMode: ui.setRightViewMode,
  });

  // Derived: current page HTML
  const generatedHtml = projects.pages[ui.currentPageIndex]?.html || '';

  // ── History ──
  const history = useHistory({
    history: projects.history,
    updateCurrentProject: projects.updateCurrentProject,
    setCurrentPageIndex: ui.setCurrentPageIndex,
    setCode: codeRefine.setCode,
    setMessages: codeRefine.setMessages,
    setRightViewMode: ui.setRightViewMode,
    setShowHistory: ui.setShowHistory,
  });

  // ── Saved Plans ──
  const savedPlans = useSavedPlans({
    projectsRef: projects.projectsRef,
    activeProjectId: projects.activeProjectId,
    loadedPlanId: projects.loadedPlanId,
    updateCurrentProject: projects.updateCurrentProject,
    setPlannedPages: generation.setPlannedPages,
    setPlannedStyleSpec: generation.setPlannedStyleSpec,
    setDetectedPlatform: generation.setDetectedPlatform,
    setPcPages: generation.setPcPages,
    setMobilePages: generation.setMobilePages,
    setActivePlanPlatform: generation.setActivePlanPlatform,
    setPcGeneratedPages: generation.setPcGeneratedPages,
    setMobileGeneratedPages: generation.setMobileGeneratedPages,
    setWireframeHtmls: generation.setWireframeHtmls,
    setRightViewMode: ui.setRightViewMode,
    setGenerateError: generation.setGenerateError,
  });

  // ── Export (all export + import) ──
  const exportFns = useExport({
    currentProject: projects.currentProject,
    projectName: projects.projectName,
    pages: projects.pages,
    pagesRef: projects.pagesRef,
    generatedHtml,
    currentPageIndex: ui.currentPageIndex,
    setProjects: projects.setProjects,
    setActiveProjectId: projects.setActiveProjectId,
    setPages: projects.setPages,
    setCurrentPageIndex: ui.setCurrentPageIndex,
    setCode: codeRefine.setCode,
    setMessages: codeRefine.setMessages,
    setPlannedPages: generation.setPlannedPages,
    setPlannedStyleSpec: generation.setPlannedStyleSpec,
    setDetectedPlatform: generation.setDetectedPlatform,
    setPcPages: generation.setPcPages,
    setMobilePages: generation.setMobilePages,
    setActivePlanPlatform: generation.setActivePlanPlatform,
    setPcGeneratedPages: generation.setPcGeneratedPages,
    setMobileGeneratedPages: generation.setMobileGeneratedPages,
    setWireframeHtmls: generation.setWireframeHtmls,
    setRightViewMode: ui.setRightViewMode,
    setGenerateProgress: generation.setGenerateProgress,
    setGenerateError: generation.setGenerateError,
    setIsGenerating: generation.setIsGenerating,
    setIsRefining: codeRefine.setIsRefining,
    setIsRegenerating: generation.setIsRegenerating,
  });

  // ── Project Management (cross-hook operations) ──

  const handleSwitchProject = useCallback((id) => {
    if (id === projects.activeProjectId) return;
    projects.setActiveProjectId(id);
    const proj = projects.projectsRef.current[id];
    if (proj) {
      codeRefine.setCode(proj.pages?.[0]?.html || '');
      generation.resetGenerationState();
      codeRefine.resetCodeRefine();
      if (proj.pages?.length > 0 && proj.pages.some(p => p?.html)) {
        ui.setRightViewMode('prototype');
      } else if (proj.plannedPages?.length > 0) {
        const wfHtmls = generateAllWireframes(proj.plannedPages, proj.detectedPlatform || 'pc');
        generation.setWireframeHtmls(wfHtmls);
        ui.setRightViewMode('plan');
      } else {
        generation.setWireframeHtmls([]);
        ui.setRightViewMode('empty');
      }
    }
  }, [projects.activeProjectId]);

  const handleCreateProject = useCallback(() => {
    const count = Object.keys(projects.projectsRef.current).length;
    const defaultName = count === 0 ? '我的项目' : `项目 ${count + 1}`;
    const proj = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name: defaultName,
      contentDesc: '', styleDesc: '',
      selectedStyles: ['business'],
      pages: [], history: [], savedPlans: [],
      loadedPlanId: null, plannedPages: null,
      plannedStyleSpec: '', detectedPlatform: 'pc',
      timestamp: Date.now(),
    };
    projects.setProjects(prev => ({ ...prev, [proj.id]: proj }));
    projects.setActiveProjectId(proj.id);
    codeRefine.setCode('');
    generation.resetGenerationState();
    codeRefine.resetCodeRefine();
    generation.setWireframeHtmls([]);
    ui.setRightViewMode('empty');
  }, []);

  const handleSelectTemplate = useCallback((template) => {
    projects.updateCurrentProject({ contentDesc: template.prompt });
    ui.setShowTemplateLibrary(false);
  }, [projects.updateCurrentProject, ui.setShowTemplateLibrary]);

  // ── Global keyboard shortcuts ──
  useEffect(() => {
    const handler = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const tag = e.target.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;

      if (isCtrlOrCmd) {
        if (e.key === 'z' && !e.shiftKey && codeRefine.canUndo && !inInput) {
          e.preventDefault();
          codeRefine.handleUndo();
          return;
        }
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          if (codeRefine.canRedo && !inInput) { e.preventDefault(); codeRefine.handleRedo(); }
          return;
        }
        if (e.key === 'e' && !inInput && generatedHtml) {
          e.preventDefault();
          exportFns.handleExport();
          return;
        }
        if (e.key === 's' && !inInput) {
          e.preventDefault();
          if (projects.pages.filter(p => p?.html).length > 1) exportFns.handleExportAll();
          else exportFns.handleExport();
          return;
        }
      }

      if (inInput) return;

      if (e.key === 'ArrowLeft' && projects.pages.length > 1 && !generation.isGenerating) {
        const prevIndex = ui.currentPageIndex > 0 ? ui.currentPageIndex - 1 : projects.pages.length - 1;
        if (projects.pages[prevIndex]?.html) {
          ui.setCurrentPageIndex(prevIndex);
          codeRefine.setCode(projects.pages[prevIndex].html || '');
          codeRefine.setMessages([]);
        }
      }
      if (e.key === 'ArrowRight' && projects.pages.length > 1 && !generation.isGenerating) {
        const nextIndex = ui.currentPageIndex < projects.pages.length - 1 ? ui.currentPageIndex + 1 : 0;
        if (projects.pages[nextIndex]?.html) {
          ui.setCurrentPageIndex(nextIndex);
          codeRefine.setCode(projects.pages[nextIndex].html || '');
          codeRefine.setMessages([]);
        }
      }

      if (e.key === 'Escape') {
        if (aiSettings.showSettings) aiSettings.setShowSettings(false);
        else if (ui.showHistory) ui.setShowHistory(false);
        else if (ui.showPlansHistory) ui.setShowPlansHistory(false);
        else if (ui.showQrPreview) ui.setShowQrPreview(false);
        else if (ui.showTemplateLibrary) ui.setShowTemplateLibrary(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [codeRefine.canUndo, codeRefine.canRedo, codeRefine.handleUndo, codeRefine.handleRedo,
    ui.currentPageIndex, projects.pages, generation.isGenerating, generatedHtml,
    aiSettings.showSettings, ui.showHistory, ui.showPlansHistory, ui.showQrPreview, ui.showTemplateLibrary,
    exportFns.handleExport, exportFns.handleExportAll]);

  // ── Render ──
  return (
    <div className="app-layout" data-component="App Layout" data-od-id="app-layout">
      <input
        ref={exportFns.importInputRef}
        type="file"
        accept=".json,.protoai.json"
        style={{ display: 'none' }}
        onChange={exportFns.handleImportFile}
      />
      <TopBar
        projectName={projects.projectName}
        onProjectNameChange={projects.handleProjectNameChange}
        projects={projects.projects}
        activeProjectId={projects.activeProjectId}
        onSwitchProject={handleSwitchProject}
        onCreateProject={handleCreateProject}
        onExportProject={exportFns.handleExportProject}
        onImportProject={exportFns.handleImportProject}
        onOpenSettings={() => aiSettings.setShowSettings(true)}
        onOpenHistory={() => ui.setShowHistory(true)}
        onOpenPlansHistory={() => ui.setShowPlansHistory(true)}
        onExport={exportFns.handleExport}
        onExportAll={exportFns.handleExportAll}
        onExportAsReact={exportFns.handleExportAsReact}
        onExportAsTailwind={exportFns.handleExportAsTailwind}
        onExportClean={exportFns.handleExportCleanHtml}
        onOpenQrPreview={() => ui.setShowQrPreview(true)}
        onOpenTemplateLibrary={() => ui.setShowTemplateLibrary(true)}
        hasMultiplePages={projects.pages.filter((p) => p?.html).length > 1}
        theme={theme.theme}
        onToggleTheme={theme.toggleTheme}
        canUndo={codeRefine.canUndo}
        canRedo={codeRefine.canRedo}
        onUndo={codeRefine.handleUndo}
        onRedo={codeRefine.handleRedo}
      />

      <ErrorBoundary>
      <div className="workspace">
        <LeftPanel
          contentDesc={projects.contentDesc}
          onContentDescChange={(v) => projects.updateCurrentProject({ contentDesc: v })}
          styleDesc={projects.styleDesc}
          onStyleDescChange={(v) => projects.updateCurrentProject({ styleDesc: v })}
          selectedStyles={projects.selectedStyles}
          onToggleStyle={projects.toggleStyle}
          onPlan={generation.handlePlan}
          onConfirmPlan={generation.handleConfirmPlan}
          onCancelPlan={generation.handleCancelPlan}
          isGenerating={generation.isGenerating}
          isPlanning={!!generation.plannedPages}
          plannedPages={generation.plannedPages}
          detectedPlatform={generation.detectedPlatform}
          pages={projects.pages}
          activeModel={aiSettings.activeModel}
          onOpenSettings={() => aiSettings.setShowSettings(true)}
          files={generation.uploadedFiles}
          onFilesAdd={generation.handleFilesAdd}
          onFileRemove={generation.handleFileRemove}
          rightViewMode={ui.rightViewMode}
          onViewPlan={generation.handleViewPlan}
          onViewPagePrototype={generation.handleViewPagePrototype}
          onRegeneratePage={(idx) => {
            codeRefine.pushUndo(idx);
            generation.handleRegeneratePage(idx, projects.pages);
          }}
          onGenerateSinglePage={generation.handleGenerateSinglePage}
          isRegenerating={generation.isRegenerating}
          regeneratingPageIndex={generation.regeneratingPageIndex}
          progressCurrent={generation.progressCurrent}
          progressTotal={generation.progressTotal}
          targetPlatform={generation.targetPlatform}
          onTargetPlatformChange={generation.setTargetPlatform}
          pageCountRange={generation.pageCountRange}
          onPageCountRangeChange={generation.setPageCountRange}
          isDualPlatform={!!generation.pcPages && !!generation.mobilePages}
          activePlanPlatform={generation.activePlanPlatform}
          onSwitchPlanPlatform={generation.handleSwitchPlanPlatform}
          onOpenTemplateLibrary={() => ui.setShowTemplateLibrary(true)}
          onSaveScheme={generation.handleSaveScheme}
          projectNotes={projects.currentProject.notes || ''}
          onProjectNotesChange={(v) => projects.updateCurrentProject({ notes: v })}
        />

        <RightPanel
          generatedHtml={generatedHtml}
          isGenerating={generation.isGenerating}
          detectedPlatform={generation.detectedPlatform}
          streamingHtml={generation.streamingHtml}
          planningStreamText={generation.planningStreamText}
          planningDiscoveredPages={generation.planningDiscoveredPages}
          planningPhase={generation.planningPhase}
          onCancelGeneration={generation.handleCancelGeneration}
          onRefresh={exportFns.handleRefresh}
          onExport={exportFns.handleExport}
          onExportAll={exportFns.handleExportAll}
          onExportImage={exportFns.handleExportImage}
          onExportAllImages={exportFns.handleExportAllImages}
          error={generation.generateError}
          progress={generation.generateProgress}
          progressCurrent={generation.progressCurrent}
          progressTotal={generation.progressTotal}
          plannedPages={generation.plannedPages}
          pages={projects.pages}
          currentPageIndex={ui.currentPageIndex}
          rightViewMode={ui.rightViewMode}
          wireframeHtmls={generation.wireframeHtmls}
          onViewModeChange={(mode) => {
            if (mode === 'plan') {
              generation.handleViewPlan();
            } else {
              generation.handleViewPagePrototype(ui.currentPageIndex);
            }
          }}
          onPageChange={(index) => {
            ui.setCurrentPageIndex(index);
            if (!generation.isGeneratingRef.current) {
              codeRefine.setCode(projects.pagesRef.current[index]?.html || '');
            }
            codeRefine.setMessages([]);
          }}
          onUserSelectPage={() => { generation.userSelectedPageRef.current = true; }}
          isRefining={codeRefine.isRefining}
          isRegenerating={generation.isRegenerating}
          onRegeneratePage={(idx) => {
            codeRefine.pushUndo(idx);
            generation.handleRegeneratePage(idx, projects.pages);
          }}
          refinePanel={
            <RefinePanel
              code={codeRefine.code}
              onCodeChange={codeRefine.handleCodeChange}
              messages={codeRefine.messages}
              onSendMessage={codeRefine.handleSendMessage}
              onRefineRegion={codeRefine.handleRefineRegion}
              isRefining={codeRefine.isRefining}
            />
          }
        />
      </div>
      </ErrorBoundary>

      {aiSettings.showSettings && (
        <AISettingsModal
          config={aiSettings.aiConfig}
          onConfigChange={aiSettings.setAiConfig}
          activeProvider={aiSettings.activeProvider}
          onActiveProviderChange={aiSettings.setActiveProvider}
          onClose={() => aiSettings.setShowSettings(false)}
        />
      )}

      {ui.showHistory && (
        <VersionHistory
          history={projects.history}
          currentHistoryId={history.currentHistoryId}
          onRestore={history.handleRestoreFromHistory}
          onExport={exportFns.handleExportHistory}
          onClose={() => ui.setShowHistory(false)}
        />
      )}

      {ui.showPlansHistory && (
        <PlansHistoryModal
          savedPlans={projects.savedPlans}
          loadedPlanId={projects.loadedPlanId}
          onLoadPlan={generation.handleLoadPlanWithWireframe}
          onDeletePlan={savedPlans.handleDeletePlan}
          onDuplicatePlan={savedPlans.handleDuplicatePlan}
          onRenamePlan={savedPlans.handleRenamePlan}
          onRegenerateFromPlan={(plan) => {
            ui.setShowPlansHistory(false);
            generation.handleRegenerateFromPlan(plan);
          }}
          onAdjustPlan={(plan) => {
            ui.setShowPlansHistory(false);
            generation.handleLoadPlanWithWireframe(plan);
          }}
          onClose={() => ui.setShowPlansHistory(false)}
        />
      )}

      {ui.showQrPreview && (
        <QrPreviewModal
          pages={projects.pages.filter(p => p?.html)}
          onClose={() => ui.setShowQrPreview(false)}
        />
      )}

      {ui.showTemplateLibrary && (
        <TemplateLibrary
          onSelect={handleSelectTemplate}
          onClose={() => ui.setShowTemplateLibrary(false)}
        />
      )}
    </div>
  );
}
