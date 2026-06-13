/**
 * AI Service — unified re-export barrel.
 * All logic has been split into focused modules:
 *   providers.js   — AI provider API calls (OpenAI, Claude, streaming)
 *   planning.js    — Phase 1: requirement analysis & page planning
 *   generation.js  — Phase 2: HTML generation, repair, navigation, file reading
 *   imageExport.js — HTML-to-PNG image capture
 */

// Re-export everything for backward compatibility with existing imports
export { callAI, callAIStream, callOpenAICompatible, callClaude, streamOpenAICompatible, streamClaude } from './providers.js';

export { planProject, parsePartialPlan, estimatePageCount } from './planning.js';

export {
  buildStyleSpec,
  buildContextPrompt,
  extractHtml,
  repairHtml,
  pageFileName,
  injectNavigation,
  extractReferenceTemplate,
  buildReferenceConstraint,
  generateSinglePage,
  generateSinglePageStream,
  generateProjectPages,
  regenerateSinglePage,
  refinePage,
  refinePageStream,
  refineRegion,
  readFileContents,
  STYLE_DESCRIPTIONS,
  STYLE_SPECS,
  PLATFORM_SPECS,
} from './generation.js';

export { htmlToImage, capturePageAsImage } from './imageExport.js';
