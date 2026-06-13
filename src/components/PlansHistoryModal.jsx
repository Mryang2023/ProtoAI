import { useState, useRef, useEffect, useMemo } from 'react';
import {
  X, Play, Trash2, Check, Layers, Clock, Search, Monitor, Smartphone,
  Copy, Pencil, ChevronDown, ChevronRight, SortAsc, Filter, Eye,
  LayoutGrid, List, ArrowUpDown, MoreHorizontal, Sparkles,
  Palette, FileCode, Zap, RotateCcw, RefreshCw, Settings2,
} from 'lucide-react';
import { generateAllWireframes } from './PlanPreview.jsx';

const styleLabels = {
  business: '商务', minimal: '极简', colorful: '彩色', playful: '活泼',
  tech: '科技', editorial: '文艺', modern: '现代SaaS', elegant: '优雅高端', fintech: '金融科技',
};

const styleColors = {
  business: { bg: '#eff6ff', fg: '#2563eb', border: '#bfdbfe' },
  minimal: { bg: '#f5f5f5', fg: '#525252', border: '#d4d4d4' },
  colorful: { bg: '#fef3c7', fg: '#b45309', border: '#fcd34d' },
  playful: { bg: '#fff7ed', fg: '#ea580c', border: '#fed7aa' },
  tech: { bg: '#f0fdf4', fg: '#16a34a', border: '#bbf7d0' },
  editorial: { bg: '#faf5ff', fg: '#7c3aed', border: '#ddd6fe' },
  modern: { bg: '#eef2ff', fg: '#4f46e5', border: '#c7d2fe' },
  elegant: { bg: '#fefce8', fg: '#a16207', border: '#fde68a' },
  fintech: { bg: '#ecfeff', fg: '#0891b2', border: '#a5f3fc' },
};

