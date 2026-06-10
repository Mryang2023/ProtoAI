import {
  Minus,
  Briefcase,
  Zap,
  Cpu,
  BookOpen,
  Layers,
  Gem,
  TrendingUp,
} from 'lucide-react';

const STYLES = [
  {
    id: 'minimal',
    label: '极简',
    icon: Minus,
    desc: '大量留白，黑白灰为主，Helvetica 字体，克制精炼',
    colors: ['#ffffff', '#111111', '#888888', '#eeeeee'],
    useCase: '个人主页 / 作品集 / 落地页',
  },
  {
    id: 'business',
    label: '商务',
    icon: Briefcase,
    desc: '蓝白配色，系统字体，圆角卡片，专业稳重',
    colors: ['#2563eb', '#fafbfc', '#1a1a2e', '#e8ecf0'],
    useCase: 'SaaS 后台 / 企业官网 / B端产品',
  },
  {
    id: 'playful',
    label: '活泼',
    icon: Zap,
    desc: '暖色调，橙色点缀，大圆角，轻松活泼的语气',
    colors: ['#f97316', '#fffbeb', '#1c1917', '#fed7aa'],
    useCase: '电商活动页 / 儿童产品 / 社交应用',
  },
  {
    id: 'tech',
    label: '科技',
    icon: Cpu,
    desc: '深色背景，绿色荧光，等宽字体，开发者风格',
    colors: ['#22c55e', '#0f172a', '#e2e8f0', '#334155'],
    useCase: '开发者工具 / API 文档 / 技术产品',
  },
  {
    id: 'editorial',
    label: '文艺',
    icon: BookOpen,
    desc: '米色底，棕色点缀，衬线字体，沉浸式阅读体验',
    colors: ['#78350f', '#faf9f6', '#1a1a1a', '#e5e1d8'],
    useCase: '博客 / 杂志 / 长文阅读产品',
  },
  {
    id: 'modern',
    label: '现代SaaS',
    icon: Layers,
    desc: '纯净白底，靛蓝主色，大圆角卡片，柔和阴影',
    colors: ['#6366f1', '#f8fafc', '#0f172a', '#e2e8f0'],
    useCase: 'SaaS 产品 / 管理后台 / 工具类产品',
  },
  {
    id: 'elegant',
    label: '优雅高端',
    icon: Gem,
    desc: '纯黑背景，金色点缀，精致衬线，奢品质感',
    colors: ['#d4af37', '#0a0a0a', '#f5f5f4', '#292524'],
    useCase: '奢侈品 / 高端品牌 / 艺术展览',
  },
  {
    id: 'fintech',
    label: '金融科技',
    icon: TrendingUp,
    desc: '深蓝背景，青色点缀，数据可视化风格',
    colors: ['#06b6d4', '#0c1222', '#e2e8f0', '#1e293b'],
    useCase: '金融仪表盘 / 数据平台 / 交易系统',
  },
];

export default function StyleTags({ selected, onToggle }) {
  return (
    <div className="style-tags-enhanced" data-component="Style Tags" data-od-id="style-tags">
      {STYLES.map((s) => {
        const Icon = s.icon;
        const isSelected = selected.includes(s.id);
        return (
          <button
            key={s.id}
            className={`style-card${isSelected ? ' selected' : ''}`}
            onClick={() => onToggle(s.id)}
            aria-pressed={isSelected}
            aria-label={`${s.label}风格`}
          >
            <div className="style-card-header">
              <span className="style-card-icon"><Icon size={14} /></span>
              <span className="style-card-label">{s.label}</span>
            </div>
            <div className="style-card-colors">
              {s.colors.map((c, i) => (
                <span key={i} className="style-color-dot" style={{ background: c }} />
              ))}
            </div>
            <span className="style-card-desc">{s.desc}</span>
            <span className="style-card-use">{s.useCase}</span>
          </button>
        );
      })}
    </div>
  );
}
