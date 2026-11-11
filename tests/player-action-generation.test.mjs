import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { GenerationError } from '../core.js';
import { playerActionDirection } from '../player-action.js';
import { normalizeNarrativeSpaces, validateNarrative } from '../narrative.js';

const source = await readFile(new URL('../index.js', import.meta.url), 'utf8');
const extract = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const code = extract('    async function generatePlayerAction(', '    // === ГЕНЕРАЦИЯ ENHANCE')
    + extract('    function assertCurrent(', '    function cancelOperation(')
    + extract('    async function restoreDraft(', '    async function sendCue(');
const request = kind => kind === 'rpg_quest' ? { kind, heroName: 'Коэми', quest: { title: 'Огонь маяка', objective: 'Зажечь огонь', criteria: 'До заката', rewardText: 'Ночлег', giver: 'Мира' }, isCurrent: () => true }
    : kind === 'map_travel' ? { kind, from: { name: 'Hall' }, to: { name: 'Garden' }, mapContext: 'Door', isCurrent: () => true }
    : { kind: 'rpg_ability', hero: { name: 'Коэми', hp: 150, mp: 160 }, ability: { name: 'Дым', owner: 'Умение', description: 'Завеса', costMP: 14, duration: 3, cooldown: 2, mechanics: 'Скрытность' }, stateContext: 'Благословение', instruction: 'Обойти стража', isCurrent: () => true };
function harness() {
    const composer = { value: 'Старый черновик  ', maxLength: -1, dispatchEvent() {}, focus() {}, setSelectionRange() {} }, ctx = { chat: [] }, state = { prompts: [], generate: async () => 'Я поднимаю дымовую завесу.' };
    const sandbox = { playerActionDirection, normalizeNarrativeSpaces, validateNarrative, stripLeadingUserName: text => text,
        document: { getElementById: () => composer }, SillyTavern: { getContext: () => ctx }, chatKey: () => 'chat', chatEpoch: 0, undoDraft: null, textAction: null,
        GenerationError, AbortController, DOMException, Event, updateBusyBadge() {}, toastr: { info() {} }, tr: text => text,
        makePrompt: async (kind, input, direction) => { state.prompts.push({ kind, input, direction }); return direction; },
        generateEnhanceFast: (...args) => state.generate(...args),
        withBusyLock: async fn => {
            const op = { key: 'chat', epoch: sandbox.chatEpoch, chat: ctx.chat, input: composer.value, controller: new AbortController() };
            try { return await fn(op); } finally { op.controller.abort(); }
        } };
    const api = vm.runInNewContext(code + '\n({generatePlayerAction,restoreDraft})', sandbox);
    return { ...api, composer, ctx, state };
}
test('real action execution appends prose, uses matching template, and undo restores the exact original', async () => {
    for (const kind of ['rpg_ability', 'map_travel', 'rpg_quest']) {
        const h = harness(), original = h.composer.value;
        await h.generatePlayerAction(request(kind)); assert.equal(h.state.prompts[0].kind, kind);
        assert.equal(h.composer.value, original + '\n\nЯ поднимаю дымовую завесу.');
        await h.restoreDraft(); assert.equal(h.composer.value, original); assert.deepEqual(h.ctx.chat, []);
    }
});
test('late actions cannot overwrite edits, switched chats, changed mechanics, unavailable input or cancelled requests', async () => {
    for (const kind of ['rpg_ability', 'rpg_quest']) for (const type of ['draft', 'chat', 'action', 'input', 'cancel', 'empty', 'provider']) {
        const h = harness(), controller = new AbortController(); let current = true;
        const action = { ...request(kind), signal: controller.signal, isCurrent: () => current };
        h.state.generate = async () => {
            if (type === 'draft') h.composer.value = 'Ручная правка';
            if (type === 'chat') h.ctx.chat = [];
            if (type === 'action') current = false;
            if (type === 'input') h.composer.readOnly = true;
            if (type === 'cancel') controller.abort();
            if (type === 'empty') return '';
            if (type === 'provider') throw new GenerationError('prompt_blocked');
            return 'Поздний результат.';
        };
        await assert.rejects(h.generatePlayerAction(action));
        assert.equal(h.composer.value, type === 'draft' ? 'Ручная правка' : 'Старый черновик  ');
    }
});
