import { X, RotateCcw, Download, FileText } from 'lucide-react';

export default function VersionHistory({ history, currentHistoryId, onRestore, onExport, onClose }) {
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer" data-component="Version History" data-od-id="version-history" role="dialog" aria-labelledby="version-title">
        <div className="drawer-header">
          <h2 className="drawer-title" id="version-title">生成历史</h2>
          <button className="btn btn-icon" onClick={onClose} aria-label="关闭历史记录">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--sp-10) var(--sp-4)', color: 'var(--fg-muted)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)' }}>
              尚无历史记录。每次生成原型后会自动保存到此处，你可以随时查看、恢复或导出。
            </div>
          ) : (
            history.map((entry) => (
              <div key={entry.id} className={`version-item${entry.id === currentHistoryId ? ' current' : ''}`}>
                <div className="version-item-header">
                  <span className="version-item-time">{entry.timestamp}</span>
                  {entry.id === currentHistoryId && <span className="version-item-badge">当前</span>}
                </div>
                <p className="version-item-desc">{entry.description || '未命名生成'}</p>
                <div className="version-item-meta">
                  <span className="version-item-pages">
                    <FileText size={12} />
                    {entry.pageCount || (entry.pages ? entry.pages.length : 0)} 个页面
                  </span>
                  {entry.styles && entry.styles.length > 0 && (
                    <div className="version-item-tags">
                      {entry.styles.map((s) => <span key={s} className="version-tag">{s}</span>)}
                    </div>
                  )}
                </div>

                <div className="version-actions">
                  {entry.id !== currentHistoryId && (
                    <button className="btn btn-sm" onClick={() => onRestore(entry)} aria-label={`恢复到 ${entry.timestamp}`}>
                      <RotateCcw size={12} />恢复
                    </button>
                  )}
                  <button className="btn btn-sm" onClick={() => onExport(entry, 'zip')} aria-label={`导出 ${entry.timestamp}`}>
                    <Download size={12} />导出
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
