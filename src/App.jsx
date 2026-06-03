import { useState, useCallback, useMemo } from 'react';
import JSZip from 'jszip';
import TopBar from './components/TopBar.jsx';
import LeftPanel from './components/LeftPanel.jsx';
import RightPanel from './components/RightPanel.jsx';
import RefinePanel from './components/RefinePanel.jsx';
import AISettingsModal from './components/AISettingsModal.jsx';
import VersionHistory from './components/VersionHistory.jsx';
import { planProject, generateProjectPages, readFileContents, capturePageAsImage } from './aiService.js';

const PROVIDER_NAMES = { openai: 'OpenAI', claude: 'Claude', custom: '本地模型' };

function formatTime(date) {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${date.getMonth() + 1}月${date.getDate()}日 ${h}:${m}`;
}

function safeName(name) {
  return name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
}

export default function App() {
  // Theme
  const [theme, setTheme] = useState('light');

  // Project
  const [projectName, setProjectName] = useState('');

  // Left panel state — default text is a short hint
  const [contentDesc, setContentDesc] = useState('');
  const [styleDesc, setStyleDesc] = useState('');
  const [selectedStyles, setSelectedStyles] = useState(['business']);

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const handleFilesAdd = useCallback((newFiles) => setUploadedFiles((prev) => [...prev, ...newFiles]), []);
  const handleFileRemove = useCallback((index) => setUploadedFiles((prev) => prev.filter((_, i) => i !== index)), []);

  // Generation state — multi-page
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [generateProgress, setGenerateProgress] = useState('');
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);

  // Plan preview state — shown after planning, before generation
  const [plannedPages, setPlannedPages] = useState(null);
  const [plannedStyleSpec, setPlannedStyleSpec] = useState('');

  // Flag: user manually selected a page to preview during generation
  const [userSelectedPage, setUserSelectedPage] = useState(false);

  // Current page html (derived)
  const generatedHtml = pages[currentPageIndex]?.html || '';

  // Refine state
  const [code, setCode] = useState('');
  const [messages, setMessages] = useState([]);

  // AI settings
  const [showSettings, setShowSettings] = useState(false);
  const [aiConfig, setAiConfig] = useState({});
  const [activeProvider, setActiveProvider] = useState('openai');

  const activeModel = useMemo(() => {
    const provider = PROVIDER_NAMES[activeProvider] || activeProvider;
    const cfg = aiConfig[activeProvider];
    const model = cfg?.model || (activeProvider === 'openai' ? 'gpt-4o' : activeProvider === 'claude' ? 'claude-sonnet-4-20250514' : '未配置');
    return { provider, model };
  }, [activeProvider, aiConfig]);

  // History — full records with pages data
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentHistoryId, setCurrentHistoryId] = useState(null);

  // ── Theme & Style ──

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  }, []);

  const toggleStyle = useCallback((id) => {
    setSelectedStyles((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }, []);

  // ── Phase 1: Plan ──

  const handlePlan = useCallback(async () => {
    setIsGenerating(true);
    setGenerateError('');
    setGenerateProgress('正在读取文件内容...');
    setPlannedPages(null);

    try {
      const fileContents = uploadedFiles.length > 0 ? await readFileContents(uploadedFiles) : [];
      setGenerateProgress('正在分析需求，规划页面结构...');

      const providerConfig = aiConfig[activeProvider] || {};
      const plan = await planProject(
        activeProvider, providerConfig, contentDesc, fileContents,
        selectedStyles, styleDesc, (msg) => setGenerateProgress(msg)
      );

      setPlannedPages(plan.pages);
      setPlannedStyleSpec(plan.styleSpec);
      setGenerateProgress('');
      setIsGenerating(false);
    } catch (err) {
      setGenerateError(err.message || '规划失败');
      setIsGenerating(false);
      setGenerateProgress('');
    }
  }, [contentDesc, selectedStyles, styleDesc, uploadedFiles, aiConfig, activeProvider]);

  // ── Phase 2: Generate (after plan confirmation) ──

  const handleConfirmPlan = useCallback(async () => {
    if (!plannedPages || plannedPages.length === 0) return;

    setIsGenerating(true);
    setGenerateError('');
    setProgressCurrent(0);
    setProgressTotal(plannedPages.length);
    setPages([]);
    setCurrentPageIndex(0);
    setUserSelectedPage(false);
    // Keep plannedPages visible — user can track each page's progress

    try {
      const providerConfig = aiConfig[activeProvider] || {};
      const result = await generateProjectPages(
        activeProvider, providerConfig, plannedPages, plannedStyleSpec,
        contentDesc, [], selectedStyles, styleDesc,
        (msg) => setGenerateProgress(msg),
        (pageResult, index, total) => {
          setProgressCurrent(index + 1);
          setPages((prev) => {
            const next = [...prev];
            next[index] = pageResult;
            return next;
          });
          // Don't override user's manual page selection
          if (!userSelectedPage) {
            setCurrentPageIndex(index);
          }
        }
      );

      // Final state
      setPages(result.pages);
      if (result.pages.length > 0) {
        setCurrentPageIndex(0);
        setCode(result.pages[0].html || '');
      }

      // Save to history — never clears old entries
      const entry = {
        id: Date.now().toString(),
        timestamp: formatTime(new Date()),
        description: contentDesc
          ? contentDesc.slice(0, 80) + (contentDesc.length > 80 ? '...' : '')
          : '文件导入生成',
        styles: [...selectedStyles],
        pages: result.pages,
        pageCount: result.pages.length,
      };
      setHistory((prev) => [entry, ...prev]);
      setCurrentHistoryId(entry.id);
    } catch (err) {
      setGenerateError(err.message || '生成失败，请检查 AI 模型配置');
    } finally {
      setIsGenerating(false);
      setGenerateProgress('');
      setProgressCurrent(0);
      setProgressTotal(0);
      setPlannedPages(null); // now hide plan, generation is done
      setUserSelectedPage(false);
    }
  }, [plannedPages, plannedStyleSpec, contentDesc, selectedStyles, styleDesc, aiConfig, activeProvider, userSelectedPage]);

  // Cancel plan
  const handleCancelPlan = useCallback(() => {
    setPlannedPages(null);
    setPlannedStyleSpec('');
  }, []);

  // ── Code & Chat ──

  const handleCodeChange = useCallback((newCode) => {
    setCode(newCode);
    setPages((prev) => {
      const next = [...prev];
      if (next[currentPageIndex]) next[currentPageIndex] = { ...next[currentPageIndex], html: newCode };
      return next;
    });
  }, [currentPageIndex]);

  const handleSendMessage = useCallback((text) => {
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setTimeout(() => {
      setMessages((prev) => [...prev, {
        role: 'ai',
        content: `已根据你的指令「${text}」调整了原型。你可以在右侧预览查看变化，或继续提出修改意见。`,
      }]);
    }, 800);
  }, []);

  // ── Export: Current Page HTML ──

  const handleExport = useCallback(() => {
    try {
      if (!generatedHtml) return;
      const page = pages[currentPageIndex];
      const fileName = page?.name ? `${projectName || 'prototype'}_${page.name}.html` : `${projectName || 'prototype'}.html`;
      const blob = new Blob([generatedHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, [generatedHtml, projectName, pages, currentPageIndex]);

  // ── Export: All Pages as ZIP ──

  const handleExportAll = useCallback(async () => {
    try {
      const validPages = pages.filter((p) => p.html);
      if (validPages.length === 0) return;
      if (validPages.length === 1) { handleExport(); return; }

      const zip = new JSZip();
      validPages.forEach((page, i) => {
        zip.file(`${String(i + 1).padStart(2, '0')}_${safeName(page.name || 'page')}.html`, page.html);
      });

      const pageLinks = validPages.map((page, i) => {
        const fn = `${String(i + 1).padStart(2, '0')}_${safeName(page.name || 'page')}.html`;
        return `<a href="${fn}" class="l"><span class="n">${page.name}</span>${page.description ? `<span class="d">${page.description}</span>` : ''}<span class="a">&rarr;</span></a>`;
      }).join('\n');

      const indexHtml = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${projectName || 'ProtoAI Prototype'}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fafafa;color:#111;padding:48px 24px}.c{max-width:640px;margin:0 auto}h1{font-size:28px;font-weight:700;margin-bottom:8px}p{font-size:14px;color:#888;margin-bottom:32px}.l{display:flex;align-items:center;gap:12px;padding:16px 20px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;text-decoration:none;color:#111;margin-bottom:8px;transition:all .15s}.l:hover{border-color:#1863dc;background:#f0f5ff}.n{font-weight:600;font-size:15px;flex-shrink:0}.d{flex:1;font-size:13px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.a{color:#ccc;font-size:18px;flex-shrink:0}.f{margin-top:48px;font-size:12px;color:#bbb;text-align:center}</style></head><body><div class="c"><h1>${projectName || 'ProtoAI Prototype'}</h1><p>共 ${validPages.length} 个页面</p>${pageLinks}<div class="f">Generated by ProtoAI</div></div></body></html>`;
      zip.file('index.html', indexHtml);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${projectName || 'prototype'}.zip`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP export failed:', err);
      alert('导出 ZIP 失败：' + (err.message || '未知错误'));
    }
  }, [pages, projectName, handleExport]);

  // ── Export: Current Page as Image ──

  const handleExportImage = useCallback(async () => {
    if (!generatedHtml) return;
    try {
      setGenerateProgress('正在生成图片...');
      const blob = await capturePageAsImage(generatedHtml, 1440, 900);
      const page = pages[currentPageIndex];
      const fileName = page?.name ? `${projectName || 'prototype'}_${page.name}.png` : `${projectName || 'prototype'}.png`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Image export failed:', err);
      alert('导出图片失败：' + (err.message || '请使用 HTML 导出'));
    } finally {
      setGenerateProgress('');
    }
  }, [generatedHtml, projectName, pages, currentPageIndex]);

  // ── Export: All Pages as Images ZIP ──

  const handleExportAllImages = useCallback(async () => {
    try {
      const validPages = pages.filter((p) => p.html);
      if (validPages.length === 0) return;
      if (validPages.length === 1) { await handleExportImage(); return; }

      setGenerateProgress('正在生成图片...');
      const zip = new JSZip();

      for (let i = 0; i < validPages.length; i++) {
        setGenerateProgress(`正在生成图片 ${i + 1}/${validPages.length}...`);
        try {
          const blob = await capturePageAsImage(validPages[i].html, 1440, 900);
          const arrayBuf = await blob.arrayBuffer();
          zip.file(`${String(i + 1).padStart(2, '0')}_${safeName(validPages[i].name || 'page')}.png`, arrayBuf);
        } catch (err) {
          console.warn(`Failed to capture page ${validPages[i].name}:`, err);
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${projectName || 'prototype'}_images.zip`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Image ZIP export failed:', err);
      alert('导出图片 ZIP 失败：' + (err.message || '未知错误'));
    } finally {
      setGenerateProgress('');
    }
  }, [pages, projectName, handleExportImage]);

  // ── Export from history ──

  const handleExportHistory = useCallback((entry, type) => {
    try {
      if (!entry?.pages) return;
      const validPages = entry.pages.filter((p) => p.html);
      if (validPages.length === 0) return;

      if (type === 'html' && validPages.length === 1) {
        const blob = new Blob([validPages[0].html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${entry.description || 'prototype'}.html`; a.click();
        URL.revokeObjectURL(url);
        return;
      }

      // ZIP export for history
      const zip = new JSZip();
      validPages.forEach((page, i) => {
        zip.file(`${String(i + 1).padStart(2, '0')}_${safeName(page.name || 'page')}.html`, page.html);
      });
      zip.generateAsync({ type: 'blob' }).then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${entry.description || 'prototype'}.zip`; a.click();
        URL.revokeObjectURL(url);
      });
    } catch (err) {
      console.error('History export failed:', err);
    }
  }, []);

  // ── Restore from history ──

  const handleRestoreFromHistory = useCallback((entry) => {
    if (!entry?.pages) return;
    setPages(entry.pages);
    setCurrentPageIndex(0);
    setCode(entry.pages[0]?.html || '');
    setCurrentHistoryId(entry.id);
    setMessages([]);
    setShowHistory(false);
  }, []);

  // ── Other ──

  const handleRefresh = useCallback(() => {
    if (!generatedHtml) return;
    setPages((prev) => {
      const next = [...prev];
      if (next[currentPageIndex]) {
        const html = next[currentPageIndex].html;
        next[currentPageIndex] = { ...next[currentPageIndex], html: '' };
        setTimeout(() => {
          setPages((p) => {
            const r = [...p];
            if (r[currentPageIndex]) r[currentPageIndex] = { ...r[currentPageIndex], html };
            return r;
          });
        }, 50);
      }
      return next;
    });
  }, [generatedHtml, currentPageIndex]);

  return (
    <div className="app-layout" data-component="App Layout" data-od-id="app-layout">
      <TopBar
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onOpenSettings={() => setShowSettings(true)}
        onOpenHistory={() => setShowHistory(true)}
        onExport={handleExport}
        onExportAll={handleExportAll}
        hasMultiplePages={pages.filter((p) => p.html).length > 1}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="workspace">
        <LeftPanel
          contentDesc={contentDesc}
          onContentDescChange={setContentDesc}
          styleDesc={styleDesc}
          onStyleDescChange={setStyleDesc}
          selectedStyles={selectedStyles}
          onToggleStyle={toggleStyle}
          onPlan={handlePlan}
          onConfirmPlan={handleConfirmPlan}
          onCancelPlan={handleCancelPlan}
          isGenerating={isGenerating}
          isPlanning={!!plannedPages}
          plannedPages={plannedPages}
          pages={pages}
          activeModel={activeModel}
          onOpenSettings={() => setShowSettings(true)}
          files={uploadedFiles}
          onFilesAdd={handleFilesAdd}
          onFileRemove={handleFileRemove}
        />

        <RightPanel
          generatedHtml={generatedHtml}
          isGenerating={isGenerating}
          onRefresh={handleRefresh}
          onExport={handleExport}
          onExportAll={handleExportAll}
          onExportImage={handleExportImage}
          onExportAllImages={handleExportAllImages}
          error={generateError}
          progress={generateProgress}
          progressCurrent={progressCurrent}
          progressTotal={progressTotal}
          plannedPages={plannedPages}
          pages={pages}
          currentPageIndex={currentPageIndex}
          onPageChange={(index) => {
            setCurrentPageIndex(index);
            setCode(pages[index]?.html || '');
            setMessages([]);
            if (isGenerating) setUserSelectedPage(true);
          }}
          onUserSelectPage={() => setUserSelectedPage(true)}
          refinePanel={
            <RefinePanel
              code={code}
              onCodeChange={handleCodeChange}
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          }
        />
      </div>

      {showSettings && (
        <AISettingsModal
          config={aiConfig}
          onConfigChange={setAiConfig}
          activeProvider={activeProvider}
          onActiveProviderChange={setActiveProvider}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showHistory && (
        <VersionHistory
          history={history}
          currentHistoryId={currentHistoryId}
          onRestore={handleRestoreFromHistory}
          onExport={handleExportHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
