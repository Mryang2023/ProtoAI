/**
 * Generation module — HTML generation, repair, navigation injection, and file utilities.
 */

import { callAI, callAIStream } from './providers.js';

// ── Style Specs ─────────────────────────────────────────

export const STYLE_DESCRIPTIONS = {
  minimal: '极简风格：大量留白，黑白配色，Helvetica字体，极小圆角，精简克制',
  business: '商务风格：蓝白配色，系统字体，适中圆角，专业稳重',
  playful: '活泼风格：暖色调，橙色点缀，圆体字体，大圆角，轻松活泼的语气',
  tech: '科技风格：深色背景，绿色点缀，等宽字体，代码风格排版',
  editorial: '文艺风格：米色底，棕色点缀，衬线字体，斜体标题，阅读体验佳',
  modern: '现代SaaS：纯净白底，靛蓝主色，大圆角卡片，柔和阴影，清晰的信息层级',
  elegant: '优雅高端：纯黑背景，金色点缀，精致衬线字体，奢品质感',
  fintech: '金融科技：深蓝背景，青色点缀，数据可视化风格，紧凑专业排版',
};

export const STYLE_SPECS = {
  minimal: {
    colors: '背景 #ffffff，文字 #111111，次要文字 #888888，强调色 #111111，边框 #eeeeee',
    typography: "font-family: 'Helvetica Neue', Arial, sans-serif; 标题 font-weight: 600",
    components: 'border-radius: 2px; box-shadow: none; border: 1px solid #eeeeee',
    spacing: 'padding: 大量留白 60-80px; gap: 24-40px',
  },
  business: {
    colors: '背景 #fafbfc，表面 #ffffff，文字 #1a1a2e，次要 #666666，主色 #2563eb，边框 #e8ecf0',
    typography: "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    components: 'border-radius: 12-16px; box-shadow: 轻微投影; border: 1px solid #e8ecf0',
    spacing: 'padding: 32-48px; gap: 16-24px',
  },
  playful: {
    colors: '背景 #fffbeb，表面 #ffffff，文字 #1c1917，次要 #78716c，主色 #f97316，边框 #fed7aa',
    typography: "font-family: 'Nunito', -apple-system, sans-serif; 标题 font-weight: 700",
    components: 'border-radius: 20px; 活泼阴影; 按钮圆角 20px',
    spacing: 'padding: 32-48px; gap: 20-32px',
  },
  tech: {
    colors: '背景 #0f172a，表面 #1e293b，文字 #e2e8f0，次要 #94a3b8，主色 #22c55e，边框 #334155',
    typography: "font-family: 'SF Mono', 'Fira Code', monospace; 代码感标题",
    components: 'border-radius: 8px; 顶部 2px 主色线条; 无阴影',
    spacing: 'padding: 24-40px; gap: 16-24px',
  },
  editorial: {
    colors: '背景 #faf9f6，表面 #ffffff，文字 #1a1a1a，次要 #6b7280，主色 #78350f，边框 #e5e1d8',
    typography: "font-family: 'Georgia', 'Times New Roman', serif; 标题 italic",
    components: 'border-radius: 4px; 无阴影; 细边框 1px solid #e5e1d8',
    spacing: 'padding: 40-60px; gap: 24-32px; 阅读最大宽度 700px',
  },
  modern: {
    colors: '背景 #f8fafc，表面 #ffffff，文字 #0f172a，次要 #64748b，主色 #6366f1，边框 #e2e8f0',
    typography: "font-family: 'Inter', -apple-system, sans-serif; 标题 font-weight: 700; letter-spacing: -0.02em",
    components: 'border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e2e8f0',
    spacing: 'padding: 32-48px; gap: 20-28px; 最大宽度 1280px',
  },
  elegant: {
    colors: '背景 #0a0a0a，表面 #171717，文字 #f5f5f4，次要 #a8a29e，主色 #d4af37，边框 #292524',
    typography: "font-family: 'Playfair Display', Georgia, serif; 标题 letter-spacing: 0.05em",
    components: 'border-radius: 2px; 无阴影; 细边框 1px solid #292524; 金色装饰线',
    spacing: 'padding: 48-80px; gap: 32-48px; 大量留白营造高级感',
  },
  fintech: {
    colors: '背景 #0c1222，表面 #1a2332，文字 #e2e8f0，次要 #94a3b8，主色 #06b6d4，边框 #1e293b',
    typography: "font-family: 'Inter', -apple-system, sans-serif; 数据用 monospace; 标题 font-weight: 600",
    components: 'border-radius: 8px; 轻微投影; border: 1px solid #1e293b; 数据卡片风格',
    spacing: 'padding: 24-40px; gap: 16-24px; 紧凑信息密度',
  },
};

// ── Platform Specs ──────────────────────────────────────

