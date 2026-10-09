import { setGenerating } from '/native-stub.js';

const events = {};
const callbacks = new Map();
for (const name of ['APP_READY', 'CHAT_CHANGED', 'GENERATION_STARTED', 'GENERATION_ENDED', 'GENERATION_STOPPED']) events[name] = name;
const emit = (name, ...args) => callbacks.get(name)?.forEach(fn => fn(...args));
const state = { prompts: [], errors: [], generated: [], output: 'I crossed into the garden after an hour.', fail: false, pending: false, title: 'Morning' };
const ctx = { chat: [], characters: [{ avatar: 'fixture.png' }], characterId: 0, name1: 'Player', name2: 'Keeper',
    getCurrentChatId: () => 'fixture', maxContext: 8192, chatMetadata: {}, mainApi: 'openai', onlineStatus: 'connected',
    extensionSettings: { BB_Enhance_Gen: {} }, extensionPrompts: {},
    eventTypes: events, eventSource: { on(name, fn) { if (!callbacks.has(name)) callbacks.set(name, []); callbacks.get(name).push(fn); } },
    accountStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    saveSettingsDebounced() {}, saveChat: async () => {}, updateMessageBlock() {},
    getCharacterCardFields: () => ({ persona: 'Player', description: 'Keeper', scenario: 'Garden' }),
    substituteParams: text => text.replace(/\{\{user\}\}/g, 'Player').replace(/\{\{char\}\}/g, 'Keeper'),
    getTokenCountAsync: async text => Math.ceil(text.length / 4),
    stopGeneration() { setGenerating(false); emit(events.GENERATION_STOPPED); },
    async generate(type) {
        state.generated.push(type); setGenerating(true); emit(events.GENERATION_STARTED, type, {}, false);
        try {
            if (state.fail) throw Error('Fixture generation failure');
            if (type === 'swipe') {
                const last = ctx.chat.at(-1); last.mes = 'New scene reply'; last.swipes[last.swipe_id] = last.mes;
            } else {
                const ta = document.querySelector('#send_textarea');
                ctx.chat.push({ is_user: true, mes: ta.value }); ta.value = '';
                ctx.chat.push({ is_user: false, mes: 'Next scene reply' });
            }
        } finally { setGenerating(false); emit(events.GENERATION_ENDED); }
    },
};
ctx.extensionSettings = { 'BB-Enhance-Gen': { uiLanguage: 'en', generationSource: 'custom', customApiUrl: 'http://fixture/v1', customApiModel: 'test', requestTimeout: 15 } };
window.fixture = { ctx, state, emit, setGenerating };
window.SillyTavern = { getContext: () => ctx };
window.jQuery = fn => fn();
window.toastr = { info() {}, warning() {}, success() {}, error(message) { state.errors.push(message); } };
window.fetch = async (url, options = {}) => {
    if (url.endsWith('/models')) return Response.json({ data: [{ id: 'first-model' }, { id: 'second-model' }] });
    if (!url.endsWith('/chat/completions')) throw Error('Unexpected fixture request');
    const prompt = JSON.parse(options.body).messages.at(-1).content;
    state.prompts.push(prompt);
    if (state.pending) return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true }));
    const ft = prompt.includes('"can_travel"');
    const ts = prompt.includes('"can_skip"');
    const content = ft ? JSON.stringify({ can_travel: true, destinations: Array.from({ length: 3 }, () => ({ name: 'Garden', time_cost: '1 hour', hook: 'Meet keeper' })) })
        : ts ? JSON.stringify({ can_skip: true, options: Array.from({ length: 3 }, () => ({ title: state.title, time: '8 hours', summary: 'Rest at inn' })) }) : state.output;
    return Response.json({ choices: [{ message: { content }, finish_reason: 'stop' }] });
};

