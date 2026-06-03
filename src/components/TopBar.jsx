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
} from 'lucide-react';

export default function TopBar({
  projectName,
  onProjectNameChange,
  onOpenSettings,
  onOpenHistory,
  onExport,
  onExportAll,
  hasMultiplePages,
  theme,
  onToggleTheme,
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExportMenu]);

  const handleExportCurrent = () => {
    onExport();
    setShowExportMenu(false);
  };

  const handleExportAll = () => {
    onExportAll();
    setShowExportMenu(false);
  };

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
        <input
          className="topbar-project"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          placeholder="未命名项目"
          aria-label="项目名称"
        />
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
                  <span>导出当前页</span>
                </button>
                <button className="export-dropdown-item" onClick={handleExportAll}>
                  <Archive size={15} />
                  <span>导出全部页面 (ZIP)</span>
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
