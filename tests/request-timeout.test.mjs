import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { GenerationError, readStream, responseContent, isPromptBlocked, wellFormedText } from '../core.js';
import { validateNarrative } from '../narrative.js';

const source = await readFile(new URL('../index.js', import.meta.url), 'utf8');
const core = await readFile(new URL('../core.js', import.meta.url), 'utf8');
const extract = (text, start, end) => text.slice(text.indexOf(start), text.indexOf(end, text.indexOf(start)));

function harness(settings = {}) {
    let now = 0, nextId = 0;
    const timers = new Map();
    const state = { fallbacks: 0, chunks: [], warnings: [], op: { controller: new AbortController() } };
    const textarea = { value: 'Original draft', dispatchEvent() {}, focus() {} };
    const ctx = { chat: [] };
    Object.assign(state.op, { key: 'chat', epoch: 0, chat: ctx.chat, input: textarea.value });
    const config = { generationSource: 'custom', customApiUrl: 'https://example.invalid', customApiModel: 'test',
        connectionProfileId: 'profile', requestTimeout: 15, enableStreaming: true, fallbackToMain: true, ...settings };
    const sandbox = {
        GenerationError, readStream, responseContent, isPromptBlocked, wellFormedText,
        setTimeout(fn, delay) { const id = ++nextId; timers.set(id, { fn, at: now + delay }); return id; },
        clearTimeout(id) { timers.delete(id); },
        AbortController, getSettings: () => config, assertCurrent: op => op.controller.signal.throwIfAborted(),
        resolveMaxTokens: () => 1500, fetch: (...args) => state.fetch(...args),
        profileService: async () => ({ getSupportedProfiles: () => [{ id: 'profile' }], sendRequest: (...args) => state.sendRequest(...args) }),
        runMainGen: async prompt => { state.fallbacks++; state.mainPrompt = prompt; return 'Fallback reply'; },
        customApiWarnedThisSession: false, console: { warn() {} },
        toastr: { warning: (...args) => state.warnings.push(args) }, t: key => key,
        document: { getElementById: () => textarea }, SillyTavern: { getContext: () => ctx }, Event,
        chatKey: () => 'chat', chatEpoch: 0, textAction: null, undoDraft: null, customDirectorText: '',
        withBusyLock: async fn => { state.op.input = textarea.value; return fn(state.op); },
        writingInstruction: () => '', updateBusyBadge() {}, makePrompt: async () => 'prompt',
        validateNarrative, stripLeadingUserName: text => text, tr: ru => ru,
    };
    const api = vm.runInNewContext([
        extract(core, 'export function createRequestTimeout(', 'export function isPromptBlocked(').replace('export ', ''),
        extract(source, '    async function runProfileGen(', '    async function runMainGen('),
        extract(source, '    async function consumeOpenAIStream(', '    /**'),
        extract(source, '    async function generateEnhanceFast(', '    async function generatePlayerAction('),
        extract(source, '    async function handleGeneration(', '    // === КУБИК'),
        extract(source, '    async function restoreDraft(', '    async function sendCue('),
        '({ generateEnhanceFast, handleGeneration, restoreDraft })',
    ].join('\n'), sandbox);
    state.advance = ms => {
        now += ms;
        for (const [id, timer] of [...timers]) if (timer.at <= now && timers.delete(id)) timer.fn();
    };
    state.run = (prompt = 'prompt') => api.generateEnhanceFast(prompt, (_delta, text) => state.chunks.push(text), 'enhance', state.op);
    state.runDraft = () => api.handleGeneration('enhance');
    state.restore = () => api.restoreDraft();
    state.textarea = textarea;
    state.pendingTimers = () => timers.size;
    state.stream = () => {
        let writer;
        const body = new ReadableStream({ start(controller) { writer = controller; } });
        state.fetch = async () => ({ ok: true, status: 200, body });
        return {
            async data(text) {
                writer.enqueue(new TextEncoder().encode(text));
                // Allow fetch, reader and callback continuations to finish without real sleeps.
                await new Promise(resolve => setImmediate(resolve));
            },
            close: () => writer.close(),
        };
    };
    return state;
}

const event = content => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;

test('every request route receives well-formed Unicode, preserving normal emoji', async () => {
    const broken = 'Story 😀 \ud83d end \udc00';
    const expected = 'Story 😀 \ufffd end \ufffd';
    for (const generationSource of ['custom', 'profile', 'main']) {
        const state = harness({ generationSource, enableStreaming: false });
        let sent;
        state.fetch = async (_url, options) => {
            sent = JSON.parse(options.body).messages[1].content;
            return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: 'Reply 😀' } }] }) };
        };
        state.sendRequest = async (_id, messages) => { sent = messages[1].content; return 'Reply 😀'; };
        const reply = await state.run(broken);
        assert.equal(generationSource === 'main' ? state.mainPrompt : sent, expected);
        assert.equal(reply, generationSource === 'main' ? 'Fallback reply' : 'Reply 😀');
        assert.equal(state.textarea.value, 'Original draft');
    }
});

test('active custom stream outlives the total timeout and cleans up its timer', async () => {
    const state = harness();
    const stream = state.stream();
    const result = state.run();
    for (let i = 0; i < 4; i++) {
        state.advance(14000);
        await stream.data(event('Text '));
    }
    await stream.data('data: [DONE]\n\n');
    assert.equal(await result, 'Text '.repeat(4));
    assert.equal(state.fallbacks, 0);
    assert.equal(state.pendingTimers(), 0);
});

