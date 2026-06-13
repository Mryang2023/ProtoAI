import { useState, useCallback, useRef } from 'react';
import { refinePageStream, refineRegion } from '../aiService.js';

export default function useCodeRefine({
  aiConfig, activeProvider,
  pages, currentPageIndex, generatedHtml,
  setPages,
}) {
  const [code, setCode] = useState('');
  const [messages, setMessages] = useState([]);
  const [isRefining, setIsRefining] = useState(false);

  // ── Undo / Redo ──
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushUndo = useCallback((pageIndex) => {
    const idx = typeof pageIndex === 'number' ? pageIndex : currentPageIndex;
    const page = pages[idx];
    if (!page?.html) return;
    undoStackRef.current.push({ pageIndex: idx, html: page.html, code });
    if (undoStackRef.current.length > 50) undoStackRef.current.shift();
    redoStackRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [pages, currentPageIndex, code]);

  const handleUndo = useCallback(() => {
    const snapshot = undoStackRef.current.pop();
    if (!snapshot) return;
    const currentPage = pages[snapshot.pageIndex];
    if (currentPage?.html) {
      redoStackRef.current.push({ pageIndex: snapshot.pageIndex, html: currentPage.html, code });
    }
    setPages((prev) => {
      const next = [...prev];
      if (next[snapshot.pageIndex]) {
        next[snapshot.pageIndex] = { ...next[snapshot.pageIndex], html: snapshot.html };
      }
      return next;
    });
    if (snapshot.pageIndex === currentPageIndex) {
      setCode(snapshot.code || snapshot.html);
    }
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }, [pages, currentPageIndex, code, setPages]);

  const handleRedo = useCallback(() => {
    const snapshot = redoStackRef.current.pop();
    if (!snapshot) return;
    const currentPage = pages[snapshot.pageIndex];
    if (currentPage?.html) {
      undoStackRef.current.push({ pageIndex: snapshot.pageIndex, html: currentPage.html, code });
    }
    setPages((prev) => {
      const next = [...prev];
      if (next[snapshot.pageIndex]) {
        next[snapshot.pageIndex] = { ...next[snapshot.pageIndex], html: snapshot.html };
      }
      return next;
    });
    if (snapshot.pageIndex === currentPageIndex) {
      setCode(snapshot.code || snapshot.html);
    }
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }, [pages, currentPageIndex, code, setPages]);

  // ── Code editing ──

  const handleCodeChange = useCallback((newCode) => {
    setCode(newCode);
    setPages((prev) => {
      const next = [...prev];
      if (next[currentPageIndex]) next[currentPageIndex] = { ...next[currentPageIndex], html: newCode };
      return next;
    });
  }, [currentPageIndex, setPages]);

  // ── Chat refine ──

  const handleSendMessage = useCallback(async (text) => {
    if (isRefining || !generatedHtml) return;
    pushUndo();
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsRefining(true);

    try {
      const providerConfig = aiConfig[activeProvider] || {};
      const refinedHtml = await refinePageStream(
        activeProvider, providerConfig, generatedHtml, text,
        () => {} // collect streamed HTML but don't update preview during streaming (would flicker)
      );
      setPages((prev) => {
        const next = [...prev];
        if (next[currentPageIndex]) {
          next[currentPageIndex] = { ...next[currentPageIndex], html: refinedHtml };
        }
        return next;
      });
      setCode(refinedHtml);
      setMessages((prev) => [...prev, {
        role: 'ai',
        content: `已根据你的指令「${text}」调整了原型。你可以在右侧预览查看变化，或继续提出修改意见。`,
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'ai',
        content: `修改失败：${err.message}。请检查 AI 模型配置后重试。`,
      }]);
    } finally {
      setIsRefining(false);
    }
  }, [isRefining, generatedHtml, aiConfig, activeProvider, currentPageIndex, pushUndo, setPages]);

  // ── Region-based refine ──

  const handleRefineRegion = useCallback(async (regionHtml, instruction) => {
    if (isRefining || !generatedHtml) return;
    pushUndo();
    setMessages((prev) => [...prev, { role: 'user', content: `[局部修改] ${instruction}` }]);
    setIsRefining(true);

    try {
      const providerConfig = aiConfig[activeProvider] || {};
      const refinedHtml = await refineRegion(activeProvider, providerConfig, generatedHtml, regionHtml, instruction);
      setPages((prev) => {
        const next = [...prev];
        if (next[currentPageIndex]) {
          next[currentPageIndex] = { ...next[currentPageIndex], html: refinedHtml };
        }
        return next;
      });
      setCode(refinedHtml);
      setMessages((prev) => [...prev, {
        role: 'ai',
        content: `已对选中区域执行「${instruction}」修改。你可以在右侧预览查看变化。`,
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'ai',
        content: `局部修改失败：${err.message}。请检查 AI 模型配置后重试。`,
      }]);
    } finally {
      setIsRefining(false);
    }
  }, [isRefining, generatedHtml, aiConfig, activeProvider, currentPageIndex, pushUndo, setPages]);

  // ── Reset (used during project switch) ──

  const resetCodeRefine = useCallback(() => {
    setMessages([]);
    setIsRefining(false);
    undoStackRef.current = [];
    redoStackRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  return {
    code, setCode, messages, setMessages,
    isRefining, setIsRefining,
    canUndo, canRedo,
    pushUndo, handleUndo, handleRedo,
    handleCodeChange, handleSendMessage, handleRefineRegion,
    resetCodeRefine,
  };
}