await import('/index.js');
const results = [];
const assert = (condition, message) => { if (!condition) throw Error(message); };
async function until(fn) {
    const end = Date.now() + 4000;
    while (!fn()) { if (Date.now() > end) throw Error('Fixture wait timed out'); await new Promise(done => setTimeout(done, 10)); }
}
async function test(name, fn) {
    try { await fn(); results.push('PASS ' + name); }
    catch (error) { results.push('FAIL ' + name + ': ' + error.message); }
    document.querySelector('#results').textContent = results.join('\n');
}
function reset(draft = '') {
    ctx.chat = [{ is_user: true, name: 'Player', mes: 'OLD_TRANSITION: rested at inn' }, { is_user: false, name: 'Keeper', mes: 'FINAL_REPLY_SENTINEL: the bridge collapsed', extra: {} }];
    document.querySelector('#send_textarea').value = draft;
    state.prompts = []; state.errors = []; state.generated = []; state.fail = false; state.pending = false;
    state.output = 'I crossed into the garden after an hour.'; state.title = 'Morning';
    emit(events.CHAT_CHANGED);
}
async function clickText(text) {
    await until(() => [...document.querySelectorAll('.bb-eg-dialog button')].some(b => b.textContent === text));
    [...document.querySelectorAll('.bb-eg-dialog button')].find(b => b.textContent === text).click();
}
async function prepare(kind, mode) {
    document.querySelector('#bb-eg-btn-' + kind).click();
    await clickText({ me: 'Me — draft', continue: 'Bot — continue', rewrite: 'Rewrite final reply' }[mode]);
    await until(() => document.querySelector('.bb-eg-option'));
    document.querySelector('.bb-eg-option').click();
}
async function apply() { await clickText('Apply transition'); await until(() => document.querySelector('#bb-eg-stop').hidden); }

