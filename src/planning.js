/**
 * Planning module — Phase 1: analyze requirements and plan page structure.
 * Supports streaming for real-time progress visibility.
 */

import { callAI, callAIStream } from './providers.js';
import { buildStyleSpec, buildContextPrompt } from './generation.js';

/**
 * Phase 1: Analyze requirements and plan page structure.
 * Accepts an optional `onStream(text)` callback for real-time progress.
 * Returns { pages, styleSpec, platform } or { pcPages, mobilePages, styleSpec, platform: 'both' }
 */
export async function planProject(provider, config, contentDesc, fileContents, selectedStyles, styleDesc, onProgress, targetPlatform = 'auto', onStream, signal) {
  if (!config?.apiKey) throw new Error('请先在设置中配置 AI 模型的 API Key');

  if (targetPlatform === 'both') {
    // ── Parallel planning for "both" mode ──
    onProgress?.('正在同时规划 PC 端和移动端方案...');

    const [pcPlan, mobilePlan] = await Promise.all([
      planProjectForPlatform(provider, config, contentDesc, fileContents, selectedStyles, styleDesc, (msg) => onProgress?.(`[PC端] ${msg}`), 'pc', onStream ? (text) => onStream(text, 'pc') : null, signal),
      planProjectForPlatform(provider, config, contentDesc, fileContents, selectedStyles, styleDesc, (msg) => onProgress?.(`[移动端] ${msg}`), 'mobile', onStream ? (text) => onStream(text, 'mobile') : null, signal),
    ]);

    return {
      platform: 'both',
      pcPages: pcPlan.pages,
      mobilePages: mobilePlan.pages,
      pages: pcPlan.pages,
      styleSpec: pcPlan.styleSpec,
    };
  }

  onProgress?.('正在分析需求，规划页面结构...');
  return planProjectForPlatform(provider, config, contentDesc, fileContents, selectedStyles, styleDesc, onProgress, targetPlatform === 'auto' ? null : targetPlatform, onStream ? (text) => onStream(text, targetPlatform) : null, signal);
}

async function planProjectForPlatform(provider, config, contentDesc, fileContents, selectedStyles, styleDesc, onProgress, platform, onStream, signal) {
  const styleSpec = buildStyleSpec(selectedStyles, styleDesc);

  let platformInstruction = '';
  if (platform === 'pc') {
    platformInstruction = '目标平台已确定为 PC端（桌面网页）。请直接按 PC 端规划页面结构，无需判断平台。';
  } else if (platform === 'mobile') {
    platformInstruction = '目标平台已确定为 移动端（手机APP/小程序）。请直接按移动端规划页面结构，无需判断平台。';
  } else {
    platformInstruction = '请根据需求内容自行判断目标平台（mobile 或 pc）。';
  }

  const systemPrompt = `你是一个专业的产品经理兼前端工程师。用户会给你产品需求描述和上传的文件内容，你需要分析这些需求，将项目拆分成多个页面。

${platformInstruction}

返回格式要求（严格 JSON 对象）：
{
  ${platform ? `"platform": "${platform}",` : '"platform": "mobile" 或 "pc",'}
  "pages": [
    {
      "name": "页面名称（中文）",
      "description": "页面功能简述（1-2句话）",
      "route": "/page-route",
      "layout": "页面整体布局方式描述",
      "sections": [
        {
          "name": "区块名称",
          "description": "该区块包含的内容和功能",
          "elements": ["具体UI元素1", "具体UI元素2"]
        }
      ],
      "interactions": ["关键交互行为"],
      "keyFeatures": ["核心功能特性"]
    }
  ]
}

${!platform ? `platform 判断规则：
- "mobile"：手机APP、微信小程序、H5移动端等移动场景
- "pc"：后台管理系统、企业官网、SaaS平台等桌面端场景` : ''}

规则：
1. 每个页面应有明确的功能职责
2. route 使用英文小写 kebab-case 格式，以 / 开头
3. sections 要尽可能详细
4. 不要输出任何其他内容，只输出 JSON 对象
5. ${platform === 'mobile' ? '所有页面必须按移动端设计规范规划' : platform === 'pc' ? '所有页面必须按PC端设计规范规划' : '根据判断的平台选择对应的设计规范'}`;

  const userPrompt = buildContextPrompt(contentDesc, fileContents, selectedStyles, styleDesc)
    + '\n\n' + styleSpec
    + `\n\n请分析以上需求，${platform ? `按 ${platform === 'pc' ? 'PC端' : '移动端'}规划` : '判断目标平台并规划'}页面结构。返回严格的 JSON 对象。`;

  // Use streaming if onStream callback is provided
  let rawResponse;
  if (onStream) {
    rawResponse = await callAIStream(provider, config, systemPrompt, userPrompt, (text) => {
      onStream(text);
    }, signal);
  } else {
    rawResponse = await callAI(provider, config, systemPrompt, userPrompt, signal);
  }

  let parsed;
  try {
    const jsonMatch = rawResponse.content.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawResponse.content);
  } catch {
    throw new Error('AI 返回的页面规划格式不正确，无法解析为 JSON');
  }

  const pages = Array.isArray(parsed) ? parsed : parsed.pages;
  const detectedPlatform = (!Array.isArray(parsed) && parsed.platform) ? parsed.platform : (platform || 'pc');

  if (!Array.isArray(pages) || pages.length === 0) throw new Error('AI 未能规划出有效的页面结构');

  return {
    platform: detectedPlatform === 'mobile' ? 'mobile' : 'pc',
    pages: pages.map((p) => ({
      name: p.name || '未命名页面',
      description: p.description || '',
      route: p.route || `/${Math.random().toString(36).slice(2, 8)}`,
      layout: p.layout || '',
      sections: Array.isArray(p.sections) ? p.sections.map((s) => ({
        name: s.name || '',
        description: s.description || '',
        elements: Array.isArray(s.elements) ? s.elements : [],
      })) : [],
      interactions: Array.isArray(p.interactions) ? p.interactions : [],
      keyFeatures: Array.isArray(p.keyFeatures) ? p.keyFeatures : [],
    })),
    styleSpec,
  };
}

