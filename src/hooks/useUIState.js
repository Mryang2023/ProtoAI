import { useState } from 'react';

export default function useUIState() {
  const [rightViewMode, setRightViewMode] = useState('empty'); // 'empty' | 'plan' | 'prototype'
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showPlansHistory, setShowPlansHistory] = useState(false);
  const [showQrPreview, setShowQrPreview] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  return {
    rightViewMode, setRightViewMode,
    currentPageIndex, setCurrentPageIndex,
    showHistory, setShowHistory,
    showPlansHistory, setShowPlansHistory,
    showQrPreview, setShowQrPreview,
    showTemplateLibrary, setShowTemplateLibrary,
    showExportModal, setShowExportModal,
  };
}
