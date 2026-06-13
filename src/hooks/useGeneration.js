import { useState, useCallback, useRef } from 'react';
import { generateAllWireframes } from '../components/PlanPreview.jsx';
import { generateId } from './useProjects.js';
import {
  planProject, generateProjectPages, generateSinglePage,
  readFileContents, buildStyleSpec, parsePartialPlan,
  extractReferenceTemplate, buildReferenceConstraint,
  estimatePageCount,
} from '../aiService.js';

function formatTime(date) {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${date.getMonth() + 1}月${date.getDate()}日 ${h}:${m}`;
}

export default function useGeneration({
  aiConfig, activeProvider,
  contentDesc, selectedStyles, styleDesc, referenceSite,
  updateCurrentProject, projectsRef, activeProjectId, loadedPlanId,
  setPages, pagesRef,
  currentPageIndex, setCurrentPageIndex, setCode, setMessages,
  setRightViewMode,
}) {
  // ── Planning state ──
  const [plannedPages, setPlannedPages] = useState(null);
  const [plannedStyleSpec, setPlannedStyleSpec] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState('pc');
  const [targetPlatform, setTargetPlatform] = useState('pc');
  const [pcPages, setPcPages] = useState(null);
  const [mobilePages, setMobilePages] = useState(null);
  const [activePlanPlatform, setActivePlanPlatform] = useState('pc');
  const [pcGeneratedPages, setPcGeneratedPages] = useState(null);
  const [mobileGeneratedPages, setMobileGeneratedPages] = useState(null);
  const [wireframeHtmls, setWireframeHtmls] = useState([]);

  // ── Page count pre-analysis ──
  const [pageCountRange, setPageCountRange] = useState(null); // { min, max, recommended } or null
  const [pageEstimate, setPageEstimate] = useState(null); // { min, max, recommended, reason } from AI
  const [isPreAnalyzing, setIsPreAnalyzing] = useState(false); // pre-analysis in progress
  const [awaitingPageConfirm, setAwaitingPageConfirm] = useState(false); // waiting for user to confirm range

  // ── Generation state ──
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [generateProgress, setGenerateProgress] = useState('');
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [streamingHtml, setStreamingHtml] = useState('');
  const [streamingPageIndex, setStreamingPageIndex] = useState(null);
  const [planningStreamText, setPlanningStreamText] = useState('');
  const [planningDiscoveredPages, setPlanningDiscoveredPages] = useState([]);
  const [planningPhase, setPlanningPhase] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratingPageIndex, setRegeneratingPageIndex] = useState(null);

  // ── Session state ──
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const handleFilesAdd = useCallback((newFiles) => setUploadedFiles((prev) => [...prev, ...newFiles]), []);
  const handleFileRemove = useCallback((index) => setUploadedFiles((prev) => prev.filter((_, i) => i !== index)), []);

  // ── Refs ──
  const userSelectedPageRef = useRef(false);
  const isGeneratingRef = useRef(false);
  const abortControllerRef = useRef(null);

  // ── Sync ref ──
  isGeneratingRef.current = isGenerating;

  // ── Phase 1: Plan ──

  // Ref to track latest confirmed range (avoids stale closure in two-phase flow)
  const pageCountRangeRef = useRef(pageCountRange);
  pageCountRangeRef.current = pageCountRange;

  // Phase 1B: Full planning with confirmed page count range
  const doFullPlanning = useCallback(async () => {
    const confirmedRange = pageCountRangeRef.current;
    setIsGenerating(true);
    isGeneratingRef.current = true;
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    setGenerateError('');
    setGenerateProgress('正在读取文件内容...');
    setPlannedPages(null);
    setPcPages(null);
    setMobilePages(null);
    setPcGeneratedPages(null);
    setMobileGeneratedPages(null);
    setPlanningStreamText('');
    setPlanningDiscoveredPages([]);
    setPlanningPhase('thinking');
    setAwaitingPageConfirm(false);

    setPages([]);
    setStreamingHtml('');
    setStreamingPageIndex(null);
    setCurrentPageIndex(0);
    setWireframeHtmls([]);
    setProgressCurrent(0);
    setProgressTotal(0);

    try {
      const fileContents = uploadedFiles.length > 0 ? await readFileContents(uploadedFiles) : [];
      setGenerateProgress('正在分析需求，AI 正在规划页面结构...');
      setPlanningPhase('thinking');

      const providerConfig = aiConfig[activeProvider] || {};
      const plan = await planProject(
        activeProvider, providerConfig, contentDesc, fileContents,
        selectedStyles, styleDesc,
        (msg) => setGenerateProgress(msg),
        targetPlatform,
        (text, platform) => {
          setPlanningStreamText(text);
          const partial = parsePartialPlan(text);
          if (partial.phase && partial.phase !== 'complete') {
            setPlanningPhase(partial.phase);
          }
          if (partial.pages.length > 0) {
            setPlanningDiscoveredPages(partial.pages);
          }
        },
        signal,
        confirmedRange,
        referenceSite
      );

      setPlanningPhase('complete');
      setPlannedStyleSpec(plan.styleSpec);
      setGenerateProgress('');
      setIsGenerating(false);
      setPlanningStreamText('');

      if (plan.platform === 'both') {
        setPcPages(plan.pcPages);
        setMobilePages(plan.mobilePages);
        setPlannedPages(plan.pcPages);
        setDetectedPlatform('pc');
        setActivePlanPlatform('pc');
        const wfHtmls = generateAllWireframes(plan.pcPages, 'pc');
        setWireframeHtmls(wfHtmls);
      } else {
        setPlannedPages(plan.pages);
        setDetectedPlatform(plan.platform || 'pc');
        setActivePlanPlatform(plan.platform || 'pc');
        const wfHtmls = generateAllWireframes(plan.pages, plan.platform || 'pc');
        setWireframeHtmls(wfHtmls);
      }

      setRightViewMode('plan');

      // Auto-save plan to project
      const planEntry = {
        id: generateId(),
        timestamp: formatTime(new Date()),
        description: contentDesc || '文件导入生成',
        selectedStyles: [...selectedStyles],
        styleDesc,
        plannedPages: plan.platform === 'both' ? plan.pcPages : plan.pages,
        pcPages: plan.pcPages || null,
        mobilePages: plan.mobilePages || null,
        styleSpec: plan.styleSpec,
        platform: plan.platform || 'pc',
        pageCountRange: confirmedRange,
        savedSchemeId: null,
      };
      const currentPlans = projectsRef.current[activeProjectId]?.savedPlans || [];
      const updatedPlans = [planEntry, ...currentPlans.filter((p) => p.id !== loadedPlanId)];
      updateCurrentProject({ savedPlans: updatedPlans, loadedPlanId: planEntry.id });
    } catch (err) {
      if (err.name === 'AbortError') {
        setIsGenerating(false);
        setGenerateProgress('');
        setPlanningStreamText('');
        setPlanningPhase('');
        return;
      }
      setGenerateError(err.message || '规划失败');
      setIsGenerating(false);
      setGenerateProgress('');
      setPlanningStreamText('');
      setPlanningPhase('');
    } finally {
      isGeneratingRef.current = false;
    }
  }, [contentDesc, selectedStyles, styleDesc, referenceSite, uploadedFiles, aiConfig, activeProvider, loadedPlanId, activeProjectId, updateCurrentProject, targetPlatform, setPages, setCurrentPageIndex, setGenerateError, setRightViewMode, projectsRef]);

  // Phase 1A: handlePlan entry — pre-analysis or full planning
  const handlePlan = useCallback(async () => {
    // If page count range already confirmed, go straight to full planning
    if (pageCountRange) {
      await doFullPlanning();
      return;
    }

    // Phase 0: Quick pre-analysis to estimate page count
    setIsPreAnalyzing(true);
    setGenerateError('');
    setGenerateProgress('正在概要分析需求...');
    setPageEstimate(null);
    setAwaitingPageConfirm(false);

    try {
      const fileContents = uploadedFiles.length > 0 ? await readFileContents(uploadedFiles) : [];
      const providerConfig = aiConfig[activeProvider] || {};
      const estimate = await estimatePageCount(activeProvider, providerConfig, contentDesc, fileContents);
      setPageEstimate(estimate);
      setPageCountRange({ min: estimate.min, max: estimate.max, recommended: estimate.recommended });
      setAwaitingPageConfirm(true);
      setGenerateProgress('');
    } catch (err) {
      if (err.name === 'AbortError') {
        setGenerateProgress('');
        return;
      }
      // If pre-analysis fails, proceed with default range
      setPageCountRange({ min: 5, max: 15, recommended: 8 });
      setAwaitingPageConfirm(true);
      setGenerateProgress('');
    } finally {
      setIsPreAnalyzing(false);
    }
  }, [pageCountRange, doFullPlanning, contentDesc, uploadedFiles, aiConfig, activeProvider, setGenerateError]);

  // Confirm page count and proceed to full planning
  const handleConfirmPageCount = useCallback((range) => {
    setPageCountRange(range);
    pageCountRangeRef.current = range; // update ref immediately for doFullPlanning
    setAwaitingPageConfirm(false);
    // Call full planning directly — doFullPlanning reads from pageCountRangeRef
    doFullPlanning();
  }, [doFullPlanning]);

  // Skip page count prediction — let AI decide freely
  const handleSkipPageCount = useCallback(() => {
    setPageCountRange(null);
    pageCountRangeRef.current = null;
    setPageEstimate(null);
    setAwaitingPageConfirm(false);
    doFullPlanning();
  }, [doFullPlanning]);

  // ── Switch platform tabs in dual mode ──

  const handleSwitchPlanPlatform = useCallback((platform) => {
    setActivePlanPlatform(platform);
    if (platform === 'pc' && pcPages) {
      setPlannedPages(pcPages);
      setDetectedPlatform('pc');
      const wfHtmls = generateAllWireframes(pcPages, 'pc');
      setWireframeHtmls(wfHtmls);
      if (pcGeneratedPages) {
        setPages(pcGeneratedPages);
        setCurrentPageIndex(0);
        setCode(pcGeneratedPages[0]?.html || '');
        setRightViewMode('prototype');
      }
    } else if (platform === 'mobile' && mobilePages) {
      setPlannedPages(mobilePages);
      setDetectedPlatform('mobile');
      const wfHtmls = generateAllWireframes(mobilePages, 'mobile');
      setWireframeHtmls(wfHtmls);
      if (mobileGeneratedPages) {
        setPages(mobileGeneratedPages);
        setCurrentPageIndex(0);
        setCode(mobileGeneratedPages[0]?.html || '');
        setRightViewMode('prototype');
      }
    }
  }, [pcPages, mobilePages, pcGeneratedPages, mobileGeneratedPages, setPages, setCurrentPageIndex, setCode, setRightViewMode]);

  // ── Phase 2: Generate ──

  const handleConfirmPlan = useCallback(async () => {
    if (!plannedPages || plannedPages.length === 0) return;

    setIsGenerating(true);
    isGeneratingRef.current = true;
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    setGenerateError('');
    userSelectedPageRef.current = false;
    setStreamingHtml('');
    setStreamingPageIndex(0);

    const isDualMode = targetPlatform === 'both' && pcPages && mobilePages;
    let savedPcPages = null; // local ref for error recovery

    try {
      const fileContents = uploadedFiles.length > 0 ? await readFileContents(uploadedFiles) : [];
      const providerConfig = aiConfig[activeProvider] || {};

      if (isDualMode) {
        const totalPc = pcPages.length;
        const totalMobile = mobilePages.length;
        const totalAll = totalPc + totalMobile;
        let completedCount = 0;

        setProgressTotal(totalAll);
        setProgressCurrent(0);
        setPages([]);
        setCurrentPageIndex(0);

        // Phase 1: PC pages
        setGenerateProgress(`正在生成PC端页面 (0/${totalPc})...`);
        setStreamingPageIndex(0);
        const pcResult = await generateProjectPages(
          activeProvider, providerConfig, pcPages, plannedStyleSpec,
          contentDesc, fileContents, selectedStyles, styleDesc, 'pc',
          (msg) => setGenerateProgress(`[PC端] ${msg}`),
          (pageResult, index) => {
            completedCount++;
            setProgressCurrent(completedCount);
            setPages((prev) => {
              const next = [...prev];
              next[index] = pageResult;
              return next;
            });
          },
          (html) => setStreamingHtml(html),
          signal
        );
        setPcGeneratedPages(pcResult.pages);
        savedPcPages = pcResult.pages; // local ref for error recovery

        // Phase 2: Mobile pages
        setGenerateProgress(`正在生成移动端页面 (0/${totalMobile})...`);
        setStreamingHtml('');
        setStreamingPageIndex(0);
        const mobileResult = await generateProjectPages(
          activeProvider, providerConfig, mobilePages, plannedStyleSpec,
          contentDesc, fileContents, selectedStyles, styleDesc, 'mobile',
          (msg) => setGenerateProgress(`[移动端] ${msg}`),
          (pageResult, index) => {
            completedCount++;
            setProgressCurrent(completedCount);
            setPages((prev) => {
              const next = [...prev];
              next[totalPc + index] = pageResult; // offset to avoid overwriting PC pages
              return next;
            });
          },
          (html) => setStreamingHtml(html),
          signal
        );
        setMobileGeneratedPages(mobileResult.pages);

        // Show active platform's pages as default view
        if (activePlanPlatform === 'pc') {
          setPages(pcResult.pages);
          if (pcResult.pages.length > 0) {
            setCurrentPageIndex(0);
            setCode(pcResult.pages[0].html || '');
          }
        } else {
          setPages(mobileResult.pages);
          if (mobileResult.pages.length > 0) {
            setCurrentPageIndex(0);
            setCode(mobileResult.pages[0].html || '');
          }
        }

        // Save to history
        const desc = contentDesc
          ? contentDesc.slice(0, 80) + (contentDesc.length > 80 ? '...' : '')
          : '文件导入生成';
        const entry = {
          id: generateId(),
          timestamp: formatTime(new Date()),
          description: desc,
          styles: [...selectedStyles],
          pages: activePlanPlatform === 'pc' ? pcResult.pages : mobileResult.pages,
          pcGeneratedPages: pcResult.pages,
          mobileGeneratedPages: mobileResult.pages,
          pageCount: totalAll,
          platform: 'both',
        };
        const currentHistory = projectsRef.current[activeProjectId]?.history || [];
        updateCurrentProject({ history: [entry, ...currentHistory] });
      } else {
        setProgressCurrent(0);
        setProgressTotal(plannedPages.length);
        setPages([]);
        setCurrentPageIndex(0);

        let completedCount = 0;
        setStreamingPageIndex(0);
        const result = await generateProjectPages(
          activeProvider, providerConfig, plannedPages, plannedStyleSpec,
          contentDesc, fileContents, selectedStyles, styleDesc, detectedPlatform,
          (msg) => setGenerateProgress(msg),
          (pageResult, index) => {
            completedCount++;
            setProgressCurrent(completedCount);
            setPages((prev) => {
              const next = [...prev];
              next[index] = pageResult;
              return next;
            });
          },
          (html) => setStreamingHtml(html),
          signal
        );

        setPages(result.pages);
        if (result.pages.length > 0) {
          setCurrentPageIndex(0);
          setCode(result.pages[0].html || '');
        }

        const desc = contentDesc
          ? contentDesc.slice(0, 80) + (contentDesc.length > 80 ? '...' : '')
          : '文件导入生成';
        const entry = {
          id: generateId(),
          timestamp: formatTime(new Date()),
          description: desc,
          styles: [...selectedStyles],
          pages: result.pages,
          pageCount: result.pages.length,
          platform: detectedPlatform,
        };
        const currentHistory = projectsRef.current[activeProjectId]?.history || [];
        updateCurrentProject({ history: [entry, ...currentHistory] });
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        if (savedPcPages) setPages(savedPcPages);
        return;
      }
      if (isDualMode && savedPcPages) {
        setPages(savedPcPages);
        if (savedPcPages.length > 0) {
          setCurrentPageIndex(0);
          setCode(savedPcPages[0].html || '');
        }
      }
      setGenerateError(err.message || '生成失败，请检查 AI 模型配置');
    } finally {
      setIsGenerating(false);
      isGeneratingRef.current = false;
      setGenerateProgress('');
      setProgressCurrent(0);
      setProgressTotal(0);
      setStreamingHtml('');
      setStreamingPageIndex(null);
      setRightViewMode('prototype');
      userSelectedPageRef.current = false;
    }
  }, [plannedPages, plannedStyleSpec, contentDesc, selectedStyles, styleDesc, aiConfig, activeProvider, uploadedFiles, detectedPlatform, activeProjectId, updateCurrentProject, targetPlatform, pcPages, mobilePages, activePlanPlatform, setPages, setCurrentPageIndex, setCode, setGenerateError, setRightViewMode, projectsRef]);

  // ── Cancel plan ──

  const handleCancelPlan = useCallback(() => {
    setPlannedPages(null);
    setPlannedStyleSpec('');
    setDetectedPlatform('pc');
    setWireframeHtmls([]);
    setRightViewMode('empty');
    setPcPages(null);
    setMobilePages(null);
    setPcGeneratedPages(null);
    setMobileGeneratedPages(null);
    setActivePlanPlatform('pc');
    updateCurrentProject({ loadedPlanId: null });
  }, [updateCurrentProject, setRightViewMode]);

  // ── Regenerate all pages from a saved plan/scheme ──

  const handleRegenerateFromPlan = useCallback(async (plan) => {
    // Load plan state first
    const planPages = plan.plannedPages || [];
    const planStyleSpec = plan.styleSpec || '';
    const planPlatform = plan.platform === 'both' ? 'pc' : (plan.platform || 'pc');

    if (!planPages.length) return;

    // Set all plan state
    setPlannedPages(planPages);
    setPlannedStyleSpec(planStyleSpec);
    setDetectedPlatform(planPlatform);
    setPcPages(plan.pcPages || null);
    setMobilePages(plan.mobilePages || null);
    setPcGeneratedPages(null);
    setMobileGeneratedPages(null);
    setActivePlanPlatform(planPlatform);

    // Restore project context
    updateCurrentProject({
      contentDesc: plan.description || '',
      selectedStyles: plan.selectedStyles || ['business'],
      styleDesc: plan.styleDesc || '',
      loadedPlanId: plan.id,
    });

    // Start generation with plan data
    setIsGenerating(true);
    isGeneratingRef.current = true;
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    setGenerateError('');
    userSelectedPageRef.current = false;
    setStreamingHtml('');
    setStreamingPageIndex(0);
    setProgressCurrent(0);
    setProgressTotal(planPages.length);
    setPages([]);
    setCurrentPageIndex(0);

    try {
      const fileContents = uploadedFiles.length > 0 ? await readFileContents(uploadedFiles) : [];
      const providerConfig = aiConfig[activeProvider] || {};

      let completedCount = 0;
      const result = await generateProjectPages(
        activeProvider, providerConfig, planPages, planStyleSpec,
        plan.description || contentDesc, fileContents,
        plan.selectedStyles || selectedStyles, plan.styleDesc || styleDesc,
        planPlatform,
        (msg) => setGenerateProgress(msg),
        (pageResult, index) => {
          completedCount++;
          setProgressCurrent(completedCount);
          setPages((prev) => {
            const next = [...prev];
            next[index] = pageResult;
            return next;
          });
        },
        (html) => setStreamingHtml(html),
        signal
      );

      setPages(result.pages);
      if (result.pages.length > 0) {
        setCurrentPageIndex(0);
        setCode(result.pages[0].html || '');
      }

      // Save to history
      const desc = (plan.description || contentDesc || '').slice(0, 80);
      const entry = {
        id: generateId(),
        timestamp: formatTime(new Date()),
        description: desc + (desc.length >= 80 ? '...' : ''),
        styles: [...(plan.selectedStyles || selectedStyles)],
        pages: result.pages,
        pageCount: result.pages.length,
        platform: planPlatform,
      };
      const currentHistory = projectsRef.current[activeProjectId]?.history || [];
      updateCurrentProject({ history: [entry, ...currentHistory] });
    } catch (err) {
      if (err.name !== 'AbortError') {
        setGenerateError(err.message || '重新生成失败');
      }
    } finally {
      setIsGenerating(false);
      isGeneratingRef.current = false;
      setGenerateProgress('');
      setProgressCurrent(0);
      setProgressTotal(0);
      setStreamingHtml('');
      setStreamingPageIndex(null);
      setRightViewMode('prototype');
      userSelectedPageRef.current = false;
    }
  }, [contentDesc, selectedStyles, styleDesc, uploadedFiles, aiConfig, activeProvider, activeProjectId, updateCurrentProject, projectsRef, setPages, setCurrentPageIndex, setCode, setGenerateError, setRightViewMode]);

  // ── Cancel generation ──

  const handleCancelGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
    isGeneratingRef.current = false;
    setGenerateProgress('已取消');
    setPlanningStreamText('');
    setPlanningPhase('');
    setStreamingHtml('');
  }, []);

  // ── View mode switching ──

  const handleViewPlan = useCallback(() => {
    setRightViewMode('plan');
  }, [setRightViewMode]);

  const handleViewPagePrototype = useCallback((pageIndex) => {
    setCurrentPageIndex(pageIndex);
    setRightViewMode('prototype');
    setCode(pagesRef.current[pageIndex]?.html || '');
    setMessages([]);
  }, [setCurrentPageIndex, setRightViewMode, setCode, setMessages, pagesRef]);

  // ── Load plan with wireframe (from history modal) ──

  const handleLoadPlanWithWireframe = useCallback((plan) => {
    updateCurrentProject({
      contentDesc: plan.description || '',
      selectedStyles: plan.selectedStyles || ['business'],
      styleDesc: plan.styleDesc || '',
      loadedPlanId: plan.id,
    });

    const isDualPlan = plan.platform === 'both' && (plan.pcPages || plan.mobilePages);
    if (isDualPlan) {
      setPcPages(plan.pcPages || null);
      setMobilePages(plan.mobilePages || null);
      setPlannedPages(plan.pcPages || plan.mobilePages || plan.plannedPages);
      setDetectedPlatform('pc');
      setActivePlanPlatform('pc');
    } else {
      setPlannedPages(plan.plannedPages);
      setPlannedStyleSpec(plan.styleSpec || '');
      setDetectedPlatform(plan.platform === 'both' ? 'pc' : (plan.platform || 'pc'));
      setPcPages(null);
      setMobilePages(null);
      setActivePlanPlatform(plan.platform === 'both' ? 'pc' : (plan.platform || 'pc'));
    }
    setPlannedStyleSpec(plan.styleSpec || '');
    setPcGeneratedPages(null);
    setMobileGeneratedPages(null);
    setGenerateError('');

    const displayPages = isDualPlan ? (plan.pcPages || plan.mobilePages) : plan.plannedPages;
    const displayPlatform = isDualPlan ? 'pc' : (plan.platform === 'both' ? 'pc' : (plan.platform || 'pc'));
    if (displayPages?.length > 0) {
      const wfHtmls = generateAllWireframes(displayPages, displayPlatform);
      setWireframeHtmls(wfHtmls);
      setRightViewMode('plan');
    }
  }, [updateCurrentProject, setGenerateError, setRightViewMode]);

  // ── Save complete scheme (plan + generated pages) ──

  const handleSaveScheme = useCallback(() => {
    const currentPlans = projectsRef.current[activeProjectId]?.savedPlans || [];
    const currentPages = pagesRef.current || [];
    const hasGeneratedPages = currentPages.some(p => p?.html);

    // Find the plan entry for the current loaded plan
    const loadedPlanId = projectsRef.current[activeProjectId]?.loadedPlanId;
    let planEntry = currentPlans.find(p => p.id === loadedPlanId);

    if (!planEntry) {
      // No existing plan, create a new one from current state
      planEntry = {
        id: generateId(),
        timestamp: formatTime(new Date()),
        description: contentDesc || '未命名方案',
        selectedStyles: [...selectedStyles],
        styleDesc,
        referenceSite: referenceSite || '',
        plannedPages: plannedPages || [],
        pcPages: pcPages || null,
        mobilePages: mobilePages || null,
        styleSpec: plannedStyleSpec || '',
        platform: detectedPlatform || 'pc',
        pageCountRange: pageCountRange || null,
      };
    }

    // Create a scheme with full data
    const schemeId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const schemeEntry = {
      ...planEntry,
      savedSchemeId: schemeId,
      schemeTimestamp: formatTime(new Date()),
      generatedPages: hasGeneratedPages ? currentPages.map(p => p ? { name: p.name, html: p.html || '', error: p.error || null } : null) : [],
      schemeDescription: planEntry.description || contentDesc || '未命名方案',
    };

    // Replace existing plan if loaded, or add new
    const updatedPlans = [
      schemeEntry,
      ...currentPlans.filter(p => p.id !== planEntry.id),
    ];
    updateCurrentProject({ savedPlans: updatedPlans, loadedPlanId: schemeEntry.id });
    return schemeEntry;
  }, [contentDesc, selectedStyles, styleDesc, referenceSite, plannedPages, pcPages, mobilePages, plannedStyleSpec, detectedPlatform, pageCountRange, activeProjectId, updateCurrentProject, projectsRef, pagesRef]);

  // ── Load scheme and restore generated pages ──

  const handleLoadScheme = useCallback((scheme) => {
    // Load the plan part
    handleLoadPlanWithWireframe(scheme);

    // If scheme has generated pages, restore them too
    if (scheme.generatedPages?.length > 0) {
      const validPages = scheme.generatedPages.map(p => p ? { name: p.name, html: p.html || '', error: p.error || null } : null);
      setPages(validPages);
      if (validPages.length > 0 && validPages[0]?.html) {
        setCurrentPageIndex(0);
        setCode(validPages[0].html);
        setRightViewMode('prototype');
      }
    }
  }, [handleLoadPlanWithWireframe, setPages, setCurrentPageIndex, setCode, setRightViewMode]);

  // ── Reference constraint helper ──

  const getReferenceConstraint = useCallback((targetIndex) => {
    // 首页不需要参考约束
    if (targetIndex === 0) return '';
    const firstPageHtml = pagesRef.current?.[0]?.html;
    if (!firstPageHtml) return '';
    const refTemplate = extractReferenceTemplate(firstPageHtml);
    return buildReferenceConstraint(refTemplate);
  }, [pagesRef]);

  // ── Single page regeneration ──

  const handleRegeneratePage = useCallback(async (pageIndex, pages) => {
    const targetIndex = typeof pageIndex === 'number' ? pageIndex : currentPageIndex;
    if (isRegenerating || !pages[targetIndex]) return;
    const page = pages[targetIndex];
    setIsRegenerating(true);
    setRegeneratingPageIndex(targetIndex);
    setGenerateProgress(`正在重新生成「${page.name}」...`);

    try {
      const providerConfig = aiConfig[activeProvider] || {};
      const fileContents = uploadedFiles.length > 0 ? await readFileContents(uploadedFiles) : [];
      const styleSpec = plannedStyleSpec || buildStyleSpec(selectedStyles, styleDesc, referenceSite);
      const referenceConstraint = getReferenceConstraint(targetIndex);
      const result = await generateSinglePage(
        activeProvider, providerConfig, page, styleSpec,
        contentDesc, fileContents, selectedStyles, styleDesc, pages, detectedPlatform,
        undefined, referenceConstraint
      );
      const html = result.html || '';
      setPages((prev) => {
        const next = [...prev];
        next[targetIndex] = { ...next[targetIndex], html, error: null };
        return next;
      });
      if (targetIndex === pageIndex) {
        setCode(html);
      }
      setCurrentPageIndex(targetIndex);
      setRightViewMode('prototype');
    } catch (err) {
      setGenerateError(`重新生成失败：${err.message}`);
    } finally {
      setIsRegenerating(false);
      setRegeneratingPageIndex(null);
      setGenerateProgress('');
    }
  }, [isRegenerating, currentPageIndex, aiConfig, activeProvider, contentDesc, selectedStyles, styleDesc, referenceSite, plannedStyleSpec, uploadedFiles, detectedPlatform, setPages, setCode, setCurrentPageIndex, setRightViewMode, setGenerateError, getReferenceConstraint]);

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
      const styleSpec = plannedStyleSpec || buildStyleSpec(selectedStyles, styleDesc, referenceSite);
      const referenceConstraint = getReferenceConstraint(pageIndex);
      const result = await generateSinglePage(
        activeProvider, providerConfig, planPage, styleSpec,
        contentDesc, fileContents, selectedStyles, styleDesc, plannedPages, detectedPlatform,
        undefined, referenceConstraint
      );
      const html = result.html || '';
      setPages((prev) => {
        const next = [...prev];
        while (next.length <= pageIndex) next.push(null);
        next[pageIndex] = { ...planPage, html, error: null };
        return next;
      });
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
  }, [plannedPages, isRegenerating, isGenerating, aiConfig, activeProvider, contentDesc, selectedStyles, styleDesc, referenceSite, plannedStyleSpec, uploadedFiles, detectedPlatform, setPages, setCurrentPageIndex, setCode, setRightViewMode, setGenerateError, getReferenceConstraint]);

  // ── Reset generation state (used during project switch) ──

  const resetGenerationState = useCallback(() => {
    // Abort any ongoing generation before resetting
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setCurrentPageIndex(0);
    setMessages([]);
    setPlannedPages(null);
    setPlannedStyleSpec('');
    setDetectedPlatform('pc');
    setUploadedFiles([]);
    setGenerateError('');
    setGenerateProgress('');
    setIsGenerating(false);
    setIsRegenerating(false);
    setPcPages(null);
    setMobilePages(null);
    setPcGeneratedPages(null);
    setMobileGeneratedPages(null);
    setActivePlanPlatform('pc');
    setPlanningStreamText('');
    setPlanningDiscoveredPages([]);
    setPlanningPhase('');
    setStreamingHtml('');
    setStreamingPageIndex(null);
    setWireframeHtmls([]);
    setProgressCurrent(0);
    setProgressTotal(0);
  }, [setCurrentPageIndex, setMessages, setGenerateError]);

  return {
    // Planning
    plannedPages, setPlannedPages,
    plannedStyleSpec, setPlannedStyleSpec,
    detectedPlatform, setDetectedPlatform,
    targetPlatform, setTargetPlatform,
    pageCountRange, setPageCountRange,
    pageEstimate, isPreAnalyzing, awaitingPageConfirm,
    pcPages, setPcPages,
    mobilePages, setMobilePages,
    activePlanPlatform, setActivePlanPlatform,
    pcGeneratedPages, setPcGeneratedPages,
    mobileGeneratedPages, setMobileGeneratedPages,
    wireframeHtmls, setWireframeHtmls,
    // Generation
    isGenerating, setIsGenerating, isGeneratingRef,
    generateError, setGenerateError,
    generateProgress, setGenerateProgress,
    progressCurrent, setProgressCurrent,
    progressTotal, setProgressTotal,
    streamingHtml, streamingPageIndex,
    planningStreamText, planningDiscoveredPages, planningPhase,
    isRegenerating, setIsRegenerating, regeneratingPageIndex,
    // Files
    uploadedFiles, handleFilesAdd, handleFileRemove,
    // Refs
    userSelectedPageRef, abortControllerRef,
    // Actions
    handlePlan, handleConfirmPageCount, handleSkipPageCount, handleConfirmPlan, handleCancelPlan,
    handleCancelGeneration, handleSwitchPlanPlatform,
    handleViewPlan, handleViewPagePrototype,
    handleLoadPlanWithWireframe, handleLoadScheme, handleSaveScheme,
    handleRegeneratePage, handleGenerateSinglePage,
    handleRegenerateFromPlan,
    resetGenerationState,
  };
}