export const PLATFORM_SPECS = {
  mobile: {
    label: '移动端',
    viewport: 'max-width: 375px; margin: 0 auto; min-height: 100vh; position: relative;',
    navigation: '底部标签栏（fixed bottom tab bar），包含 3-5 个主要入口，每个标签带图标+文字，当前页面高亮。不要使用顶部导航栏。',
    layout: '单列布局，全宽内容区，卡片式排列。使用 flex-direction: column。',
    interaction: '触控优先：按钮最小高度 44px，点击区域足够大，使用大圆角（12-16px），适合手指操作。',
    meta: '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">',
  },
  pc: {
    label: 'PC端',
    viewport: 'max-width: 1200px; margin: 0 auto; padding: 0 24px;',
    navigation: '顶部水平导航栏（sticky top nav），包含 logo + 页面链接，当前页面高亮。',
    layout: '宽幅多列布局，可使用 grid 或 flex 横向排列。',
    interaction: '鼠标交互：标准按钮大小，hover 效果，下拉菜单等桌面端交互。',
    meta: '<meta name="viewport" content="width=device-width, initial-scale=1">',
  },
};

// ── Style Spec Builder ──────────────────────────────────

export function buildStyleSpec(selectedStyles, styleDesc, referenceSite = '') {
  const primary = selectedStyles[0] || 'business';
  const spec = STYLE_SPECS[primary] || STYLE_SPECS.business;
  const labels = selectedStyles.map((s) => STYLE_DESCRIPTIONS[s]).filter(Boolean);

  let result = `【全局设计规范 — 所有页面必须严格遵守】
配色方案：${spec.colors}
字体：${spec.typography}
组件样式：${spec.components}
间距：${spec.spacing}`;

  if (labels.length > 1) {
    result += `\n融合风格：${labels.join('；')}`;
  }
  if (styleDesc) {
    result += `\n补充要求：${styleDesc}`;
  }
  if (referenceSite) {
    result += `\n\n参考网站风格：请参考 ${referenceSite} 的视觉设计风格（配色、排版、圆角、阴影、间距等），在生成原型时尽量模仿该网站的设计语言和美感。如果无法访问该网站，请根据你对该网站风格的认知来设计。`;
  }
  result += '\n\n重要：所有页面必须使用相同的配色、字体和组件风格，保持视觉统一。';
  return result;
}

// ── Reference Template Extraction ───────────────────────

/**
 * 从 HTML 中提取完整的标签块（正确处理嵌套）
 * 例如 extractTagBlock(html, 'nav') 会提取第一个 <nav>...</nav> 包括所有嵌套内容
 */
function extractTagBlock(html, tagName) {
  const openRe = new RegExp(`<${tagName}(?:\\s[^>]*)?>|<${tagName}>`, 'gi');
  const match = openRe.exec(html);
  if (!match) return '';

  const start = match.index;
  let depth = 0;
  let i = match.index;
  const closeTag = `</${tagName}>`;
  const openPattern = new RegExp(`<${tagName}[\\s>]`, 'gi');
  const closePattern = new RegExp(closeTag, 'gi');

  while (i < html.length) {
    openPattern.lastIndex = i;
    closePattern.lastIndex = i;
    const nextOpen = openPattern.exec(html);
    const nextClose = closePattern.exec(html);

    if (!nextClose) break; // no more closing tags

    if (nextOpen && nextOpen.index < nextClose.index) {
      depth++;
      i = nextOpen.index + 1;
    } else {
      depth--;
      if (depth === 0) {
        return html.slice(start, nextClose.index + closeTag.length);
      }
      i = nextClose.index + 1;
    }
  }

  // Fallback: return from start to first closing tag
  const fallbackClose = html.indexOf(closeTag, start);
  if (fallbackClose !== -1) {
    return html.slice(start, fallbackClose + closeTag.length);
  }
  return '';
}

/**
 * 从首页 HTML 中提取参考模板（导航栏 + 全局样式），用于后续页面的一致性约束
 * @param {string} html - 首页生成的完整 HTML
 * @returns {{ navHtml: string, styleCss: string, headerHtml: string }}
 */
