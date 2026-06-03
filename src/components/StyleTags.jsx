import {
  Minus,
  Briefcase,
  Zap,
  Cpu,
  BookOpen,
} from 'lucide-react';

const STYLES = [
  { id: 'minimal', label: '极简', icon: Minus, desc: 'Minimal — 大量留白，简洁克制' },
  { id: 'business', label: '商务', icon: Briefcase, desc: 'Business — 专业稳重，结构清晰' },
  { id: 'playful', label: '活泼', icon: Zap, desc: 'Playful — 色彩鲜明，富有活力' },
  { id: 'tech', label: '科技', icon: Cpu, desc: 'Tech — 深色基调，技术感强' },
  { id: 'editorial', label: '文艺', icon: BookOpen, desc: 'Editorial — 衬线排版，阅读体验佳' },
];

export default function StyleTags({ selected, onToggle }) {
  return (
    <div className="style-tags" data-component="Style Tags" data-od-id="style-tags">
      {STYLES.map((s) => {
        const Icon = s.icon;
        const isSelected = selected.includes(s.id);
        return (
          <button
            key={s.id}
            className={`style-tag${isSelected ? ' selected' : ''}`}
            onClick={() => onToggle(s.id)}
            title={s.desc}
            aria-pressed={isSelected}
            aria-label={`${s.label}风格`}
          >
            <span className="style-tag-icon"><Icon size={14} /></span>
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
