// Pure response/context logic shared by the extension and regression checks.
export class GenerationError extends Error {
    constructor(code, partial = '') {
        super(code);
        this.name = 'GenerationError';
        this.code = code;
        this.partial = partial;
    }
}

export function stripCues(text) {
    return String(text || '').replace(/(?:\r?\n)*> (?:💥|🎁|❤️|🃏|💀|📝|✏️|⏩|🎲|📍|⚡)[^\n]*?<span style="display:none;">[\s\S]*?<\/span>/g, '').trim();
}

export function cleanNarrative(text) {
    // An unclosed reasoning block must never become publishable narrative.
    return String(text || '')
        .replace(/<(think|info)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi, '')
        .replace(/<\/(?:think|info)\s*>/gi, '')
        .replace(/::([A-Z_]+)_START::[\s\S]*?::\1_END::/g, '')
        .replace(/※\/?SCENE(?::[^※]*)?※/gi, '')
        .replace(/⟦\/?[A-Za-zА-Яа-яЁё\s_]+(?::[^⟧]*)?⟧/g, '')
        .replace(/^```(?:html|markdown|text)?\s*\n([\s\S]*?)\n```\s*$/i, '$1')
        .replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n').trim();
}

export function parseTransition(text, kind) {
    const source = cleanNarrative(text).replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    let data;
    try { data = JSON.parse(source.slice(source.indexOf('{'), source.lastIndexOf('}') + 1)); }
    catch { throw new GenerationError('invalid_json'); }
    const flag = kind === 'ft' ? 'can_travel' : 'can_skip';
    const list = kind === 'ft' ? 'destinations' : 'options';
    const fields = kind === 'ft' ? ['name', 'hook', 'time_cost'] : ['title', 'summary', 'time'];
    if (!data || typeof data !== 'object' || typeof data[flag] !== 'boolean') throw new GenerationError('invalid_json');
    if (!data[flag]) {
        if (typeof data.lock_reason !== 'string' || !data.lock_reason.trim() || data.lock_reason.length > 1200) throw new GenerationError('invalid_json');
        return { allowed: false, reason: data.lock_reason.trim(), options: [] };
    }
    if (!Array.isArray(data[list]) || data[list].length !== 3) throw new GenerationError('invalid_json');
    const options = data[list].map(item => {
        if (!item || fields.some(key => typeof item[key] !== 'string' || !item[key].trim() || item[key].length > 1200)) throw new GenerationError('invalid_json');
        return { title: item[fields[0]].trim(), summary: item[fields[1]].trim(), time: item[fields[2]].trim() };
    });
    return { allowed: true, reason: '', options };
}

export function recentContext(chat, depth, budget) {
    const count = Math.max(1, Math.min(40, Math.floor(Number(depth) || 8)));
    const limit = Math.max(2000, Math.min(60000, Math.floor(Number(budget) || 16000)));
    const messages = (chat || []).filter(m => !m.is_system).slice(-count)
        .map(m => `${m.name || (m.is_user ? 'User' : 'Character')}: ${stripCues(m.mes)}`);
    // Keep the most recent context if a message exceeds the character budget.
    const text = messages.join('\n\n');
    return text.length > limit ? '[…]\n' + text.slice(-(limit - 5)) : text;
}

export function fillTemplate(template, values) {
    // Replacement callbacks preserve literal $&, $` and $' in user/model text.
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => Object.hasOwn(values, key) ? String(values[key]) : match);
}

export function responseContent(data) {
    const choice = data?.choices?.[0];
    const text = choice?.message?.content;
    if (choice?.finish_reason === 'length') throw new GenerationError('truncated', typeof text === 'string' ? text : '');
    if (data?.error || choice?.finish_reason === 'content_filter') throw new GenerationError('provider_error');
    if (typeof text !== 'string' || !text.trim()) throw new GenerationError('empty_response');
    return text;
}

export async function readStream(response, onChunk, signal) {
    if (!response.body?.getReader) throw new GenerationError('stream_error');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '', result = '', completed = false;
    const onAbort = () => { void reader.cancel().catch(() => {}); };
    signal?.addEventListener('abort', onAbort, { once: true });
    function line(raw) {
        const value = raw.trim();
        if (!value.startsWith('data:')) return;
        const payload = value.slice(5).trim();
        if (payload === '[DONE]') { completed = true; return; }
        let data;
        try { data = JSON.parse(payload); } catch { throw new GenerationError('stream_error', result); }
        if (data.error) throw new GenerationError('provider_error', result);
        const choice = data.choices?.[0];
        const delta = choice?.delta?.content ?? choice?.message?.content ?? '';
        if (typeof delta !== 'string') throw new GenerationError('stream_error', result);
        if (delta) { result += delta; onChunk?.(delta, result); }
        if (choice?.finish_reason === 'length') throw new GenerationError('truncated', result);
        if (choice?.finish_reason === 'content_filter') throw new GenerationError('provider_error', result);
        if (choice?.finish_reason === 'stop') completed = true;
    }
    try {
        signal?.throwIfAborted();
        while (true) {
            const { value, done } = await reader.read();
            signal?.throwIfAborted();
            buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const raw of lines) line(raw);
            if (done) { if (buffer.trim()) line(buffer); break; }
            if (completed) break;
        }
        if (!completed) throw new GenerationError('stream_error', result);
        if (!result.trim()) throw new GenerationError('empty_response');
        return result;
    } catch (error) {
        if (signal?.aborted) throw signal.reason;
        if (error instanceof GenerationError) throw error;
        throw new GenerationError('stream_error', result);
    } finally {
        signal?.removeEventListener('abort', onAbort);
        try { await reader.cancel(); } catch { /* already closed */ }
        reader.releaseLock();
    }
}
