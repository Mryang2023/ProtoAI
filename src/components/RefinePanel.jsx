import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { MessageSquare, Code2, Send, Bot, User } from 'lucide-react';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

export default function RefinePanel({
  code,
  onCodeChange,
  messages,
  onSendMessage,
}) {
  const [activeTab, setActiveTab] = useState('chat');
  const [input, setInput] = useState('');
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
              disabled={!input.trim()}
              aria-label="发送微调指令"
            >
              <Send size={14} />
            </button>
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