export function extractReferenceTemplate(html) {
  const result = { navHtml: '', styleCss: '', headerHtml: '' };

  // 提取 <style> 块内容（取第一个 style 标签，通常是全局样式）
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (styleMatch) {
    result.styleCss = styleMatch[1].trim();
  }

  // 提取 <nav> 标签（使用嵌套感知的提取）
  result.navHtml = extractTagBlock(html, 'nav');

  // 提取 <header> 标签（有些页面用 header 而非 nav）
  result.headerHtml = extractTagBlock(html, 'header');

  // 如果既没有 nav 也没有 header，尝试提取顶部导航区域
  if (!result.navHtml && !result.headerHtml) {
    const navDivMatch = html.match(
      /<div[^>]*class="[^"]*(?:nav|top-bar|header|navigation|navbar)[^"]*"[^>]*>/i
    );
    if (navDivMatch) {
      // Use tag-counting to extract the full div block
      const start = navDivMatch.index;
      let depth = 0;
      let i = start;
      while (i < html.length) {
        const nextOpen = html.indexOf('<div', i);
        const nextClose = html.indexOf('</div>', i);
        if (nextClose === -1) break;
        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth++;
          i = nextOpen + 4;
        } else {
          depth--;
          if (depth === 0) {
            result.navHtml = html.slice(start, nextClose + 6);
            break;
          }
          i = nextClose + 6;
        }
      }
    }
  }

  return result;
}

/**
 * 构建参考模板约束文本，注入到后续页面的 prompt 中
 */
export function buildReferenceConstraint(refTemplate) {
  if (!refTemplate) return '';

  const navSnippet = refTemplate.navHtml || refTemplate.headerHtml;
  if (!navSnippet && !refTemplate.styleCss) return '';

  const parts = [];
  parts.push('\n\n## ⚠️ 跨页面一致性约束（必须严格遵守）\n');
  parts.push('以下是该项目已生成页面的导航栏和全局样式参考，你的导航栏结构、样式类名、配色方案必须与参考**完全一致**。\n');

  if (navSnippet) {
    parts.push('### 参考导航栏 HTML：');
    parts.push('```html');
    parts.push(navSnippet);
    parts.push('```\n');
  }

  if (refTemplate.styleCss) {
    // 只取前 100 行样式，避免 prompt 过长
    const cssLines = refTemplate.styleCss.split('\n');
    const truncatedCss = cssLines.slice(0, 100).join('\n');
    const wasTruncated = cssLines.length > 100;

    parts.push('### 参考全局样式（CSS）：');
    parts.push('```css');
    parts.push(truncatedCss);
    if (wasTruncated) parts.push('/* ... 后续样式省略，但配色和布局变量必须保持一致 */');
    parts.push('```\n');
  }

  parts.push('### 具体要求：');
  parts.push('1. 导航栏的 HTML 结构、类名、颜色必须与参考模板完全相同');
  parts.push('2. 导航栏中的项目标题文字必须与参考模板一致（不要改名）');
  parts.push('3. CSS 变量（:root 或顶层变量）中的配色方案必须复用');
  parts.push('4. 你可以为当前页面添加新的样式，但不能修改导航栏和全局配色');
  parts.push('5. 如果参考模板中有页面列表链接，保留相同的链接结构，用 class 标记当前页');

  return parts.join('\n');
}

// ── Theme Consistency Utilities ──────────────────────────

/**
 * Extract :root CSS variables from HTML's first <style> block.
 * Returns the full :root { ... } block string, or empty string if not found.
 */
function extractRootCss(html) {
  if (!html) return '';
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (!styleMatch) return '';
  const css = styleMatch[1];
  // Match :root block — handle nested braces
  const rootStart = css.indexOf(':root');
  if (rootStart === -1) return '';
  const braceStart = css.indexOf('{', rootStart);
  if (braceStart === -1) return '';
  let depth = 1;
  let i = braceStart + 1;
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    i++;
  }
  return css.slice(rootStart, i).trim();
}

/**
 * Inject shared :root CSS variables into a page's first <style> block.
 * Prepends the shared :root block so it overrides the page's own :root values.
 */
function injectRootCss(html, rootCss) {
  if (!html || !rootCss) return html;
  const styleMatch = html.match(/<style[^>]*>/i);
  if (!styleMatch) return html;
  const insertPos = styleMatch.index + styleMatch[0].length;
  // Check if the page already has a :root block — if so, inject variables at the start of it
  const existingRoot = html.indexOf(':root', insertPos);
  const styleClose = html.indexOf('</style>', insertPos);
  if (existingRoot !== -1 && existingRoot < styleClose) {
    // Page has its own :root — inject shared variables at the beginning of :root block
    const bracePos = html.indexOf('{', existingRoot);
    if (bracePos !== -1 && bracePos < styleClose) {
      // Extract just the variable declarations from shared rootCss
      const varLines = rootCss.match(/--[\w-]+\s*:\s*[^;]+;/g) || [];
      if (varLines.length === 0) return html;
      const injection = '\n/* ProtoAI 统一主题变量 */\n' + varLines.join('\n') + '\n';
      return html.slice(0, bracePos + 1) + injection + html.slice(bracePos + 1);
    }
  }
  // No existing :root — prepend the full shared :root block
  const injection = '\n/* ProtoAI 统一主题 */\n' + rootCss + '\n';
  return html.slice(0, insertPos) + injection + html.slice(insertPos);
}

