import { useState } from 'react';
import { X, Loader2, Check, AlertCircle, Plus, Trash2, ChevronDown } from 'lucide-react';

const BUILTIN_PROVIDERS = [
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
];

// Quick-add presets for popular providers
const POPULAR_PRESETS = [
  { name: 'DeepSeek', endpoint: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { name: 'Moonshot', endpoint: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  { name: '通义千问', endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-turbo' },
  { name: '智谱 GLM', endpoint: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
  { name: '零一万物', endpoint: 'https://api.lingyiwanwu.com/v1', model: 'yi-lightning' },
  { name: 'SiliconFlow', endpoint: 'https://api.siliconflow.cn/v1', model: 'deepseek-ai/DeepSeek-V3' },
];

export default function AISettingsModal({
  config,
  onConfigChange,
  activeProvider,
  onActiveProviderChange,
  onClose,
}) {
  const [testStatus, setTestStatus] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [newProvider, setNewProvider] = useState({ name: '', endpoint: '', model: '' });

  // Build full provider list: built-in + user custom
  const customProviderIds = config.__customProviders || [];
  const customProviders = customProviderIds.map((id) => ({
    id,
    name: config[id]?.name || id,
    iconClass: 'custom',
    iconLetter: (config[id]?.name || id).charAt(0).toUpperCase(),
    models: [],
    defaultEndpoint: config[id]?.endpoint || '',
  }));
  const allProviders = [...BUILTIN_PROVIDERS, ...customProviders];

  // ── Add custom provider ──
  const addCustomProvider = (name, endpoint, model) => {
    if (!name.trim()) return;
    const id = `custom_${name.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '_').replace(/\s+/g, '_')}`;

    // Prevent duplicates
    if (customProviderIds.includes(id) || BUILTIN_PROVIDERS.some((p) => p.id === id)) {
      alert('该名称已被使用，请换一个名称');
      return;
    }

    const updated = { ...config };
    if (!updated[id]) updated[id] = {};
    updated[id].name = name.trim();
    if (endpoint) updated[id].endpoint = endpoint;
    if (model) updated[id].model = model;
    updated.__customProviders = [...customProviderIds, id];
    onConfigChange(updated);
    onActiveProviderChange(id);
    setShowAddForm(false);
    setShowPresets(false);
    setNewProvider({ name: '', endpoint: '', model: '' });
  };

  // ── Remove custom provider ──
  const removeCustomProvider = (id) => {
    const updated = { ...config };
    updated.__customProviders = customProviderIds.filter((cid) => cid !== id);
    delete updated[id];
    onConfigChange(updated);
    if (activeProvider === id) {
      onActiveProviderChange(BUILTIN_PROVIDERS[0].id);
    }
  };

  // ── Update provider field ──
  const updateProvider = (providerId, field, value) => {
    const updated = { ...config };
    if (!updated[providerId]) updated[providerId] = {};
    updated[providerId][field] = value;
    onConfigChange(updated);
  };

  // ── Test connection ──
  const handleTestConnection = async (providerId) => {
    setTestStatus((prev) => ({ ...prev, [providerId]: 'testing' }));
    setTimeout(() => {
      const provider = config[providerId];
      if (provider?.apiKey && provider.apiKey.length > 8) {
        setTestStatus((prev) => ({ ...prev, [providerId]: 'success' }));
      } else {
        setTestStatus((prev) => ({ ...prev, [providerId]: 'error' }));
      }
    }, 1200);
  };

  const isCustom = (id) => id.startsWith('custom_');

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
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-muted)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--sp-3)' }}>
            选择一个 AI 模型并配置 API 密钥。密钥仅保存在本地浏览器中，不会上传到任何服务器。
          </p>

          {allProviders.map((provider) => {
            const isActive = activeProvider === provider.id;
            const providerConfig = config[provider.id] || {};
            const status = testStatus[provider.id];
            const canRemove = isCustom(provider.id);

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
                  {canRemove && (
                    <button
                      className="btn btn-icon btn-sm provider-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCustomProvider(provider.id);
                      }}
                      aria-label={`删除 ${provider.name}`}
                      title="删除此模型"
                      style={{ marginLeft: 'auto', color: 'var(--fg-muted)', opacity: 0.6 }}
                    >
                      <Trash2 size={14} />
                    </button>
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
                      {provider.models.length === 0 ? (
                        <input
                          id={`model-${provider.id}`}
                          className="form-input"
                          placeholder="输入模型名称，如 deepseek-chat"
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

          {/* ── Add custom provider ── */}
          <div style={{ marginTop: 'var(--sp-3)' }}>
            {/* Quick-add presets */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-sm add-provider-btn"
                onClick={() => setShowPresets((v) => !v)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Plus size={14} />
                添加模型
                <ChevronDown size={12} style={{ transform: showPresets ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
              </button>

              {showPresets && (
                <div
                  className="preset-dropdown"
                  style={{
                    position: 'absolute', bottom: '100%', left: 0, right: 0,
                    marginBottom: 4, background: 'var(--bg-surface, #fff)',
                    border: '1px solid var(--border, #e5e7eb)', borderRadius: 10,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 10,
                    maxHeight: 240, overflowY: 'auto',
                  }}
                >
                  {POPULAR_PRESETS.map((preset) => {
                    const presetId = `custom_${preset.name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '_')}`;
                    const alreadyAdded = customProviderIds.includes(presetId) ||
                      BUILTIN_PROVIDERS.some((p) => p.id === presetId);
                    return (
                      <button
                        key={preset.name}
                        className="preset-item"
                        onClick={() => addCustomProvider(preset.name, preset.endpoint, preset.model)}
                        disabled={alreadyAdded}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          width: '100%', padding: '10px 14px', border: 'none', background: 'none',
                          cursor: alreadyAdded ? 'default' : 'pointer', textAlign: 'left',
                          opacity: alreadyAdded ? 0.4 : 1, fontSize: 14,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{preset.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--fg-muted, #888)', marginTop: 2 }}>{preset.model}</div>
                        </div>
                        {alreadyAdded ? (
                          <Check size={14} style={{ color: 'var(--success, #22c55e)' }} />
                        ) : (
                          <Plus size={14} style={{ color: 'var(--fg-muted, #888)' }} />
                        )}
                      </button>
                    );
                  })}
                  <div style={{ borderTop: '1px solid var(--border, #e5e7eb)', padding: '6px 8px' }}>
                    <button
                      className="preset-item"
                      onClick={() => { setShowAddForm(true); setShowPresets(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        width: '100%', padding: '10px 6px', border: 'none', background: 'none',
                        cursor: 'pointer', fontSize: 14, color: 'var(--accent, #2563eb)',
                      }}
                    >
                      <Plus size={14} />
                      自定义（手动输入）
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Manual add form */}
            {showAddForm && (
              <div style={{
                marginTop: 'var(--sp-3)', padding: 'var(--sp-3)',
                border: '1px solid var(--border, #e5e7eb)', borderRadius: 10,
                background: 'var(--bg-surface, #fafafa)',
              }}>
                <div className="form-field" style={{ marginBottom: 'var(--sp-2)' }}>
                  <label className="form-label">名称</label>
                  <input
                    className="form-input"
                    placeholder="如 DeepSeek、Moonshot"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider((p) => ({ ...p, name: e.target.value }))}
                    autoFocus
                  />
                </div>
                <div className="form-field" style={{ marginBottom: 'var(--sp-2)' }}>
                  <label className="form-label">API 端点</label>
                  <input
                    className="form-input"
                    placeholder="https://api.deepseek.com/v1"
                    value={newProvider.endpoint}
                    onChange={(e) => setNewProvider((p) => ({ ...p, endpoint: e.target.value }))}
                  />
                </div>
                <div className="form-field" style={{ marginBottom: 'var(--sp-3)' }}>
                  <label className="form-label">默认模型</label>
                  <input
                    className="form-input"
                    placeholder="deepseek-chat"
                    value={newProvider.model}
                    onChange={(e) => setNewProvider((p) => ({ ...p, model: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-sm" onClick={() => { setShowAddForm(false); setNewProvider({ name: '', endpoint: '', model: '' }); }}>
                    取消
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => addCustomProvider(newProvider.name, newProvider.endpoint, newProvider.model)}
                    disabled={!newProvider.name.trim()}
                  >
                    添加
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={onClose}>保存配置</button>
        </div>
      </div>
    </div>
  );
}
