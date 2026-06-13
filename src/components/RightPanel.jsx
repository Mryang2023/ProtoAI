import { useState, useRef, useEffect } from 'react';
import {
  Monitor, Tablet, Smartphone, RefreshCw, ZoomIn, ZoomOut,
  Download, FileDown, Archive, Image, Images,
  Sparkles, AlertCircle, ChevronDown, CheckCircle2, ArrowLeft, RotateCcw,
  Layers, Eye, Brain, FileText, Route, Loader2, XCircle,
} from 'lucide-react';
import { pageFileName } from '../aiService.js';

// ── iframe Link Interceptor ─────────────────────────────
// Injects a script into srcDoc that intercepts <a> clicks and
// posts a message to the parent window for cross-page navigation.

const LINK_INTERCEPTOR_SCRIPT = `<script>
(function(){
  document.addEventListener('click',function(e){
    var t=e.target.closest('a');
    if(!t)return;
    var h=t.getAttribute('href');
    if(!h||h.startsWith('http')||h.startsWith('//')||h.startsWith('javascript:')||h==='#')return;
    e.preventDefault();e.stopPropagation();
    var f=h.split('#')[0].split('?')[0];
    window.parent.postMessage({type:'protoai-nav',href:f},'*');
  },true);
  window.addEventListener('message',function(e){
    if(e.data&&e.data.type==='protoai-current-page'){
      var c=e.data.href;
      document.querySelectorAll('a').forEach(function(a){
        var h=(a.getAttribute('href')||'').split('#')[0].split('?')[0];
        if(h===c){a.classList.add('nav-active','current-page','active')}
        else{a.classList.remove('nav-active','current-page','active')}
      });
    }
  });
})();
<\/script>`;

function injectLinkInterceptor(html) {
  if (!html || typeof html !== 'string') return html;
  if (html.includes("type:'protoai-nav'")) return html; // already injected
  // Insert before </body> or at the end
  if (html.includes('</body>')) {
    return html.replace('</body>', LINK_INTERCEPTOR_SCRIPT + '\n</body>');
  }
  return html + LINK_INTERCEPTOR_SCRIPT;
}

