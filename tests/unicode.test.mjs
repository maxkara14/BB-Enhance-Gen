import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { sliceUnicode, wellFormedText, recentContext, fillTemplate } from '../core.js';

test('prefix and suffix budgets never split an emoji pair', () => {
    const text = 'Кира 😀 👩‍⚕️ 日本語';
    for (let budget = 0; budget <= text.length; budget++) {
        const prefix = sliceUnicode(text, 0, budget);
        const suffix = budget ? sliceUnicode(text, -budget) : '';
        assert.equal(prefix.isWellFormed(), true);
        assert.equal(suffix.isWellFormed(), true);
        assert.ok(prefix.length <= budget);
        assert.ok(suffix.length <= budget);
    }
    assert.equal(sliceUnicode('a😀b', 0, 2), 'a');
    assert.equal(sliceUnicode('a😀b', -2), 'b');
    assert.equal(sliceUnicode('a😀b', 0, 3), 'a😀');
    assert.equal(sliceUnicode('a😀b', -3), '😀b');
});

test('recent context does not emit an orphan surrogate at the history cutoff', () => {
    const chat = [{ name: 'User', mes: 'a'.repeat(2000) + '😀' + 'b'.repeat(1994) }];
    const before = structuredClone(chat);
    const result = recentContext(chat, 8, 2000);
    assert.equal(result.isWellFormed(), true);
    assert.ok(result.length <= 2000);
    assert.ok(result.endsWith('b'.repeat(1994)));
    assert.deepEqual(chat, before);
    assert.equal(recentContext([{ name: 'Кира', mes: 'Привет 😀' }], 8, 2000), 'Кира: Привет 😀');
});

test('outgoing repair preserves valid Unicode and replaces only orphan surrogates', () => {
    const valid = 'Кира 👩‍⚕️ 😀 日本語 café\n\nТекст';
    assert.equal(wellFormedText(valid), valid);
    const broken = '\ud83dНачало\udc00 / 😀 / \ud800\ud800\udc00\udfff';
    const repaired = wellFormedText(broken);
    assert.equal(repaired, '\ufffdНачало\ufffd / 😀 / \ufffd\ud800\udc00\ufffd');
    assert.equal(repaired.isWellFormed(), true);
    assert.equal(wellFormedText(repaired), repaired);
    assert.equal(JSON.stringify({ prompt: repaired }).includes('\\ud83d'), false);
});

test('actual prompt assembly keeps Unicode valid at header and history budget boundaries', async () => {
    const source = await readFile(new URL('../index.js', import.meta.url), 'utf8');
    const code = source.slice(source.indexOf('    async function makePrompt('), source.indexOf('    async function restoreDraft('));
    for (const header of ['a'.repeat(7999) + '😀tail', 'Short header 😀']) {
        const ctx = { extensionPrompts: {}, chat: [{ name: 'Кира', mes: '😀'.repeat(12000) + 'END' }] };
        const before = structuredClone(ctx);
        const makePrompt = vm.runInNewContext(code + '\nmakePrompt', {
            sliceUnicode, recentContext, fillTemplate, PLAYER_IDENTITY_RULE: 'Player identity',
            substitutePromptMacros: async text => text.startsWith('Player:') ? header : text,
            SillyTavern: { getContext: () => ctx }, getSettings: () => ({ contextBudget: 16000 }),
            narrativeContext: text => text, getOptionalMapContext: () => '', activeOperation: null,
            collectLoreContext: async () => '', checkWorldInfo() {}, writingRules: () => '',
        });
        const result = await makePrompt('enhance', 'Draft 👩‍⚕️', '', 'Keep emoji 😀');
        assert.equal(result.isWellFormed(), true);
        assert.ok(result.includes('Draft 👩‍⚕️'));
        assert.ok(result.includes('Keep emoji 😀'));
        assert.ok(result.includes('END'));
        assert.deepEqual(ctx, before);
    }
});
