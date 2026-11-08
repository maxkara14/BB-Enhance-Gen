import test from 'node:test';
import assert from 'node:assert/strict';
import { narrativeContext, validateNarrative, normalizeNarrativeSpaces } from '../narrative.js';

test('copied Hangul filler separators become ordinary spaces in context and generated drafts', () => {
    const sample = '—\u3164Мне\u3164потребуются\u3164два\uffa0стола.\n\nКагами\u3164вышла\u3164на\u3164террасу.';
    const expected = '— Мне потребуются два стола.\n\nКагами вышла на террасу.';
    assert.equal(narrativeContext(sample), expected);
    assert.equal(validateNarrative(sample), expected);
    // Every cumulative streaming update passes through this same validator.
    for (let end = 1; end <= sample.length; end++) {
        assert.doesNotMatch(validateNarrative(sample.slice(0, end)), /[\u3164\uffa0]/);
    }
});

test('normalization preserves Unicode prose, emoji joiners and intentional layout', () => {
    const text = '— Шинобу, всё готово! 👩‍⚕️\n\n*Кагами поклонилась.*\n日本語 한글 café\n  Два  пробела.';
    assert.equal(validateNarrative(text), text);
    assert.equal(narrativeContext(text), text);
    assert.equal(validateNarrative('<p>Кагами\u3164улыбнулась.</p>'), '<p>Кагами улыбнулась.</p>');
});

test('all supported space substitutes are cleaned in context and cumulative stream output', () => {
    const codes = [0xA0, 0x1680, ...Array.from({ length: 12 }, (_, i) => 0x2000 + i),
        0x202F, 0x205F, 0x2800, 0x3000, 0xFEFF, 0x115F, 0x1160, 0x3164, 0xFFA0];
    for (const code of codes) {
        const space = String.fromCodePoint(code);
        const sample = `Мне${space}нужен${space}стол.\n\nКагами${space}кивнула. 👩‍⚕️`;
        const expected = 'Мне нужен стол.\n\nКагами кивнула. 👩‍⚕️';
        assert.equal(narrativeContext(sample), expected);
        assert.equal(validateNarrative(sample), expected);
        for (let end = 1; end <= sample.length; end++) assert.equal(validateNarrative(sample.slice(0, end)), validateNarrative(expected.slice(0, end)));
    }
    const text = '\t فارسی\u200Ctext 👩‍⚕️ ❤️ 日本語 한글\r\n  Два  пробела.\n';
    assert.equal(normalizeNarrativeSpaces(text), text);
    assert.equal(normalizeNarrativeSpaces('а\u2800\u2800б'), 'а  б');
});

test('filler cleanup preserves rejection of technical output and removal of reasoning', () => {
    assert.throws(() => validateNarrative('<script>alert(1)</script>'), error => error.code === 'non_narrative');
    assert.equal(validateNarrative('<think>Internal\u3164thought</think>Кагами\u3164кивнула.'), 'Кагами кивнула.');
});
