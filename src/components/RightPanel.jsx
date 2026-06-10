import { useState, useRef, useEffect } from 'react';
import {
  Monitor, Tablet, Smartphone, RefreshCw, ZoomIn, ZoomOut,
  Download, FileDown, Archive, Image, Images,
  Sparkles, AlertCircle, ChevronDown, CheckCircle2, ArrowLeft, RotateCcw,
} from 'lucide-react';

export default function RightPanel({
  generatedHtml, isGenerating, onRefresh,
  onExport, onExportAll, onExportImage, onExportAllImages,
  refinePanel, error, progress, progressCurrent, progressTotal,
  plannedPages, pages, currentPageIndex, onPageChange,
  onUserSelectPage,
  isRefining, isRegenerating, onRegeneratePage,
}) {
  const [device, setDevice] = useState('desktop');
  const [zoom, setZoom] = useState(100);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [userPreviewIndex, setUserPreviewIndex] = useState(null);
  const exportRef = useRef(null);

  const hasMultiplePages = pages.filter((p) => p?.html).length > 1;

  // Reset local preview when generation finishes
  useEffect(() => {
    if (!isGenerating) setUserPreviewIndex(null);
  }, [isGenerating]);

  // Determine which HTML to show in the preview
  // During generation: only show iframe when user manually selects a completed page
  // This prevents iframe from thrashing between different HTML documents
  const previewHtml = isGenerating
    ? (userPreviewIndex !== null ? (pages[userPreviewIndex]?.html || '') : '')
    : generatedHtml;
  const devices = [
    { id: 'desktop', icon: Monitor, label: '桌面' },
    { id: 'tablet', icon: Tablet, label: '平板' },
    { id: 'mobile', icon: Smartphone, label: '手机' },
  ];

  useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setShowExportMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExportMenu]);

  // Handler: user clicks a page (from tabs or progress grid)
  const handleSelectPage = (index) => {
    if (isGenerating) {
      setUserPreviewIndex(index);
      if (onUserSelectPage) onUserSelectPage();
    }
    onPageChange(index);
  };

  const showProgressDuringGen = isGenerating && !previewHtml;

  return (
    <div className="right-panel" data-component="Right Panel" data-od-id="right-panel">
      {/* Compact progress bar during generation (always visible at top) */}
      {isGenerating && progressTotal > 0 && (
        <div className="compact-progress-bar">
          <div className="compact-progress-track">
            <div className="compact-progress-fill"
              style={{ width: `${progressTotal > 0 ? Math.round((progressCurrent / progressTotal) * 100) : 0}%` }} />
          </div>
          <span className="compact-progress-text">
            {progressCurrent}/{progressTotal} {progress || '准备中...'}
          </span>
          {userPreviewIndex !== null && (
            <button className="compact-progress-back" onClick={() => setUserPreviewIndex(null)}>
              <ArrowLeft size={12} />返回进度
            </button>
          )}
        </div>
      )}

      {/* Preview toolbar */}
      {previewHtml && (
        <div className="preview-toolbar">
          <div className="preview-toolbar-left">
            {devices.map((d) => {
              const Icon = d.icon;
              return (
                <button key={d.id} className={`device-btn${device === d.id ? ' active' : ''}`}
                  onClick={() => setDevice(d.id)} title={d.label}
                  aria-label={`切换为${d.label}视图`} aria-pressed={device === d.id}>
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
          <div className="preview-toolbar-right">
            <button className="btn btn-icon btn-sm" onClick={() => setZoom((z) => Math.max(z - 10, 50))} disabled={zoom <= 50} title="缩小" aria-label="缩小"><ZoomOut size={14} /></button>
            <span className="zoom-display">{zoom}%</span>
            <button className="btn btn-icon btn-sm" onClick={() => setZoom((z) => Math.min(z + 10, 150))} disabled={zoom >= 150} title="放大" aria-label="放大"><ZoomIn size={14} /></button>
            <button className="btn btn-icon btn-sm" onClick={onRefresh} title="刷新预览" aria-label="刷新预览"><RefreshCw size={14} /></button>
            {!isGenerating && (
              <button className="btn btn-icon btn-sm" onClick={onRegeneratePage} disabled={isRegenerating} title="重新生成此页面" aria-label="重新生成此页面">
                <RotateCcw size={14} />
              </button>
            )}
            <div className="toolbar-divider" />
            <div className="export-btn-group" ref={exportRef}>
              <button className="btn btn-icon btn-sm export-toolbar-btn" onClick={() => setShowExportMenu((v) => !v)} title="导出原型" aria-label="导出原型" aria-expanded={showExportMenu}>
                <Download size={14} /><ChevronDown size={10} />
              </button>
              {showExportMenu && (
                <div className="export-dropdown export-dropdown-right" data-component="Export Menu" data-od-id="export-menu-right">
                  <button className="export-dropdown-item" onClick={() => { onExport(); setShowExportMenu(false); }}>
                    <FileDown size={15} /><span>导出当前页 (HTML)</span>
                  </button>
                  {hasMultiplePages && (
                    <button className="export-dropdown-item" onClick={() => { onExportAll(); setShowExportMenu(false); }}>
                      <Archive size={15} /><span>导出全部 (ZIP)</span>
                    </button>
                  )}
                  <div className="export-dropdown-divider" />
                  <button className="export-dropdown-item" onClick={() => { onExportImage(); setShowExportMenu(false); }}>
                    <Image size={15} /><span>导出当前页 (PNG)</span>
                  </button>
                  {hasMultiplePages && (
                    <button className="export-dropdown-item" onClick={() => { onExportAllImages(); setShowExportMenu(false); }}>
                      <Images size={15} /><span>导出全部图片 (ZIP)</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page navigation — show when multiple pages exist (including during generation) */}
      {(pages.filter((p) => p?.html).length > 1 || (isGenerating && plannedPages && plannedPages.length > 1)) && (
        <div className="page-nav" data-component="Page Navigation" data-od-id="page-nav">
          {(plannedPages || pages).map((page, i) => {
            const pageData = pages[i];
            const isDone = pageData?.html && !pageData?.error;
            const isCurrent = isGenerating && userPreviewIndex !== null
              ? i === userPreviewIndex
              : i === currentPageIndex;
            return (
              <button key={`nav-${page.name || page.route}-${i}`}
                className={`page-nav-tab${isCurrent ? ' active' : ''}${pageData?.error ? ' has-error' : ''}`}
                onClick={() => isDone && handleSelectPage(i)}
                disabled={isGenerating && !isDone}
                title={page.description || page.name}
                aria-label={`切换到页面：${page.name}`} aria-pressed={isCurrent}>
                <span className="page-nav-name">{page.name}</span>
                {isDone && <CheckCircle2 size={11} className="page-nav-done" />}
                {pageData?.error && <AlertCircle size={12} className="page-nav-error" />}
              </button>
            );
          })}
          {/* Regenerate current page button */}
          {!isGenerating && generatedHtml && (
            <button className="page-nav-regenerate"
              onClick={onRegeneratePage}
              disabled={isRegenerating}
              title="重新生成此页面"
              aria-label="重新生成当前页面">
              <RotateCcw size={12} />
              {isRegenerating ? '生成中...' : '重新生成'}
            </button>
          )}
        </div>
      )}

      {/* Preview area */}
      <div className="preview-frame-container">
        {error ? (
          <ErrorState message={error} />
        ) : showProgressDuringGen ? (
          <ProgressState
            progress={progress}
            current={progressCurrent}
            total={progressTotal}
            plannedPages={plannedPages}
            pages={pages}
            onPreviewPage={(index) => handleSelectPage(index)}
          />
        ) : previewHtml ? (
          <div className={`preview-frame ${device}`}
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}>
            <iframe title="原型预览" srcDoc={previewHtml}
              sandbox="allow-scripts allow-same-origin" aria-label="HTML原型预览区域" />
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Refine panel */}
      {previewHtml && !isGenerating && refinePanel}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state" data-component="Empty State" data-od-id="empty-state">
      <div className="empty-state-icon"><Sparkles size={36} /></div>
      <h2 className="empty-state-title">开始创建你的原型</h2>
      <p className="empty-state-desc">在左侧描述你的页面内容和风格偏好，或上传需求文档，ProtoAI 会自动规划并生成 HTML 原型。</p>
      <div className="empty-state-steps">
        <div className="empty-step"><span className="empty-step-num">1</span>在左侧输入描述或上传文件</div>
        <div className="empty-step"><span className="empty-step-num">2</span>选择风格标签，点击「规划方案」</div>
        <div className="empty-step"><span className="empty-step-num">3</span>确认页面规划后开始生成</div>
        <div className="empty-step"><span className="empty-step-num">4</span>逐页预览，通过对话或代码微调</div>
      </div>
    </div>
  );
}

function ProgressState({ progress, current, total, plannedPages, pages, onPreviewPage }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  // Build a unified list: use plannedPages for names/descriptions, pages for HTML data
  const pageList = (plannedPages || []).map((plan, i) => {
    const pageData = pages?.[i];
    return {
      name: plan.name,
      description: plan.description,
      html: pageData?.html || '',
      error: pageData?.error || null,
      isDone: !!pageData?.html && !pageData?.error,
      isFailed: !!pageData?.error,
      isGenerating: !!(
        pages &&
        current < total &&
        !pageData?.html &&
        !pageData?.error
      ),
    };
  });

  return (
    <div className="progress-state" data-component="Progress State" data-od-id="progress-state">
      {/* Page preview grid */}
      {pageList.length > 0 && (
        <div className="progress-pages">
          <p className="progress-pages-label">页面预览 — 点击已完成的页面查看</p>
          <div className="progress-preview-grid">
            {pageList.map((page, i) => (
              <div
                key={i}
                className={`progress-preview-card${page.isDone ? ' done clickable' : ''}${page.isGenerating ? ' generating' : ''}${page.isFailed ? ' failed' : ''}`}
                onClick={() => page.isDone && onPreviewPage && onPreviewPage(i)}
                role={page.isDone ? 'button' : undefined}
                tabIndex={page.isDone ? 0 : undefined}
                aria-label={page.isDone ? `查看页面：${page.name}` : undefined}
              >
                {/* Thumbnail area */}
                <div className="progress-preview-thumb">
                  {page.isDone ? (
                    <iframe
                      title={`预览: ${page.name}`}
                      srcDoc={page.html}
                      sandbox="allow-scripts allow-same-origin"
                      className="progress-thumb-iframe"
                    />
                  ) : page.isGenerating ? (
                    <div className="progress-thumb-loading">
                      <span className="spinner-small" />
                      <span>生成中...</span>
                    </div>
                  ) : page.isFailed ? (
                    <div className="progress-thumb-error">
                      <AlertCircle size={20} />
                    </div>
                  ) : (
                    <div className="progress-thumb-pending">
                      <span className="progress-thumb-num">{i + 1}</span>
                    </div>
                  )}
                </div>
                {/* Label */}
                <div className="progress-preview-label">
                  {page.isDone && <CheckCircle2 size={11} style={{ color: 'var(--success)', flexShrink: 0 }} />}
                  {page.isFailed && <AlertCircle size={11} style={{ color: 'var(--danger)', flexShrink: 0 }} />}
                  <span className="progress-preview-name">{page.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skeleton preview (when no plan yet) */}
      {total === 0 && pageList.length === 0 && (
        <div className="loading-skeleton">
          <div className="skeleton-bar w-50 h-lg" />
          <div className="skeleton-bar w-full" />
          <div className="skeleton-bar w-75" />
          <div className="skeleton-bar w-full h-xl" />
          <div className="skeleton-bar w-full" />
          <div className="skeleton-bar w-50" />
        </div>
      )}
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="empty-state" data-component="Error State" data-od-id="error-state">
      <div className="empty-state-icon" style={{ background: 'color-mix(in srgb, var(--danger) 10%, transparent)', color: 'var(--danger)' }}>
        <AlertCircle size={36} />
      </div>
      <h2 className="empty-state-title">生成失败</h2>
      <p className="empty-state-desc" style={{ color: 'var(--danger)' }}>{message}</p>
      <p className="empty-state-desc" style={{ marginTop: 'var(--sp-3)' }}>请检查 AI 模型配置是否正确，或确认网络连接后重试。</p>
    </div>
  );
}