export default function RightPanel({
  generatedHtml, isGenerating, onRefresh, detectedPlatform,
  onExport, onExportAll, onExportImage, onExportAllImages,
  refinePanel, error, progress, progressCurrent, progressTotal,
  plannedPages, pages, currentPageIndex, onPageChange,
  onUserSelectPage,
  isRefining, isRegenerating, onRegeneratePage,
  rightViewMode = 'prototype', wireframeHtmls = [],
  onViewModeChange,
  streamingHtml = '',
  planningStreamText = '',
  planningDiscoveredPages = [],
  planningPhase = '',
  onCancelGeneration,
}) {
  const [device, setDevice] = useState('desktop');
  const [zoom, setZoom] = useState(100);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [userPreviewIndex, setUserPreviewIndex] = useState(null);
  const [planPageIndex, setPlanPageIndex] = useState(0);
  const exportRef = useRef(null);
  const iframeRef = useRef(null);

  const hasMultiplePages = pages.filter((p) => p?.html).length > 1;

  // ── iframe cross-page navigation ──
  // Listen for navigation messages from the iframe
  useEffect(() => {
    function handleMessage(e) {
      if (e.data?.type === 'protoai-nav') {
        const targetHref = e.data.href;
        const list = plannedPages || pages;
        const idx = list.findIndex((p, i) => {
          if (!p) return false;
          return pageFileName(p, i) === targetHref;
        });
        if (idx >= 0 && pages[idx]?.html) {
          onPageChange(idx);
        }
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [pages, plannedPages, onPageChange]);

  // Reset local preview when generation finishes
  useEffect(() => {
    if (!isGenerating) setUserPreviewIndex(null);
  }, [isGenerating]);

  // Reset plan page index when plannedPages changes
  useEffect(() => {
    setPlanPageIndex(0);
  }, [plannedPages]);

  // Set default device based on detected platform
  useEffect(() => {
    if (detectedPlatform === 'mobile') {
      setDevice('mobile');
    } else {
      setDevice('desktop');
    }
  }, [detectedPlatform]);

  // Determine which HTML to show in the preview
  // During generation: user-selected page > streaming partial > empty (progress cards)
  const rawPreviewHtml = isGenerating
    ? (userPreviewIndex !== null
        ? (pages[userPreviewIndex]?.html || '')
        : (streamingHtml || ''))
    : (rightViewMode === 'prototype' ? generatedHtml : '');

  // Inject link interceptor for cross-page navigation (only when not streaming)
  const previewHtml = rawPreviewHtml && !streamingHtml
    ? injectLinkInterceptor(rawPreviewHtml)
    : rawPreviewHtml;

  // Notify iframe of current page (for nav highlighting) — must be after previewHtml declaration
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow && pages[currentPageIndex]) {
      const href = pageFileName(pages[currentPageIndex], currentPageIndex);
      const timer = setTimeout(() => {
        iframe.contentWindow?.postMessage({ type: 'protoai-current-page', href }, '*');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentPageIndex, pages, previewHtml]);

  // Current wireframe HTML for plan mode
  const currentWireframeHtml = rightViewMode === 'plan' && wireframeHtmls.length > 0
    ? wireframeHtmls[planPageIndex] || ''
    : '';

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

  const handleSelectPage = (index) => {
    if (isGenerating) {
      setUserPreviewIndex(index);
      if (onUserSelectPage) onUserSelectPage();
    }
    onPageChange(index);
  };

  const showProgressDuringGen = isGenerating && !previewHtml;
  const showPlanMode = rightViewMode === 'plan' && !isGenerating && currentWireframeHtml;
  const showPrototypeMode = rightViewMode === 'prototype' || isGenerating;

  // Show planning analysis view when actively planning (before page generation starts)
  const showPlanningView = isGenerating && planningPhase && planningPhase !== 'complete'
    && (!plannedPages || plannedPages.length === 0 || !progressTotal);

  return (
    <div className="right-panel" data-component="Right Panel" data-od-id="right-panel">
      {/* View mode tabs (plan vs prototype) */}
      {plannedPages && plannedPages.length > 0 && !isGenerating && (
        <div className="view-mode-tabs">
          <button
            className={`view-mode-tab${rightViewMode === 'plan' ? ' active' : ''}`}
            onClick={() => onViewModeChange?.('plan')}
            title="查看方案线框预览"
          >
            <Layers size={14} />
            方案预览
          </button>
          <button
            className={`view-mode-tab${rightViewMode === 'prototype' ? ' active' : ''}`}
            onClick={() => onViewModeChange?.('prototype')}
            title="查看生成的原型"
            disabled={pages.length === 0 || !pages.some(p => p?.html)}
          >
            <Eye size={14} />
            原型预览
            {pages.filter(p => p?.html).length > 0 && (
              <span className="view-mode-badge">{pages.filter(p => p?.html).length}</span>
            )}
          </button>
        </div>
      )}

      {/* Plan mode: page navigation + wireframe */}
      {showPlanMode && (
        <>
          <div className="plan-preview-toolbar">
            <div className="plan-page-tabs">
              {plannedPages.map((page, i) => (
                <button
                  key={`plan-tab-${i}`}
                  className={`plan-page-tab${i === planPageIndex ? ' active' : ''}`}
                  onClick={() => setPlanPageIndex(i)}
                >
                  <span className="plan-tab-index">{i + 1}</span>
                  {page.name}
                  {pages[i]?.html && <CheckCircle2 size={11} style={{ color: 'var(--success)', flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          </div>
          <div className="preview-frame-container">
            <div className={`preview-frame ${device}`}
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}>
              <iframe title="方案线框预览" srcDoc={currentWireframeHtml}
                sandbox="allow-scripts allow-same-origin" aria-label="方案线框预览区域" />
            </div>
          </div>
        </>
      )}

      {/* Prototype mode: progress bar + toolbar + preview */}
      {showPrototypeMode && (
        <>
          {/* Compact progress bar during generation */}
          {isGenerating && progressTotal > 0 && (
            <div className="compact-progress-bar">
              <div className="compact-progress-track">
                <div className="compact-progress-fill"
                  style={{ width: `${progressTotal > 0 ? Math.round((progressCurrent / progressTotal) * 100) : 0}%` }} />
              </div>
              <span className="compact-progress-text">
                {progressCurrent}/{progressTotal} {progress || '准备中...'}
                {streamingHtml && !userPreviewIndex && <span style={{ color: '#22c55e', marginLeft: 8 }}>● 实时预览中</span>}
              </span>
              {userPreviewIndex !== null && (
                <button className="compact-progress-back" onClick={() => setUserPreviewIndex(null)}>
                  <ArrowLeft size={12} />返回进度
                </button>
              )}
              {onCancelGeneration && (
                <button className="compact-progress-cancel" onClick={onCancelGeneration} title="取消生成">
                  <XCircle size={13} />取消
                </button>
              )}
            </div>
          )}

          {/* Compact planning indicator (shows before progress bar during planning) */}
          {showPlanningView && (
            <div className="compact-progress-bar" style={{ background: 'color-mix(in srgb, var(--accent) 4%, transparent)' }}>
              <div className="compact-progress-track">
                <div className="compact-progress-fill" style={{ width: '30%', background: 'linear-gradient(90deg, var(--accent), #8b5cf6)', animation: 'planningProgressPulse 2s ease-in-out infinite' }} />
              </div>
              <span className="compact-progress-text compact-progress-planning">
                <Loader2 size={12} className="planning-stream-spin" />
                {planningPhase === 'thinking' && '正在理解需求...'}
                {planningPhase === 'planning' && '正在规划页面结构...'}
                {planningPhase === 'detailing' && `已发现 ${planningDiscoveredPages.length} 个页面，细化中...`}
                {!planningPhase && '正在启动规划...'}
                {planningDiscoveredPages.length > 0 && (
                  <span style={{ marginLeft: 6, opacity: 0.6 }}>{planningDiscoveredPages.map(p => p.name).join(' · ')}</span>
                )}
              </span>
              {onCancelGeneration && (
                <button className="compact-progress-cancel" onClick={onCancelGeneration} title="取消规划">
                  <XCircle size={13} />取消
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
                    <div className="export-dropdown export-dropdown-right">
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

          {/* Page navigation */}
          {(pages.filter((p) => p?.html).length > 1 || (isGenerating && plannedPages && plannedPages.length > 1)) && (
            <div className="page-nav">
              {(plannedPages || pages).map((page, i) => {
                if (!page) return null;
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
                    title={page.description || page.name}>
                    <span className="page-nav-name">{page.name}</span>
                    {isDone && <CheckCircle2 size={11} className="page-nav-done" />}
                    {pageData?.error && <AlertCircle size={12} className="page-nav-error" />}
                  </button>
                );
              })}
              {!isGenerating && generatedHtml && (
                <button className="page-nav-regenerate"
                  onClick={onRegeneratePage}
                  disabled={isRegenerating}
                  title="重新生成此页面">
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
            ) : showPlanningView ? (
              <PlanningAnalysisView
                phase={planningPhase}
                discoveredPages={planningDiscoveredPages}
                streamText={planningStreamText}
              />
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
                <iframe ref={iframeRef} title="原型预览" srcDoc={previewHtml}
                  sandbox="allow-scripts allow-same-origin" aria-label="HTML原型预览区域" />
              </div>
            ) : (
              <EmptyState />
            )}
          </div>

          {/* Refine panel */}
          {previewHtml && !isGenerating && refinePanel}
        </>
      )}

      {/* Empty state when no plan and no prototype */}
      {!showPlanMode && !showPrototypeMode && <EmptyState />}
      {rightViewMode === 'plan' && !isGenerating && !currentWireframeHtml && plannedPages?.length > 0 && (
        <div className="preview-frame-container">
          <div className="empty-state">
            <Layers size={36} style={{ color: 'var(--fg-muted)', opacity: 0.5 }} />
            <h2 className="empty-state-title">方案详情</h2>
            <p className="empty-state-desc">请在左侧确认方案后开始生成原型。</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanningAnalysisView({ phase, discoveredPages, streamText }) {
  const streamEndRef = useRef(null);
  const [showRawDetail, setShowRawDetail] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [thoughtIndex, setThoughtIndex] = useState(0);

  // Elapsed timer
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Rotate thinking thoughts
  useEffect(() => {
    const t = setInterval(() => setThoughtIndex(i => i + 1), 2800);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll stream text
  useEffect(() => {
    if (streamEndRef.current) {
      streamEndRef.current.scrollTop = streamEndRef.current.scrollHeight;
    }
  }, [streamText]);

  const phaseConfig = {
    thinking: { label: '理解需求', icon: Brain, color: '#8b5cf6', desc: '正在分析产品需求和用户场景...' },
    planning: { label: '规划结构', icon: Route, color: '#3b82f6', desc: '正在设计页面架构和导航关系...' },
    detailing: { label: '细化方案', icon: FileText, color: '#10b981', desc: '正在完善每个页面的区块和交互细节...' },
    complete: { label: '规划完成', icon: CheckCircle2, color: '#22c55e', desc: '方案已就绪，即将开始生成...' },
  };

  const currentPhase = phaseConfig[phase] || phaseConfig.thinking;
  const PhaseIcon = currentPhase.icon;
  const phaseOrder = ['thinking', 'planning', 'detailing', 'complete'];
  const currentIdx = phaseOrder.indexOf(phase);

  // Thinking thoughts — rotate based on phase
  const thinkingThoughts = {
    thinking: ['正在理解需求描述中的关键词...', '分析目标用户和使用场景...', '识别核心功能和交互模式...', '评估内容结构和信息层级...'],
    planning: ['设计最优页面架构...', '规划导航关系和用户流程...', '确定页面之间的跳转逻辑...', '构建响应式布局方案...'],
    detailing: ['细化页面区块和组件...', '设计交互细节和状态变化...', '优化视觉层次和排版...', '完善每个页面的功能描述...'],
    complete: ['方案验证通过...', '准备开始生成原型...'],
  };
  const thoughts = thinkingThoughts[phase] || thinkingThoughts.thinking;
  const currentThought = thoughts[thoughtIndex % thoughts.length];

  const readableLines = extractReadableInsights(streamText, discoveredPages);

  return (
    <div className="planning-view" data-component="Planning Analysis View">
      {/* Ambient background glow */}
      <div className="planning-ambient" style={{ '--phase-color': currentPhase.color }} />

      {/* Hero header with orbital icon */}
      <div className="planning-hero">
        <div className="planning-orbital-container">
          <PhaseIcon size={28} className="planning-hero-icon" style={{ color: currentPhase.color }} />
          <div className="planning-orbital-ring ring-1"><span className="orbital-dot" /></div>
          <div className="planning-orbital-ring ring-2"><span className="orbital-dot" /></div>
          <div className="planning-orbital-ring ring-3"><span className="orbital-dot" /><span className="orbital-dot opposite" /></div>
          <div className="planning-hero-glow" style={{ background: currentPhase.color }} />
        </div>
        <div className="planning-hero-text">
          <h3 className="planning-hero-title">AI 正在深度分析</h3>
          <p className="planning-hero-phase" style={{ color: currentPhase.color }}>{currentPhase.desc}</p>
          <p className="planning-hero-thought">{currentThought}</p>
        </div>
      </div>

      {/* Phase timeline with animated progress */}
      <div className="planning-timeline">
        {phaseOrder.slice(0, 3).map((p, i) => {
          const cfg = phaseConfig[p];
          const StepIcon = cfg.icon;
          const isActive = i === currentIdx;
          const isDone = i < currentIdx;
          return (
            <div key={p} className={`timeline-phase${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}>
              <div className="timeline-dot" style={{ '--dot-color': cfg.color }}>
                {isDone ? <CheckCircle2 size={13} /> : <StepIcon size={12} />}
              </div>
              <div className="timeline-info">
                <span className="timeline-label">{cfg.label}</span>
                {isActive && <span className="timeline-active-indicator">进行中</span>}
              </div>
              {i < 2 && (
                <div className="timeline-connector">
                  <div className={`timeline-connector-fill${isDone ? ' filled' : ''}`} style={{ '--fill-color': cfg.color }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Discovered pages — staggered entrance */}
      {discoveredPages.length > 0 && (
        <div className="planning-discovered">
          <div className="planning-discovered-header">
            <Layers size={14} />
            <span>已发现 {discoveredPages.length} 个页面</span>
            <span className="planning-discovered-badge">{discoveredPages.length}</span>
          </div>
          <div className="planning-discovered-list">
            {discoveredPages.map((page, i) => (
              <div key={`${page.name}-${i}`} className="discovered-card" style={{ animationDelay: `${i * 100}ms`, '--card-accent': phaseConfig[phase]?.color || '#3b82f6' }}>
                <div className="discovered-card-index">{i + 1}</div>
                <div className="discovered-card-body">
                  <span className="discovered-card-name">{page.name}</span>
                  {page.description && (
                    <span className="discovered-card-desc">{page.description}</span>
                  )}
                </div>
                {page.route && (
                  <span className="discovered-card-route">{page.route}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live thinking stream — auto-visible */}
      {readableLines.length > 0 && (
        <div className="planning-live-stream">
          <div className="planning-live-label">
            <span className="live-dot" />
            思考过程
          </div>
          <div className="planning-live-lines" ref={streamEndRef}>
            {readableLines.map((line, i) => (
              <div key={i} className={`planning-live-line${i === readableLines.length - 1 ? ' latest' : ''}`}>
                <span className="live-line-marker">›</span>
                {line}
                {i === readableLines.length - 1 && <span className="typing-cursor">|</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapsible raw detail for advanced users */}
      {streamText && (
        <div className="planning-raw-toggle-section">
          <button
            className="planning-stream-toggle"
            onClick={() => setShowRawDetail(v => !v)}
          >
            <Loader2 size={13} className="planning-stream-spin" />
            <span>{showRawDetail ? '收起原始输出' : '查看原始数据流'}</span>
          </button>
          {showRawDetail && (
            <pre className="planning-stream-raw">{streamText.slice(-3000)}</pre>
          )}
        </div>
      )}

      {/* Footer with elapsed time */}
      <div className="planning-footer-enhanced">
        <div className="planning-elapsed">
          <span className="elapsed-dot" />
          已用时 {elapsed}s
        </div>
        <span className="planning-hint-text">规划通常需要 10-30 秒，取决于项目复杂度</span>
      </div>
    </div>
  );
}

/**
 * Extract readable insights from raw JSON streaming text.
 * Only extracts platform info; page names come from the correctly parsed
 * `discoveredPages` prop (parsePartialPlan already handles nesting).
 */
function extractReadableInsights(text, discoveredPages) {
  if (!text || text.length < 10) return [];
  const lines = [];
  const seen = new Set();

  // Extract platform
  const platformMatch = text.match(/"platform"\s*:\s*"(mobile|pc)"/);
  if (platformMatch && !seen.has('platform')) {
    seen.add('platform');
    lines.push(platformMatch[1] === 'mobile' ? '📱 目标平台：移动端' : '🖥️ 目标平台：PC端');
  }

  // Use correctly parsed page data from props (not raw regex)
  if (discoveredPages && discoveredPages.length > 0) {
    for (const page of discoveredPages) {
      if (seen.has(`page-${page.name}`)) continue;
      seen.add(`page-${page.name}`);

      let line = `📄 ${page.name}`;
      if (page.description) line += ` — ${page.description}`;
      if (page.route) line += `  (${page.route})`;
      lines.push(line);
    }
  }

  return lines.slice(0, 20); // Limit to avoid overwhelming
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
