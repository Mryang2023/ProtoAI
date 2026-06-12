import { useCallback } from 'react';
import { generateAllWireframes } from '../components/PlanPreview.jsx';

function formatTime(date) {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${date.getMonth() + 1}月${date.getDate()}日 ${h}:${m}`;
}

export default function useSavedPlans({
  projectsRef, activeProjectId, loadedPlanId,
  updateCurrentProject,
  setPlannedPages, setPlannedStyleSpec, setDetectedPlatform,
  setPcPages, setMobilePages, setActivePlanPlatform,
  setPcGeneratedPages, setMobileGeneratedPages,
  setWireframeHtmls, setRightViewMode, setGenerateError,
}) {
  // ── Load plan ──

  const handleLoadPlan = useCallback((plan) => {
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
  }, [updateCurrentProject, setPlannedPages, setPlannedStyleSpec, setDetectedPlatform,
    setPcPages, setMobilePages, setActivePlanPlatform,
    setPcGeneratedPages, setMobileGeneratedPages,
    setWireframeHtmls, setRightViewMode, setGenerateError]);

  // ── Delete plan ──

  const handleDeletePlan = useCallback((planId) => {
    const currentPlans = projectsRef.current[activeProjectId]?.savedPlans || [];
    const updates = { savedPlans: currentPlans.filter((p) => p.id !== planId) };
    if (loadedPlanId === planId) {
      setPlannedPages(null);
      setPlannedStyleSpec('');
      updates.loadedPlanId = null;
    }
    updateCurrentProject(updates);
  }, [loadedPlanId, activeProjectId, updateCurrentProject, setPlannedPages, setPlannedStyleSpec]);

  // ── Duplicate plan ──

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

  // ── Rename plan ──

  const handleRenamePlan = useCallback((planId, newName) => {
    const currentPlans = projectsRef.current[activeProjectId]?.savedPlans || [];
    updateCurrentProject({
      savedPlans: currentPlans.map((p) => p.id === planId ? { ...p, description: newName } : p),
    });
  }, [activeProjectId, updateCurrentProject]);

  return { handleLoadPlan, handleDeletePlan, handleDuplicatePlan, handleRenamePlan };
}
