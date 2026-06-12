import { useState, useMemo } from 'react';

const BUILTIN_PROVIDER_NAMES = { openai: 'OpenAI', claude: 'Claude', custom: 'Mimo' };

export default function useAiSettings() {
  const [showSettings, setShowSettings] = useState(false);
  const [aiConfig, setAiConfig] = useState({
    custom: {
      apiKey: 'tp-s8015ckz5f83j4ok8irjjb1ul18s57t6pgz8r26jog63gsb6',
      endpoint: 'https://token-plan-sgp.xiaomimimo.com/v1',
      model: 'mimo-v2.5-pro',
    },
  });
  const [activeProvider, setActiveProvider] = useState('custom');

  const activeModel = useMemo(() => {
    const cfg = aiConfig[activeProvider];
    const provider = BUILTIN_PROVIDER_NAMES[activeProvider]
      || cfg?.name
      || activeProvider;
    const model = cfg?.model || (activeProvider === 'openai' ? 'gpt-4o' : activeProvider === 'claude' ? 'claude-sonnet-4-20250514' : '未配置');
    return { provider, model };
  }, [activeProvider, aiConfig]);

  return {
    showSettings, setShowSettings,
    aiConfig, setAiConfig,
    activeProvider, setActiveProvider,
    activeModel,
  };
}
