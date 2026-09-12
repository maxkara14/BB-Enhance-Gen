import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanNarrative, fillTemplate, parseTransition, readStream, recentContext, responseContent, responseSummary, stripCues } from '../core.js';

const event = data => `data: ${JSON.stringify(data)}\n\n`;
const delta = text => event({ choices: [{ delta: { content: text } }] });
const stop = event({ choices: [{ delta: {}, finish_reason: 'stop' }] });
function response(chunks) {
    return new Response(new ReadableStream({ start(controller) {
        for (const chunk of chunks) controller.enqueue(typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk);
        controller.close();
    } }));
}
const valid = kind => kind === 'ft'
    ? { can_travel: true, destinations: Array.from({ length: 3 }, () => ({ name: 'Town', hook: 'Meet a friend', time_cost: '1 hour' })) }
    : { can_skip: true, options: Array.from({ length: 3 }, () => ({ title: 'Morning', summary: 'Wake up', time: '8 hours' })) };

test('response diagnostics expose only safe shape metadata for JSON and SSE', async () => {
    const data = {secret:'PRIVATE',choices:[{message:{content:'',reasoning_content:'PRIVATE',tool_calls:[{arguments:'PRIVATE'}]},finish_reason:'PRIVATE'}],usage:{completion_tokens:123,completion_tokens_details:{reasoning_tokens:123}}};
    const summary=responseSummary(data);
    assert.equal(summary.finish,'other'); assert.equal(summary.toolCalls,1); assert.equal(summary.reasoningTokens,123);
    assert.equal(JSON.stringify(summary).includes('PRIVATE'),false);
    assert.throws(()=>responseContent(data),error=>error.code==='reasoning_only' && error.responseSummary.contentSize===0);
    await assert.rejects(readStream(response([event(data),stop]),()=>{}),error=>error.code==='reasoning_only' && error.responseSummary.events===2 && error.responseSummary.reasoningPresent && !JSON.stringify(error.responseSummary).includes('PRIVATE'));
    assert.equal(responseContent({choices:[{message:{content:'Valid prose'}}]}),'Valid prose');
});

test('FT/TS accept complete options and explicit denials', () => {
    for (const kind of ['ft', 'ts']) {
        assert.equal(parseTransition(JSON.stringify(valid(kind)), kind).options.length, 3);
        const denial = kind === 'ft' ? { can_travel: false, lock_reason: 'Busy' } : { can_skip: false, lock_reason: 'Busy' };
        assert.equal(parseTransition(JSON.stringify(denial), kind).allowed, false);
    }
});

