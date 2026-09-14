import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanButtonIcon, customButtons, writingInstruction, DEFAULT_WRITING_INSTRUCTIONS, WRITING_LIMITS } from '../writing.js';

test('missing or malformed overrides preserve defaults; only writing actions can be edited', () => {
    for (const value of [undefined, null, 5, '', ' ', 'x'.repeat(8001)]) {
        assert.equal(writingInstruction('enhance', { enhance: value }), DEFAULT_WRITING_INSTRUCTIONS.enhance);
    }
    assert.equal(writingInstruction('improve', { improve: ' Shorten. ' }), 'Shorten.');
    assert.equal(writingInstruction('ft_analyzer', { ft_analyzer: 'Break JSON' }), '');
    assert.equal(writingInstruction('constructor', {}), '');
    assert.equal(writingInstruction('enhance', Object.create({ enhance: 'inherited' })), DEFAULT_WRITING_INSTRUCTIONS.enhance);
});

test('button settings reject malformed identities, duplicates and unbounded fields without mutating input', () => {
    const valid = { id: 'custom-one', name: ' Shorten ', icon: '✧', instruction: ' Shorten the draft. ', enabled: false };
    const input = [null, {}, { ...valid, id: '<img>' }, { ...valid, instruction: '' }, valid, { ...valid }, { ...valid, id: 'custom-two', name: 'x'.repeat(49) }];
    const original = structuredClone(input);
    assert.deepEqual(customButtons(input), [{ ...valid, name: 'Shorten', instruction: 'Shorten the draft.' }]);
    assert.deepEqual(input, original);
    assert.deepEqual(customButtons({}), []);
    assert.equal(customButtons(Array.from({ length: 25 }, (_, i) => ({ ...valid, id: `custom-${i}` }))).length, WRITING_LIMITS.buttons);
});

test('instruction content stays literal and names remain data', () => {
    const value = { id: 'custom-one', name: '<img src=x>', icon: '<svg>', instruction: '{{input}} $& __BB_INPUT__' };
    assert.deepEqual(customButtons([value]), [{ ...value, icon: '<>', enabled: true }]);
    assert.equal(writingInstruction('enhance', { enhance: value.instruction }), value.instruction);
});

test('icons reject multilingual letters and whitespace while preserving emoji sequences and digits', () => {
    assert.equal(cleanButtonIcon('AbЯё中文é\r\n\t \u2028\u2029 123!?★'), '123!?★');
    for (const icon of ['☾', '1️⃣', '🧑🏽‍🚀', '🇬🇧', '❤️', '🏴\u{e0067}\u{e0062}\u{e007f}']) assert.equal(cleanButtonIcon(icon), icon);
    const item = { id: 'custom-old', name: 'Old button', icon: 'ABC\n', instruction: 'Shorten.' };
    assert.equal(customButtons([item])[0].icon, '✧');
    assert.equal(item.icon, 'ABC\n', 'reading old settings does not rewrite stored data');
});
