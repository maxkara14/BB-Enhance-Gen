import test from 'node:test';
import assert from 'node:assert/strict';
import { transitionChat, transitionText, appendTransition, captureTransitionChat, assertTransitionChat } from '../transitions.js';

test('continuation and player draft preserve the final reply; rewrite excludes it without mutating history', () => {
    const chat = [{ is_user: true, mes: 'Wait' }, { is_user: false, mes: 'The bridge collapsed' }];
    const original = structuredClone(chat);
    for (const mode of ['me', 'continue']) assert.deepEqual(transitionChat(chat, mode), chat);
    assert.deepEqual(transitionChat(chat, 'rewrite'), [chat[0]]);
    assert.deepEqual(chat, original);
    for (const invalid of [[], [chat[0]], [{ is_system: true, mes: 'note' }]]) {
        assert.throws(() => transitionChat(invalid, 'rewrite'), error => error.code === 'no_reply');
    }
});

test('a new cue preserves previous transition descriptions and does not execute slash commands', () => {
    const previous = '⏩ Morning · 8 hours\nRested at the inn';
    const result = appendTransition(previous, '📍 Market · 15 minutes\nBuy food');
    assert.ok(result.includes(previous));
    assert.match(result, /Buy food/);
    assert.equal(appendTransition('', '⏩ Morning'), '⏩ Morning');
    assert.equal(appendTransition('/danger', '⏩ Morning')[0], '\u200B');
    assert.equal(appendTransition('A valid action', '⏩ Morning'), 'A valid action\n\n⏩ Morning');
});

test('transition instructions include destination, duration and direction for both tools', () => {
    const selected = { title: 'Garden', time: '1 hour', summary: 'Meet the keeper' };
    for (const kind of ['ft', 'ts']) {
        const text = transitionText(kind, selected);
        for (const value of Object.values(selected)) assert.ok(text.includes(value));
    }
    assert.match(transitionText('ft', { surprise: true }), /unexpected encounter/);
});

test('changed message content, swipe, deletion and new replies invalidate prepared transitions', () => {
    const chat = [{ mes: 'Original', swipe_id: 0 }];
    const snapshot = captureTransitionChat(chat);
    assert.doesNotThrow(() => assertTransitionChat(snapshot, chat));
    for (const changed of [[{ ...chat[0] }], [], [...chat, { mes: 'New' }]]) {
        assert.throws(() => assertTransitionChat(snapshot, changed), error => error.code === 'stale_scene');
    }
    chat[0].mes = 'Edited';
    assert.throws(() => assertTransitionChat(snapshot, chat), error => error.code === 'stale_scene');
    chat[0].mes = 'Original'; chat[0].swipe_id = 1;
    assert.throws(() => assertTransitionChat(snapshot, chat), error => error.code === 'stale_scene');
});
