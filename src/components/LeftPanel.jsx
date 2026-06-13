import { useState, useRef, useCallback, useMemo } from 'react';
import { Sparkles, FileText, Palette, Bot, Check, X, LayoutList, Trash2, Play, Monitor, Smartphone, ChevronDown, Plus, RotateCcw, Eye, Zap, Loader2, CheckCircle2, AlertCircle, ArrowRight, Layout, StickyNote, Hash, Save } from 'lucide-react';
import StyleTags from './StyleTags.jsx';
import FileUpload from './FileUpload.jsx';

export default function LeftPanel({
  contentDesc,
  onContentDescChange,
  styleDesc,
  onStyleDescChange,
  selectedStyles,
  onToggleStyle,
  onPlan,
  onConfirmPlan,
  onCancelPlan,
  isGenerating,
  isPlanning,
  plannedPages,
  detectedPlatform,
  pages,
  activeModel,
  onOpenSettings,
  files,
  onFilesAdd,
  onFileRemove,
  rightViewMode,
  onViewPlan,
  onViewPagePrototype,
  onRegeneratePage,
  onGenerateSinglePage,
  isRegenerating,
  regeneratingPageIndex,
  progressCurrent,
  progressTotal,
  targetPlatform,
  onTargetPlatformChange,
  pageCountRange,
  onPageCountRangeChange,
  isDualPlatform,
  activePlanPlatform,
  onSwitchPlanPlatform,
  onOpenTemplateLibrary,
  onSaveScheme,
  projectNotes = '',
  onProjectNotesChange,
}) {
  const [panelWidth, setPanelWidth] = useState(400);
  const [stylesExpanded, setStylesExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const isResizing = useRef(false);

  const handleMouseDown = useCallback((e) => {
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = panelWidth;
    const move = (ev) => {
      if (!isResizing.current) return;
      setPanelWidth(Math.min(520, Math.max(320, startWidth + ev.clientX - startX)));
    };
    const up = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }, [panelWidth]);

  const hasInput = contentDesc.trim() || files.length > 0;

  // Compute page count suggestion based on content
  const pageSuggestion = useMemo(() => {
    const text = (contentDesc || '').toLowerCase();
    const len = text.length;
    if (len < 10 && files.length === 0) return null;

    let complexity = 1; // 1=simple, 2=medium, 3=complex
    // Complexity keywords
    const complexKeywords = ['管理系统', '后台', 'admin', 'dashboard', 'erp', 'crm', '平台', '电商', '商城', 'shopping', 'mall', 'oa', 'sass', 'saas', '多端', '多角色', '权限', '数据分析', '报表', '审批', '工作流'];
    const mediumKeywords = ['官网', '展示', '企业', 'portfolio', 'landing', '博客', 'blog', '文档', 'docs', '帮助', 'help', '介绍', '产品', '服务', '功能', 'feature'];

    let score = 0;
    for (const kw of complexKeywords) { if (text.includes(kw)) score += 2; }
    for (const kw of mediumKeywords) { if (text.includes(kw)) score += 1; }

    // Length factor
    if (len > 500) score += 2;
    else if (len > 200) score += 1;

    // File factor
    if (files.length >= 3) score += 2;
    else if (files.length >= 1) score += 1;

    if (score >= 5) complexity = 3;
    else if (score >= 2) complexity = 2;

    const ranges = {
      1: { min: 3, max: 8, recommended: 5 },
      2: { min: 5, max: 15, recommended: 8 },
      3: { min: 10, max: 30, recommended: 18 },
    };
    return ranges[complexity];
  }, [contentDesc, files]);

  // Local state for user-adjusted range (synced with pageSuggestion)
  const [localRange, setLocalRange] = useState(null);
  const [pageCountExpanded, setPageCountExpanded] = useState(false);

  // Sync local range with suggestion or prop
  const effectiveRange = useMemo(() => {
    if (localRange) return localRange;
    if (pageCountRange) return pageCountRange;
    return pageSuggestion;
  }, [localRange, pageCountRange, pageSuggestion]);

  // When user adjusts slider
  const handleRangeChange = useCallback((min, max) => {
    const recommended = Math.round((min + max) / 2);
    const newRange = { min, max, recommended };
    setLocalRange(newRange);
    onPageCountRangeChange?.(newRange);
  }, [onPageCountRangeChange]);

  // Reset to AI suggestion
  const handleResetRange = useCallback(() => {
    setLocalRange(null);
    onPageCountRangeChange?.(pageSuggestion);
  }, [pageSuggestion, onPageCountRangeChange]);

  const isCustomized = localRange && pageSuggestion &&
    (localRange.min !== pageSuggestion.min || localRange.max !== pageSuggestion.max);

  // Compute generation stats
  const generatedCount = pages?.filter(p => p?.html && !p?.error).length || 0;
  const failedCount = pages?.filter(p => p?.error).length || 0;
  const totalPlanned = plannedPages?.length || 0;
  const allDone = totalPlanned > 0 && generatedCount + failedCount >= totalPlanned && !isGenerating;

  return (
    <aside
      className="left-panel"
      style={{ width: panelWidth }}
      data-component="Left Panel"
      data-od-id="left-panel"
    >
      <div className="left-panel-content">
        {/* Content description */}
        <section className="panel-section">
          <div className="panel-section-header">
            <FileText size={14} style={{ color: 'var(--fg-muted)' }} />
            <span className="section-label">内容描述</span>
          </div>
          <p className="section-hint">描述页面内容和功能，或上传需求文件让 AI 分析</p>
          <div className="textarea-field">
            <textarea
              value={contentDesc}
              onChange={(e) => onContentDescChange(e.target.value)}
              placeholder="按照文档要求生成原型，或在此描述页面内容和功能..."
              maxLength={2000}
              aria-label="内容描述"
            />
            <span className="char-count">{contentDesc.length}/2000</span>
          </div>
        </section>

        {/* File upload */}
        <FileUpload files={files} onFilesAdd={onFilesAdd} onFileRemove={onFileRemove} />

        {/* Style preferences */}
        <section className="panel-section">
          <div
            className="panel-section-header"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setStylesExpanded((v) => !v)}
          >
            <Palette size={14} style={{ color: 'var(--fg-muted)' }} />
            <span className="section-label">风格偏好</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 2 }}>
              {selectedStyles.length > 0 && (
                <span style={{
                  background: 'var(--accent-subtle)', color: 'var(--accent)',
                  padding: '1px 6px', borderRadius: 9999, fontWeight: 600,
                }}>{selectedStyles.length}</span>
              )}
              <ChevronDown size={14} style={{
                transform: stylesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform .2s',
              }} />
            </span>
          </div>
          {!stylesExpanded ? (
            <p className="section-hint">
              {selectedStyles.length > 0
                ? `已选：${selectedStyles.join('、')}，点击展开修改`
                : '点击展开选择风格标签'}
            </p>
          ) : (
            <>
              <p className="section-hint">选择一种或多种风格标签，可叠加使用</p>
              <StyleTags selected={selectedStyles} onToggle={onToggleStyle} />
              <div className="textarea-field" style={{ marginTop: 'var(--sp-2)' }}>
                <textarea
                  value={styleDesc}
                  onChange={(e) => onStyleDescChange(e.target.value)}
                  placeholder="补充风格描述（可选）：例如使用深色背景、圆角卡片、渐变按钮..."
                  maxLength={500}
                  style={{ minHeight: 80 }}
                  aria-label="风格补充描述"
                />
                <span className="char-count">{styleDesc.length}/500</span>
              </div>
            </>
          )}
        </section>

        {/* Plan summary + page list */}
        {plannedPages && plannedPages.length > 0 && (
          <section className="plan-preview" data-component="Plan Summary" data-od-id="plan-summary">
            <div className="panel-section-header">
              <LayoutList size={14} style={{ color: isGenerating ? 'var(--fg-muted)' : 'var(--accent)' }} />
              <span className="section-label" style={{ color: isGenerating ? 'var(--fg-muted)' : 'var(--accent)' }}>
                {isGenerating ? '生成进度' : allDone ? '生成结果' : '页面方案'}
              </span>
              <span style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: isDualPlatform ? 'rgba(124,58,237,0.1)' : detectedPlatform === 'mobile' ? 'rgba(249,115,22,0.1)' : 'rgba(37,99,235,0.1)',
                color: isDualPlatform ? '#7c3aed' : detectedPlatform === 'mobile' ? '#ea580c' : '#2563eb',
              }}>
                {isDualPlatform ? <LayoutList size={12} /> : detectedPlatform === 'mobile' ? <Smartphone size={12} /> : <Monitor size={12} />}
                {isDualPlatform ? '双端' : detectedPlatform === 'mobile' ? '移动端' : 'PC端'}
              </span>
            </div>

            {/* Dual-platform tab switcher */}
            {isDualPlatform && !isGenerating && (
              <div className="platform-plan-tabs">
                <button
                  className={`platform-plan-tab${activePlanPlatform === 'pc' ? ' active' : ''}`}
                  onClick={() => onSwitchPlanPlatform && onSwitchPlanPlatform('pc')}
                >
                  <Monitor size={12} />
                  PC端方案
                </button>
                <button
                  className={`platform-plan-tab${activePlanPlatform === 'mobile' ? ' active' : ''}`}
                  onClick={() => onSwitchPlanPlatform && onSwitchPlanPlatform('mobile')}
                >
                  <Smartphone size={12} />
                  移动端方案
                </button>
              </div>
            )}

            {/* Progress bar during batch generation */}
            {isGenerating && progressTotal > 0 && (
              <div className="gen-progress-bar">
                <div className="gen-progress-track">
                  <div
                    className="gen-progress-fill"
                    style={{ width: `${Math.round((progressCurrent / progressTotal) * 100)}%` }}
                  />
                </div>
                <span className="gen-progress-text">
                  {progressCurrent}/{progressTotal} 页已完成
                </span>
              </div>
            )}

            {/* Summary stats after generation */}
            {allDone && totalPlanned > 0 && (
              <div className="gen-result-stats">
                <span className="gen-stat">
                  <CheckCircle2 size={12} style={{ color: 'var(--success)' }} />
                  {generatedCount} 页已生成
                </span>
                {failedCount > 0 && (
                  <span className="gen-stat gen-stat-fail">
                    <AlertCircle size={12} style={{ color: 'var(--danger)' }} />
                    {failedCount} 页失败
                  </span>
                )}
                <button
                  className="gen-view-all-btn"
                  onClick={() => onViewPagePrototype && onViewPagePrototype(0)}
                >
                  查看全部 <ArrowRight size={12} />
                </button>
              </div>
            )}

            {/* Save Scheme button — shown after all pages are generated */}
            {allDone && totalPlanned > 0 && onSaveScheme && (
              <button
                className="btn btn-primary save-scheme-btn"
                onClick={onSaveScheme}
                style={{ marginTop: 'var(--sp-2)', width: '100%', justifyContent: 'center', gap: 6 }}
              >
                <Save size={14} />
                保存完整方案
              </button>
            )}

            {!isGenerating && !allDone && (
              <p className="section-hint">{plannedPages.length} 个页面 · 点击页面名称查看原型</p>
            )}

            <div className="plan-pages-list">
              {plannedPages.map((page, i) => {
                const pageData = pages?.[i];
                const isDone = pageData?.html && !pageData?.error;
                const isFailed = pageData?.error;
                const isBatchGenerating = isGenerating && !isDone && !isFailed;
                const isSingleGenerating = isRegenerating && regeneratingPageIndex === i;
                const isActive = rightViewMode === 'prototype' && (isDone || isSingleGenerating);
                const canGenerateSingle = !isGenerating && !isRegenerating && !isDone && rightViewMode !== 'plan';

                return (
                  <div
                    key={i}
                    className={`plan-page-item${isDone ? ' done' : ''}${isBatchGenerating ? ' generating' : ''}${isFailed ? ' failed' : ''}${isActive ? ' active-prototype' : ''}${isSingleGenerating ? ' single-generating' : ''}`}
                    onClick={() => {
                      if (isDone && onViewPagePrototype) onViewPagePrototype(i);
                    }}
                    style={isDone && onViewPagePrototype ? { cursor: 'pointer' } : undefined}
                  >
                    {/* Status indicator */}
                    <span className={`plan-page-index${isDone ? ' done' : ''}${isBatchGenerating || isSingleGenerating ? ' generating' : ''}${isFailed ? ' failed' : ''}`}>
                      {isDone ? '✓' : isFailed ? '✗' : isSingleGenerating ? (
                        <Loader2 size={12} className="spin-animation" />
                      ) : i + 1}
                    </span>

                    {/* Page info */}
                    <div className="plan-page-info">
                      <span className="plan-page-name">{page.name}</span>
                      {page.description && <span className="plan-page-desc">{page.description}</span>}
                    </div>

                    {/* Batch generating status */}
                    {isBatchGenerating && <span className="plan-page-status">等待中</span>}

                    {/* Single page generating */}
                    {isSingleGenerating && <span className="plan-page-status generating">生成中...</span>}

                    {/* Done: action buttons */}
                    {isDone && !isGenerating && (
                      <div className="plan-page-actions">
                        <button
                          className="btn btn-icon btn-sm plan-page-action"
                          onClick={(e) => { e.stopPropagation(); if (onViewPlan) onViewPlan(); }}
                          title="查看方案线框"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          className="btn btn-icon btn-sm plan-page-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onRegeneratePage) onRegeneratePage(i);
                          }}
                          disabled={isRegenerating}
                          title="重新生成此页面"
                        >
                          <RotateCcw size={12} />
                        </button>
                      </div>
                    )}

                    {/* Failed: retry button */}
                    {isFailed && !isGenerating && (
                      <button
                        className="btn btn-icon btn-sm plan-page-action plan-page-retry"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onGenerateSinglePage) onGenerateSinglePage(i);
                        }}
                        disabled={isRegenerating}
                        title="重新生成"
                      >
                        <RotateCcw size={12} />
                      </button>
                    )}

                    {/* Not yet generated: generate button (visible after batch or in non-plan view) */}
                    {canGenerateSingle && (
                      <button
                        className="btn btn-icon btn-sm plan-page-action plan-page-generate"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onGenerateSinglePage) onGenerateSinglePage(i);
                        }}
                        disabled={isRegenerating}
                        title="生成此页面"
                      >
                        <Zap size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Confirm / Cancel buttons (plan mode only, not generating) */}
            {!isGenerating && rightViewMode === 'plan' && (
              <div className="plan-actions">
                <button className="btn btn-primary plan-confirm-btn" onClick={onConfirmPlan}>
                  <Check size={15} />确认方案，开始生成
                </button>
                <button className="btn btn-ghost btn-sm" onClick={onCancelPlan}>
                  <X size={14} />取消
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Model indicator + Platform selector + Generate button */}
      <div style={{ padding: 'var(--sp-4) var(--sp-5)', borderTop: '1px solid var(--border-light)' }}>
        <button
          className="model-indicator"
          onClick={onOpenSettings}
          title="点击修改 AI 模型配置"
          aria-label={`当前模型：${activeModel.provider} ${activeModel.model}，点击修改`}
        >
          <Bot size={14} />
          <span className="model-indicator-label">当前模型</span>
          <span className="model-indicator-value">{activeModel.provider} · {activeModel.model}</span>
        </button>

        {/* Platform selector — shown before planning */}
        {!plannedPages && (
          <div className="platform-selector" style={{ marginTop: 'var(--sp-3)' }}>
            <div className="platform-selector-label">
              <Monitor size={12} style={{ opacity: 0.6 }} />
              目标平台
            </div>
            <div className="platform-selector-options">
              <button
                className={`platform-option${targetPlatform === 'pc' ? ' active' : ''}`}
                onClick={() => onTargetPlatformChange && onTargetPlatformChange('pc')}
              >
                <Monitor size={15} />
                <span className="platform-option-label">PC端</span>
                <span className="platform-option-desc">桌面网页</span>
              </button>
              <button
                className={`platform-option${targetPlatform === 'mobile' ? ' active' : ''}`}
                onClick={() => onTargetPlatformChange && onTargetPlatformChange('mobile')}
              >
                <Smartphone size={15} />
                <span className="platform-option-label">移动端</span>
                <span className="platform-option-desc">APP/小程序</span>
              </button>
              <button
                className={`platform-option${targetPlatform === 'both' ? ' active' : ''}`}
                onClick={() => onTargetPlatformChange && onTargetPlatformChange('both')}
              >
                <LayoutList size={15} />
                <span className="platform-option-label">双端</span>
                <span className="platform-option-desc">PC + 移动</span>
              </button>
            </div>
          </div>
        )}

        {/* Page count range selector — shown before planning when suggestion is available */}
        {!plannedPages && pageSuggestion && hasInput && (
          <div className="page-count-selector" style={{ marginTop: 'var(--sp-3)' }}>
            <button
              className="panel-section-header panel-section-header-collapsible"
              onClick={() => setPageCountExpanded(v => !v)}
              style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer', width: '100%' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-muted)' }}>
                <Hash size={13} />
                页面数量范围
              </span>
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  background: 'var(--accent-subtle)', color: 'var(--accent)',
                  padding: '1px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600,
                }}>
                  {effectiveRange?.recommended || '?'} 页
                </span>
                <ChevronDown
                  size={13}
                  style={{
                    color: 'var(--fg-muted)',
                    transform: pageCountExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform .2s',
                  }}
                />
              </span>
            </button>

            {pageCountExpanded && (
              <div className="page-count-body" style={{ marginTop: 'var(--sp-2)' }}>
                <p className="section-hint" style={{ margin: '0 0 8px', fontSize: 11 }}>
                  AI 建议 <strong>{pageSuggestion.min}–{pageSuggestion.max}</strong> 页
                  {isCustomized && <span style={{ color: 'var(--accent)', marginLeft: 4 }}>（已自定义）</span>}
                </p>

                {/* Min slider */}
                <div className="page-count-slider-row">
                  <label className="page-count-label">最少</label>
                  <input
                    type="range"
                    className="page-count-slider"
                    min={Math.max(1, pageSuggestion.min - 3)}
                    max={effectiveRange?.max || pageSuggestion.max}
                    step={1}
                    value={effectiveRange?.min || pageSuggestion.min}
                    onChange={(e) => {
                      const newMin = parseInt(e.target.value, 10);
                      const currentMax = effectiveRange?.max || pageSuggestion.max;
                      handleRangeChange(Math.min(newMin, currentMax - 1), currentMax);
                    }}
                  />
                  <span className="page-count-value">{effectiveRange?.min || pageSuggestion.min}</span>
                </div>

                {/* Max slider */}
                <div className="page-count-slider-row">
                  <label className="page-count-label">最多</label>
                  <input
                    type="range"
                    className="page-count-slider"
                    min={effectiveRange?.min || pageSuggestion.min}
                    max={Math.min(60, pageSuggestion.max + 15)}
                    step={1}
                    value={effectiveRange?.max || pageSuggestion.max}
                    onChange={(e) => {
                      const newMax = parseInt(e.target.value, 10);
                      const currentMin = effectiveRange?.min || pageSuggestion.min;
                      handleRangeChange(currentMin, Math.max(newMax, currentMin + 1));
                    }}
                  />
                  <span className="page-count-value">{effectiveRange?.max || pageSuggestion.max}</span>
                </div>

                {/* Range visualization */}
                <div className="page-count-range-bar">
                  <div
                    className="page-count-range-fill"
                    style={{
                      left: `${((effectiveRange?.min || pageSuggestion.min) - Math.max(1, pageSuggestion.min - 3)) / (Math.min(60, pageSuggestion.max + 15) - Math.max(1, pageSuggestion.min - 3)) * 100}%`,
                      right: `${100 - ((effectiveRange?.max || pageSuggestion.max) - Math.max(1, pageSuggestion.min - 3)) / (Math.min(60, pageSuggestion.max + 15) - Math.max(1, pageSuggestion.min - 3)) * 100}%`,
                    }}
                  />
                </div>

                {isCustomized && (
                  <button
                    className="page-count-reset"
                    onClick={handleResetRange}
                  >
                    <RotateCcw size={11} />
                    重置为 AI 建议
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {!plannedPages ? (
          <>
            {onOpenTemplateLibrary && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={onOpenTemplateLibrary}
                disabled={isGenerating}
                style={{ marginTop: 'var(--sp-3)', width: '100%', justifyContent: 'center', gap: 8 }}
              >
                <Layout size={16} />
                从模板库选择
              </button>
            )}
            <button
              className="btn-generate"
              onClick={onPlan}
              disabled={isGenerating || !hasInput}
              aria-label="规划方案"
              style={{ marginTop: 'var(--sp-2)' }}
            >
              {isGenerating ? (
                <><span className="spinner" />分析中...</>
              ) : (
                <><Sparkles size={18} />规划方案{targetPlatform === 'both' ? '（双端）' : ''}</>
              )}
            </button>
          </>
        ) : null}

        {/* Project Notes / Memo */}
        <section className="panel-section panel-section-notes">
          <button
            className="panel-section-header panel-section-header-collapsible"
            onClick={() => setNotesExpanded(v => !v)}
            aria-expanded={notesExpanded}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <StickyNote size={14} />
              项目备注
            </span>
            <ChevronDown
              size={14}
              style={{
                transform: notesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform .2s',
              }}
            />
          </button>
          {notesExpanded && (
            <textarea
              className="notes-textarea"
              value={projectNotes}
              onChange={(e) => onProjectNotesChange?.(e.target.value)}
              placeholder="记录项目相关的备注、想法、待办事项..."
              rows={4}
            />
          )}
        </section>
      </div>

      {/* Resize handle */}
      <div
        className={`resize-handle${isResizing.current ? ' active' : ''}`}
        onMouseDown={handleMouseDown}
        role="separator"
        aria-orientation="vertical"
        aria-label="调整面板宽度"
      />
    </aside>
  );
}