export default function PlansHistoryModal({
  savedPlans = [],
  loadedPlanId,
  onLoadPlan,
  onDeletePlan,
  onDuplicatePlan,
  onRenamePlan,
  onRegenerateFromPlan,
  onAdjustPlan,
  onClose,
}) {
  const overlayRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [wireframeCache, setWireframeCache] = useState({});
  const [viewStyle, setViewStyle] = useState('card');
  const [hoveredPlanId, setHoveredPlanId] = useState(null);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (editingPlanId) setEditingPlanId(null);
        else onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, editingPlanId]);

  const getWireframes = (plan) => {
    if (wireframeCache[plan.id]) return wireframeCache[plan.id];
    if (!plan.plannedPages?.length) return [];
    const htmls = generateAllWireframes(plan.plannedPages, plan.platform || 'pc');
    setWireframeCache((prev) => ({ ...prev, [plan.id]: htmls }));
    return htmls;
  };

  const filteredPlans = useMemo(() => {
    let result = [...savedPlans];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => {
        if ((p.description || '').toLowerCase().includes(q)) return true;
        if (p.plannedPages?.some((pg) => (pg.name || '').toLowerCase().includes(q))) return true;
        if (p.selectedStyles?.some((s) => s.toLowerCase().includes(q))) return true;
        return false;
      });
    }
    if (platformFilter !== 'all') {
      result = result.filter((p) => (p.platform || 'pc') === platformFilter);
    }
    switch (sortBy) {
      case 'newest': result.sort((a, b) => (b.id || '').localeCompare(a.id || '')); break;
      case 'oldest': result.sort((a, b) => (a.id || '').localeCompare(b.id || '')); break;
      case 'pages': result.sort((a, b) => (b.plannedPages?.length || 0) - (a.plannedPages?.length || 0)); break;
    }
    return result;
  }, [savedPlans, searchQuery, platformFilter, sortBy]);

  const totalPlans = savedPlans.length;
  const pcCount = savedPlans.filter((p) => (p.platform || 'pc') === 'pc').length;
  const mobileCount = savedPlans.filter((p) => p.platform === 'mobile').length;

  const handleToggleExpand = (planId) => {
    setExpandedPlanId((prev) => (prev === planId ? null : planId));
  };

  const handleStartRename = (plan) => {
    setEditingPlanId(plan.id);
    setEditingName(plan.description || '');
  };

  const handleConfirmRename = () => {
    if (editingPlanId && onRenamePlan) {
      onRenamePlan(editingPlanId, editingName.trim());
    }
    setEditingPlanId(null);
  };

  const handleDuplicate = (plan) => {
    if (onDuplicatePlan) onDuplicatePlan(plan);
  };

  // Get primary style color for a plan
  const getPlanAccent = (plan) => {
    const style = plan.selectedStyles?.[0] || 'business';
    return styleColors[style] || styleColors.business;
  };

  return (
    <div className="modal-overlay phm-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal-content phm-modal">
        {/* Header */}
        <div className="phm-header">
          <div className="phm-header-left">
            <div className="phm-header-icon">
              <Layers size={20} />
            </div>
            <div className="phm-header-text">
              <h2 className="phm-header-title">历史方案</h2>
              <div className="phm-header-subtitle">
                <span className="phm-subtitle-count">{totalPlans} 个方案</span>
                {pcCount > 0 && (
                  <span className="phm-subtitle-chip pc">
                    <Monitor size={10} />{pcCount}
                  </span>
                )}
                {mobileCount > 0 && (
                  <span className="phm-subtitle-chip mobile">
                    <Smartphone size={10} />{mobileCount}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="phm-header-right">
            <div className="phm-view-toggle">
              <button
                className={`phm-toggle-btn${viewStyle === 'card' ? ' active' : ''}`}
                onClick={() => setViewStyle('card')}
                title="卡片视图"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                className={`phm-toggle-btn${viewStyle === 'compact' ? ' active' : ''}`}
                onClick={() => setViewStyle('compact')}
                title="紧凑视图"
              >
                <List size={14} />
              </button>
            </div>
            <button className="phm-close-btn" onClick={onClose} aria-label="关闭">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        {totalPlans > 0 && (
          <div className="phm-toolbar">
            <div className="phm-search-wrap">
              <Search size={15} className="phm-search-icon" />
              <input
                type="text"
                className="phm-search-input"
                placeholder="搜索方案名称、页面名或风格..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="phm-search-clear" onClick={() => setSearchQuery('')}>
                  <X size={13} />
                </button>
              )}
            </div>
            <div className="phm-toolbar-row">
              <div className="phm-platform-tabs">
                {[
                  { key: 'all', label: '全部', count: totalPlans },
                  { key: 'pc', label: 'PC端', count: pcCount, icon: Monitor },
                  { key: 'mobile', label: '移动端', count: mobileCount, icon: Smartphone },
                ].map((f) => (
                  <button
                    key={f.key}
                    className={`phm-platform-tab${platformFilter === f.key ? ' active' : ''}`}
                    onClick={() => setPlatformFilter(f.key)}
                  >
                    {f.icon && <f.icon size={12} />}
                    <span>{f.label}</span>
                    {f.count > 0 && <span className="phm-tab-count">{f.count}</span>}
                  </button>
                ))}
              </div>
              <div className="phm-sort-wrap">
                <ArrowUpDown size={12} className="phm-sort-icon" />
                <select
                  className="phm-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">最新优先</option>
                  <option value="oldest">最早优先</option>
                  <option value="pages">页面数最多</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="phm-body">
          {totalPlans === 0 ? (
            <div className="phm-empty">
              <div className="phm-empty-visual">
                <div className="phm-empty-circle" />
                <Clock size={32} className="phm-empty-icon" />
              </div>
              <h3 className="phm-empty-title">暂无历史方案</h3>
              <p className="phm-empty-desc">每次规划方案后会自动保存到当前项目<br />你可以在这里查看、加载和管理所有历史方案</p>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="phm-empty">
              <div className="phm-empty-visual">
                <div className="phm-empty-circle" />
                <Search size={28} className="phm-empty-icon" />
              </div>
              <h3 className="phm-empty-title">未找到匹配的方案</h3>
              <p className="phm-empty-desc">尝试修改搜索关键词或筛选条件</p>
            </div>
          ) : (
            <div className={`phm-list ${viewStyle}`}>
              {filteredPlans.map((plan) => {
                const isLoaded = loadedPlanId === plan.id;
                const isExpanded = expandedPlanId === plan.id;
                const isEditing = editingPlanId === plan.id;
                const isHovered = hoveredPlanId === plan.id;
                const wireframes = isExpanded ? getWireframes(plan) : [];
                const pageCount = plan.plannedPages?.length || 0;
                const accent = getPlanAccent(plan);

                return (
                  <div
                    key={plan.id}
                    className={`phm-card${isLoaded ? ' loaded' : ''}${isExpanded ? ' expanded' : ''} ${viewStyle}`}
                    onMouseEnter={() => setHoveredPlanId(plan.id)}
                    onMouseLeave={() => setHoveredPlanId(null)}
                    style={{ '--plan-accent': accent.fg, '--plan-accent-bg': accent.bg, '--plan-accent-border': accent.border }}
                  >
                    {/* Accent strip */}
                    <div className="phm-card-accent" />

                    {/* Card header row */}
                    <div className="phm-card-header" onClick={() => handleToggleExpand(plan.id)}>
                      {/* Expand toggle */}
                      <div className="phm-card-expand">
                        <div className={`phm-expand-icon${isExpanded ? ' rotated' : ''}`}>
                          <ChevronRight size={16} />
                        </div>
                      </div>

                      {/* Main info */}
                      <div className="phm-card-info">
                        {isEditing ? (
                          <div className="phm-rename-inline">
                            <input
                              className="phm-rename-field"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmRename(); if (e.key === 'Escape') setEditingPlanId(null); }}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button className="phm-rename-ok" onClick={(e) => { e.stopPropagation(); handleConfirmRename(); }}>
                              <Check size={13} />
                            </button>
                            <button className="phm-rename-cancel" onClick={(e) => { e.stopPropagation(); setEditingPlanId(null); }}>
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="phm-card-title-row">
                              <span className="phm-card-title">{plan.description || '未命名方案'}</span>
                              {isLoaded && <span className="phm-active-badge">当前方案</span>}
                            </div>
                            <div className="phm-card-meta">
                              <span className={`phm-badge ${plan.platform === 'mobile' ? 'mobile' : 'pc'}`}>
                                {plan.platform === 'mobile' ? <Smartphone size={10} /> : <Monitor size={10} />}
                                {plan.platform === 'mobile' ? '移动端' : 'PC端'}
                              </span>
                              <span className="phm-meta-dot" />
                              <span className="phm-meta-text">{pageCount} 页面</span>
                              {plan.generatedPages?.length > 0 && (
                                <>
                                  <span className="phm-meta-dot" />
                                  <span className="phm-meta-text" style={{ color: 'var(--success)' }}>
                                    <Check size={9} style={{ marginRight: 2 }} />
                                    {plan.generatedPages.filter(p => p?.html).length} 页已生成
                                  </span>
                                </>
                              )}
                              {plan.timestamp && (
                                <>
                                  <span className="phm-meta-dot" />
                                  <span className="phm-meta-text muted">{plan.timestamp}</span>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Style pills */}
                      {plan.selectedStyles?.length > 0 && viewStyle === 'card' && (
                        <div className="phm-style-pills" onClick={(e) => e.stopPropagation()}>
                          {plan.selectedStyles.slice(0, 3).map((s) => {
                            const c = styleColors[s] || styleColors.business;
                            return (
                              <span
                                key={s}
                                className="phm-style-pill"
                                style={{ background: c.bg, color: c.fg, borderColor: c.border }}
                              >
                                {styleLabels[s] || s}
                              </span>
                            );
                          })}
                          {plan.selectedStyles.length > 3 && (
                            <span className="phm-style-pill more">+{plan.selectedStyles.length - 3}</span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className={`phm-card-actions${isHovered || isExpanded ? ' visible' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <button
                          className={`phm-action-btn primary${isLoaded ? ' loaded' : ''}`}
                          onClick={() => onLoadPlan(plan)}
                          disabled={isLoaded}
                          title={isLoaded ? '当前方案' : '加载方案'}
                        >
                          {isLoaded ? <><Check size={13} />已加载</> : <><Play size={13} />加载</>}
                        </button>
                        {plan.generatedPages?.length > 0 && (
                          <button
                            className="phm-action-icon"
                            onClick={() => onRegenerateFromPlan?.(plan)}
                            title="根据此方案重新生成原型"
                          >
                            <RefreshCw size={13} />
                          </button>
                        )}
                        <button
                          className="phm-action-icon"
                          onClick={() => onAdjustPlan?.(plan)}
                          title="加载并调整此方案"
                        >
                          <Settings2 size={13} />
                        </button>
                        <button className="phm-action-icon" onClick={() => handleStartRename(plan)} title="重命名">
                          <Pencil size={13} />
                        </button>
                        <button className="phm-action-icon" onClick={() => handleDuplicate(plan)} title="复制">
                          <Copy size={13} />
                        </button>
                        <button className="phm-action-icon danger" onClick={() => onDeletePlan(plan.id)} title="删除">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && viewStyle === 'card' && (
                      <div className="phm-card-detail">
                        {/* Wireframe thumbnails */}
                        {wireframes.length > 0 && (
                          <div className="phm-detail-section">
                            <div className="phm-detail-label">
                              <Eye size={12} />
                              <span>线框预览</span>
                              <span className="phm-detail-count">{wireframes.length} 页</span>
                            </div>
                            <div className="phm-thumb-grid">
                              {plan.plannedPages.map((page, i) => (
                                <div key={i} className="phm-thumb">
                                  <div className="phm-thumb-frame">
                                    {wireframes[i] ? (
                                      <iframe
                                        title={`缩略图: ${page.name}`}
                                        srcDoc={wireframes[i]}
                                        sandbox=""
                                        className="phm-thumb-iframe"
                                        tabIndex={-1}
                                      />
                                    ) : (
                                      <div className="phm-thumb-empty">
                                        <span>{i + 1}</span>
                                      </div>
                                    )}
                                  </div>
                                  <span className="phm-thumb-name">{page.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Page structure */}
                        {plan.plannedPages?.length > 0 && (
                          <div className="phm-detail-section">
                            <div className="phm-detail-label">
                              <FileCode size={12} />
                              <span>页面结构</span>
                            </div>
                            <div className="phm-pages">
                              {plan.plannedPages.map((page, i) => (
                                <div key={i} className="phm-page-row">
                                  <div className="phm-page-row-header">
                                    <span className="phm-page-idx">{i + 1}</span>
                                    <div className="phm-page-info">
                                      <span className="phm-page-name">{page.name}</span>
                                      {page.description && <span className="phm-page-desc">{page.description}</span>}
                                    </div>
                                    {page.route && <span className="phm-page-route">{page.route}</span>}
                                  </div>
                                  {page.sections?.length > 0 && (
                                    <div className="phm-page-blocks">
                                      {page.sections.map((sec, si) => (
                                        <div key={si} className="phm-block">
                                          <div className="phm-block-name">
                                            <span className="phm-block-dot" />
                                            {sec.name}
                                            {sec.elements?.length > 0 && (
                                              <span className="phm-block-count">{sec.elements.length}</span>
                                            )}
                                          </div>
                                          {sec.elements?.length > 0 && (
                                            <div className="phm-block-elements">
                                              {sec.elements.map((el, ei) => (
                                                <span key={ei} className="phm-el-tag">{el}</span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {page.interactions?.length > 0 && (
                                    <div className="phm-page-interactions">
                                      {page.interactions.map((inter, ii) => (
                                        <span key={ii} className="phm-interact">
                                          <Zap size={9} />{inter}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Style spec */}
                        {plan.styleSpec && (
                          <div className="phm-detail-section">
                            <div className="phm-detail-label">
                              <Palette size={12} />
                              <span>设计规范</span>
                            </div>
                            <div className="phm-spec-preview">
                              {plan.styleSpec.slice(0, 300)}{plan.styleSpec.length > 300 ? '...' : ''}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Compact expanded */}
                    {isExpanded && viewStyle === 'compact' && (
                      <div className="phm-card-detail compact">
                        {plan.plannedPages?.map((page, i) => (
                          <div key={i} className="phm-compact-row">
                            <span className="phm-compact-idx">{i + 1}</span>
                            <span className="phm-compact-name">{page.name}</span>
                            <span className="phm-compact-desc">{page.description || ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {totalPlans > 0 && (
          <div className="phm-footer">
            <Sparkles size={11} />
            <span>点击卡片展开查看线框预览和页面结构详情</span>
          </div>
        )}
      </div>
    </div>
  );
}
