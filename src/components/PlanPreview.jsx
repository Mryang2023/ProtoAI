/**
 * Generates low-fidelity wireframe HTML from structured plan data.
 * Renders placeholder blocks representing page sections and UI elements.
 */

export function generateWireframeHtml(page, platform = 'pc') {
  const isMobile = platform === 'mobile';
  const maxWidth = isMobile ? '375px' : '960px';
  const fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  const sectionsHtml = (page.sections || []).map((section, si) => {
    const elementsHtml = (section.elements || []).map((el) => {
      const tag = guessElementTag(el);
      return `<div style="
        display: inline-flex; align-items: center; gap: 4px;
        padding: 6px 12px; margin: 3px; border-radius: 6px;
        background: ${tag === 'button' ? '#e0e7ff' : tag === 'input' ? '#fef3c7' : '#f1f5f9'};
        border: 1px dashed ${tag === 'button' ? '#818cf8' : tag === 'input' ? '#f59e0b' : '#94a3b8'};
        font-size: 12px; color: ${tag === 'button' ? '#4338ca' : tag === 'input' ? '#92400e' : '#475569'};
        font-family: ${fontFamily};
      ">
        ${tag === 'button' ? '⬜' : tag === 'input' ? '▭' : '◻'} ${el}
      </div>`;
    }).join('');

    return `
    <div style="
      margin: ${si === 0 ? '0' : '12px'} 0; padding: 16px;
      border: 2px dashed #cbd5e1; border-radius: 12px;
      background: ${si % 2 === 0 ? '#f8fafc' : '#ffffff'};
    ">
      <div style="
        font-size: 13px; font-weight: 700; color: #334155;
        margin-bottom: 4px; font-family: ${fontFamily};
        display: flex; align-items: center; gap: 6px;
      ">
        <span style="
          display: inline-flex; align-items: center; justify-content: center;
          width: 20px; height: 20px; border-radius: 50%;
          background: #6366f1; color: white; font-size: 10px; font-weight: 700;
        ">${si + 1}</span>
        ${section.name}
      </div>
      ${section.description ? `<div style="font-size: 11px; color: #64748b; margin-bottom: 10px; font-family: ${fontFamily}; line-height: 1.4;">${section.description}</div>` : ''}
      ${elementsHtml ? `<div style="display: flex; flex-wrap: wrap; gap: 2px;">${elementsHtml}</div>` : ''}
    </div>`;
  }).join('');

  const interactionsHtml = (page.interactions || []).length > 0 ? `
    <div style="margin-top: 16px; padding: 14px; background: #eff6ff; border-radius: 10px; border: 1px solid #bfdbfe;">
      <div style="font-size: 12px; font-weight: 700; color: #1e40af; margin-bottom: 8px; font-family: ${fontFamily};">
        ⚡ 交互行为
      </div>
      ${(page.interactions || []).map((inter) => `
        <div style="font-size: 11px; color: #1e40af; padding: 3px 0; font-family: ${fontFamily}; line-height: 1.4;">
          → ${inter}
        </div>
      `).join('')}
    </div>
  ` : '';

  const featuresHtml = (page.keyFeatures || []).length > 0 ? `
    <div style="margin-top: 10px; padding: 14px; background: #f0fdf4; border-radius: 10px; border: 1px solid #bbf7d0;">
      <div style="font-size: 12px; font-weight: 700; color: #166534; margin-bottom: 8px; font-family: ${fontFamily};">
        ★ 核心功能
      </div>
      ${(page.keyFeatures || []).map((feat) => `
        <div style="font-size: 11px; color: #166534; padding: 3px 0; font-family: ${fontFamily}; line-height: 1.4;">
          • ${feat}
        </div>
      `).join('')}
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>方案预览 - ${page.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: ${fontFamily}; background: #fafafa; }
  </style>
</head>
<body>
  <div style="max-width: ${maxWidth}; margin: 0 auto; padding: ${isMobile ? '16px' : '32px 24px'};">
    <!-- Page Header -->
    <div style="
      padding: 20px 0 16px; margin-bottom: 16px;
      border-bottom: 2px solid #e2e8f0;
    ">
      <div style="
        display: flex; align-items: center; gap: 10px;
        margin-bottom: 6px;
      ">
        <span style="
          display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 8px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white; font-size: 14px; font-weight: 700;
          font-family: ${fontFamily};
        ">${(page.name || '?')[0]}</span>
        <div>
          <h1 style="font-size: ${isMobile ? '18px' : '22px'}; font-weight: 700; color: #0f172a; font-family: ${fontFamily};">${page.name}</h1>
          <div style="font-size: 11px; color: #94a3b8; font-family: ${fontFamily}; margin-top: 2px;">${page.route || ''}</div>
        </div>
      </div>
      ${page.description ? `<p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 8px; font-family: ${fontFamily};">${page.description}</p>` : ''}
      ${page.layout ? `<div style="margin-top: 10px; padding: 8px 12px; background: #f1f5f9; border-radius: 8px; font-size: 11px; color: #475569; font-family: ${fontFamily};"><strong>布局：</strong>${page.layout}</div>` : ''}
    </div>

    <!-- Sections -->
    <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; font-family: ${fontFamily};">
      页面区块结构 (${(page.sections || []).length} 个区块)
    </div>
    ${sectionsHtml}

    <!-- Interactions & Features -->
    ${interactionsHtml}
    ${featuresHtml}
  </div>
</body>
</html>`;
}

/**
 * Guess element type from name for visual styling
 */
function guessElementTag(name) {
  if (!name) return 'div';
  const lower = name.toLowerCase();
  if (/按钮|btn|button|提交|确认|取消|删除|新增|添加|保存|导出|导入|搜索|登录|注册|发送/.test(lower)) return 'button';
  if (/输入|搜索框|input|textarea|文本框|密码|邮箱|手机|用户名|表单/.test(lower)) return 'input';
  if (/图片|img|image|头像|封面|banner|轮播|图标/.test(lower)) return 'img';
  if (/列表|table|表格|卡片|card|grid|list/.test(lower)) return 'list';
  if (/导航|nav|menu|菜单|tab|标签/.test(lower)) return 'nav';
  return 'div';
}

/**
 * Generate wireframe HTML for all pages in a plan
 */
export function generateAllWireframes(pages, platform) {
  return pages.map((page) => generateWireframeHtml(page, platform));
}
