import test from 'node:test';
import assert from 'node:assert/strict';
import { collectLoreContext } from '../lore-context.js';

function fixture() {
    const ctx = { maxContext: 8192, chatMetadata: { timedWorldInfo: { sticky: { old: 1 } } },
        extensionPrompts: { '2_floating_prompt': { value: 'Original note', scan: true } },
        getCharacterCardFields: () => ({ persona: 'Player', description: 'Keeper', personality: 'Kind', scenario: 'Garden' }),
        getTokenCountAsync: async text => text.length };
    return { enabled: true, limit: 100, chat: [{ mes: 'Old' }, { is_system: true, mes: 'Excluded' }, { mes: 'Recent' }],
        input: 'Draft', ctx, format: entry => entry.content,
        scan: async () => ({ allActivatedEntries: new Set([{ order: 2, content: 'Short lore' }, { order: 1, content: 'x'.repeat(200) }]) }) };
}

test('disabled lore never scans or counts tokens', async () => {
    assert.equal(await collectLoreContext({ enabled: false }), '');
});

test('scan receives reverse chat, draft, character data and dry-run flag', async () => {
    const args = fixture();
    args.scan = async (chat, context, dry, fields) => {
        assert.deepEqual(chat, ['Draft', 'Recent', 'Old']);
        assert.equal(context, 8192); assert.equal(dry, true);
        assert.equal(fields.personaDescription, 'Player'); assert.equal(fields.characterDescription, 'Keeper');
        assert.equal(fields.trigger, 'normal');
        return { allActivatedEntries: new Set() };
    };
    assert.equal(await collectLoreContext(args), '');
});

test('token cap includes the complete reference block, skips oversized entries and zero keeps native budget only', async () => {
    const args = fixture();
    const text = await collectLoreContext(args);
    assert.ok(text.length <= args.limit); assert.match(text, /Short lore/); assert.ok(!text.includes('xxx'));
    args.limit = 0;
    assert.match(await collectLoreContext(args), /xxx/);
});

test('dry scan restores author note and timed effects on success and errors', async () => {
    for (const fail of [false, true]) {
        const args = fixture(); const original = structuredClone(args.ctx.chatMetadata);
        args.scan = async () => {
            args.ctx.extensionPrompts['2_floating_prompt'] = { value: 'Injected lore', scan: false };
            args.ctx.chatMetadata.timedWorldInfo.sticky.new = 2;
            if (fail) throw Error('Failed scan');
            return { allActivatedEntries: new Set() };
        };
        if (fail) await assert.rejects(collectLoreContext(args), /Failed scan/);
        else await collectLoreContext(args);
        assert.equal(args.ctx.extensionPrompts['2_floating_prompt'].value, 'Original note');
        assert.deepEqual(args.ctx.chatMetadata, original);
    }
});

test('prompt callbacks survive restoration and a newly selected chat note is not overwritten', async () => {
    const args = fixture(); const filter = () => true;
    args.ctx.extensionPrompts['2_floating_prompt'].filter = filter;
    await collectLoreContext(args);
    assert.equal(args.ctx.extensionPrompts['2_floating_prompt'].filter, filter);
    args.canRestoreNote = () => false;
    args.scan = async () => {
        args.ctx.extensionPrompts['2_floating_prompt'] = { value: 'New chat note' };
        return { allActivatedEntries: new Set() };
    };
    await collectLoreContext(args);
    assert.equal(args.ctx.extensionPrompts['2_floating_prompt'].value, 'New chat note');
});

test('cancelled or stale scans never produce applicable context and remove metadata created by a dry scan', async () => {
    const args = fixture(); delete args.ctx.chatMetadata.timedWorldInfo;
    let cancelled = false;
    args.check = () => { if (cancelled) throw Error('Stale chat'); };
    args.scan = async () => { args.ctx.chatMetadata.timedWorldInfo = {}; cancelled = true; return {}; };
    await assert.rejects(collectLoreContext(args), /Stale chat/);
    assert.ok(!Object.hasOwn(args.ctx.chatMetadata, 'timedWorldInfo'));
});
