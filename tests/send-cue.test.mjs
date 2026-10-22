import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { appendTransition } from '../transitions.js';

// Exercise the actual integration function without booting the extension UI.
const source = await readFile(new URL('../index.js', import.meta.url), 'utf8');
const sendCueSource = source.slice(source.indexOf('    async function sendCue('), source.indexOf('    function makeCue('));

function harness(generate) {
    const user = { is_user: true, mes: '' };
    const reply = { mes: 'Old reply', swipe_id: 0, swipes: ['Old reply'] };
    const chat = [user, reply];
    const op = { key: 'chat', epoch: 0, chat, input: '', controller: new AbortController() };
    const textarea = { value: '', dispatchEvent() {} };
    const state = { user, reply, chat, op, textarea, saves: [], stops: 0, warnings: 0 };
    const ctx = {
        chat, onlineStatus: 'connected',
        generate: () => generate(state),
        saveChat: async () => { state.saves.push(structuredClone(chat)); },
        stopGeneration: () => { state.stops++; },
        updateMessageBlock() {},
    };
    state.ctx = ctx;
    class GenerationError extends Error { constructor(code) { super(code); this.code = code; } }
    const sandbox = {
        SillyTavern: { getContext: () => ctx },
        assertCurrent: () => { op.controller.signal.throwIfAborted(); },
        mainGenerating: false, pendingBotResponse: false, chatEpoch: 0,
        chatKey: () => 'chat', maybeShowCuePreview: async () => true,
        updateBusyBadge() {}, appendTransition, ensureSwipes() {}, syncMesToSwipe() {},
        document: { getElementById: () => textarea }, Event, GenerationError,
        // A timeout here would interrupt valid, long-running main generation.
        setTimeout() { throw new Error('Enhance must not time out main generation'); },
        toastr: { warning() { state.warnings++; } }, tr: ru => ru,
    };
    const sendCue = vm.runInNewContext(`${sendCueSource}\nsendCue`, sandbox);
    state.run = (mode = 'rewrite') => sendCue('OOC: next morning', op, mode);
    return state;
}

test('failed streaming rewrite preserves the cue, partial text and old swipes', async () => {
    const failure = new Error('stream disconnected');
    const state = harness(async ({ reply }) => {
        reply.mes = 'New partial reply';
        reply.swipes[reply.swipe_id] = reply.mes;
        throw failure;
    });
    await assert.rejects(state.run(), error => error === failure);
    assert.match(state.user.mes, /OOC: next morning/);
    assert.equal(state.reply.mes, 'New partial reply');
    assert.deepEqual(state.reply.swipes, ['Old reply', 'New partial reply']);
    assert.equal(state.saves.at(-1)[1].mes, 'New partial reply');
    assert.equal(state.op.mainRequest, false);
});

test('empty reply leaves the cue available for retry', async () => {
    const state = harness(async ({ reply }) => { reply.mes = ''; });
    await assert.rejects(state.run(), error => error.code === 'empty_response');
    assert.match(state.user.mes, /OOC: next morning/);
    assert.equal(state.reply.swipes[0], 'Old reply');
});

test('successful rewrite keeps both variants and removes the abort listener', async () => {
    const state = harness(async ({ reply }) => {
        reply.mes = 'Complete reply';
        reply.swipes[reply.swipe_id] = reply.mes;
    });
    assert.equal(await state.run(), true);
    assert.deepEqual(state.reply.swipes, ['Old reply', 'Complete reply']);
    state.op.controller.abort();
    assert.equal(state.stops, 0);
});

test('cancelled streaming rewrite saves received text and reports cancellation', async () => {
    const reason = new DOMException('Stopped', 'AbortError');
    const state = harness(async ({ reply, op }) => {
        reply.mes = 'Interrupted reply';
        reply.swipes[reply.swipe_id] = reply.mes;
        op.controller.abort(reason);
    });
    await assert.rejects(state.run(), error => error === reason);
    assert.equal(state.stops, 1);
    assert.equal(state.saves.at(-1)[1].mes, 'Interrupted reply');
    assert.match(state.user.mes, /OOC: next morning/);
});

test('unsent continuation retains its prepared draft', async () => {
    const state = harness(async () => {});
    await assert.rejects(state.run('continue'), error => error.code === 'not_sent');
    assert.match(state.textarea.value, /OOC: next morning/);
    assert.equal(state.reply.mes, 'Old reply');
});

test('error recovery does not save into a different chat', async () => {
    const failure = new Error('disconnected');
    const state = harness(async ({ ctx }) => { ctx.chat = []; throw failure; });
    await assert.rejects(state.run(), error => error === failure);
    assert.equal(state.saves.length, 1); // Cue saved before generation only.
});

test('save failure does not hide the original generation error', async () => {
    const failure = new Error('disconnected');
    const state = harness(async ({ ctx }) => {
        ctx.saveChat = async () => { throw new Error('save failed'); };
        throw failure;
    });
    await assert.rejects(state.run(), error => error === failure);
    assert.equal(state.warnings, 1);
});
