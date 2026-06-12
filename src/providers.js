/**
 * AI Provider Calls — OpenAI-compatible, Claude, and streaming support.
 * All provider-level API calls live here.
 */

// ── Router ──────────────────────────────────────────────

export async function callAI(provider, config, systemPrompt, userPrompt, signal) {
  if (!config?.apiKey) throw new Error('请先在设置中配置 AI 模型的 API Key');
  if (provider === 'claude') {
    return callClaude(config.apiKey, config.endpoint, config.model, systemPrompt, userPrompt, signal);
  }
  return callOpenAICompatible(config.apiKey, config.endpoint, config.model, systemPrompt, userPrompt, signal);
}

// ── OpenAI-compatible ───────────────────────────────────

export async function callOpenAICompatible(apiKey, endpoint, model, systemPrompt, userPrompt, signal) {
  const baseUrl = endpoint || 'https://api.openai.com/v1';
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: model || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 16000,
    }),
    signal: signal || AbortSignal.timeout(120_000),
  });
  if (!response.ok) {
    const errorText = await response.text();
    let msg = `API 请求失败 (${response.status})`;
    try { msg = JSON.parse(errorText).error?.message || msg; } catch {}
    throw new Error(msg);
  }
  const data = await response.json();
  const choice = data.choices?.[0];
  const content = choice?.message?.content;
  if (!content) throw new Error('AI 返回了空内容');
  return { content, finishReason: choice?.finish_reason || 'stop' };
}

// ── Claude (Anthropic) ──────────────────────────────────

export async function callClaude(apiKey, endpoint, model, systemPrompt, userPrompt, signal) {
  const baseUrl = endpoint || 'https://api.anthropic.com/v1';
  const url = `${baseUrl.replace(/\/$/, '')}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
    signal: signal || AbortSignal.timeout(120_000),
  });
  if (!response.ok) {
    const errorText = await response.text();
    let msg = `API 请求失败 (${response.status})`;
    try { msg = JSON.parse(errorText).error?.message || msg; } catch {}
    throw new Error(msg);
  }
  const data = await response.json();
  const content = data.content?.[0]?.text;
  if (!content) throw new Error('AI 返回了空内容');
  return { content, finishReason: data.stop_reason === 'max_tokens' ? 'length' : 'stop' };
}

// ── Streaming: OpenAI-compatible ────────────────────────

/**
 * Stream an OpenAI-compatible chat completion.
 * Calls `onChunk(accumulatedText)` on each SSE delta.
 * Returns the final full text.
 */
export async function streamOpenAICompatible(apiKey, endpoint, model, systemPrompt, userPrompt, onChunk, signal) {
  const baseUrl = endpoint || 'https://api.openai.com/v1';
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: model || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 16000,
      stream: true,
    }),
    signal: signal || AbortSignal.timeout(180_000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let msg = `API 请求失败 (${response.status})`;
    try { msg = JSON.parse(errorText).error?.message || msg; } catch {}
    throw new Error(msg);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // keep incomplete line in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          fullContent += delta;
          onChunk?.(fullContent);
        }
      } catch {
        // skip malformed SSE chunks
      }
    }
  }

  if (!fullContent) throw new Error('AI 返回了空内容');
  return { content: fullContent, finishReason: 'stop' };
}

// ── Streaming: Claude ───────────────────────────────────

/**
 * Stream a Claude (Anthropic) message.
 * Calls `onChunk(accumulatedText)` on each content_block_delta event.
 */
export async function streamClaude(apiKey, endpoint, model, systemPrompt, userPrompt, onChunk, signal) {
  const baseUrl = endpoint || 'https://api.anthropic.com/v1';
  const url = `${baseUrl.replace(/\/$/, '')}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      stream: true,
    }),
    signal: signal || AbortSignal.timeout(180_000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let msg = `API 请求失败 (${response.status})`;
    try { msg = JSON.parse(errorText).error?.message || msg; } catch {}
    throw new Error(msg);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);

      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          fullContent += parsed.delta.text;
          onChunk?.(fullContent);
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  if (!fullContent) throw new Error('AI 返回了空内容');
  return { content: fullContent, finishReason: 'stop' };
}

// ── Streaming Router ────────────────────────────────────

/**
 * Stream AI response. Calls `onChunk(fullText)` as text accumulates.
 * Returns { content, finishReason } when complete.
 * Optional `signal` parameter enables cancellation via AbortController.
 */
export async function callAIStream(provider, config, systemPrompt, userPrompt, onChunk, signal) {
  if (!config?.apiKey) throw new Error('请先在设置中配置 AI 模型的 API Key');
  if (provider === 'claude') {
    return streamClaude(config.apiKey, config.endpoint, config.model, systemPrompt, userPrompt, onChunk, signal);
  }
  return streamOpenAICompatible(config.apiKey, config.endpoint, config.model, systemPrompt, userPrompt, onChunk, signal);
}
