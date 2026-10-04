import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../map-context.js', import.meta.url), 'utf8');
const { getOptionalMapContext } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
test('disabled integration never reads the map', () => {
    assert.equal(getOptionalMapContext(false, { apiVersion: 1, getContext() { throw Error('must not read'); } }), '');
});
test('missing, incompatible, empty or failed API preserves normal generation', () => {
    for (const api of [undefined, {}, { apiVersion: 2, getContext: () => 'old' },
        { apiVersion: 1, getContext: () => '' }, { apiVersion: 1, getContext: () => ({}) },
        { apiVersion: 1, getContext() { throw Error('unavailable'); } }]) {
        assert.equal(getOptionalMapContext(true, api), '');
    }
});
test('map is resolved again for each chat and quoted as reference data', () => {
    let current = 'Зал — Мира, Ключ, Дым';
    const api = { apiVersion: 1, getContext: () => current };
    assert.match(getOptionalMapContext(true, api), /Зал — Мира, Ключ, Дым/);
    current = 'Garden\n{{user}}';
    const result = getOptionalMapContext(true, api);
    assert.ok(result.includes(JSON.stringify(current)));
    assert.ok(!result.includes('Зал'));
    current = '';
    assert.equal(getOptionalMapContext(true, api), '');
});
