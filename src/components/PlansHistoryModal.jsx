import { useState, useRef, useEffect, useMemo } from 'react';
import {
  X, Play, Trash2, Check, Layers, Clock, Search, Monitor, Smartphone,
  Copy, Pencil, ChevronDown, ChevronRight, SortAsc, Filter, Eye,
  LayoutGrid, List, ArrowUpDown, MoreHorizontal,
} from 'lucide-react';
import { generateAllWireframes } from './PlanPreview.jsx';

export default function PlansHistoryModal({
  savedPlans = [],
  loadedPlanId,
  onLoadPlan,
  onDeletePlan,
  onDuplicatePlan,
  onRenamePlan,
  onClose,
}) {
  const overlayRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all'); // all | pc | mobile
  const [sortBy, setSortBy] = useState('newest'); // newest | oldest | pages
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [wireframeCache, setWireframeCache] = useState({});
  const [viewStyle, setViewStyle] = useState('card'); // card | compact

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
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

  // Generate wireframe thumbnails for expanded plan
  const getWireframes = (plan) => {
    if (wireframeCache[plan.id]) return wireframeCache[plan.id];
    if (!plan.plannedPages?.length) return [];
    const htmls = generateAllWireframes(plan.plannedPages, plan.platform || 'pc');
    setWireframeCache((prev) => ({ ...prev, [plan.id]: htmls }));
    return htmls;
  };

  // Filter and sort plans
  const filteredPlans = useMemo(() => {
    let result = [...savedPlans];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => {
        if ((p.description || '').toLowerCase().includes(q)) return true;
        if (p.plannedPages?.some((pg) => (pg.name || '').toLowerCase().includes(q))) return true;
        if (p.selectedStyles?.some((s) => s.toLowerCase().includes(q))) return true;
        return false;
      });
    }

    // Platform filter
    if (platformFilter !== 'all') {
      result = result.filter((p) => (p.platform || 'pc') === platformFilter);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
        break;
      case 'oldest':
        result.sort((a, b) => (a.id || '').localeCompare(b.id || ''));
        break;
      case 'pages':
        result.sort((a, b) => (b.plannedPages?.length || 0) - (a.plannedPages?.length || 0));
        break;
    }

    return result;
  }, [savedPlans, searchQuery, platformFilter, sortBy]);

  // Stats
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

  const styleLabels = {
    business: '商务', minimal: '极简', colorful: '彩色', playful: '活泼',
    tech: '科技', editorial: '文艺', modern: '现代SaaS', elegant: '优雅高端', fintech: '金融科技',
  };

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal-content plans-history-modal">
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="phm-header-icon">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="modal-title" style={{ margin: 0, fontSize: 16 }}>历史方案</h2>
              <div className="phm-header-stats">
                <span>共 {totalPlans} 个方案</span>
                {pcCount > 0 && <span className="phm-stat-badge pc"><Monitor size={10} />{pcCount}</span>}
                {mobileCount > 0 && <span className="phm-stat-badge mobile"><Smartphone size={10} />{mobileCount}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button className={`btn btn-icon btn-sm ${viewStyle === 'card' ? 'active' : ''}`}
              onClick={() => setViewStyle('card')} title="卡片视图">
              <LayoutGrid size={14} />
            </button>
            <button className={`btn btn-icon btn-sm ${viewStyle === 'compact' ? 'active' : ''}`}
              onClick={() => setViewStyle('compact')} title="紧凑视图">
              <List size={14} />
            </button>
            <button className="btn btn-icon" onClick={onClose} aria-label="关闭">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar: Search + Filters + Sort */}
        {totalPlans > 0 && (
          <div className="phm-toolbar">
            <div className="phm-search">
              <Search size={14} style={{ color: 'var(--fg-muted)', flexShrink: 0 }} />
              <input
                type="text"
                className="phm-search-input"
                placeholder="搜索方案名称、页面名或风格..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="phm-search-clear" onClick={() => setSearchQuery('')}>
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="phm-filters">
              <div className="phm-filter-group">
                {[
                  { key: 'all', label: '全部' },
                  { key: 'pc', label: 'PC端', icon: Monitor },
                  { key: 'mobile', label: '移动端', icon: Smartphone },
                ].map((f) => (
                  <button
                    key={f.key}
                    className={`phm-filter-btn${platformFilter === f.key ? ' active' : ''}`}
                    onClick={() => setPlatformFilter(f.key)}
                  >
                    {f.icon && <f.icon size={12} />}
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="phm-sort">
                <ArrowUpDown size={12} style={{ color: 'var(--fg-muted)' }} />
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
        <div className="plans-history-body">
          {totalPlans === 0 ? (
            <div className="plans-history-empty">
              <div className="phm-empty-icon"><Clock size={36} /></div>
              <h3 className="phm-empty-title">暂无历史方案</h3>
              <p className="phm-empty-desc">每次规划方案后会自动保存到当前项目。<br/>你可以在这里查看、加载和管理所有历史方案。</p>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="plans-history-empty">
              <Search size={28} style={{ color: 'var(--fg-muted)', opacity: 0.4 }} />
              <p className="phm-empty-title" style={{ marginTop: 8 }}>未找到匹配的方案</p>
              <p className="phm-empty-desc">尝试修改搜索关键词或筛选条件</p>
            </div>
          ) : (
            <div className={`plans-history-list ${viewStyle}`}>
              {filteredPlans.map((plan) => {
                const isLoaded = loadedPlanId === plan.id;
                const isExpanded = expandedPlanId === plan.id;
                const isEditing = editingPlanId === plan.id;
                const wireframes = isExpanded ? getWireframes(plan) : [];
                const pageCount = plan.plannedPages?.length || 0;

                return (
                  <div
                    key={plan.id}
                    className={`plan-history-card${isLoaded ? ' loaded' : ''}${isExpanded ? ' expanded' : ''} ${viewStyle}`}
                  >
                    {/* Card header */}
                    <div className="plan-history-header" onClick={() => handleToggleExpand(plan.id)}>
                      <button className="phm-expand-toggle" aria-label={isExpanded ? '收起' : '展开'}>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>

                      <div className="plan-history-main">
                        {isEditing ? (
                          <div className="phm-rename-row">
                            <input
                              className="phm-rename-input"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmRename(); if (e.key === 'Escape') setEditingPlanId(null); }}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); handleConfirmRename(); }}>
                              <Check size={12} />
                            </button>
                            <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); setEditingPlanId(null); }}>
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="plan-history-title">{plan.description || '未命名方案'}</div>
                        )}

                        <div className="plan-history-meta">
                          <span className={`phm-platform-badge ${plan.platform === 'mobile' ? 'mobile' : 'pc'}`}>
                            {plan.platform === 'mobile' ? <Smartphone size={11} /> : <Monitor size={11} />}
                            {plan.platform === 'mobile' ? '移动端' : 'PC端'}
                          </span>
                          <span className="phm-meta-sep">·</span>
                          <span>{pageCount} 个页面</span>
                          {plan.timestamp && (
                            <>
                              <span className="phm-meta-sep">·</span>
                              <span className="phm-meta-time">{plan.timestamp}</span>
                            </>
                          )}
                          {isLoaded && (
                            <span className="phm-loaded-badge"><Check size={10} />当前</span>
                          )}
                        </div>

                        {/* Style tags */}
                        {plan.selectedStyles?.length > 0 && viewStyle === 'card' && (
                          <div className="plan-history-styles">
                            {plan.selectedStyles.map((s) => (
                              <span key={s} className="phm-style-tag">{styleLabels[s] || s}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="plan-history-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className={`btn btn-sm ${isLoaded ? 'btn-ghost' : 'btn-primary'}`}
                          onClick={() => onLoadPlan(plan)}
                          disabled={isLoaded}
                          title={isLoaded ? '当前方案' : '加载并在右侧查看线框预览'}
                        >
                          {isLoaded ? <><Check size={13} />已加载</> : <><Play size={13} />加载</>}
                        </button>
                        <div className="phm-more-actions">
                          <button className="btn btn-icon btn-sm" onClick={() => handleStartRename(plan)} title="重命名">
                            <Pencil size={13} />
                          </button>
                          <button className="btn btn-icon btn-sm" onClick={() => handleDuplicate(plan)} title="复制方案">
                            <Copy size={13} />
                          </button>
                          <button className="btn btn-icon btn-sm phm-delete-btn" onClick={() => onDeletePlan(plan.id)} title="删除">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && viewStyle === 'card' && (
                      <div className="plan-history-detail">
                        {/* Wireframe thumbnails */}
                        {wireframes.length > 0 && (
                          <div className="phm-wireframe-section">
                            <div className="phm-section-label">
                              <Eye size={12} />线框预览
                            </div>
                            <div className="phm-wireframe-grid">
                              {plan.plannedPages.map((page, i) => (
                                <div key={i} className="phm-wireframe-thumb">
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
                                      <div className="phm-thumb-placeholder">
                                        <span>{i + 1}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="phm-thumb-label">{page.name}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Page details */}
                        {plan.plannedPages?.length > 0 && (
                          <div className="phm-pages-detail">
                            <div className="phm-section-label">
                              <LayoutGrid size={12} />页面详情
                            </div>
                            <div className="phm-pages-accordion">
                              {plan.plannedPages.map((page, i) => (
                                <div key={i} className="phm-page-detail-item">
                                  <div className="phm-page-detail-header">
                                    <span className="phm-page-num">{i + 1}</span>
                                    <span className="phm-page-name">{page.name}</span>
                                    {page.description && <span className="phm-page-desc">{page.description}</span>}
                                  </div>
                                  {page.sections?.length > 0 && (
                                    <div className="phm-page-sections">
                                      {page.sections.map((sec, si) => (
                                        <div key={si} className="phm-section-item">
                                          <span className="phm-section-name">{sec.name}</span>
                                          {sec.elements?.length > 0 && (
                                            <div className="phm-section-elements">
                                              {sec.elements.map((el, ei) => (
                                                <span key={ei} className="phm-element-tag">{el}</span>
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
                                        <span key={ii} className="phm-interaction-item">→ {inter}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Style spec preview */}
                        {plan.styleSpec && (
                          <div className="phm-style-spec-section">
                            <div className="phm-section-label">设计规范</div>
                            <div className="phm-style-spec-preview">{plan.styleSpec.slice(0, 200)}{plan.styleSpec.length > 200 ? '...' : ''}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Compact expanded */}
                    {isExpanded && viewStyle === 'compact' && (
                      <div className="plan-history-detail compact">
                        <div className="phm-compact-pages">
                          {plan.plannedPages?.map((page, i) => (
                            <div key={i} className="phm-compact-page">
                              <span className="phm-compact-num">{i + 1}</span>
                              <span className="phm-compact-name">{page.name}</span>
                              <span className="phm-compact-desc">{page.description || ''}</span>
                            </div>
                          ))}
                        </div>
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
            <span className="phm-footer-hint">点击方案卡片展开查看详细线框预览和页面结构</span>
          </div>
        )}
      </div>
    </div>
  );
}
