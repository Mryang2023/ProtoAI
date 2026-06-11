import { useState, useEffect } from 'react';
import {
  X, ShoppingBag, BarChart3, Users, Settings, MessageCircle,
  User, MessageSquare, Rocket, Building2, CreditCard,
  AlertTriangle, Layout, Package, List, ShoppingCart,
  ClipboardCheck, LogIn,
} from 'lucide-react';

const ICON_MAP = {
  ShoppingBag, BarChart3, Users, Settings, MessageCircle,
  User, MessageSquare, Rocket, Building2, CreditCard,
  AlertTriangle, Layout, Package, List, ShoppingCart,
  ClipboardCheck, LogIn,
};

const TEMPLATES = [
  // ── 电商/商城 ──
  {
    id: 'ecommerce-home',
    category: '电商/商城',
    name: '电商首页',
    icon: 'ShoppingBag',
    description: '商品展示、分类导航、搜索、推荐商品',
    pageCount: 1,
    prompt: '生成一个电商首页，包含：顶部导航栏（logo、搜索框、购物车图标）、轮播Banner广告、商品分类入口（图标+文字）、推荐商品卡片网格（商品图片、名称、价格、评分）、底部导航。',
  },
  {
    id: 'ecommerce-product-list',
    category: '电商/商城',
    name: '商品列表',
    icon: 'List',
    description: '筛选侧栏、商品网格卡片、分页',
    pageCount: 1,
    prompt: '生成一个商品列表页，包含：左侧筛选栏（分类、价格区间、品牌、评分）、右侧商品网格（商品卡片含图片、名称、价格、评分标签）、顶部分类和排序选项、底部分页器。',
  },
  {
    id: 'ecommerce-product-detail',
    category: '电商/商城',
    name: '商品详情',
    icon: 'Package',
    description: '图片画廊、价格、描述、加入购物车',
    pageCount: 1,
    prompt: '生成一个商品详情页，包含：左侧商品图片画廊（主图+缩略图列表）、右侧商品信息（商品名称、价格、促销标签、规格选择、数量选择、加入购物车按钮、商品描述、参数表格）、底部商品评价区域。',
  },
  {
    id: 'ecommerce-cart',
    category: '电商/商城',
    name: '购物车',
    icon: 'ShoppingCart',
    description: '商品列表、数量控制、价格汇总、结算',
    pageCount: 1,
    prompt: '生成一个购物车页面，包含：购物车商品列表（商品图片、名称、规格、单价、数量加减控件、删除按钮）、右侧或底部价格汇总（商品总价、优惠券、运费、合计金额）、去结算按钮。',
  },
  {
    id: 'ecommerce-order-confirm',
    category: '电商/商城',
    name: '订单确认',
    icon: 'ClipboardCheck',
    description: '订单摘要、收货信息、物流跟踪',
    pageCount: 1,
    prompt: '生成一个订单确认页，包含：订单成功提示（勾选动画图标、订单号）、收货地址信息卡片、订单商品清单、价格明细、物流状态跟踪时间线（已下单、已发货、运输中、已签收）、继续购物按钮。',
  },

  // ── SaaS/工具 ──
  {
    id: 'saas-dashboard',
    category: 'SaaS/工具',
    name: '数据仪表盘',
    icon: 'BarChart3',
    description: '统计卡片、图表区域、近期动态、侧边导航',
    pageCount: 1,
    prompt: '生成一个数据仪表盘页面，包含：左侧固定侧边导航栏（logo、菜单项含图标、用户头像）、顶部栏（搜索、通知铃铛、用户头像）、主体区域包含统计卡片行（总用户数、收入、转化率、活跃用户，含趋势箭头）、图表占位区域（折线图、柱状图）、近期活动列表。',
  },
  {
    id: 'saas-user-management',
    category: 'SaaS/工具',
    name: '用户管理',
    icon: 'Users',
    description: '用户表格、搜索筛选、角色标签、操作按钮',
    pageCount: 1,
    prompt: '生成一个用户管理页面，包含：顶部标题和添加用户按钮、搜索框和筛选器（角色、状态）、用户数据表格（头像、姓名、邮箱、角色标签、状态标签、注册时间、操作按钮含编辑和删除）、底部批量操作栏和分页器。',
  },
  {
    id: 'saas-settings',
    category: 'SaaS/工具',
    name: '设置页面',
    icon: 'Settings',
    description: '标签分区、表单字段、开关切换、保存按钮',
    pageCount: 1,
    prompt: '生成一个设置页面，包含：左侧设置分类导航（个人资料、安全、通知、偏好设置、集成）、右侧设置表单区域（标签页切换、表单输入框、文本域、下拉选择、开关切换控件）、底部保存和取消按钮。',
  },
  {
    id: 'saas-login',
    category: 'SaaS/工具',
    name: '登录页',
    icon: 'LogIn',
    description: '居中表单、Logo、邮箱密码、社交登录',
    pageCount: 1,
    prompt: '生成一个登录页面，包含：居中卡片布局、顶部Logo和应用名称、邮箱输入框、密码输入框（含显示/隐藏切换）、记住我复选框、登录按钮、社交登录按钮（Google、GitHub、微信）、底部注册链接和忘记密码链接。',
  },

  // ── 社交/内容 ──
  {
    id: 'social-feed',
    category: '社交/内容',
    name: '信息流',
    icon: 'MessageCircle',
    description: '帖子卡片、头像、图文、点赞评论',
    pageCount: 1,
    prompt: '生成一个信息流页面，包含：顶部导航栏（logo、搜索、消息通知、用户头像）、中间信息流区域（帖子卡片含用户头像、用户名、发布时间、文字内容、图片网格、点赞和评论按钮、分享按钮）、右侧推荐关注列表和热门话题。',
  },
  {
    id: 'social-profile',
    category: '社交/内容',
    name: '个人主页',
    icon: 'User',
    description: '封面照片、头像、简介、标签页',
    pageCount: 1,
    prompt: '生成一个个人主页，包含：顶部封面图片区域、用户头像（半覆盖在封面上）、用户名和简介信息、统计数字（帖子数、粉丝数、关注数）、编辑资料按钮、标签页切换（帖子、回复、媒体、喜欢）、帖子网格或列表内容。',
  },
  {
    id: 'social-chat-list',
    category: '社交/内容',
    name: '聊天列表',
    icon: 'MessageSquare',
    description: '会话列表、头像、最近消息、时间戳',
    pageCount: 1,
    prompt: '生成一个聊天列表页面，包含：左侧会话列表（每个会话含头像、用户名、最近一条消息摘要、时间戳、未读消息数气泡）、顶部搜索栏和新建聊天按钮、右侧聊天窗口占位（选中会话后显示消息区域、输入框和发送按钮）。',
  },

  // ── 通用 ──
  {
    id: 'general-landing',
    category: '通用',
    name: '落地页',
    icon: 'Rocket',
    description: 'Hero区域、功能网格、用户评价、CTA',
    pageCount: 1,
    prompt: '生成一个产品落地页，包含：顶部导航栏（logo、功能链接、登录和注册按钮）、Hero区域（大标题、副标题、CTA按钮、产品截图或插图）、功能特点网格（图标+标题+描述，3-4列）、用户评价轮播或网格、定价入口区域、底部CTA横幅、页脚（链接分组、版权信息）。',
  },
  {
    id: 'general-about',
    category: '通用',
    name: '关于我们',
    icon: 'Building2',
    description: '团队网格、公司故事、价值观、联系方式',
    pageCount: 1,
    prompt: '生成一个关于我们页面，包含：顶部Banner（公司slogan）、公司故事区域（图文混排）、核心价值观展示（图标+标题+描述卡片）、团队成员网格（头像、姓名、职位、社交链接）、合作伙伴logo墙、联系方式和地图占位区域。',
  },
  {
    id: 'general-pricing',
    category: '通用',
    name: '定价页',
    icon: 'CreditCard',
    description: '定价卡片、功能对比、FAQ',
    pageCount: 1,
    prompt: '生成一个定价页面，包含：顶部标题和月付/年付切换开关、三列定价卡片（免费版、专业版、企业版，每列含价格、功能列表、CTA按钮，推荐版高亮）、功能对比表格（不同套餐的功能勾选对比）、FAQ折叠问答区域、底部CTA横幅。',
  },
  {
    id: 'general-404',
    category: '通用',
    name: '404页面',
    icon: 'AlertTriangle',
    description: '创意错误插图、搜索框、返回首页',
    pageCount: 1,
    prompt: '生成一个404错误页面，包含：居中布局、大号404数字或创意插图/动画、"页面未找到"提示文字、描述文字、搜索输入框（帮助用户查找内容）、返回首页按钮和浏览热门页面链接。',
  },
];