// ── HTML Utilities ──────────────────────────────────────

export function extractHtml(text) {
  let html = text.trim();
  const fenceMatch = html.match(/```(?:html)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) html = fenceMatch[1].trim();
  if (!html.startsWith('<!') && !html.startsWith('<html')) {
    const start = html.indexOf('<!DOCTYPE');
    const htmlStart = start !== -1 ? start : html.indexOf('<html');
    if (htmlStart > 0) html = html.slice(htmlStart);
  }
  html = repairHtml(html);
  return html;
}

export function repairHtml(html) {
  if (!html) return html;
  if (!html.includes('</html>')) {
    const styleOpens = (html.match(/<style/g) || []).length;
    const styleCloses = (html.match(/<\/style>/g) || []).length;
    if (styleOpens > styleCloses) html += '\n</style>';

    const tagsToClose = ['div', 'section', 'main', 'header', 'footer', 'nav', 'article', 'aside', 'body', 'html'];
    for (const tag of tagsToClose) {
      const opens = (html.match(new RegExp(`<${tag}[\\s>]`, 'gi')) || []).length;
      const closes = (html.match(new RegExp(`</${tag}>`, 'gi')) || []).length;
      const diff = opens - closes;
      for (let j = 0; j < diff; j++) {
        html += `\n</${tag}>`;
      }
    }
  }
  return html;
}

// ── Filename Helper ─────────────────────────────────────

export function pageFileName(page, index) {
  const safe = (page.name || 'page')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_');
  return `${String(index + 1).padStart(2, '0')}_${safe}.html`;
}

// ── Navigation Injection ────────────────────────────────

export function injectNavigation(pages) {
  if (pages.length <= 1) return pages;

  return pages.map((p, currentPageIndex) => {
    if (!p.html) return p;
    let html = p.html;

    const links = pages.map((page, i) => {
      const fn = pageFileName(page, i);
      const isCurrent = i === currentPageIndex;
      if (isCurrent) {
        return `<a href="${fn}" style="text-decoration:none;color:#fff;padding:5px 12px;border-radius:5px;font-size:13px;font-weight:600;background:#2563eb;">${page.name}</a>`;
      }
      return `<a href="${fn}" style="text-decoration:none;color:#555;padding:5px 12px;border-radius:5px;font-size:13px;font-weight:500;transition:all .15s;" onmouseover="this.style.background='#f0f0f0';this.style.color='#111'" onmouseout="this.style.background='transparent';this.style.color='#555'">${page.name}</a>`;
    }).join('');

    // Show page count and current indicator
    const pageInfo = `<span style="font-size:12px;color:#aaa;margin-left:auto;white-space:nowrap;">${currentPageIndex + 1} / ${pages.length}</span>`;

    const navHtml = `
  <nav data-protoai-nav style="position:fixed;top:0;left:0;right:0;z-index:99999;display:flex;align-items:center;gap:6px;padding:8px 20px;background:#fff;border-bottom:1px solid #eee;box-shadow:0 1px 4px rgba(0,0,0,0.06);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <span style="font-weight:700;font-size:13px;margin-right:12px;color:#2563eb;white-space:nowrap;letter-spacing:-0.3px;">ProtoAI</span>
    <div style="display:flex;align-items:center;gap:2px;overflow-x:auto;flex:1;scrollbar-width:none;-webkit-overflow-scrolling:touch;">
      ${links}
    </div>
    ${pageInfo}
  </nav>
  <div style="height:44px;"></div>`;

    if (html.includes('<body>')) {
      html = html.replace('<body>', `<body>${navHtml}`);
    } else if (/<body\s[^>]*>/.test(html)) {
      html = html.replace(/<body\s[^>]*>/, (match) => `${match}${navHtml}`);
    } else if (html.includes('</body>')) {
      html = html.replace('</body>', `${navHtml}\n</body>`);
    } else {
      html = navHtml + '\n' + html;
    }

    return { ...p, html };
  });
}

// ── Prompt Helpers ──────────────────────────────────────

export function buildContextPrompt(contentDesc, fileContents, selectedStyles, styleDesc, referenceSite = '') {
  let prompt = '';
  if (fileContents.length > 0) {
    prompt += '## 上传的需求文件内容\n\n';
    fileContents.forEach(({ name, content }) => {
      prompt += `### 文件: ${name}\n\`\`\`\n${content}\n\`\`\`\n\n`;
    });
  }
  if (contentDesc) prompt += `## 页面需求描述\n${contentDesc}\n\n`;
  const styleLabels = selectedStyles.map((s) => STYLE_DESCRIPTIONS[s]).filter(Boolean);
  if (styleLabels.length > 0 || styleDesc || referenceSite) {
    prompt += '## 风格偏好\n';
    if (styleLabels.length > 0) prompt += styleLabels.map((s) => `- ${s}`).join('\n') + '\n';
    if (styleDesc) prompt += `补充说明：${styleDesc}\n`;
    if (referenceSite) prompt += `参考网站：${referenceSite}（请参考该网站的视觉设计风格）\n`;
    prompt += '\n';
  }
  return prompt;
}

