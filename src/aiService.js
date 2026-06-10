/**
 * AI Service — calls configured AI provider to generate HTML prototypes.
 * Supports OpenAI, Anthropic Claude, and custom/local models (OpenAI-compatible).
 * Multi-page planning with shared style spec for visual consistency.
 */

const STYLE_DESCRIPTIONS = {
  minimal: '极简风格：大量留白，黑白配色，Helvetica字体，极小圆角，精简克制',
  business: '商务风格：蓝白配色，系统字体，适中圆角，专业稳重',
  playful: '活泼风格：暖色调，橙色点缀，圆体字体，大圆角，轻松活泼的语气',
  tech: '科技风格：深色背景，绿色点缀，等宽字体，代码风格排版',
  editorial: '文艺风格：米色底，棕色点缀，衬线字体，斜体标题，阅读体验佳',
};

// Concrete design tokens per style for cross-page consistency
const STYLE_SPECS = {
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
};

/**
 * Build a unified design spec string from selected styles.
 * This spec is injected into EVERY page prompt to ensure visual consistency.
 */
export function buildStyleSpec(selectedStyles, styleDesc) {
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
  result += '\n\n重要：所有页面必须使用相同的配色、字体和组件风格，保持视觉统一。';
  return result;
}

/**
 * Read text content from uploaded files (best-effort).
 * Supports text files (txt, md, csv, etc.), images (metadata only),
 * and Excel files (.xls, .xlsx) via the xlsx library.
 */
export async function readFileContents(files) {
  const results = [];
  for (const file of files) {
    // Skip images — just note the filename
    if (file.type?.startsWith('image/')) {
      results.push({ name: file.name, content: `[图片文件: ${file.name}，类型 ${file.type}]` });
      continue;
    }

    // Detect Excel files by MIME type or extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isExcel =
      file.type === 'application/vnd.ms-excel' ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      ext === 'xls' ||
      ext === 'xlsx';

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

    // Default: read as plain text
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

// ── AI Provider Calls ──────────────────────────────────

async function callAI(provider, config, systemPrompt, userPrompt) {
  if (!config?.apiKey) throw new Error('请先在设置中配置 AI 模型的 API Key');
  if (provider === 'claude') {
    return callClaude(config.apiKey, config.endpoint, config.model, systemPrompt, userPrompt);
  }
  return callOpenAICompatible(config.apiKey, config.endpoint, config.model, systemPrompt, userPrompt);
}

async function callOpenAICompatible(apiKey, endpoint, model, systemPrompt, userPrompt) {
  const baseUrl = endpoint || 'https://api.openai.com/v1';
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: model || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 16000,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    let msg = `API 请求失败 (${response.status})`;
    try { msg = JSON.parse(errorText).error?.message || msg; } catch {}
    throw new Error(msg);
  }
  const data = await response.json();
  const choice = data.choices?.[0];
  const content = choice?.message?.content;
  if (!content) throw new Error('AI 返回了空内容');
  return { content, finishReason: choice?.finish_reason || 'stop' };
}

async function callClaude(apiKey, endpoint, model, systemPrompt, userPrompt) {
  const baseUrl = endpoint || 'https://api.anthropic.com/v1';
  const url = `${baseUrl.replace(/\/$/, '')}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    let msg = `API 请求失败 (${response.status})`;
    try { msg = JSON.parse(errorText).error?.message || msg; } catch {}
    throw new Error(msg);
  }
  const data = await response.json();
  const content = data.content?.[0]?.text;
  if (!content) throw new Error('AI 返回了空内容');
  return { content, finishReason: data.stop_reason === 'max_tokens' ? 'length' : 'stop' };
}

function extractHtml(text) {
  let html = text.trim();
  const fenceMatch = html.match(/```(?:html)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) html = fenceMatch[1].trim();
  if (!html.startsWith('<!') && !html.startsWith('<html')) {
    const start = html.indexOf('<!DOCTYPE');
    const htmlStart = start !== -1 ? start : html.indexOf('<html');
    if (htmlStart > 0) html = html.slice(htmlStart);
  }
  // Repair truncated HTML: close unclosed tags
  html = repairHtml(html);
  return html;
}