// Group templates by category preserving insertion order
const CATEGORY_ORDER = ['电商/商城', 'SaaS/工具', '社交/内容', '通用'];
const groupedTemplates = CATEGORY_ORDER.map((cat) => ({
  category: cat,
  templates: TEMPLATES.filter((t) => t.category === cat),
}));

export default function TemplateLibrary({ onSelect, onClose }) {
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSelect = (template) => {
    onSelect(template);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        padding: '24px',
      }}
    >
      <style>{`
        .tl-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        @media (max-width: 560px) {
          .tl-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="template-library-title"
        style={{
          background: 'var(--bg-primary, #fff)',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '32px',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.18)',
          border: '1px solid var(--border-color, #e5e7eb)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="关闭"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            border: 'none',
            background: 'var(--bg-primary, transparent)',
            borderRadius: '8px',
            cursor: 'pointer',
            color: 'var(--fg-muted, #888)',
            transition: 'background .15s, color .15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--border-color, #e5e7eb)';
            e.currentTarget.style.color = 'var(--fg-primary, #1a1a1a)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-primary, transparent)';
            e.currentTarget.style.color = 'var(--fg-muted, #888)';
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '28px', paddingRight: '40px' }}>
          <h2
            id="template-library-title"
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--fg-primary, #1a1a1a)',
              lineHeight: '1.3',
            }}
          >
            页面模板库
          </h2>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: '14px',
              color: 'var(--fg-muted, #888)',
              lineHeight: '1.5',
            }}
          >
            选择一个预设模板，快速开始你的原型设计
          </p>
        </div>

        {/* Categories */}
        {groupedTemplates.map(({ category, templates }) => (
          <div key={category} style={{ marginBottom: '28px' }}>
            {/* Category header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--border-color, #e5e7eb)',
              }}
            >
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--fg-muted, #888)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {category}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'var(--fg-muted, #aaa)',
                  background: 'var(--border-color, #f0f0f0)',
                  borderRadius: '10px',
                  padding: '1px 8px',
                }}
              >
                {templates.length}
              </span>
            </div>

            {/* Template grid: 2 columns, 1 on small screens */}
            <div className="tl-grid">
              {templates.map((template) => {
                const Icon = ICON_MAP[template.icon] || Layout;
                const isHovered = hoveredId === template.id;

                return (
                  <div
                    key={template.id}
                    onClick={() => handleSelect(template)}
                    onMouseEnter={() => setHoveredId(template.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(template);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color, #e5e7eb)',
                      background: isHovered
                        ? 'color-mix(in srgb, var(--accent, #2563eb) 5%, var(--bg-primary, #fff))'
                        : 'var(--bg-primary, #fff)',
                      cursor: 'pointer',
                      transition: 'background .15s, border-color .15s, box-shadow .15s',
                      borderColor: isHovered
                        ? 'color-mix(in srgb, var(--accent, #2563eb) 30%, var(--border-color, #e5e7eb))'
                        : 'var(--border-color, #e5e7eb)',
                      boxShadow: isHovered
                        ? '0 2px 8px rgba(0, 0, 0, 0.06)'
                        : 'none',
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        flexShrink: 0,
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        background: 'color-mix(in srgb, var(--accent, #2563eb) 10%, transparent)',
                        color: 'var(--accent, #2563eb)',
                      }}
                    >
                      <Icon size={18} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          marginBottom: '4px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--fg-primary, #1a1a1a)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {template.name}
                        </span>
                        <span
                          style={{
                            flexShrink: 0,
                            fontSize: '11px',
                            color: 'var(--fg-muted, #aaa)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {template.pageCount} 页
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '12px',
                          color: 'var(--fg-muted, #888)',
                          lineHeight: '1.5',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {template.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Footer hint */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-color, #e5e7eb)',
            fontSize: '12px',
            color: 'var(--fg-muted, #aaa)',
          }}
        >
          <Layout size={12} />
          <span>选择模板后将自动生成对应的页面原型</span>
        </div>
      </div>
    </div>
  );
}