// ── Page Generation ─────────────────────────────────────

function buildPageSystemPrompt(platform, hasReference) {
  const platSpec = PLATFORM_SPECS[platform] || PLATFORM_SPECS.pc;
  let prompt = `你是一个专业的 HTML/CSS 原型生成器。用户会给你单个页面的需求描述和全局设计规范，你需要生成一个完整、可直接运行的单页 HTML 文件。

目标平台：${platform === 'mobile' ? '移动端（手机APP/小程序）' : 'PC端（桌面网页）'}

平台规范：
- 视口设置：${platSpec.meta}
- 布局约束：${platSpec.viewport}
- 导航模式：${platSpec.navigation}
- 布局方式：${platSpec.layout}
- 交互方式：${platSpec.interaction}

规则：
1. 输出必须是完整的 HTML 文件，从 <!DOCTYPE html> 到 </html>
2. 所有 CSS 写在 <style> 标签内，不要使用外部 CSS 文件
3. 不要使用外部 JS 库，纯 HTML + CSS 即可
4. 页面要有良好的视觉效果、合理的排版和配色
5. 确保页面在不同屏幕尺寸下基本可用
6. 只输出 HTML 代码，不要输出任何解释性文字
7. 不要用 markdown 代码块包裹，直接输出 HTML
8. 必须严格遵守全局设计规范中的配色、字体和组件样式
9. ${platform === 'mobile' ? '页面内容区域顶部放置简洁的文字链接导航，底部放置固定导航栏（tab bar）' : '页面内容区域上方放置水平导航栏'}
10. 所有导航链接必须使用 <a href="文件名.html"> 格式，文件名必须与下方页面列表中的文件名完全一致
11. 页面中所有可点击的按钮、链接，如果对应其他页面的功能，都必须使用 <a> 标签并链接到对应的页面文件
12. 所有图片必须使用占位图服务：使用 https://placehold.co/宽x高/背景色/文字色?text=描述 格式生成占位图。例如 https://placehold.co/400x300/e2e8f0/64748b?text=Product+Image 。头像使用圆形占位图，Banner 使用宽幅占位图。不要留空白或使用 broken image
13. 所有可交互元素必须有完整的状态样式：按钮和链接需要包含 :hover（鼠标悬停变色/阴影）、:active（按下反馈）、:focus-visible（键盘焦点环）、:disabled（禁用灰化）状态。卡片元素需要 hover 阴影提升效果
14. 使用 CSS 自定义属性（变量）管理配色和间距，使用 clamp() 函数实现响应式字体大小（例如 font-size: clamp(14px, 2vw, 18px)），确保在不同视口下平滑过渡`;

  if (hasReference) {
    prompt += `\n15. 【最高优先级】如果用户提供了"参考模板"或"跨页面一致性约束"，你的导航栏 HTML 结构、CSS 类名、配色变量必须与参考模板完全一致，不允许做任何修改或重新设计。`;
  }

  return prompt;
}

function buildPageUserPrompt(page, allPages, fileContents, contentDesc, styleSpec, platform, referenceConstraint) {
  let userPrompt = '';
  userPrompt += `## 当前页面信息\n`;
  userPrompt += `- 页面名称：${page.name}\n`;
  userPrompt += `- 页面描述：${page.description}\n`;
  userPrompt += `- 页面路由：${page.route}\n`;
  userPrompt += `- 目标平台：${platform === 'mobile' ? '移动端（手机APP/小程序）' : 'PC端（桌面网页）'}\n\n`;

  if (allPages && allPages.length > 1) {
    userPrompt += `## 完整页面列表及对应文件名（共 ${allPages.length} 页）\n`;
    allPages.forEach((p, i) => {
      const fn = pageFileName(p, i);
      const marker = p.route === page.route ? ' ← 当前页面' : '';
      userPrompt += `${i + 1}. ${p.name} → 文件名: ${fn}${marker}\n`;
    });
    userPrompt += `\n【重要】页面间的导航和跳转必须使用上述文件名作为 href 属性值。`;
    userPrompt += `例如：要跳转到「${allPages[0].name}」页面，必须使用 <a href="${pageFileName(allPages[0], 0)}">。`;
    userPrompt += `所有按钮、链接、导航元素都应使用 <a> 标签并设置正确的 href 属性来实现页面跳转。\n\n`;
  }

  // 注入参考模板约束（仅对非首页生效）
  if (referenceConstraint) {
    userPrompt += referenceConstraint + '\n\n';
  }

  if (fileContents.length > 0) {
    userPrompt += '## 上传的需求文件内容\n\n';
    fileContents.forEach(({ name, content }) => {
      userPrompt += `### 文件: ${name}\n\`\`\`\n${content}\n\`\`\`\n\n`;
    });
  }

  if (contentDesc) {
    userPrompt += `## 整体需求描述\n${contentDesc}\n\n`;
  }

  userPrompt += styleSpec + '\n\n';
  userPrompt += `请根据以上信息，为「${page.name}」页面生成完整的单页 HTML 原型。`;
  userPrompt += '该页面应严格遵循规划中的功能描述和全局设计规范。';
  userPrompt += `页面必须符合${platform === 'mobile' ? '移动端' : 'PC端'}的布局规范。`;
  if (referenceConstraint) {
    userPrompt += '导航栏和全局样式必须严格复用参考模板，保持一致性。';
  }
  userPrompt += '所有页面间的跳转链接必须使用正确的文件名。';
  userPrompt += '只输出 HTML 代码，不要输出任何解释性文字。';
  return userPrompt;
}