/**
 * Parse partial JSON streaming text to extract discovered page names.
 * Tolerant of incomplete JSON — extracts whatever is available.
 * Correctly distinguishes page-level "name" from section-level "name".
 */
export function parsePartialPlan(text) {
  if (!text) return { platform: null, pages: [], phase: 'thinking' };

  const pages = [];
  let phase = 'thinking';

  // First check if we have "platform"
  const platformMatch = text.match(/"platform"\s*:\s*"(mobile|pc)"/);
  const platform = platformMatch ? platformMatch[1] : null;

  // Find the "pages" array start
  const pagesKeyMatch = text.match(/"pages"\s*:\s*\[/);
  if (!pagesKeyMatch) return { platform, pages, phase };

  phase = 'planning';
  const pagesArrayStart = pagesKeyMatch.index + pagesKeyMatch[0].length;
  const afterPages = text.slice(pagesArrayStart);

  // Walk through the text tracking brace/bracket depth to find page-level objects.
  // depth 0 = inside pages array, directly
  // When we encounter '{' at depth 0, it's a new page object.
  // When we encounter '"sections"' inside a page object, we skip nested names.
  let depth = 0; // 0 = pages array level
  let inPageObj = false;
  let inSections = false;
  let sectionsDepth = 0;
  let i = 0;

  while (i < afterPages.length) {
    const ch = afterPages[i];

    // Track string boundaries to skip strings
    if (ch === '"') {
      // Skip the entire string
      i++;
      while (i < afterPages.length) {
        if (afterPages[i] === '\\') { i += 2; continue; }
        if (afterPages[i] === '"') break;
        i++;
      }
      i++;
      continue;
    }

    if (ch === '[') {
      depth++;
      if (inSections) sectionsDepth++;
    } else if (ch === ']') {
      if (depth === 0) break; // pages array ended
      depth--;
      if (inSections) {
        sectionsDepth--;
        if (sectionsDepth < 0) { inSections = false; sectionsDepth = 0; }
      }
    } else if (ch === '{') {
      if (depth === 0 && !inSections) {
        // This is a page-level object
        inPageObj = true;
      }
      if (inSections) sectionsDepth++;
    } else if (ch === '}') {
      if (depth === 0 && inPageObj) {
        // Page object ended
        inPageObj = false;
      }
      if (inSections) sectionsDepth--;
    }

    // Check for "sections" keyword to enter sections-skipping mode
    if (inPageObj && !inSections && depth === 0) {
      const remaining = afterPages.slice(i);
      const sectionsMatch = remaining.match(/^"sections"\s*:\s*\[/);
      if (sectionsMatch) {
        inSections = true;
        sectionsDepth = 0;
        i += sectionsMatch[0].length;
        continue;
      }
    }

    // Extract "name" only when inside a page object and NOT inside sections
    if (inPageObj && !inSections && depth === 0) {
      const remaining = afterPages.slice(i);
      const nameMatch = remaining.match(/^"name"\s*:\s*"([^"]+)"/);
      if (nameMatch) {
        const name = nameMatch[1];
        const contextAfter = remaining.slice(0, 600);
        const descMatch = contextAfter.match(/"description"\s*:\s*"([^"]+)"/);
        const routeMatch = contextAfter.match(/"route"\s*:\s*"([^"]+)"/);

        pages.push({
          name,
          description: descMatch ? descMatch[1] : '',
          route: routeMatch ? routeMatch[1] : '',
        });
      }
    }

    i++;
  }

  if (pages.length > 0) phase = 'detailing';
  if (text.includes(']') && text.includes('}') && text.trim().endsWith('}')) phase = 'complete';

  return { platform, pages, phase };
}
