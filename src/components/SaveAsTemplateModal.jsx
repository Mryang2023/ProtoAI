import { useState, useRef, useEffect } from 'react';
import { X, BookmarkPlus, Star, ChevronDown } from 'lucide-react';

const CUSTOM_TEMPLATES_KEY = 'protoai_custom_templates';

// ── localStorage helpers ─────────────────────────────────
export function loadCustomTemplates() {
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomTemplates(templates) {
  try {
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
    return true;
  } catch (e) {
    console.warn('Failed to save custom templates:', e);
    return false;
  }
}

// ── Category options ─────────────────────────────────────
const CATEGORY_OPTIONS = [
  { key: '电商/商城', label: '电商/商城' },
  { key: 'SaaS/后台', label: 'SaaS/后台' },
  { key: '社交/内容', label: '社交/内容' },
  { key: '教育/培训', label: '教育/培训' },
  { key: '企业/官网', label: '企业/官网' },
  { key: '金融/理财', label: '金融/理财' },
  { key: '餐饮/美食', label: '餐饮/美食' },
  { key: '医疗/健康', label: '医疗/健康' },
  { key: '旅游/出行', label: '旅游/出行' },
  { key: '房产/家居', label: '房产/家居' },
  { key: '自定义', label: '自定义' },
];

// ── Component ────────────────────────────────────────────
export default function SaveAsTemplateModal({ onSave, onClose, defaultContent = '' }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('自定义');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [templateType, setTemplateType] = useState('project'); // 'project' | 'page'
  const inputRef = useRef(null);

  // Focus name field on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // ESC to close
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 6) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
    if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const template = {
      id: 'custom-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      description: description.trim() || name.trim(),
      category: category,
      type: templateType,
      tags: tags.length > 0 ? tags : [category],
      prompt: defaultContent,
      icon: 'BookmarkPlus',
      createdAt: Date.now(),
    };

    if (templateType === 'project') {
      // Estimate page count from prompt
      const lines = defaultContent.split('\n');
      let count = 0;
      for (const line of lines) {
        if (/^\s*\d+\.\s+/.test(line)) count++;
      }
      template.pageCount = count || 1;
    }

    onSave(template);
    onClose();
  };

  return (
    <div className="sat-overlay" onClick={onClose}>
      <div className="sat-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sat-header">
          <div className="sat-header-left">
            <div className="sat-header-icon">
              <Star size={18} />
            </div>
            <h3 className="sat-title">保存为模板</h3>
          </div>
          <button className="sat-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="sat-body">
          {/* Name */}
          <div className="sat-field">
            <label className="sat-label">模板名称</label>
            <input
              ref={inputRef}
              className="sat-input"
              type="text"
              placeholder="例如：电商后台管理系统"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={40}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
            />
          </div>

          {/* Description */}
          <div className="sat-field">
            <label className="sat-label">
              描述
              <span className="sat-optional">(可选)</span>
            </label>
            <textarea
              className="sat-textarea"
              placeholder="简要描述这个模板的用途和特点..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Type */}
          <div className="sat-field">
            <label className="sat-label">模板类型</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className={`tl-type-btn${templateType === 'project' ? ' active' : ''}`}
                onClick={() => setTemplateType('project')}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                完整项目
              </button>
              <button
                className={`tl-type-btn${templateType === 'page' ? ' active' : ''}`}
                onClick={() => setTemplateType('page')}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                单页面
              </button>
            </div>
          </div>

          {/* Category */}
          <div className="sat-field">
            <label className="sat-label">分类</label>
            <select
              className="sat-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="sat-field">
            <label className="sat-label">
              标签
              <span className="sat-optional">(回车添加，最多6个)</span>
            </label>
            <div className="sat-tags-input">
              {tags.map(tag => (
                <span key={tag} className="sat-tag-chip">
                  {tag}
                  <button className="sat-tag-remove" onClick={() => handleRemoveTag(tag)}>
                    <X size={10} />
                  </button>
                </span>
              ))}
              <input
                className="sat-tags-input-field"
                type="text"
                placeholder={tags.length === 0 ? '输入标签后回车...' : ''}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={handleAddTag}
              />
            </div>
          </div>

          {/* Preview hint */}
          <div className="sat-hint">
            模板将保存当前的生成指令，方便以后一键复用。
          </div>
        </div>

        {/* Footer */}
        <div className="sat-footer">
          <button className="sat-cancel-btn" onClick={onClose}>取消</button>
          <button
            className="sat-save-btn"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            <BookmarkPlus size={14} />
            保存模板
          </button>
        </div>
      </div>
    </div>
  );
}