test('custom stream timeout preserves partial text and prevents fallback', async () => {
    const state = harness();
    const stream = state.stream();
    const result = state.run();
    const rejected = assert.rejects(result, error => error.code === 'timeout' && error.partial === 'Partial story');
    await stream.data(event('Partial story'));
    state.advance(15000);
    await rejected;
    assert.deepEqual(state.chunks, ['Partial story']);
    assert.equal(state.fallbacks, 0);
    assert.equal(state.pendingTimers(), 0);
});

test('reasoning and SSE heartbeats renew the idle timeout without becoming prose', async () => {
    const state = harness();
    const stream = state.stream();
    const result = state.run();
    state.advance(14000);
    await stream.data('data: {"choices":[{"delta":{"reasoning_content":"Thinking"}}]}\n\n');
    state.advance(14000);
    await stream.data(': keepalive\n\n');
    state.advance(14000);
    await stream.data(event('Final prose') + 'data: [DONE]\n\n');
    assert.equal(await result, 'Final prose');
    assert.deepEqual(state.chunks, ['Final prose']);
});

test('network failure after text cannot replace it with a fallback reply', async () => {
    const state = harness();
    const stream = state.stream();
    const result = state.run();
    const rejected = assert.rejects(result, error => error.code === 'stream_error');
    await stream.data(event('Partial story'));
    stream.close();
    await rejected;
    assert.equal(state.fallbacks, 0);
    assert.equal(state.pendingTimers(), 0);
});

test('failure before any output still allows configured fallback', async () => {
    const state = harness();
    state.fetch = async () => { throw new Error('network unavailable'); };
    assert.equal(await state.run(), 'Fallback reply');
    assert.equal(state.fallbacks, 1);
    assert.equal(state.pendingTimers(), 0);
});

test('manual cancellation preserves partial output and never falls back', async () => {
    const state = harness();
    const stream = state.stream();
    const result = state.run();
    const rejected = assert.rejects(result, error => error.name === 'AbortError');
    await stream.data(event('Partial story'));
    state.op.controller.abort(new DOMException('Cancelled', 'AbortError'));
    await rejected;
    assert.deepEqual(state.chunks, ['Partial story']);
    assert.equal(state.fallbacks, 0);
    assert.equal(state.pendingTimers(), 0);
});

test('non-streaming custom requests retain the total deadline and reject late results', async () => {
    const state = harness({ enableStreaming: false, fallbackToMain: false });
    state.fetch = async () => ({ ok: true, status: 200, json: async () => {
        state.advance(15000);
        return { choices: [{ message: { content: 'Late reply' } }] };
    } });
    await assert.rejects(state.run(), error => error.code === 'timeout');
    assert.equal(state.pendingTimers(), 0);
});

test('profile streams renew the deadline for text and reasoning updates', async () => {
    const state = harness({ generationSource: 'profile' });
    state.sendRequest = async () => async function* () {
        state.advance(14000);
        yield { text: '', state: { reasoning: 'Thinking' } };
        state.advance(14000);
        yield { text: 'Partial' };
        state.advance(14000);
        yield { text: 'Complete reply' };
    };
    assert.equal(await state.run(), 'Complete reply');
    assert.deepEqual(state.chunks, ['', 'Partial', 'Complete reply']);
    assert.equal(state.pendingTimers(), 0);
});

test('stalled profile stream reports timeout and retains already delivered text', async () => {
    const state = harness({ generationSource: 'profile' });
    state.sendRequest = async (_id, _prompt, _limit, options) => async function* () {
        yield { text: 'Partial story' };
        state.advance(15000);
        options.signal.throwIfAborted();
    };
    await assert.rejects(state.run(), error => error.code === 'timeout');
    assert.deepEqual(state.chunks, ['Partial story']);
    assert.equal(state.pendingTimers(), 0);
});

test('a stream with no data times out and does not hang', async () => {
    const state = harness({ fallbackToMain: false });
    const stream = state.stream();
    const result = state.run();
    const rejected = assert.rejects(result, error => error.code === 'timeout');
    await stream.data('');
    state.advance(15000);
    await rejected;
    assert.equal(state.pendingTimers(), 0);
});

test('actual Enhance handler retains timed-out prose, warns, and can restore the original', async () => {
    const state = harness();
    const stream = state.stream();
    const result = state.runDraft();
    const rejected = assert.rejects(result, error => error.code === 'timeout');
    await stream.data(event('Partial story'));
    assert.equal(state.textarea.value, 'Partial story');
    state.advance(15000);
    await rejected;
    assert.equal(state.textarea.value, 'Partial story');
    assert.match(state.warnings[0][0], /Полученный текст оставлен/);
    assert.equal(state.fallbacks, 0);
    await state.restore();
    assert.equal(state.textarea.value, 'Original draft');
});

test('streamed technical markup never reaches the draft or triggers fallback', async () => {
    const state = harness();
    const stream = state.stream();
    const result = state.runDraft();
    const rejected = assert.rejects(result, error => error.code === 'non_narrative');
    await stream.data(event('<script>alert(1)</script>'));
    await rejected;
    assert.equal(state.textarea.value, 'Original draft');
    assert.equal(state.fallbacks, 0);
    assert.equal(state.pendingTimers(), 0);
});
