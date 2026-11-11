import test from 'node:test';
import assert from 'node:assert/strict';
import { mapTravelDirection, playerActionDirection, PLAYER_ACTION_API_VERSION, PLAYER_ACTION_KINDS } from '../player-action.js';

const request = { kind: 'map_travel', from: { name: 'Hall' }, to: { name: 'Garden', threat_level: 'danger', threat_reason: 'Fire' },
    mapContext: '{{setvar::x::1}} <img src=x>', instruction: 'Carefully', isCurrent: () => true };
test('map action API validates and snapshots only supported reference fields', () => {
    assert.equal(PLAYER_ACTION_API_VERSION, 1);
    const snapshot = JSON.stringify(request);
    const direction = mapTravelDirection(request);
    assert.match(direction, /Fire/);
    assert.match(direction, /\{\{setvar/);
    assert.equal(JSON.stringify(request), snapshot);
    for (const invalid of [null, { ...request, kind: 'unknown' }, { ...request, isCurrent: null },
        { ...request, from: {} }, { ...request, from: { name: 'Hall', summary: false } },
        { ...request, to: { name: 'Garden', threat_level: 'invalid' } },
        { ...request, signal: {} }, { ...request, mapContext: 'x'.repeat(32001) }]) {
        assert.throws(() => mapTravelDirection(invalid), error => error.code === 'invalid_action');
    }
});

export const rpgRequest = () => ({ kind: 'rpg_ability', hero: { name: 'Коэми', hp: 150, mp: 160 },
    ability: { name: 'Тёмный дым', owner: 'Умение', description: 'Создаёт дымовую завесу.', costMP: 14, duration: 3, cooldown: 2, mechanics: 'Скрытность +20%' },
    stateContext: 'На герое действует благословение.', instruction: 'Скрыться и обойти стража.', isCurrent: () => true });
test('RPG action contract snapshots accepted mechanics and intention; map contract stays supported', () => {
    const request = rpgRequest(), before = JSON.stringify(request);
    const direction = playerActionDirection(request); request.ability.name = 'Changed';
    assert.match(direction, /Тёмный дым/); assert.match(direction, /Скрыться/); assert.match(direction, /14/); assert.equal(direction.includes('Changed'), false);
    assert.ok(PLAYER_ACTION_KINDS.includes('map_travel')); assert.ok(PLAYER_ACTION_KINDS.includes('rpg_ability'));
    assert.equal(playerActionDirection({ ...JSON.parse(before), kind: 'map_travel', ...{ from: { name: 'Hall' }, to: { name: 'Garden' }, mapContext: '', isCurrent: () => true } }).startsWith('Saved map'), true);
});
test('RPG action rejects unsupported, unavailable and oversized inputs before generation', () => {
    for (const mutate of [r => r.kind = 'unknown', r => r.isCurrent = null, r => r.signal = {}, r => r.instruction = '', r => r.instruction = 'x'.repeat(2001),
        r => r.hero.hp = 0, r => r.hero.mp = 1, r => r.ability.costMP = '14', r => r.ability.duration = -1, r => r.stateContext = 'x'.repeat(16001)]) {
        const request = rpgRequest(); mutate(request); assert.throws(() => playerActionDirection(request), e => e.code === 'invalid_action');
    }
});
test('quest agreement validates and snapshots only established terms', () => {
    const request = { kind: 'rpg_quest', heroName: 'Коэми', quest: { title: 'Огонь маяка', objective: 'Зажечь огонь', criteria: 'До заката', rewardText: 'Ночлег', giver: 'Мира' }, isCurrent: () => true };
    const direction = playerActionDirection(request); request.quest.title = 'Changed';
    assert.match(direction, /Огонь маяка/); assert.equal(direction.includes('Changed'), false);
    for (const mutate of [r => r.heroName = '', r => r.quest.objective = '', r => r.quest.rewardText = 'x'.repeat(1001), r => r.signal = {}, r => r.isCurrent = null]) {
        const value = structuredClone({ ...request, isCurrent: undefined }); value.isCurrent = () => true; mutate(value);
        assert.throws(() => playerActionDirection(value), e => e.code === 'invalid_action');
    }
});
