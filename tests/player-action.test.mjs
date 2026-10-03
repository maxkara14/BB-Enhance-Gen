import test from 'node:test';
import assert from 'node:assert/strict';
import { mapTravelDirection, PLAYER_ACTION_API_VERSION } from '../player-action.js';

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