test('Custom API accepts text blocks and completion text without exposing reasoning', async () => {
    const blocks = [{ type: 'reasoning', text: 'PRIVATE' }, { type: 'text', text: 'Hello' }, { text: ' world' }];
    for (const data of [{choices:[{message:{content:blocks}}]}, {choices:[{text:'Hello world'}]}, {content:blocks}]) {
        assert.equal(responseContent(data), 'Hello world');
    }
    for (const data of [{choices:[{delta:{content:blocks}}]}, {choices:[{text:'Hello world'}]}]) {
        assert.equal(await readStream(response([event(data),stop]),()=>{}), 'Hello world');
    }
    const reasoning = {reasoning_content:'PRIVATE'};
    assert.throws(()=>responseContent({choices:[{message:reasoning}]}),{code:'reasoning_only'});
    await assert.rejects(readStream(response([event({choices:[{delta:reasoning}]}),stop]),()=>{}),{code:'reasoning_only'});
    assert.throws(()=>responseContent({choices:[{message:{content:blocks},finish_reason:'length'}]}),{code:'truncated'});
    await assert.rejects(readStream(response([event({choices:[{delta:{content:blocks},finish_reason:'content_filter'}]})]),()=>{}),{code:'provider_error'});
});
test('FT/TS reject false strings, absent flags, null items, wrong counts and huge fields', () => {
    for (const kind of ['ft', 'ts']) {
        const flag = kind === 'ft' ? 'can_travel' : 'can_skip';
        const list = kind === 'ft' ? 'destinations' : 'options';
        for (const data of [{}, { [flag]: 'false' }, { [flag]: false }, { ...valid(kind), [list]: [null, null, null] }, { ...valid(kind), [list]: [] }]) {
            assert.throws(() => parseTransition(JSON.stringify(data), kind), { code: 'invalid_json' });
        }
        const data = valid(kind); data[list][0][kind === 'ft' ? 'name' : 'title'] = 'x'.repeat(1201);
        assert.throws(() => parseTransition(JSON.stringify(data), kind), { code: 'invalid_json' });
    }
});
test('JSON fences and reasoning can be removed without changing valid data', () => {
    assert.equal(parseTransition('<think>private</think>\n```json\n' + JSON.stringify(valid('ft')) + '\n```', 'ft').allowed, true);
    assert.throws(() => parseTransition('Not JSON', 'ft'), { code: 'invalid_json' });
});
test('SSE handles UTF8 split into individual bytes and final event without newline', async () => {
    const bytes = new TextEncoder().encode(delta('Привет 🌍') + stop.trimEnd());
    let shown = '';
    assert.equal(await readStream(response([...bytes].map(byte => new Uint8Array([byte]))), (_d, total) => { shown = total; }), 'Привет 🌍');
    assert.equal(shown, 'Привет 🌍');
    assert.equal(await readStream(response([delta('ok'), 'data: [DONE]'])), 'ok');
});
test('SSE never treats an unfinished, malformed or length-limited reply as success', async () => {
    await assert.rejects(readStream(response([delta('partial')])), { code: 'stream_error', partial: 'partial' });
    await assert.rejects(readStream(response([delta('partial'), 'data: {broken}\n\n'])), { code: 'stream_error' });
    await assert.rejects(readStream(response([delta('partial'), event({ choices: [{ finish_reason: 'length' }] })])), { code: 'truncated', partial: 'partial' });
    await assert.rejects(readStream(response([event({ error: { message: 'secret provider details' } })])), { code: 'provider_error' });
    await assert.rejects(readStream(response(['data: [DONE]\n\n'])), { code: 'empty_response' });
});
test('SSE abort cancels the reader and does not return partial text', async () => {
    const controller = new AbortController(); let cancelled = false;
    const res = new Response(new ReadableStream({ cancel() { cancelled = true; } }));
    const work = readStream(res, undefined, controller.signal);
    controller.abort(new DOMException('Cancelled', 'AbortError'));
    await assert.rejects(work, { name: 'AbortError' }); assert.equal(cancelled, true);
});
test('JSON completion errors are classified without leaking provider text', () => {
    assert.equal(responseContent({ choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }] }), 'ok');
    assert.throws(() => responseContent({ choices: [{ message: { content: 'partial' }, finish_reason: 'length' }] }), { code: 'truncated' });
    assert.throws(() => responseContent({ error: { message: 'secret' } }), { code: 'provider_error' });
    assert.throws(() => responseContent({ choices: [{ message: { content: [] } }] }), { code: 'empty_response' });
});
test('narrative cleanup preserves dialogue quotes and rejects reasoning-only output', () => {
    assert.equal(cleanNarrative('"Hello."'), '"Hello."');
    assert.equal(cleanNarrative('<think>private'), '');
    assert.equal(cleanNarrative('<think>private</think>Story'), 'Story');
    assert.equal(cleanNarrative('```html\n<b>Story</b>\n```'), '<b>Story</b>');
});
test('context strips only recognized cues, skips system messages and obeys a character budget', () => {
    const cue = '\n\n> 🎲 Result <span style="display:none;">\n<system_note>Hidden</system_note>\n</span>';
    assert.equal(stripCues('Draft' + cue), 'Draft'); assert.equal(stripCues('Draft'), 'Draft');
    assert.equal(stripCues('Draft' + cue.replace('🎲', '✏️')), 'Draft');
    assert.equal(stripCues('Draft' + cue + '\nMore'), 'Draft\nMore');
    const context = recentContext([{ name: 'old', mes: 'old' }, { is_system: true, mes: 'system' }, { name: 'new', mes: 'x'.repeat(3000) + cue }], 1, 2000);
    assert.ok(context.length <= 2000); assert.ok(!context.includes('Hidden')); assert.ok(!context.includes('system'));
});
test('template insertion preserves dollar sequences and does not recursively expand slots', () => {
    assert.equal(fillTemplate('{{input}} {{x}}', { input: "$& $` $' {{x}}", x: 'ok' }), "$& $` $' {{x}} ok");
});
