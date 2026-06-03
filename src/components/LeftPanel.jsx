import { useState, useRef, useCallback } from 'react';
import { Sparkles, FileText, Palette, Bot, Check, X, LayoutList } from 'lucide-react';
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
  pages,
  activeModel,
  onOpenSettings,
  files,
  onFilesAdd,
  onFileRemove,
}) {
  const [panelWidth, setPanelWidth] = useState(400);
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
          <div className="panel-section-header">
            <Palette size={14} style={{ color: 'var(--fg-muted)' }} />
            <span className="section-label">风格偏好</span>
          </div>
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
        </section>

        {/* Plan preview */}
        {plannedPages && plannedPages.length > 0 && (
          <section className="plan-preview" data-component="Plan Preview" data-od-id="plan-preview">
            <div className="panel-section-header">
              <LayoutList size={14} style={{ color: isGenerating ? 'var(--fg-muted)' : 'var(--accent)' }} />
              <span className="section-label" style={{ color: isGenerating ? 'var(--fg-muted)' : 'var(--accent)' }}>
                {isGenerating ? '生成进度' : '生成方案'}
              </span>
            </div>
            {!isGenerating && (
              <p className="section-hint">AI 规划了 {plannedPages.length} 个页面，确认后开始生成</p>
            )}
            <div className="plan-pages-list">
              {plannedPages.map((page, i) => {
                const pageData = pages?.[i];
                const isDone = pageData?.html && !pageData?.error;
                const isFailed = pageData?.error;
                const isCurrent = isGenerating && !isDone && !isFailed && (i === (pages?.filter(Boolean).length || 0));
                return (
                  <div key={i} className={`plan-page-item${isDone ? ' done' : ''}${isCurrent ? ' generating' : ''}${isFailed ? ' failed' : ''}`}>
                    <span className={`plan-page-index${isDone ? ' done' : ''}${isCurrent ? ' generating' : ''}${isFailed ? ' failed' : ''}`}>
                      {isDone ? '✓' : isFailed ? '✗' : i + 1}
                    </span>
                    <div className="plan-page-info">
                      <span className="plan-page-name">{page.name}</span>
                      {page.description && <span className="plan-page-desc">{page.description}</span>}
                    </div>
                    {isCurrent && <span className="plan-page-status">生成中...</span>}
                    {isDone && <span className="plan-page-status done">已完成</span>}
                    {isFailed && <span className="plan-page-status failed">失败</span>}
                  </div>
                );
              })}
            </div>
            {!isGenerating && (
              <div className="plan-actions">
                <button className="btn btn-primary plan-confirm-btn" onClick={onConfirmPlan}>
                  <Check size={15} />确认，开始生成
                </button>
                <button className="btn btn-ghost btn-sm" onClick={onCancelPlan}>
                  <X size={14} />取消
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Model indicator + Generate button */}
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
        {!plannedPages ? (
          <button
            className="btn-generate"
            onClick={onPlan}
            disabled={isGenerating || !hasInput}
            aria-label="规划方案"
            style={{ marginTop: 'var(--sp-3)' }}
          >
            {isGenerating ? (
              <><span className="spinner" />分析中...</>
            ) : (
              <><Sparkles size={18} />规划方案</>
            )}
          </button>
        ) : null}
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
