import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../index.js', import.meta.url), 'utf8');
const extract = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const generation = extract('    async function handleGeneration(', '    // === КУБИК');
const restore = extract('    async function restoreDraft(', '    async function sendCue(');
const check = extract('    function assertCurrent(', '    function cancelOperation(');

function harness(input = 'Original draft') {
    const textarea = { value: input, dispatchEvent() {}, focus() {} };
    const ctx = { chat: [] };
    const state = { textarea, ctx, warnings: [], prompts: [], generate: async () => 'Complete reply' };
    class GenerationError extends Error { constructor(code) { super(code); this.code = code; } }
    const sandbox = {
        document: { getElementById: () => textarea },
        SillyTavern: { getContext: () => ctx },
        chatKey: () => 'chat', chatEpoch: 0, customDirectorText: '', textAction: null, undoDraft: null,
        withBusyLock: async fn => {
            const op = { key: 'chat', epoch: sandbox.chatEpoch, chat: ctx.chat, input: textarea.value, controller: new AbortController() };
            state.op = op;
            try { return await fn(op); }
            finally { op.controller.abort(); }
        },
        getSettings: () => ({}), writingInstruction: () => '', updateBusyBadge() {},
        makePrompt: async (_type, draft) => { state.prompts.push(draft); return draft; },
        generateEnhanceFast: (...args) => state.generate(...args),
        validateNarrative: text => text, stripLeadingUserName: text => text,
        toastr: { warning: text => state.warnings.push(text), info() {} },
        tr: ru => ru, t: key => key, GenerationError, Event,
    };
    const api = vm.runInNewContext(`${check}\n${restore}\n${generation}\n({ handleGeneration, restoreDraft })`, sandbox);
    return Object.assign(state, {
        run: (type = 'dir_custom') => api.handleGeneration(type),
        retry: () => api.handleGeneration(sandbox.textAction.type, sandbox.textAction),
        restore: () => api.restoreDraft(),
        undo: () => sandbox.undoDraft,
    });
}

test('director failure keeps partial output and restores the original on request', async () => {
    const state = harness();
    state.generate = async (_prompt, chunk) => { chunk('', 'Partial reply'); throw new Error('stream disconnected'); };
    await assert.rejects(state.run(), /stream disconnected/);
    assert.equal(state.textarea.value, 'Partial reply');
    assert.equal(state.warnings.length, 1);
    assert.equal(state.undo().original, 'Original draft');
    await state.restore();
    assert.equal(state.textarea.value, 'Original draft');
    assert.equal(state.undo(), null);
});

test('an initially empty draft is recoverable after cancellation', async () => {
    const state = harness('');
    state.generate = async (_prompt, chunk, _purpose, op) => {
        chunk('', 'Partial reply');
        op.controller.abort(new DOMException('Cancelled', 'AbortError'));
        return 'Late result';
    };
    await assert.rejects(state.run(), error => error.name === 'AbortError');
    assert.equal(state.textarea.value, 'Partial reply');
    await state.restore();
    assert.equal(state.textarea.value, '');
});

test('failure without output leaves the original unchanged', async () => {
    const state = harness();
    state.generate = async () => { throw new Error('timeout'); };
    await assert.rejects(state.run(), /timeout/);
    assert.equal(state.textarea.value, 'Original draft');
    assert.equal(state.undo(), null);
    assert.equal(state.warnings.length, 0);
});

test('manual edits survive late chunks, final results and restore attempts', async () => {
    for (const lateChunk of [true, false]) {
        const state = harness();
        state.generate = async (_prompt, chunk) => {
            chunk('', 'Partial reply');
            state.textarea.value = 'Manual edit';
            if (lateChunk) chunk('', 'Late chunk');
            return 'Late result';
        };
        await assert.rejects(state.run(), error => error.code === 'draft_changed');
        await assert.rejects(state.restore(), error => error.code === 'draft_changed');
        assert.equal(state.textarea.value, 'Manual edit');
        assert.equal(state.warnings.length, 0);
    }
});

test('retry generates from the original and retains it for undo after success', async () => {
    const state = harness();
    state.generate = async (_prompt, chunk) => { chunk('', 'Partial reply'); throw new Error('timeout'); };
    await assert.rejects(state.run('enhance'), /timeout/);
    state.generate = async (_prompt, chunk) => { chunk('', 'Retry partial'); return 'Complete reply'; };
    await state.retry();
    assert.deepEqual(state.prompts, ['Original draft', 'Original draft']);
    assert.equal(state.textarea.value, 'Complete reply');
    await state.restore();
    assert.equal(state.textarea.value, 'Original draft');
});

test('a changed chat cannot receive late text or an old original', async () => {
    const state = harness();
    state.generate = async (_prompt, chunk) => {
        chunk('', 'Partial reply');
        state.ctx.chat = [];
        state.textarea.value = 'Other chat draft';
        chunk('', 'Late chunk');
    };
    await assert.rejects(state.run(), error => error.code === 'stale_chat');
    assert.equal(state.textarea.value, 'Other chat draft');
    assert.equal(state.warnings.length, 0);
});