export async function generateSinglePage(provider, config, page, styleSpec, contentDesc, fileContents, selectedStyles, styleDesc, allPages, platform = 'pc', signal, referenceConstraint = '') {
  const hasReference = !!referenceConstraint;
  const systemPrompt = buildPageSystemPrompt(platform, hasReference);
  const userPrompt = buildPageUserPrompt(page, allPages, fileContents, contentDesc, styleSpec, platform, referenceConstraint);
  const rawResponse = await callAI(provider, config, systemPrompt, userPrompt, signal);
  return { html: extractHtml(rawResponse.content), finishReason: rawResponse.finishReason };
}

/**
 * Streaming version of generateSinglePage.
 * Calls `onChunk(htmlString)` with progressively accumulated (and repaired) HTML.
 */
export async function generateSinglePageStream(provider, config, page, styleSpec, contentDesc, fileContents, selectedStyles, styleDesc, allPages, platform = 'pc', onChunk, signal, referenceConstraint = '') {
  const hasReference = !!referenceConstraint;
  const systemPrompt = buildPageSystemPrompt(platform, hasReference);
  const userPrompt = buildPageUserPrompt(page, allPages, fileContents, contentDesc, styleSpec, platform, referenceConstraint);

  const rawResponse = await callAIStream(provider, config, systemPrompt, userPrompt, (fullText) => {
    const html = extractHtml(fullText);
    onChunk?.(html);
  }, signal);

  return { html: extractHtml(rawResponse.content), finishReason: rawResponse.finishReason };
}

// ── Batch Generation ────────────────────────────────────

