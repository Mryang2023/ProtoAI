import { useState, useRef, useCallback } from 'react';
import { Sparkles, FileText, Palette, Bot, Check, X, LayoutList, Trash2, Play, Monitor, Smartphone, ChevronDown, Plus, RotateCcw, Eye, Zap, Loader2, CheckCircle2, AlertCircle, ArrowRight, Layout, StickyNote } from 'lucide-react';
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
  isDualPlatform,
  activePlanPlatform,
  onSwitchPlanPlatform,
  onOpenTemplateLibrary,
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
