/**
 * PlanPreview — generates realistic wireframe HTML from structured plan data.
 * Renders placeholder UI components that visually represent the planned page structure.
 * Supports PC and mobile platform layouts.
 */

export function generateWireframeHtml(page, platform = 'pc') {
  const isMobile = platform === 'mobile';
  const W = isMobile ? 375 : 960;
  const sectionType = detectSectionType(page);

  // Build navigation
  const navHtml = renderNav(page, isMobile);

  // Build sections
  const sectionsHtml = (page.sections || []).map((section, si) =>
    renderSection(section, si, isMobile, si === 0 ? sectionType : detectSectionLayout(section))
  ).join('');

  // Build footer / bottom tab bar
  const footerHtml = isMobile ? renderMobileTabBar(page) : renderFooter();

  // Interactions & features annotation panel
  const annotationsHtml = renderAnnotations(page);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${page.name} - 线框预览</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5;
      color: #333;
      -webkit-font-smoothing: antialiased;
    }
    .wireframe-container {
      max-width: ${W}px;
      margin: 0 auto;
      background: #fff;
      min-height: 100vh;
      ${isMobile ? '' : 'box-shadow: 0 0 40px rgba(0,0,0,0.06);'}
      position: relative;
    }
    /* Watermark */
    .wireframe-watermark {
      position: fixed; top: 8px; right: 12px;
      font-size: 10px; color: #bbb; letter-spacing: 0.5px;
      pointer-events: none; z-index: 999;
    }
    /* Navigation */
    .wf-nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: ${isMobile ? '10px 16px' : '14px 32px'};
      background: #fafafa; border-bottom: 1px solid #eee;
      position: sticky; top: 0; z-index: 10;
    }
    .wf-nav-logo {
      font-size: ${isMobile ? '14px' : '16px'}; font-weight: 700; color: #444;
      display: flex; align-items: center; gap: 8px;
    }
    .wf-nav-logo-icon {
      width: ${isMobile ? '24px' : '28px'}; height: ${isMobile ? '24px' : '28px'};
      border-radius: 6px; background: linear-gradient(135deg, #c7d2fe, #a5b4fc);
    }
    .wf-nav-links {
      display: flex; gap: ${isMobile ? '12px' : '20px'}; align-items: center;
    }
    .wf-nav-link {
      font-size: ${isMobile ? '11px' : '13px'}; color: #888;
      padding: 4px 0; border-bottom: 2px solid transparent;
    }
    .wf-nav-link.active { color: #555; border-bottom-color: #6366f1; font-weight: 600; }
    .wf-nav-action {
      font-size: ${isMobile ? '10px' : '12px'}; color: #fff;
      background: #a5b4fc; padding: 5px 14px; border-radius: 6px; font-weight: 500;
    }
    /* Page body */
    .wf-body { padding: ${isMobile ? '16px' : '32px 40px'}; ${isMobile ? 'padding-bottom: 72px;' : 'padding-bottom: 48px;'} }
    /* Section blocks */
    .wf-section { margin-bottom: ${isMobile ? '20px' : '28px'}; }
    .wf-section-label {
      font-size: 10px; color: #aaa; text-transform: uppercase; letter-spacing: 1px;
      margin-bottom: 10px; font-weight: 600;
    }
    /* Hero layout */
    .wf-hero {
      display: ${isMobile ? 'flex' : 'flex'}; flex-direction: ${isMobile ? 'column' : 'row'};
      gap: ${isMobile ? '16px' : '32px'}; align-items: center;
      padding: ${isMobile ? '24px 16px' : '40px 32px'};
      background: linear-gradient(135deg, #f0f0ff 0%, #f8f8ff 100%);
      border-radius: 12px;
    }
    .wf-hero-text { flex: 1; }
    .wf-hero-title {
      font-size: ${isMobile ? '20px' : '28px'}; font-weight: 700; color: #333;
      line-height: 1.3; margin-bottom: 8px;
    }
    .wf-hero-subtitle {
      font-size: ${isMobile ? '12px' : '14px'}; color: #888; line-height: 1.6;
      margin-bottom: 16px;
    }
    .wf-hero-img {
      width: ${isMobile ? '100%' : '320px'}; height: ${isMobile ? '140px' : '200px'};
      background: #e8e8e8; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; position: relative;
      overflow: hidden;
    }
    .wf-hero-img::before, .wf-hero-img::after {
      content: ''; position: absolute; background: #d4d4d4;
    }
    .wf-hero-img::before { width: 141%; height: 1px; transform: rotate(25deg); }
    .wf-hero-img::after { width: 141%; height: 1px; transform: rotate(-25deg); }
    /* Content blocks */
    .wf-text-line {
      height: 10px; background: #e8e8e8; border-radius: 5px; margin-bottom: 8px;
    }
    .wf-text-line.w60 { width: 60%; }
    .wf-text-line.w80 { width: 80%; }
    .wf-text-line.w40 { width: 40%; }
    .wf-text-line.w-full { width: 100%; }
    /* Buttons */
    .wf-btn {
      display: inline-flex; align-items: center; justify-content: center;
      padding: ${isMobile ? '8px 16px' : '10px 22px'};
      border-radius: 8px; font-size: ${isMobile ? '12px' : '13px'};
      font-weight: 500; margin: 3px 4px 3px 0;
    }
    .wf-btn-primary { background: #a5b4fc; color: #fff; }
    .wf-btn-secondary { background: #f1f5f9; color: #666; border: 1px solid #ddd; }
    .wf-btn-ghost { background: transparent; color: #888; border: 1px dashed #ccc; }
    /* Input fields */
    .wf-field { margin-bottom: ${isMobile ? '12px' : '16px'}; }
    .wf-field-label {
      font-size: ${isMobile ? '11px' : '12px'}; color: #666; font-weight: 500;
      margin-bottom: 4px; display: block;
    }
    .wf-field-input {
      width: 100%; height: ${isMobile ? '36px' : '40px'};
      border: 1px solid #ddd; border-radius: 8px; padding: 0 12px;
      background: #fafafa; font-size: 12px; color: #bbb;
      display: flex; align-items: center;
    }
    .wf-field-textarea {
      width: 100%; height: 80px;
      border: 1px solid #ddd; border-radius: 8px; padding: 10px 12px;
      background: #fafafa; font-size: 12px; color: #bbb;
    }
    /* Image placeholders */
    .wf-img-placeholder {
      background: #eaeaea; border-radius: 8px; position: relative;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .wf-imgplaceholder::before, .wf-imgplaceholder::after {
      content: ''; position: absolute; background: #d8d8d8; width: 141%; height: 1px;
    }
    .wf-imgplaceholder::before { transform: rotate(25deg); }
    .wf-imgplaceholder::after { transform: rotate(-25deg); }
    .wf-img-icon { color: #ccc; font-size: 20px; z-index: 1; }
    /* Card grid */
    .wf-card-grid {
      display: grid;
      grid-template-columns: ${isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'};
      gap: ${isMobile ? '10px' : '16px'};
    }
    .wf-card {
      border: 1px solid #eee; border-radius: 10px; overflow: hidden; background: #fff;
    }
    .wf-card-img {
      width: 100%; height: ${isMobile ? '80px' : '120px'};
      background: #eaeaea; position: relative; overflow: hidden;
    }
    .wf-card-img::before, .wf-card-img::after {
      content: ''; position: absolute; background: #d8d8d8; width: 141%; height: 1px;
    }
    .wf-card-img::before { transform: rotate(25deg); }
    .wf-card-img::after { transform: rotate(-25deg); }
    .wf-card-body { padding: ${isMobile ? '10px' : '14px'}; }
    .wf-card-title { font-size: ${isMobile ? '12px' : '14px'}; font-weight: 600; color: #444; margin-bottom: 4px; }
    .wf-card-desc { font-size: ${isMobile ? '10px' : '11px'}; color: #aaa; line-height: 1.4; }
    /* Table / List */
    .wf-table { width: 100%; border-collapse: collapse; }
    .wf-table th {
      font-size: 11px; color: #888; font-weight: 600; text-align: left;
      padding: 8px 12px; background: #f8f8f8; border-bottom: 1px solid #eee;
    }
    .wf-table td {
      font-size: 11px; color: #aaa; padding: 10px 12px; border-bottom: 1px solid #f0f0f0;
    }
    .wf-table-row-hover:hover { background: #fafafa; }
    /* List items */
    .wf-list-item {
      display: flex; align-items: center; gap: 12px;
      padding: ${isMobile ? '10px 0' : '14px 0'}; border-bottom: 1px solid #f0f0f0;
    }
    .wf-list-avatar {
      width: ${isMobile ? '36px' : '40px'}; height: ${isMobile ? '36px' : '40px'};
      border-radius: 50%; background: #e8e8e8; flex-shrink: 0;
    }
    .wf-list-content { flex: 1; min-width: 0; }
    .wf-list-title { font-size: ${isMobile ? '13px' : '14px'}; font-weight: 500; color: #444; margin-bottom: 2px; }
    .wf-list-sub { font-size: ${isMobile ? '10px' : '11px'}; color: #aaa; }
    .wf-list-action { font-size: 11px; color: #a5b4fc; flex-shrink: 0; }
    /* Stat cards */
    .wf-stat-grid {
      display: grid;
      grid-template-columns: ${isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'};
      gap: ${isMobile ? '8px' : '16px'};
    }
    .wf-stat-card {
      padding: ${isMobile ? '12px' : '20px'}; border: 1px solid #eee;
      border-radius: 10px; background: #fafafa; text-align: center;
    }
    .wf-stat-value {
      font-size: ${isMobile ? '20px' : '28px'}; font-weight: 700; color: #a5b4fc;
      margin-bottom: 4px;
    }
    .wf-stat-label { font-size: ${isMobile ? '10px' : '12px'}; color: #999; }
    /* Search bar */
    .wf-search {
      display: flex; align-items: center; gap: 8px;
      padding: ${isMobile ? '8px 12px' : '10px 16px'};
      border: 1px solid #ddd; border-radius: 10px; background: #fafafa;
      margin-bottom: 16px;
    }
    .wf-search-icon { color: #bbb; font-size: 14px; }
    .wf-search-text { font-size: 13px; color: #bbb; }
    /* Nav / Tabs */
    .wf-tabs {
      display: flex; gap: 0; border-bottom: 1px solid #eee; margin-bottom: 16px;
    }
    .wf-tab {
      padding: 8px 16px; font-size: ${isMobile ? '12px' : '13px'}; color: #888;
      border-bottom: 2px solid transparent; font-weight: 500;
    }
    .wf-tab.active { color: #555; border-bottom-color: #6366f1; }
    /* Mobile bottom tab bar */
    .wf-tabbar {
      position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
      width: ${W}px; max-width: 100%;
      display: flex; justify-content: space-around; align-items: center;
      padding: 8px 0 12px; background: #fff;
      border-top: 1px solid #eee; z-index: 10;
    }
    .wf-tabbar-item {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      font-size: 9px; color: #aaa;
    }
    .wf-tabbar-item.active { color: #6366f1; }
    .wf-tabbar-icon {
      width: 20px; height: 20px; border-radius: 4px; background: #e8e8e8;
    }
    .wf-tabbar-item.active .wf-tabbar-icon { background: #c7d2fe; }
    /* Footer */
    .wf-footer {
      padding: 24px 40px; border-top: 1px solid #eee; text-align: center;
      font-size: 11px; color: #bbb;
    }
    /* Annotations (interactions & features) */
    .wf-annotations {
      margin: ${isMobile ? '16px' : '24px 40px'};
      display: grid; grid-template-columns: ${isMobile ? '1fr' : '1fr 1fr'};
      gap: 12px;
    }
    .wf-anno-block {
      padding: 14px 16px; border-radius: 10px;
      font-size: 12px; line-height: 1.5;
    }
    .wf-anno-interactions { background: #f0f4ff; border: 1px solid #dde4ff; }
    .wf-anno-features { background: #f0fdf4; border: 1px solid #c6f6d5; }
    .wf-anno-title {
      font-size: 11px; font-weight: 700; margin-bottom: 8px;
      letter-spacing: 0.3px;
    }
    .wf-anno-interactions .wf-anno-title { color: #4338ca; }
    .wf-anno-features .wf-anno-title { color: #166534; }
    .wf-anno-item { padding: 2px 0; }
    .wf-anno-interactions .wf-anno-item { color: #5b5bd6; }
    .wf-anno-features .wf-anno-item { color: #22863a; }
    /* Page title block */
    .wf-page-header {
      padding: ${isMobile ? '20px 16px 16px' : '32px 40px 24px'};
      border-bottom: 1px solid #eee;
    }
    .wf-page-title {
      font-size: ${isMobile ? '22px' : '26px'}; font-weight: 700; color: #222;
      margin-bottom: 6px;
    }
    .wf-page-route { font-size: 11px; color: #bbb; margin-bottom: 8px; }
    .wf-page-desc { font-size: ${isMobile ? '12px' : '13px'}; color: #888; line-height: 1.5; }
    .wf-layout-badge {
      display: inline-block; padding: 3px 10px; border-radius: 6px;
      background: #f1f5f9; font-size: 10px; color: #666; margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="wireframe-container">
    <div class="wireframe-watermark">WIREFRAME</div>
    ${navHtml}
    <div class="wf-page-header">
      <div class="wf-page-title">${page.name}</div>
      <div class="wf-page-route">${page.route || ''}</div>
      ${page.description ? `<div class="wf-page-desc">${page.description}</div>` : ''}
      ${page.layout ? `<div class="wf-layout-badge">📐 ${page.layout}</div>` : ''}
    </div>
    <div class="wf-body">
      ${sectionsHtml}
    </div>
    ${annotationsHtml}
    ${footerHtml}
  </div>
</body>
</html>`;
}

// ── Navigation ──────────────────────────────────────────

function renderNav(page, isMobile) {
  const pageName = page.name || '应用';
  // Simple nav with logo + a few placeholder links
  const links = isMobile
    ? ''
    : `<div class="wf-nav-links">
        <span class="wf-nav-link active">${pageName}</span>
        <span class="wf-nav-link">首页</span>
        <span class="wf-nav-link">关于</span>
        <span class="wf-nav-action">操作按钮</span>
      </div>`;

  return `
    <div class="wf-nav">
      <div class="wf-nav-logo">
        <div class="wf-nav-logo-icon"></div>
        <span>${pageName}</span>
      </div>
      ${links}
    </div>`;
}

function renderMobileTabBar(page) {
  const items = ['首页', '发现', '消息', '我的'];
  return `
    <div class="wf-tabbar">
      ${items.map((label, i) => `
        <div class="wf-tabbar-item${i === 0 ? ' active' : ''}">
          <div class="wf-tabbar-icon"></div>
          <span>${label}</span>
        </div>
      `).join('')}
    </div>`;
}

function renderFooter() {
  return `<div class="wf-footer">© ${new Date().getFullYear()} ProtoAI Wireframe · 仅用于方案预览</div>`;
}

// ── Section Rendering ───────────────────────────────────

function renderSection(section, index, isMobile, layoutType) {
  const elements = section.elements || [];
  const buttons = elements.filter(el => guessElementTag(el) === 'button');
  const inputs = elements.filter(el => guessElementTag(el) === 'input');
  const images = elements.filter(el => guessElementTag(el) === 'img');
  const navItems = elements.filter(el => guessElementTag(el) === 'nav');
  const listItems = elements.filter(el => guessElementTag(el) === 'list');
  const others = elements.filter(el => {
    const t = guessElementTag(el);
    return t !== 'button' && t !== 'input' && t !== 'img' && t !== 'nav' && t !== 'list';
  });

  let contentHtml = '';

  switch (layoutType) {
    case 'hero':
      contentHtml = renderHeroSection(section, buttons, others, isMobile);
      break;
    case 'form':
      contentHtml = renderFormSection(inputs, buttons, isMobile);
      break;
    case 'card-grid':
      contentHtml = renderCardGridSection(section, images, others, isMobile);
      break;
    case 'stats':
      contentHtml = renderStatsSection(section, others, isMobile);
      break;
    case 'table-list':
      contentHtml = renderTableSection(section, listItems, others, isMobile);
      break;
    case 'search':
      contentHtml = renderSearchSection(section, navItems, others, buttons, isMobile);
      break;
    case 'media':
      contentHtml = renderMediaSection(section, images, others, isMobile);
      break;
    default:
      contentHtml = renderGenericSection(section, elements, isMobile);
  }

  return `
    <div class="wf-section">
      <div class="wf-section-label">${section.name}</div>
      ${section.description ? `<div style="font-size:11px;color:#999;margin-bottom:10px;line-height:1.4;">${section.description}</div>` : ''}
      ${contentHtml}
    </div>`;
}

// ── Section Layout Renderers ────────────────────────────

function renderHeroSection(section, buttons, others, isMobile) {
  const btnsHtml = buttons.map((b, i) =>
    `<span class="wf-btn ${i === 0 ? 'wf-btn-primary' : 'wf-btn-secondary'}">${b}</span>`
  ).join('');

  const textLines = others.length > 0
    ? others.map(o => `<div class="wf-text-line ${['w60','w80','w40','w-full'][Math.floor(Math.random()*4)]}"></div>`).join('')
    : `<div class="wf-text-line w80"></div><div class="wf-text-line w60"></div>`;

  return `
    <div class="wf-hero">
      <div class="wf-hero-text">
        <div class="wf-hero-title">${section.name}</div>
        <div class="wf-hero-subtitle">${section.description || '此处为区块描述文字'}</div>
        ${textLines}
        <div style="margin-top:16px">${btnsHtml || '<span class="wf-btn wf-btn-primary">主要操作</span><span class="wf-btn wf-btn-secondary">次要操作</span>'}</div>
      </div>
      <div class="wf-hero-img">
        <span style="color:#ccc;font-size:14px;z-index:1">图片占位</span>
      </div>
    </div>`;
}

function renderFormSection(inputs, buttons, isMobile) {
  const fieldsHtml = (inputs.length > 0 ? inputs : ['输入字段 1', '输入字段 2', '输入字段 3']).map((input) => {
    const isTextarea = /描述|备注|内容|textarea|详情|留言|评论/i.test(input);
    return `
      <div class="wf-field">
        <label class="wf-field-label">${input}</label>
        ${isTextarea
          ? `<div class="wf-field-textarea">请输入${input}...</div>`
          : `<div class="wf-field-input">请输入${input}</div>`
        }
      </div>`;
  }).join('');

  const btnsHtml = buttons.map((b, i) =>
    `<span class="wf-btn ${i === 0 ? 'wf-btn-primary' : 'wf-btn-secondary'}">${b}</span>`
  ).join('') || '<span class="wf-btn wf-btn-primary">提交</span>';

  return `
    <div style="max-width: ${isMobile ? '100%' : '480px'}">
      ${fieldsHtml}
      <div style="margin-top:16px">${btnsHtml}</div>
    </div>`;
}

function renderCardGridSection(section, images, others, isMobile) {
  const cards = [];
  const count = isMobile ? 4 : 6;
  for (let i = 0; i < count; i++) {
    const title = others[i] || `卡片标题 ${i + 1}`;
    cards.push(`
      <div class="wf-card">
        <div class="wf-card-img">
          <span style="color:#ccc;font-size:11px;z-index:1;position:relative">图片</span>
        </div>
        <div class="wf-card-body">
          <div class="wf-card-title">${title}</div>
          <div class="wf-card-desc">这是卡片的描述文字区域，简要说明内容信息。</div>
        </div>
      </div>`);
  }
  return `<div class="wf-card-grid">${cards.join('')}</div>`;
}

function renderStatsSection(section, others, isMobile) {
  const stats = others.length > 0 ? others : ['总用户数', '活跃用户', '转化率', '总收入'];
  const cards = (stats.length > 4 ? stats.slice(0, 4) : stats).map((s, i) => {
    const values = ['1,234', '567', '89%', '¥12.3万'];
    return `
      <div class="wf-stat-card">
        <div class="wf-stat-value">${values[i % values.length]}</div>
        <div class="wf-stat-label">${s}</div>
      </div>`;
  });
  return `<div class="wf-stat-grid">${cards.join('')}</div>`;
}

function renderTableSection(section, listItems, others, isMobile) {
  if (isMobile) {
    // Mobile: render as list items
    const items = others.length > 0 ? others : ['列表项 1', '列表项 2', '列表项 3', '列表项 4'];
    return items.slice(0, 5).map(item => `
      <div class="wf-list-item">
        <div class="wf-list-avatar"></div>
        <div class="wf-list-content">
          <div class="wf-list-title">${item}</div>
          <div class="wf-list-sub">描述信息 · 辅助文字</div>
        </div>
        <div class="wf-list-action">操作</div>
      </div>
    `).join('');
  }

  // PC: render as table
  const cols = others.length >= 3 ? others.slice(0, 4) : ['名称', '状态', '更新时间', '操作'];
  const rows = 4;
  return `
    <table class="wf-table">
      <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
      <tbody>
        ${Array.from({ length: rows }, (_, ri) => `
          <tr class="wf-table-row-hover">
            ${cols.map((c, ci) => `<td>${ci === cols.length - 1 ? '<span style="color:#a5b4fc">操作</span>' : `数据 ${ri + 1}-${ci + 1}`}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

function renderSearchSection(section, navItems, others, buttons, isMobile) {
  const tabs = navItems.length > 0 ? navItems : ['全部', '推荐', '最新', '热门'];
  const tabsHtml = `<div class="wf-tabs">${tabs.map((t, i) => `<div class="wf-tab${i === 0 ? ' active' : ''}">${t}</div>`).join('')}</div>`;
  const searchHtml = `<div class="wf-search"><span class="wf-search-icon">🔍</span><span class="wf-search-text">搜索...</span></div>`;

  // Cards below
  const cardCount = isMobile ? 4 : 6;
  let cardsHtml = '';
  for (let i = 0; i < cardCount; i++) {
    cardsHtml += `
      <div class="wf-card">
        <div class="wf-card-img">
          <span style="color:#ccc;font-size:11px;z-index:1;position:relative">图片</span>
        </div>
        <div class="wf-card-body">
          <div class="wf-card-title">结果项 ${i + 1}</div>
          <div class="wf-card-desc">简要描述内容信息</div>
        </div>
      </div>`;
  }

  return `
    ${searchHtml}
    ${tabsHtml}
    <div class="wf-card-grid">${cardsHtml}</div>`;
}

function renderMediaSection(section, images, others, isMobile) {
  const imgCount = isMobile ? 3 : 4;
  const imgs = [];
  for (let i = 0; i < imgCount; i++) {
    const h = isMobile ? '140px' : '180px';
    imgs.push(`
      <div class="wf-imgplaceholder" style="width:100%;height:${h};border-radius:10px">
        <span style="color:#ccc;font-size:12px;z-index:1">${images[i] || `图片 ${i + 1}`}</span>
      </div>`);
  }
  return `
    <div style="display:grid;grid-template-columns:${isMobile ? '1fr' : '1fr 1fr'};gap:${isMobile ? '10px' : '16px'}">
      ${imgs.join('')}
    </div>`;
}

function renderGenericSection(section, elements, isMobile) {
  if (elements.length === 0) {
    return `
      <div style="padding:20px;border:1px dashed #ddd;border-radius:10px;text-align:center;color:#bbb;font-size:12px">
        暂无具体元素
      </div>`;
  }

  // Smart rendering: group by type and render appropriate wireframe elements
  const html = [];

  // Buttons
  const buttons = elements.filter(el => guessElementTag(el) === 'button');
  if (buttons.length > 0) {
    html.push(`<div style="margin-bottom:12px">${buttons.map((b, i) =>
      `<span class="wf-btn ${i === 0 ? 'wf-btn-primary' : 'wf-btn-secondary'}">${b}</span>`
    ).join('')}</div>`);
  }

  // Inputs
  const inputs = elements.filter(el => guessElementTag(el) === 'input');
  if (inputs.length > 0) {
    html.push(inputs.map(input => `
      <div class="wf-field">
        <label class="wf-field-label">${input}</label>
        <div class="wf-field-input">请输入...</div>
      </div>
    `).join(''));
  }

  // Images
  const imgs = elements.filter(el => guessElementTag(el) === 'img');
  if (imgs.length > 0) {
    const gridCols = isMobile ? '1fr' : `repeat(${Math.min(imgs.length, 3)}, 1fr)`;
    html.push(`<div style="display:grid;grid-template-columns:${gridCols};gap:10px;margin-bottom:12px">
      ${imgs.map(img => `
        <div class="wf-imgplaceholder" style="height:${isMobile ? '100px' : '140px'}">
          <span style="color:#ccc;font-size:11px;z-index:1">${img}</span>
        </div>
      `).join('')}
    </div>`);
  }

  // Nav/Tab items
  const navs = elements.filter(el => guessElementTag(el) === 'nav');
  if (navs.length > 0) {
    html.push(`<div class="wf-tabs">${navs.map((n, i) =>
      `<div class="wf-tab${i === 0 ? ' active' : ''}">${n}</div>`
    ).join('')}</div>`);
  }

  // List items
  const lists = elements.filter(el => guessElementTag(el) === 'list');
  if (lists.length > 0) {
    html.push(lists.map(item => `
      <div class="wf-list-item">
        <div class="wf-list-avatar"></div>
        <div class="wf-list-content">
          <div class="wf-list-title">${item}</div>
          <div class="wf-list-sub">描述信息</div>
        </div>
        <div class="wf-list-action">→</div>
      </div>
    `).join(''));
  }

  // Generic divs (text lines, generic elements)
  const generics = elements.filter(el => guessElementTag(el) === 'div');
  if (generics.length > 0) {
    html.push(`<div style="margin-top:8px">
      ${generics.map(g => `<div class="wf-text-line ${['w60','w80','w40','w-full'][generics.indexOf(g) % 4]}"></div>`).join('')}
    </div>`);
  }

  return html.join('');
}

// ── Annotations (interactions & features) ───────────────

function renderAnnotations(page) {
  const interactions = page.interactions || [];
  const features = page.keyFeatures || [];
  if (interactions.length === 0 && features.length === 0) return '';

  return `<div class="wf-annotations">
    ${interactions.length > 0 ? `
      <div class="wf-anno-block wf-anno-interactions">
        <div class="wf-anno-title">⚡ 交互行为</div>
        ${interactions.map(i => `<div class="wf-anno-item">→ ${i}</div>`).join('')}
      </div>
    ` : ''}
    ${features.length > 0 ? `
      <div class="wf-anno-block wf-anno-features">
        <div class="wf-anno-title">★ 核心功能</div>
        ${features.map(f => `<div class="wf-anno-item">• ${f}</div>`).join('')}
      </div>
    ` : ''}
  </div>`;
}

// ── Section Type Detection ──────────────────────────────

function detectSectionType(page) {
  // The first section type is determined by overall page characteristics
  const sections = page.sections || [];
  if (sections.length === 0) return 'generic';

  const firstSection = sections[0];
  const elements = firstSection.elements || [];
  const name = (firstSection.name + ' ' + (firstSection.description || '')).toLowerCase();

  // Hero detection
  if (/hero|banner|首屏|欢迎|首页头|头图|轮播|cover/i.test(name)) return 'hero';
  if (sections.length <= 3 && elements.some(el => /图片|img|image|封面|banner/i.test(el))) return 'hero';

  // Form detection
  const inputCount = elements.filter(el => guessElementTag(el) === 'input').length;
  if (inputCount >= 2 || /表单|form|注册|登录|填写|编辑|创建|新增|设置/i.test(name)) return 'form';

  // Stats detection
  if (/统计|数据|概览|dashboard|总览|指标|汇总|报表/i.test(name)) return 'stats';

  // Default to hero for first section
  return 'hero';
}

function detectSectionLayout(section) {
  const name = (section.name + ' ' + (section.description || '')).toLowerCase();
  const elements = section.elements || [];

  // Form
  const inputCount = elements.filter(el => guessElementTag(el) === 'input').length;
  if (inputCount >= 2 || /表单|form|注册|登录|填写|编辑|创建|新增|设置|信息/i.test(name)) return 'form';

  // Card grid
  if (/卡片|card|推荐|列表展示|gallery|相册|作品|商品|产品|课程|文章|帖子/i.test(name)) return 'card-grid';

  // Stats
  if (/统计|数据|概览|dashboard|总览|指标|汇总|报表|数字/i.test(name)) return 'stats';

  // Table/List
  if (/表格|table|记录|日志|历史|订单|用户列表|成员|列表|管理/i.test(name)) return 'table-list';

  // Search
  if (/搜索|search|筛选|分类|标签|发现|浏览/i.test(name)) return 'search';

  // Media
  const imgCount = elements.filter(el => guessElementTag(el) === 'img').length;
  if (imgCount >= 3 || /图片|相册|gallery|媒体|media|轮播/i.test(name)) return 'media';

  // Nav/Tab
  const navCount = elements.filter(el => guessElementTag(el) === 'nav').length;
  if (navCount >= 3) return 'search';

  // List items dominant
  const listCount = elements.filter(el => guessElementTag(el) === 'list').length;
  if (listCount >= 3) return 'table-list';

  return 'generic';
}

// ── Element Tag Guessing (enhanced) ─────────────────────

function guessElementTag(name) {
  if (!name) return 'div';
  const lower = name.toLowerCase();
  if (/按钮|btn|button|提交|确认|取消|删除|新增|添加|保存|导出|导入|搜索|登录|注册|发送|上传|下载|编辑|发布|关注|点赞|收藏|分享|刷新|返回/.test(lower)) return 'button';
  if (/输入|搜索框|input|textarea|文本框|密码|邮箱|手机|用户名|表单|标题|描述|备注|内容|地址|电话|昵称|姓名|年龄|价格|数量|日期|时间/.test(lower)) return 'input';
  if (/图片|img|image|头像|封面|banner|轮播|图标|logo|照片|缩略图|背景图|海报|截图|相册/.test(lower)) return 'img';
  if (/列表|table|表格|卡片|card|grid|list|数据|记录|订单|用户|成员|商品/.test(lower)) return 'list';
  if (/导航|nav|menu|菜单|tab|标签|分类|频道|选项|筛选/.test(lower)) return 'nav';
  return 'div';
}

// ── Batch Generation ────────────────────────────────────

export function generateAllWireframes(pages, platform) {
  return pages.map((page) => generateWireframeHtml(page, platform));
}
