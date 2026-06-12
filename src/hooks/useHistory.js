import { useState, useCallback } from 'react';

export default function useHistory({
  history, updateCurrentProject,
  setCurrentPageIndex, setCode, setMessages,
  setRightViewMode, setShowHistory,
}) {
  const [currentHistoryId, setCurrentHistoryId] = useState(null);

  const handleRestoreFromHistory = useCallback((entry) => {
    if (!entry?.pages) return;
    updateCurrentProject({ pages: entry.pages });
    setCurrentPageIndex(0);
    setCode(entry.pages[0]?.html || '');
    setCurrentHistoryId(entry.id);
    setMessages([]);
    setShowHistory(false);
    setRightViewMode('prototype');
  }, [updateCurrentProject, setCurrentPageIndex, setCode, setMessages, setShowHistory, setRightViewMode]);

  return { currentHistoryId, setCurrentHistoryId, handleRestoreFromHistory };
}