await test('model list loads once and selection synchronizes manual entry', async () => {
    [...document.querySelectorAll('button')].find(b => b.textContent === 'Connect / Refresh models').click();
    await until(() => !document.querySelector('#bb-eg-model-list').disabled);
    const list = document.querySelector('#bb-eg-model-list'); list.value = 'second-model'; list.dispatchEvent(new Event('change'));
    assert(ctx.extensionSettings['BB-Enhance-Gen'].customApiModel === 'second-model', 'Selected model not saved');
    assert(document.querySelector('input[data-setting="customApiModel"]').value === 'second-model', 'Manual input not synchronized');
});
await test('Director recovers after a start event without an end event', async () => {
    reset(); emit(events.GENERATION_STARTED, 'normal', {}, false);
    assert(document.querySelector('#bb-eg-btn-director').disabled, 'Expected initial lock');
    await until(() => !document.querySelector('#bb-eg-btn-director').disabled);
    document.querySelector('#bb-eg-btn-director').click();
    assert(document.querySelector('#bb-eg-popup').classList.contains('show'), 'Director did not open');
    document.querySelector('#bb-eg-btn-director').click();
});
await test('actual native generation remains blocked', async () => {
    setGenerating(true); emit(events.GENERATION_STARTED, 'normal', {}, false);
    await new Promise(done => setTimeout(done, 600));
    assert(document.querySelector('#bb-eg-btn-director').disabled, 'Native generation lock lost');
    setGenerating(false); emit(events.GENERATION_ENDED);
});
await test('Director repairs a detached popup and follows actual menu visibility', async () => {
    reset(); const button = document.querySelector('#bb-eg-btn-director');
    button.click(); const popup = document.querySelector('#bb-eg-popup'); popup.classList.remove('show'); popup.remove();
    button.click();
    assert(popup.isConnected && popup.classList.contains('show'), 'Detached popup did not recover');
    button.click();
});
for (const kind of ['ft', 'ts']) {
    await test(kind + ' continuation preserves previous reply and transition text', async () => {
        reset(); const original = ctx.chat[1]; await prepare(kind, 'continue'); await apply();
        assert(ctx.chat.length === 4 && ctx.chat[1] === original, 'History replaced');
        assert(ctx.chat[0].mes.includes('OLD_TRANSITION'), 'Earlier description removed');
        assert(state.generated[0] === 'normal', 'Wrong generation type');
        assert(ctx.chat[2].mes.includes(kind === 'ft' ? '1 hour' : '8 hours'), 'Duration missing');
        assert(state.prompts[0].includes('FINAL_REPLY_SENTINEL'), 'Continuation context incomplete');
    });
    await test(kind + ' player draft appends prose and undo restores original', async () => {
        reset('My existing draft'); await prepare(kind, 'me'); await apply();
        assert(ctx.chat.length === 2 && !state.generated.length, 'Draft sent to chat');
        assert(document.querySelector('#send_textarea').value === 'My existing draft\n\n' + state.output, 'Draft not preserved');
        assert(state.prompts.every(p => p.includes('FINAL_REPLY_SENTINEL')), 'Player context incomplete');
        document.querySelector('#bb-eg-undo').click(); await until(() => document.querySelector('#bb-eg-stop').hidden);
        assert(document.querySelector('#send_textarea').value === 'My existing draft', 'Undo failed');
    });
    await test(kind + ' rewriting preserves the old swipe and excludes replaced reply', async () => {
        reset('Author intention'); const previous = ctx.chat[1].mes; await prepare(kind, 'rewrite'); await apply();
        assert(ctx.chat.length === 2 && state.generated[0] === 'swipe', 'Rewrite appended a reply');
        assert(ctx.chat[1].swipes[0] === previous && ctx.chat[1].swipes[1] === 'New scene reply', 'Old swipe lost');
        assert(!state.prompts[0].includes('FINAL_REPLY_SENTINEL'), 'Replaced reply contaminated analysis');
        assert(document.querySelector('#send_textarea').value === 'Author intention', 'Author draft lost');
    });
}
await test('rewrite failure restores the original reply, user message and draft', async () => {
    reset('Keep draft'); const original = JSON.stringify(ctx.chat); state.fail = true;
    await prepare('ts', 'rewrite'); await apply();
    assert(JSON.stringify(ctx.chat) === original, 'Failed rewrite modified history');
    assert(document.querySelector('#send_textarea').value === 'Keep draft', 'Failed rewrite modified draft');
});
await test('changed draft while choosing a transition remains intact', async () => {
    reset(); await prepare('ts', 'continue'); document.querySelector('#send_textarea').value = 'Manual edit'; await apply();
    assert(document.querySelector('#send_textarea').value === 'Manual edit' && !state.generated.length, 'Manual edit overwritten');
});
await test('changed scene invalidates prepared transition', async () => {
    reset(); await prepare('ts', 'continue'); ctx.chat[1].mes = 'Edited reply'; await apply();
    assert(!state.generated.length && ctx.chat[1].mes === 'Edited reply', 'Stale transition applied');
});
await test('technical model output does not overwrite player draft', async () => {
    reset('Keep draft'); await prepare('ts', 'me'); state.output = '<script>alert(1)</script>'; await apply();
    assert(document.querySelector('#send_textarea').value === 'Keep draft' && ctx.chat.length === 2, 'Technical output applied');
});
await test('cancelled API request preserves draft and unlocks controls', async () => {
    reset('Keep draft'); state.pending = true; document.querySelector('#bb-eg-btn-ts').click(); await clickText('Me — draft');
    await until(() => state.prompts.length); document.querySelector('#bb-eg-stop').click();
    await until(() => document.querySelector('#bb-eg-stop').hidden);
    assert(document.querySelector('#send_textarea').value === 'Keep draft', 'Cancelled request changed draft');
});
await test('lore setting adds active lore to the outgoing request', async () => {
    reset(); ctx.extensionSettings['BB-Enhance-Gen'].useLorebooks = true;
    await prepare('ts', 'me'); await apply();
    assert(state.prompts.every(p => p.includes('LORE_SENTINEL')), 'Lore absent from request');
    ctx.extensionSettings['BB-Enhance-Gen'].useLorebooks = false;
});
await test('model markup in transition descriptions is escaped in the sent message', async () => {
    reset(); state.title = '<img src=x onerror=alert(1)>';
    await prepare('ts', 'continue'); await apply();
    assert(!ctx.chat[2].mes.includes('<img') && ctx.chat[2].mes.includes('&lt;img'), 'Model markup was sent as executable HTML');
});
await test('a later Director cue preserves an earlier transition description', async () => {
    reset(); document.querySelector('#bb-eg-btn-director').click();
    document.querySelector('[data-vibe="dir_custom"]').click();
    const input = document.querySelector('.bb-eg-custom-textarea'); input.value = 'Introduce a visitor'; input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('[data-target="bot"]').click();
    await until(() => document.querySelector('#bb-eg-stop').hidden);
    assert(ctx.chat[0].mes.includes('OLD_TRANSITION') && ctx.chat[0].mes.includes('Introduce a visitor'), 'Earlier transition removed by Director');
});
await test('switching chats during analysis cancels the late result', async () => {
    reset('Keep draft'); state.pending = true; document.querySelector('#bb-eg-btn-ts').click(); await clickText('Me — draft');
    await until(() => state.prompts.length);
    ctx.chat = [{ is_user: true, mes: 'Other scene' }]; document.querySelector('#send_textarea').value = 'New chat draft'; emit(events.CHAT_CHANGED);
    await until(() => document.querySelector('#bb-eg-stop').hidden);
    assert(!document.querySelector('.bb-eg-dialog') && document.querySelector('#send_textarea').value === 'New chat draft', 'Late result reached new chat');
});
reset();
document.querySelector('#results').dataset.failed = String(results.filter(r => r.startsWith('FAIL')).length);
document.querySelector('#results').dataset.complete = 'true';
document.querySelector('#results').textContent = results.join('\n') + '\n' + results.length + ' browser checks completed';
