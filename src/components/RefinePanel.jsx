import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { MessageSquare, Code2, Send, Bot, User, Scissors, Loader2 } from 'lucide-react';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

export default function RefinePanel({
  code,
  onCodeChange,
  messages,
  onSendMessage,
  onRefineRegion,
  isRefining = false,
}) {
  const [activeTab, setActiveTab] = useState('chat');
  const [input, setInput] = useState('');
  const [regionHtml, setRegionHtml] = useState('');
  const [regionInstruction, setRegionInstruction] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRegionSend = () => {
    if (!regionHtml.trim() || !regionInstruction.trim()) return;
    onRefineRegion?.(regionHtml.trim(), regionInstruction.trim());
    setRegionHtml('');
    setRegionInstruction('');
  };

  return (
    <div className="refine-panel" data-component="Refine Panel" data-od-id="refine-panel">
      {/* Tabs */}
      <div className="refine-tabs">
        <button
          className={`refine-tab${activeTab === 'chat' ? ' active' : ''}`}
          onClick={() => setActiveTab('chat')}
          aria-selected={activeTab === 'chat'}
        >
          <MessageSquare size={14} className="refine-tab-icon" />
          对话微调
        </button>
        <button
          className={`refine-tab${activeTab === 'region' ? ' active' : ''}`}
          onClick={() => setActiveTab('region')}
          aria-selected={activeTab === 'region'}
        >
          <Scissors size={14} className="refine-tab-icon" />
          局部编辑
        </button>
        <button
          className={`refine-tab${activeTab === 'code' ? ' active' : ''}`}
          onClick={() => setActiveTab('code')}
          aria-selected={activeTab === 'code'}
        >
          <Code2 size={14} className="refine-tab-icon" />
          代码编辑
        </button>
      </div>

      {/* Chat mode */}
      {activeTab === 'chat' && (
        <div className="refine-chat">
          <div className="chat-messages" role="log" aria-label="对话历史">
            {messages.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--sp-5)',
                  color: 'var(--fg-muted)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                输入自然语言指令来微调原型，例如"把导航栏改成深色背景"
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                <div className={`chat-avatar ${msg.role}`}>
                  {msg.role === 'ai' ? <Bot size={14} /> : <User size={14} />}
                </div>
                <div className="chat-bubble">{msg.content}</div>
              </div>
            ))}
            {isRefining && (
              <div className="chat-message ai">
                <div className="chat-avatar ai">
                  <Bot size={14} />
                </div>
                <div className="chat-bubble" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-muted, #888)' }}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>正在修改原型...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="chat-input-area">
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="描述你想要的修改..."
              aria-label="微调指令输入"
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSend}
              disabled={!input.trim() || isRefining}
              aria-label="发送微调指令"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Region edit mode */}
      {activeTab === 'region' && (
        <div className="refine-region" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12, padding: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
            粘贴需要修改的 HTML 片段（从代码编辑器中复制），然后描述你想要的修改。AI 会只修改选中区域，其余部分保持不变。
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary, #666)' }}>选中区域 HTML</label>
            <textarea
              value={regionHtml}
              onChange={(e) => setRegionHtml(e.target.value)}
              placeholder={'粘贴要修改的 HTML 代码片段...\n例如: <div class="header">...</div>'}
              style={{
                flex: 1,
                resize: 'none',
                border: '1px solid var(--border-color, #e5e7eb)',
                borderRadius: 8,
                padding: 10,
                fontSize: 12,
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                background: 'var(--bg-primary, #fff)',
                color: 'var(--fg-primary, #111)',
                outline: 'none',
                minHeight: 100,
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary, #666)' }}>修改指令</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={regionInstruction}
                onChange={(e) => setRegionInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleRegionSend();
                  }
                }}
                placeholder="例如：把背景色改成蓝色，增加圆角"
                style={{
                  flex: 1,
                  border: '1px solid var(--border-color, #e5e7eb)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 13,
                  background: 'var(--bg-primary, #fff)',
                  color: 'var(--fg-primary, #111)',
                  outline: 'none',
                }}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleRegionSend}
                disabled={!regionHtml.trim() || !regionInstruction.trim()}
                style={{ whiteSpace: 'nowrap' }}
              >
                <Scissors size={14} />
                修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code mode */}
      {activeTab === 'code' && (
        <div className="refine-code">
          <Suspense
            fallback={
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--fg-muted)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                加载代码编辑器...
              </div>
            }
          >
            <MonacoEditor
              height="100%"
              language="html"
              theme="vs-dark"
              value={code}
              onChange={(val) => onCodeChange(val || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                tabSize: 2,
                automaticLayout: true,
                padding: { top: 8 },
              }}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
