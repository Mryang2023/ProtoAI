import { useState } from 'react';
import { X, Loader2, Check, AlertCircle } from 'lucide-react';

const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    iconClass: 'openai',
    iconLetter: 'O',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultEndpoint: 'https://api.openai.com/v1',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    iconClass: 'claude',
    iconLetter: 'C',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    defaultEndpoint: 'https://api.anthropic.com/v1',
  },
  {
    id: 'custom',
    name: '自定义 / 本地模型',
    iconClass: 'custom',
    iconLetter: 'L',
    models: [],
    defaultEndpoint: 'http://localhost:11434/v1',
  },
];

export default function AISettingsModal({
  config,
  onConfigChange,
  activeProvider,
  onActiveProviderChange,
  onClose,
}) {
  const [testStatus, setTestStatus] = useState({});

  const updateProvider = (providerId, field, value) => {
    const updated = { ...config };
    if (!updated[providerId]) updated[providerId] = {};
    updated[providerId][field] = value;
    onConfigChange(updated);
  };

  const handleTestConnection = async (providerId) => {
    setTestStatus((prev) => ({ ...prev, [providerId]: 'testing' }));
    // Simulate connection test
    setTimeout(() => {
      const provider = config[providerId];
      if (provider?.apiKey && provider.apiKey.length > 8) {
        setTestStatus((prev) => ({ ...prev, [providerId]: 'success' }));
      } else {
        setTestStatus((prev) => ({ ...prev, [providerId]: 'error' }));
      }
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose} data-component="AI Settings Modal" data-od-id="ai-settings">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="ai-settings-title">
        <div className="modal-header">
          <h2 className="modal-title" id="ai-settings-title">AI 模型配置</h2>
          <button className="btn btn-icon" onClick={onClose} aria-label="关闭设置">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-muted)', lineHeight: 'var(--leading-relaxed)' }}>
            选择一个 AI 提供商并配置 API 密钥。你的密钥仅保存在本地浏览器中，不会上传到任何服务器。
          </p>

          {PROVIDERS.map((provider) => {
            const isActive = activeProvider === provider.id;
            const providerConfig = config[provider.id] || {};
            const status = testStatus[provider.id];

            return (
              <div key={provider.id} className={`provider-card${isActive ? ' active' : ''}`}>
                <div
                  className="provider-header"
                  onClick={() => onActiveProviderChange(provider.id)}
                  role="radio"
                  aria-checked={isActive}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onActiveProviderChange(provider.id)}
                >
                  <div className="provider-radio" />
                  <div className={`provider-icon ${provider.iconClass}`}>
                    {provider.iconLetter}
                  </div>
                  <span className="provider-name">{provider.name}</span>
                  {providerConfig.apiKey && (
                    <span className="provider-status connected">已配置</span>
                  )}
                </div>

                {isActive && (
                  <div className="provider-body">
                    <div className="form-field">
                      <label className="form-label" htmlFor={`apikey-${provider.id}`}>API Key</label>
                      <input
                        id={`apikey-${provider.id}`}
                        className="form-input"
                        type="password"
                        placeholder="sk-..."
                        value={providerConfig.apiKey || ''}
                        onChange={(e) => updateProvider(provider.id, 'apiKey', e.target.value)}
                        autoComplete="off"
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label" htmlFor={`endpoint-${provider.id}`}>API 端点</label>
                      <input
                        id={`endpoint-${provider.id}`}
                        className="form-input"
                        type="url"
                        placeholder={provider.defaultEndpoint}
                        value={providerConfig.endpoint || ''}
                        onChange={(e) => updateProvider(provider.id, 'endpoint', e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label" htmlFor={`model-${provider.id}`}>模型</label>
                      {provider.id === 'custom' ? (
                        <input
                          id={`model-${provider.id}`}
                          className="form-input"
                          placeholder="输入模型名称，如 llama3.1"
                          value={providerConfig.model || ''}
                          onChange={(e) => updateProvider(provider.id, 'model', e.target.value)}
                        />
                      ) : (
                        <select
                          id={`model-${provider.id}`}
                          className="form-select"
                          value={providerConfig.model || provider.models[0]}
                          onChange={(e) => updateProvider(provider.id, 'model', e.target.value)}
                        >
                          {provider.models.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <button
                        className="btn btn-sm"
                        onClick={() => handleTestConnection(provider.id)}
                        disabled={status === 'testing'}
                      >
                        {status === 'testing' ? (
                          <Loader2 size={14} style={{ animation: 'spin 0.6s linear infinite' }} />
                        ) : null}
                        测试连接
                      </button>
                      {status === 'success' && (
                        <div className="test-connection">
                          <span className="dot success" />
                          <span style={{ color: 'var(--success)' }}>连接成功</span>
                        </div>
                      )}
                      {status === 'error' && (
                        <div className="test-connection">
                          <span className="dot error" />
                          <span style={{ color: 'var(--danger)' }}>连接失败，请检查配置</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={onClose}>保存配置</button>
        </div>
      </div>
    </div>
  );
}
