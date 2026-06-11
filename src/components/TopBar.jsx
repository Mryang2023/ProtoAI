import { useState, useRef, useEffect } from 'react';
import {
  Settings,
  History,
  Download,
  FileDown,
  Archive,
  Sparkles,
  Moon,
  Sun,
  ChevronDown,
  Plus,
  FolderOpen,
  Check,
  Layers,
  QrCode,
  Layout,
  Code2,
} from 'lucide-react';

export default function TopBar({
  projectName,
  onProjectNameChange,
  projects,
  activeProjectId,
  onSwitchProject,
  onCreateProject,
  onOpenSettings,
  onOpenHistory,
  onOpenPlansHistory,
  onExport,
  onExportAll,
  onExportAsReact,
  onExportAsTailwind,
  onExportClean,
  onOpenQrPreview,
  onOpenTemplateLibrary,
  hasMultiplePages,
  theme,
  onToggleTheme,
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const exportRef = useRef(null);
  const projectRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!showExportMenu && !showProjectMenu) return;
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setShowExportMenu(false);
      if (projectRef.current && !projectRef.current.contains(e.target)) setShowProjectMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExportMenu, showProjectMenu]);

  const handleExportCurrent = () => { onExport(); setShowExportMenu(false); };
  const handleExportAll = () => { onExportAll(); setShowExportMenu(false); };
  const handleExportReact = () => { onExportAsReact?.(); setShowExportMenu(false); };
  const handleExportTailwind = () => { onExportAsTailwind?.(); setShowExportMenu(false); };
  const handleExportClean = () => { onExportClean?.(); setShowExportMenu(false); };

  const handleSwitchProject = (id) => {
    onSwitchProject(id);
    setShowProjectMenu(false);
  };

  const handleCreateProject = () => {
    onCreateProject();
    setShowProjectMenu(false);
  };

  const projectList = projects ? Object.values(projects) : [];

  return (
    <header className="topbar" data-component="Top Bar" data-od-id="topbar">
      <div className="topbar-left">
        <div className="topbar-logo">
          <div className="topbar-logo-mark">
            <Sparkles size={16} />
          </div>
          <span className="topbar-logo-text">ProtoAI</span>
        </div>
        <div className="topbar-divider" />

        {/* Project switcher */}
        <div ref={projectRef} style={{ position: 'relative' }}>
          <button
            className="topbar-project-switcher"
            onClick={() => setShowProjectMenu((v) => !v)}
            aria-label="切换项目"
            aria-expanded={showProjectMenu}
          >
            <FolderOpen size={14} style={{ flexShrink: 0, color: 'var(--fg-muted)' }} />
            <span className="topbar-project-name">{projectName || '未命名项目'}</span>
            <ChevronDown size={12} style={{
              flexShrink: 0,
              color: 'var(--fg-muted)',
              transform: showProjectMenu ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform .15s',
            }} />
          </button>

          {showProjectMenu && (
            <div className="project-dropdown">
              {projectList.length > 0 && (
                <div className="project-dropdown-section">
                  <span className="project-dropdown-label">我的项目</span>
                  {projectList.map((p) => (
                    <button
                      key={p.id}
                      className={`project-dropdown-item${p.id === activeProjectId ? ' active' : ''}`}
                      onClick={() => handleSwitchProject(p.id)}
                    >
                      <FolderOpen size={14} />
                      <span className="project-dropdown-item-name">{p.name || '未命名项目'}</span>
                      <span className="project-dropdown-item-meta">
                        {p.history?.length || 0} 次生成
                      </span>
                      {p.id === activeProjectId && <Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                    </button>
                  ))}
                </div>
              )}
              <div className="project-dropdown-section">
                <button className="project-dropdown-item new-project" onClick={handleCreateProject}>
                  <Plus size={14} />
                  <span>新建项目</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="topbar-right">
        <button
          className="btn btn-icon"
          onClick={onToggleTheme}
          title={theme === 'dark' ? '切换亮色模式' : '切换暗色模式'}
          aria-label="切换主题"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          className="btn btn-icon"
          onClick={onOpenPlansHistory}
          title="历史方案"
          aria-label="历史方案"
        >
          <Layers size={18} />
        </button>
        <button
          className="btn btn-icon"
          onClick={onOpenHistory}
          title="版本历史"
          aria-label="版本历史"
        >
          <History size={18} />
        </button>

        {/* Export button with optional dropdown */}
        {hasMultiplePages ? (
          <div className="export-btn-group" ref={exportRef}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowExportMenu((v) => !v)}
              title="导出原型"
              aria-label="导出原型"
              aria-expanded={showExportMenu}
            >
              <Download size={15} />
              导出
              <ChevronDown size={12} />
            </button>
            {showExportMenu && (
              <div className="export-dropdown" data-component="Export Menu" data-od-id="export-menu">
                <button className="export-dropdown-item" onClick={handleExportCurrent}>
                  <FileDown size={15} />
                  <span>导出当前页 HTML</span>
                </button>
                <button className="export-dropdown-item" onClick={handleExportAll}>
                  <Archive size={15} />
                  <span>导出全部页面 (ZIP)</span>
                </button>
                <div style={{ height: 1, background: 'var(--border-color, #e5e7eb)', margin: '4px 0' }} />
                <button className="export-dropdown-item" onClick={handleExportReact}>
                  <Code2 size={15} />
                  <span>导出为 React 组件</span>
                </button>
                <button className="export-dropdown-item" onClick={handleExportTailwind}>
                  <Layout size={15} />
                  <span>导出为 Tailwind HTML</span>
                </button>
                <button className="export-dropdown-item" onClick={handleExportClean}>
                  <FileDown size={15} />
                  <span>导出纯净 HTML（无导航栏）</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="btn btn-ghost btn-sm"
            onClick={onExport}
            title="导出HTML"
            aria-label="导出HTML文件"
          >
            <Download size={15} />
            导出
          </button>
        )}

        {onOpenQrPreview && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={onOpenQrPreview}
            title="手机扫码预览"
            aria-label="手机扫码预览"
          >
            <QrCode size={15} />
          </button>
        )}

        {onOpenTemplateLibrary && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={onOpenTemplateLibrary}
            title="页面模板库"
            aria-label="页面模板库"
          >
            <Layout size={15} />
            模板
          </button>
        )}

        <button
          className="btn btn-ghost btn-sm"
          onClick={onOpenSettings}
          title="AI模型设置"
          aria-label="AI模型设置"
        >
          <Settings size={15} />
          设置
        </button>
      </div>
    </header>
  );
}