export async function generateProjectPages(provider, config, plannedPages, styleSpec, contentDesc, fileContents, selectedStyles, styleDesc, platform, onProgress, onPageGenerated, onStream, signal) {
  if (!config?.apiKey) throw new Error('请先在设置中配置 AI 模型的 API Key');

  const MAX_CONCURRENT = 3;
  const STAGGER_DELAY_MS = 800;
  const MAX_RETRIES = 2;

  const results = new Array(plannedPages.length);
  const completed = new Set();

  onProgress?.(`正在生成 ${plannedPages.length} 个页面（首页优先生成以提取参考模板）...`);

  async function generateWithRetry(page, index, shouldStream, referenceConstraint) {
    let lastError = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      try {
        // Use streaming for the designated page (first page by default)
        if (shouldStream && onStream && attempt === 0) {
          const result = await generateSinglePageStream(
            provider, config, page, styleSpec, contentDesc,
            fileContents, selectedStyles, styleDesc, plannedPages, platform,
            (html) => onStream(html, index), signal, referenceConstraint
          );
          return result.html;
        }
        const result = await generateSinglePage(
          provider, config, page, styleSpec, contentDesc,
          fileContents, selectedStyles, styleDesc, plannedPages, platform, signal,
          referenceConstraint
        );
        if (result.finishReason === 'length' && attempt < MAX_RETRIES) {
          console.warn(`Page "${page.name}" truncated (attempt ${attempt + 1}), retrying...`);
          continue;
        }
        return result.html;
      } catch (err) {
        if (err.name === 'AbortError' || signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        lastError = err;
        if (attempt < MAX_RETRIES) {
          // Abortable delay: resolve on timeout, reject on abort
          await new Promise((resolve, reject) => {
            const timer = setTimeout(resolve, 1000 * (attempt + 1));
            if (signal) {
              signal.addEventListener('abort', () => {
                clearTimeout(timer);
                reject(new DOMException('Aborted', 'AbortError'));
              }, { once: true });
            }
          });
        }
      }
    }
    throw lastError || new Error('生成失败');
  }

  // ── Phase 1: Generate the first page (reference page) with streaming ──
  let referenceConstraint = '';
  try {
    const firstPageHtml = await generateWithRetry(plannedPages[0], 0, true, '');
    const firstResult = { ...plannedPages[0], html: firstPageHtml };
    results[0] = firstResult;
    completed.add(0);
    onProgress?.(`已完成 ${completed.size}/${plannedPages.length} 页（参考模板提取中）`);
    onPageGenerated?.(firstResult, 0, plannedPages.length);

    // Extract reference template from the first page
    if (plannedPages.length > 1) {
      const refTemplate = extractReferenceTemplate(firstPageHtml);
      referenceConstraint = buildReferenceConstraint(refTemplate);
      if (referenceConstraint) {
        console.log('[ProtoAI] 参考模板已提取，将注入后续页面 prompt');
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      results[0] = { ...plannedPages[0], html: '', error: '已取消' };
      completed.add(0);
    } else {
      results[0] = { ...plannedPages[0], html: '', error: err.message };
      completed.add(0);
      onProgress?.(`首页生成失败，后续页面将无参考模板约束`);
      onPageGenerated?.(results[0], 0, plannedPages.length);
    }
  }

  // ── Phase 2: Generate remaining pages concurrently (with reference constraint) ──
  if (plannedPages.length > 1) {
    const remainingPromises = plannedPages.slice(1).map(async (page, i) => {
      const pageIndex = i + 1;
      if (signal?.aborted) return;
      if (i > 0 && i % MAX_CONCURRENT === 0) {
        await new Promise((r) => setTimeout(r, STAGGER_DELAY_MS));
        if (signal?.aborted) return;
      }
      try {
        const html = await generateWithRetry(page, pageIndex, false, referenceConstraint);
        const result = { ...page, html };
        results[pageIndex] = result;
        completed.add(pageIndex);
        onProgress?.(`已完成 ${completed.size}/${plannedPages.length} 页`);
        onPageGenerated?.(result, pageIndex, plannedPages.length);
      } catch (err) {
        if (err.name === 'AbortError') {
          results[pageIndex] = { ...page, html: '', error: '已取消' };
          completed.add(pageIndex);
          return;
        }
        const result = { ...page, html: '', error: err.message };
        results[pageIndex] = result;
        completed.add(pageIndex);
        onProgress?.(`已完成 ${completed.size}/${plannedPages.length} 页`);
        onPageGenerated?.(result, pageIndex, plannedPages.length);
      }
    });

    await Promise.allSettled(remainingPromises);
  }

  // ── Phase 3: Enforce theme consistency across all pages ──
  // Extract :root CSS variables from the first (reference) page and inject into all other pages
  if (results[0]?.html) {
    const rootCss = extractRootCss(results[0].html);
    if (rootCss) {
      for (let i = 1; i < results.length; i++) {
        if (results[i]?.html) {
          results[i] = { ...results[i], html: injectRootCss(results[i].html, rootCss) };
        }
      }
    }
  }

  // Return raw pages without injected navigation.
  // ProtoAI's own UI handles page switching; nav is only injected at export time.
  return { pages: results };
}

export async function regenerateSinglePage(provider, config, page, styleSpec, contentDesc, fileContents, selectedStyles, styleDesc, allPages, platform = 'pc', referenceConstraint = '') {
  return generateSinglePage(provider, config, page, styleSpec, contentDesc, fileContents, selectedStyles, styleDesc, allPages, platform, undefined, referenceConstraint);
}

// ── Refine Page ─────────────────────────────────────────

/**
 * 智能截断 HTML，在标签边界处切割，避免切断标签属性
 */
function truncateHtmlAtBoundary(html, maxLen) {
  if (html.length <= maxLen) return html;
  const cutPoint = html.lastIndexOf('>', maxLen);
  if (cutPoint > maxLen * 0.8) {
    return html.slice(0, cutPoint + 1) + '\n<!-- 内容过长已截断 -->';
  }
  return html.slice(0, maxLen) + '\n<!-- 内容过长已截断 -->';
}

export async function refinePage(provider, config, currentHtml, userInstruction) {
  if (!config?.apiKey) throw new Error('请先在设置中配置 AI 模型的 API Key');

  const systemPrompt = `你是一个专业的 HTML/CSS 前端工程师。用户会给你当前页面的 HTML 代码和一条修改指令。请按照指令修改 HTML 并返回完整的修改后 HTML。

规则：
1. 返回完整的 HTML 文件（从 <!DOCTYPE> 到 </html>）
2. 只修改用户要求的部分，保持其他内容不变
3. 只输出 HTML 代码，不要输出任何解释性文字
4. 不要用 markdown 代码块包裹，直接输出 HTML`;

  const userPrompt = `## 当前页面 HTML\n\n\`\`\`html\n${truncateHtmlAtBoundary(currentHtml, 12000)}\n\`\`\`\n\n## 修改指令\n\n${userInstruction}\n\n请按照修改指令调整 HTML，返回完整的修改后 HTML 代码。`;

  const rawResponse = await callAI(provider, config, systemPrompt, userPrompt);
  return extractHtml(rawResponse.content);
}

/**
 * Streaming version of refinePage.
 * Calls `onChunk(htmlString)` with progressively extracted HTML during generation.
 */
export async function refinePageStream(provider, config, currentHtml, userInstruction, onChunk, signal) {
  if (!config?.apiKey) throw new Error('请先在设置中配置 AI 模型的 API Key');

  const systemPrompt = `你是一个专业的 HTML/CSS 前端工程师。用户会给你当前页面的 HTML 代码和一条修改指令。请按照指令修改 HTML 并返回完整的修改后 HTML。

规则：
1. 返回完整的 HTML 文件（从 <!DOCTYPE> 到 </html>）
2. 只修改用户要求的部分，保持其他内容不变
3. 只输出 HTML 代码，不要输出任何解释性文字
4. 不要用 markdown 代码块包裹，直接输出 HTML`;

  const userPrompt = `## 当前页面 HTML\n\n\`\`\`html\n${truncateHtmlAtBoundary(currentHtml, 12000)}\n\`\`\`\n\n## 修改指令\n\n${userInstruction}\n\n请按照修改指令调整 HTML，返回完整的修改后 HTML 代码。`;

  const rawResponse = await callAIStream(provider, config, systemPrompt, userPrompt, (fullText) => {
    const html = extractHtml(fullText);
    if (html) onChunk?.(html);
  }, signal);

  return extractHtml(rawResponse.content);
}

/**
 * Refine only a selected region of the page.
 * The AI receives the full HTML but focuses modifications on the marked region.
 */
export async function refineRegion(provider, config, currentHtml, regionHtml, userInstruction) {
  if (!config?.apiKey) throw new Error('请先在设置中配置 AI 模型的 API Key');

  const systemPrompt = `你是一个专业的 HTML/CSS 前端工程师。用户会给你当前页面的完整 HTML 和一段被标记为【选中区域】的代码片段。
请只修改选中区域的部分，然后将修改后的选中区域替换回完整 HTML 中对应的位置。

规则：
1. 返回完整的 HTML 文件（从 <!DOCTYPE> 到 </html>）
2. 只修改【选中区域】内的代码，其余部分保持不变
3. 只输出 HTML 代码，不要输出任何解释性文字
4. 不要用 markdown 代码块包裹，直接输出 HTML`;

  const userPrompt = `## 当前完整页面 HTML\n\n\`\`\`html\n${truncateHtmlAtBoundary(currentHtml, 12000)}\n\`\`\`\n\n## 选中区域（仅修改此部分）\n\n\`\`\`html\n${regionHtml}\n\`\`\`\n\n## 修改指令\n\n${userInstruction}\n\n请修改选中区域，然后将修改后的区域替换回完整 HTML 中。返回完整 HTML。`;

  const rawResponse = await callAI(provider, config, systemPrompt, userPrompt);
  return extractHtml(rawResponse.content);
}

// ── File Reading ────────────────────────────────────────

export async function readFileContents(files) {
  const results = [];
  for (const file of files) {
    if (file.type?.startsWith('image/')) {
      results.push({ name: file.name, content: `[图片文件: ${file.name}，类型 ${file.type}]` });
      continue;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const isExcel =
      file.type === 'application/vnd.ms-excel' ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      ext === 'xls' || ext === 'xlsx';

    if (isExcel) {
      try {
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        let text = `Excel 文件: ${file.name}（共 ${workbook.SheetNames.length} 个工作表）\n\n`;
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const csv = XLSX.utils.sheet_to_csv(sheet, { FS: '\t', blankrows: false });
          text += `--- 工作表: ${sheetName} ---\n${csv}\n\n`;
        }
        const maxChars = 30000;
        const truncated = text.length > maxChars
          ? text.slice(0, maxChars) + `\n\n... (Excel 内容过长，已截断，共 ${text.length} 字符)`
          : text;
        results.push({ name: file.name, content: truncated });
      } catch {
        results.push({ name: file.name, content: `[无法解析 Excel 文件: ${file.name}]` });
      }
      continue;
    }

    try {
      const text = await file.text();
      const maxChars = 15000;
      const truncated = text.length > maxChars
        ? text.slice(0, maxChars) + `\n\n... (文件过长，已截断，共 ${text.length} 字符)`
        : text;
      results.push({ name: file.name, content: truncated });
    } catch {
      results.push({ name: file.name, content: `[无法读取文件内容: ${file.name}]` });
    }
  }
  return results;
}