/**
 * Attempt to close unclosed HTML tags when AI output was truncated.
 */
function repairHtml(html) {
  if (!html) return html;
  // If HTML is clearly truncated (no closing </html>)
  if (!html.includes('</html>')) {
    // Close any open style tag
    const styleOpens = (html.match(/<style/g) || []).length;
    const styleCloses = (html.match(/<\/style>/g) || []).length;
    if (styleOpens > styleCloses) html += '\n</style>';

    // Close any open div/section/main/header/footer/nav/article tags (common in layouts)
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

// ── Phase 1: Plan ──────────────────────────────────────

/**
 * Phase 1: Analyze requirements and plan page structure.
 * Returns { pages: [{name, description, route}], styleSpec: string }
 */
export async function planProject(provider, config, contentDesc, fileContents, selectedStyles, styleDesc, onProgress) {
  if (!config?.apiKey) throw new Error('请先在设置中配置 AI 模型的 API Key');
  onProgress?.('正在分析需求，规划页面结构...');

  const styleSpec = buildStyleSpec(selectedStyles, styleDesc);

  const systemPrompt = `你是一个专业的产品经理兼前端工程师。用户会给你产品需求描述和上传的文件内容，你需要分析这些需求，将项目拆分成多个页面，并返回页面规划方案。

返回格式要求（严格 JSON 数组）：
[
  {
    "name": "页面名称（中文）",
    "description": "页面功能简述（1-2句话）",
    "route": "/page-route"
  }
]

规则：
1. 每个页面应有明确的功能职责
2. route 使用英文小写 kebab-case 格式，以 / 开头
3. 如果需求较简单（单一页面），可以只返回 1 个页面
4. 不要输出任何其他内容，只输出 JSON 数组`;

  const userPrompt = buildContextPrompt(contentDesc, fileContents, selectedStyles, styleDesc)
    + '\n\n' + styleSpec
    + '\n\n请分析以上需求，将项目拆分为多个页面。返回严格的 JSON 数组格式，不要输出任何其他内容。';

  const rawResponse = await callAI(provider, config, systemPrompt, userPrompt);

  let pages;
  try {
    const jsonMatch = rawResponse.content.match(/\[[\s\S]*\]/);
    pages = JSON.parse(jsonMatch ? jsonMatch[0] : rawResponse.content);
  } catch {
    throw new Error('AI 返回的页面规划格式不正确，无法解析为 JSON');
  }
  if (!Array.isArray(pages) || pages.length === 0) throw new Error('AI 未能规划出有效的页面结构');

  return {
    pages: pages.map((p) => ({
      name: p.name || '未命名页面',
      description: p.description || '',
      route: p.route || `/${Math.random().toString(36).slice(2, 8)}`,
    })),
    styleSpec,
  };
}

// ── Shared filename helper ──────────────────────────────

/**
 * Generate a consistent filename for a page's HTML file.
 * Used by both injectNavigation() and the ZIP export to ensure links match files.
 */
export function pageFileName(page, index) {
  const safe = (page.name || 'page')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_');
  return `${String(index + 1).padStart(2, '0')}_${safe}.html`;
}

// ── Navigation Injection ──────────────────────────────

/**
 * Inject a unified navigation bar into each page's HTML so pages link to each other.
 * The nav is placed at the TOP of the page with position:fixed for always-visible access.
 * Only runs for multi-page projects.
 */
function injectNavigation(pages) {
  if (pages.length <= 1) return pages;

  return pages.map((p, currentPageIndex) => {
    if (!p.html) return p;
    let html = p.html;

    // Build links with current page highlighted
    const links = pages.map((page, i) => {
      const fn = pageFileName(page, i);
      const isCurrent = i === currentPageIndex;
      if (isCurrent) {
        return `<a href="${fn}" style="text-decoration:none;color:#2563eb;padding:6px 14px;border-radius:6px;font-size:14px;font-weight:600;background:rgba(37,99,235,0.08);">${page.name}</a>`;
      }
      return `<a href="${fn}" style="text-decoration:none;color:#555;padding:6px 14px;border-radius:6px;font-size:14px;font-weight:500;transition:all .15s;" onmouseover="this.style.background='#f0f0f0';this.style.color='#111'" onmouseout="this.style.background='transparent';this.style.color='#555'">${page.name}</a>`;
    }).join('\n        ');

    // Fixed nav bar at the top — always visible regardless of scroll position
    const navHtml = `
  <nav style="position:fixed;top:0;left:0;right:0;z-index:99999;display:flex;align-items:center;gap:4px;padding:10px 24px;background:#ffffff;border-bottom:1px solid #e5e7eb;box-shadow:0 2px 8px rgba(0,0,0,0.08);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <span style="font-weight:700;font-size:15px;margin-right:16px;color:#111;white-space:nowrap;">ProtoAI</span>
    <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
      ${links}
    </div>
  </nav>
  <div style="height:52px;"></div>`;

    // Insert at the TOP of the page body (not the bottom) for immediate visibility
    if (html.includes('<body>')) {
      html = html.replace('<body>', `<body>${navHtml}`);
    } else if (/<body\s[^>]*>/.test(html)) {
      html = html.replace(/<body\s[^>]*>/, (match) => `${match}${navHtml}`);
    } else if (html.includes('</body>')) {
      // Fallback: insert before </body> if no opening <body> found
      html = html.replace('</body>', `${navHtml}\n</body>`);
    } else {
      // Last resort: prepend to HTML
      html = navHtml + '\n' + html;
    }

    return { ...p, html };
  });
}

// ── Phase 2: Generate ──────────────────────────────────

/**
 * Phase 2: Generate HTML for each planned page.
 * Uses staggered concurrency (max 3 simultaneous requests) with retry
 * for truncated responses, preventing API rate-limit issues.
 * Calls onPageGenerated as each page completes.
 */
export async function generateProjectPages(provider, config, plannedPages, styleSpec, contentDesc, fileContents, selectedStyles, styleDesc, onProgress, onPageGenerated) {
  if (!config?.apiKey) throw new Error('请先在设置中配置 AI 模型的 API Key');

  const MAX_CONCURRENT = 3;
  const STAGGER_DELAY_MS = 800; // delay between launching each request
  const MAX_RETRIES = 2;

  // Pre-allocate results array to preserve page order
  const results = new Array(plannedPages.length);
  const completed = new Set();

  onProgress?.(`正在生成 ${plannedPages.length} 个页面...`);

  // Generate a single page with retry logic for truncated responses
  async function generateWithRetry(page, index) {
    let lastError = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await generateSinglePage(
          provider, config, page, styleSpec, contentDesc,
          fileContents, selectedStyles, styleDesc, plannedPages
        );

        // Check if response was truncated (finish_reason === 'length')
        if (result.finishReason === 'length' && attempt < MAX_RETRIES) {
          // Response was cut off — retry once more
          console.warn(`Page "${page.name}" truncated (attempt ${attempt + 1}), retrying...`);
          continue;
        }

        return result.html;
      } catch (err) {
        lastError = err;
        if (attempt < MAX_RETRIES) {
          // Wait before retry
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
    throw lastError || new Error('生成失败');
  }

  // Staggered concurrency: launch requests in waves
  const promises = plannedPages.map(async (page, i) => {
    // Stagger start times to avoid overwhelming the API
    if (i > 0 && i % MAX_CONCURRENT === 0) {
      await new Promise((r) => setTimeout(r, STAGGER_DELAY_MS));
    }

    try {
      const html = await generateWithRetry(page, i);
      const result = { ...page, html };
      results[i] = result;
      completed.add(i);
      onProgress?.(`已完成 ${completed.size}/${plannedPages.length} 页`);
      onPageGenerated?.(result, i, plannedPages.length);
    } catch (err) {
      const result = { ...page, html: '', error: err.message };
      results[i] = result;
      completed.add(i);
      onProgress?.(`已完成 ${completed.size}/${plannedPages.length} 页`);
      onPageGenerated?.(result, i, plannedPages.length);
    }
  });

  await Promise.allSettled(promises);

  // Inject cross-page navigation for multi-page projects
  const finalPages = injectNavigation(results);

  return { pages: finalPages };
}

async function generateSinglePage(provider, config, page, styleSpec, contentDesc, fileContents, selectedStyles, styleDesc, allPages) {
  const systemPrompt = `你是一个专业的 HTML/CSS 原型生成器。用户会给你单个页面的需求描述和全局设计规范，你需要生成一个完整、可直接运行的单页 HTML 文件。

规则：
1. 输出必须是完整的 HTML 文件，从 <!DOCTYPE html> 到 </html>
2. 所有 CSS 写在 <style> 标签内，不要使用外部 CSS 文件
3. 不要使用外部 JS 库，纯 HTML + CSS 即可
4. 页面要有良好的视觉效果、合理的排版和配色
5. 确保页面在不同屏幕尺寸下基本可用
6. 只输出 HTML 代码，不要输出任何解释性文字
7. 不要用 markdown 代码块包裹，直接输出 HTML
8. 必须严格遵守全局设计规范中的配色、字体和组件样式
9. 如果页面内容区域的顶部需要放置导航，使用简洁的文字链接风格`;

  let userPrompt = '';
  userPrompt += `## 当前页面信息\n`;
  userPrompt += `- 页面名称：${page.name}\n`;
  userPrompt += `- 页面描述：${page.description}\n`;
  userPrompt += `- 页面路由：${page.route}\n\n`;

  if (allPages && allPages.length > 1) {
    userPrompt += `## 完整页面列表（共 ${allPages.length} 页）\n`;
    allPages.forEach((p, i) => {
      const marker = p.route === page.route ? ' ← 当前页面' : '';
      userPrompt += `${i + 1}. ${p.name}（${p.route}）${marker}\n`;
    });
    userPrompt += `请在页面内容区域上方放置一个简洁的导航栏，包含所有页面名称作为文字链接，当前页面高亮显示，其他页面使用普通样式。导航应与页面整体设计风格一致。\n\n`;
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
  userPrompt += '只输出 HTML 代码，不要输出任何解释性文字。';

  const rawResponse = await callAI(provider, config, systemPrompt, userPrompt);
  return { html: extractHtml(rawResponse.content), finishReason: rawResponse.finishReason };
}

/**
 * Send current HTML + user instruction to AI and return modified HTML.
 */
export async function refinePage(provider, config, currentHtml, userInstruction) {
  if (!config?.apiKey) throw new Error('请先在设置中配置 AI 模型的 API Key');

  const systemPrompt = `你是一个专业的 HTML/CSS 前端工程师。用户会给你当前页面的 HTML 代码和一条修改指令。请按照指令修改 HTML 并返回完整的修改后 HTML。

规则：
1. 返回完整的 HTML 文件（从 <!DOCTYPE> 到 </html>）
2. 只修改用户要求的部分，保持其他内容不变
3. 只输出 HTML 代码，不要输出任何解释性文字
4. 不要用 markdown 代码块包裹，直接输出 HTML`;

  const userPrompt = `## 当前页面 HTML\n\n\`\`\`html\n${currentHtml.slice(0, 12000)}\n\`\`\`\n\n## 修改指令\n\n${userInstruction}\n\n请按照修改指令调整 HTML，返回完整的修改后 HTML 代码。`;

  const rawResponse = await callAI(provider, config, systemPrompt, userPrompt);
  return extractHtml(rawResponse.content);
}

// ── Single Page Regeneration ────────────────────────────

/**
 * Regenerate a single page. Wrapper around the internal generateSinglePage.
 */
export async function regenerateSinglePage(provider, config, page, styleSpec, contentDesc, fileContents, selectedStyles, styleDesc, allPages) {
  return generateSinglePage(provider, config, page, styleSpec, contentDesc, fileContents, selectedStyles, styleDesc, allPages);
}

// ── Prompt helpers ──────────────────────────────────────

function buildContextPrompt(contentDesc, fileContents, selectedStyles, styleDesc) {
  let prompt = '';
  if (fileContents.length > 0) {
    prompt += '## 上传的需求文件内容\n\n';
    fileContents.forEach(({ name, content }) => {
      prompt += `### 文件: ${name}\n\`\`\`\n${content}\n\`\`\`\n\n`;
    });
  }
  if (contentDesc) prompt += `## 页面需求描述\n${contentDesc}\n\n`;
  const styleLabels = selectedStyles.map((s) => STYLE_DESCRIPTIONS[s]).filter(Boolean);
  if (styleLabels.length > 0 || styleDesc) {
    prompt += '## 风格偏好\n';
    if (styleLabels.length > 0) prompt += styleLabels.map((s) => `- ${s}`).join('\n') + '\n';
    if (styleDesc) prompt += `补充说明：${styleDesc}\n`;
    prompt += '\n';
  }
  return prompt;
}

// ── Image Export Utility ───────────────────────────────

/**
 * Convert an HTML string to a PNG image blob using SVG foreignObject.
 * Returns a Blob of the PNG image.
 */
export async function htmlToImage(htmlString, width = 1440, height = 900) {
  return new Promise((resolve, reject) => {
    // Use iframe approach for reliable rendering
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `position:fixed;left:-${width + 100}px;top:0;width:${width}px;height:${height}px;border:none;visibility:hidden;`;
    iframe.sandbox = 'allow-same-origin';
    document.body.appendChild(iframe);

    iframe.srcdoc = htmlString;
    iframe.onload = () => {
      setTimeout(() => {
        try {
          const canvas = document.createElement('canvas');
          const scale = 2;
          canvas.width = width * scale;
          canvas.height = height * scale;
          const ctx = canvas.getContext('2d');
          ctx.scale(scale, scale);

          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!iframeDoc) {
            document.body.removeChild(iframe);
            reject(new Error('无法访问 iframe 内容进行截图'));
            return;
          }

          // Use the built-in drawImage with the iframe's document
          const body = iframeDoc.body;
          const svgData = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
              <foreignObject width="100%" height="100%">
                <div xmlns="http://www.w3.org/1999/xhtml">${body.innerHTML}</div>
              </foreignObject>
            </svg>`;

          const img = new Image();
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);

          img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);
            document.body.removeChild(iframe);
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('图片生成失败'));
            }, 'image/png');
          };

          img.onerror = () => {
            URL.revokeObjectURL(url);
            document.body.removeChild(iframe);
            // Fallback: just return the HTML as-is
            reject(new Error('SVG 渲染失败，请尝试使用 HTML 导出'));
          };

          img.src = url;
        } catch (err) {
          document.body.removeChild(iframe);
          reject(err);
        }
      }, 500); // Wait for rendering
    };
  });
}

/**
 * Capture a page by rendering its HTML in a hidden iframe and using canvas.
 * More reliable cross-browser approach.
 */
export async function capturePageAsImage(htmlString, width = 1440, height = 900) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `position:fixed;left:-9999px;top:0;width:${width}px;height:${height}px;border:none;`;
    iframe.sandbox = 'allow-same-origin';
    document.body.appendChild(iframe);

    iframe.srcdoc = htmlString;

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('截图超时'));
    }, 15000);

    const cleanup = () => {
      clearTimeout(timeout);
      if (iframe.parentNode) document.body.removeChild(iframe);
    };

    iframe.onload = () => {
      // Give extra time for fonts and images to load
      setTimeout(() => {
        try {
          const canvas = document.createElement('canvas');
          const scale = 2;
          canvas.width = width * scale;
          canvas.height = height * scale;
          const ctx = canvas.getContext('2d');
          ctx.scale(scale, scale);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);

          // Serialize the iframe content to SVG foreignObject
          const doc = iframe.contentDocument;
          if (!doc) {
            cleanup();
            reject(new Error('无法访问页面内容'));
            return;
          }

          const serializer = new XMLSerializer();
          const htmlClone = doc.documentElement.cloneNode(true);
          const htmlStr = serializer.serializeToString(htmlClone);

          const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
            <foreignObject width="100%" height="100%">
              ${htmlStr}
            </foreignObject>
          </svg>`;

          const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const img = new Image();

          img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);
            cleanup();
            canvas.toBlob((b) => {
              if (b) resolve(b);
              else reject(new Error('Canvas 导出失败'));
            }, 'image/png');
          };

          img.onerror = () => {
            URL.revokeObjectURL(url);
            cleanup();
            reject(new Error('图片渲染失败'));
          };

          img.src = url;
        } catch (err) {
          cleanup();
          reject(err);
        }
      }, 800);
    };
  });
}
