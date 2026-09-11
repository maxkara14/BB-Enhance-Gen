// Only synthetic data. No requests reach a real provider or SillyTavern server.
const results = [], errors = [], notifications = [], handlers = new Map(), memory = new Map();
window.__suite = { done: false, results, errors };
window.addEventListener('error', event => errors.push(event.message));
window.addEventListener('unhandledrejection', event => errors.push(String(event.reason)));
const settings = { uiLanguage: 'en', useCustomApi: true, customApiUrl: 'https://test.invalid/v1', customApiModel: 'synthetic', fallbackToMain: false, skipAnimation: true };
let key = 'chat-a', chat = [{ name: 'Player', is_user: true, mes: 'I enter the room.' }, { name: 'Character', is_user: false, mes: 'Welcome.' }];
let fetchHandler, nativeHandler, mainHandler, requests = 0, sends = [], saved = 0;
const events = Object.fromEntries(['APP_READY','CHAT_CHANGED','GENERATION_STARTED','GENERATION_ENDED','GENERATION_STOPPED'].map(key => [key,key]));
const emit = (type, ...args) => { for (const handler of handlers.get(type) || []) handler(...args); };
const ctx = {
    extensionSettings: { 'BB-Enhance-Gen': settings },
    get chat() { return chat; }, getCurrentChatId: () => key, characterId: 0, name1: 'Player',
    characters: [{ avatar: 'character.png' }], eventTypes: events,
    eventSource: { on(type, handler) { handlers.set(type, [...(handlers.get(type) || []), handler]); } },
    saveSettingsDebounced() {}, extensionPrompts: { '2_floating_prompt': { value: 'Evening in town' }, '1_memory': { value: 'Old friends' } },
    substituteParams(text) { return text.replace(/\{\{(user|persona|char|charDescription|scenario)\}\}/g, (_m,key) => ({ user: 'Player', persona: 'Human traveler', char: 'Character', charDescription: 'Friendly host', scenario: 'A quiet village' })[key]); },
    accountStorage: { getItem: key => memory.get(key) || null, setItem: (key,value) => memory.set(key,value), removeItem: key => memory.delete(key) },
    async saveChat() { saved++; },
    async generate(type) {
        emit(events.GENERATION_STARTED,type,{},false);
        const input = document.getElementById('send_textarea'); sends.push({ type, input: input.value, key, message: chat[0].mes });
        try { if (nativeHandler) await nativeHandler(type); else if (type === 'normal') input.value = ''; }
        finally { emit(events.GENERATION_ENDED); }
    },
    async generateQuietPrompt(params) {
        emit(events.GENERATION_STARTED,'quiet',{},false);
        try { return mainHandler ? await mainHandler(params) : 'Main result'; }
        finally { emit(events.GENERATION_ENDED); }
    },
    stopGeneration() { emit(events.GENERATION_STOPPED); },
};
window.SillyTavern = { getContext: () => ctx };
window.toastr = Object.fromEntries(['info','warning','error','success'].map(type => [type, message => notifications.push({ type,message })]));
window.jQuery = callback => callback();
window.fetch = async (...args) => { requests++; return fetchHandler(...args); };
const completion = text => new Response(JSON.stringify({ choices: [{ message: { content: text }, finish_reason: 'stop' }] }));
const pause = () => new Promise(resolve => setTimeout(resolve, 10));
async function until(predicate, label = 'condition') { for (let i=0;i<200;i++) { if (predicate()) return; await pause(); } throw new Error('Timed out: '+label); }
function assert(value, label) { if (!value) throw new Error(label); }
const ta = () => document.getElementById('send_textarea');
const dialog = () => document.querySelector('.bb-eg-dialog');
const button = text => [...document.querySelectorAll('.bb-eg-dialog button')].find(btn => btn.textContent === text);
const click = text => { const el = button(text); assert(el && !el.disabled, 'Enabled button: '+text); el.click(); };
async function idle() { await until(() => document.getElementById('bb-eg-stop').hidden, 'idle'); }
async function reset() {
    document.getElementById('bb-eg-stop')?.click(); await idle();
    key = 'chat-a'; chat = [{ name:'Player',is_user:true,mes:'I enter the room.' },{ name:'Character',is_user:false,mes:'Welcome.' }]; emit(events.CHAT_CHANGED);
    settings.showCuePreview=false; settings.enableStreaming=false; settings.manualRoll=false; settings.fallbackToMain=false;
    settings.useCustomApi=true; settings.askDifficultyEveryTime=false; settings.skipAnimation=true;
    settings.tensionType='romantic'; settings.outputLanguage='auto'; settings.expansion='2';
    fetchHandler = async () => completion('A polished draft.'); nativeHandler=null; mainHandler=null; ta().value='Original draft'; sends=[]; saved=0;
}
async function test(name, fn) {
    try { await reset(); await fn(); results.push({ name, pass:true }); }
    catch(error) { results.push({ name, pass:false, error:String(error) }); }
    document.getElementById('results').textContent=JSON.stringify(results,null,2);
}
await import('/index.js');

await test('preview applies only on request; undo preserves later edits', async () => {
    document.getElementById('bb-eg-btn-enhance').click(); await until(() => button('Apply') && !button('Apply').disabled);
    assert(ta().value==='Original draft','original remains'); click('Apply'); await idle(); assert(ta().value==='A polished draft.','applied');
    const undo = [...document.querySelectorAll('#bb-enhance-toolbar button')].find(b=>b.textContent.includes('Restore original'));
    ta().value+=' More'; undo.click(); await idle(); assert(ta().value.endsWith(' More'),'new edits preserved');
    ta().value='A polished draft.'; undo.click(); await idle(); assert(ta().value==='Original draft','restored');
});
await test('late response cannot overwrite an edited draft', async () => {
    let finish; fetchHandler=()=>new Promise(resolve=>{finish=resolve;});
    document.getElementById('bb-eg-btn-enhance').click(); await until(()=>finish); ta().value='New typing'; finish(completion('Late result'));
    await until(()=>button('Apply')&&!button('Apply').disabled); click('Apply'); assert(ta().value==='New typing','new typing preserved'); assert(dialog(),'preview stays for copying'); click('Cancel'); await idle();
});
await test('switching chats cancels transport and closes stale preview', async () => {
    let cancelled=false;
    fetchHandler=(_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>{cancelled=true;reject(options.signal.reason);}));
    document.getElementById('bb-eg-btn-enhance').click(); await until(()=>dialog()); await pause();
    key='chat-b'; chat=[]; ta().value='Other chat draft'; emit(events.CHAT_CHANGED); await idle();
    assert(cancelled,'transport cancelled'); assert(!dialog(),'stale preview closed'); assert(ta().value==='Other chat draft','other draft preserved');
});
await test('streaming is isolated; partial response cannot be applied; retry works', async () => {
    settings.enableStreaming=true;
    fetchHandler=async()=>new Response('data: {"choices":[{"delta":{"content":"Partial"}}]}\n\n');
    document.getElementById('bb-eg-btn-enhance').click(); await until(()=>button('Retry')&&!button('Retry').disabled);
    assert(button('Apply').disabled,'partial apply disabled'); assert(ta().value==='Original draft','draft intact');
    fetchHandler=async()=>new Response('data: {"choices":[{"delta":{"content":"Complete"}}]}\n\ndata: [DONE]');
    click('Retry'); await until(()=>!button('Apply').disabled); click('Apply'); await idle(); assert(ta().value==='Complete','retry applied');
});
await test('Escape cancels an in-flight retry and restores focus', async () => {
    if (!document.getElementById('bb-enhance-toolbar').classList.contains('expanded')) document.getElementById('bb-eg-toggle-btn').click();
    const trigger=document.getElementById('bb-eg-btn-enhance'); trigger.focus(); trigger.click(); await until(()=>button('Apply')&&!button('Apply').disabled);
    let started=false,cancelled=false;
    fetchHandler=(_url,options)=>new Promise((_resolve,reject)=>{started=true;options.signal.addEventListener('abort',()=>{cancelled=true;reject(options.signal.reason);});});
    click('Retry'); await until(()=>started); dialog().dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); await idle();
    assert(cancelled,'retry aborted'); assert(ta().value==='Original draft','draft preserved');
    await pause(); assert(document.activeElement===trigger||document.activeElement.id==='bb-eg-toggle-btn','focus returned to toolbar');
});
await test('invalid transition booleans never open selectable options or send', async () => {
    fetchHandler=async()=>completion('{"can_travel":"false"}'); document.getElementById('bb-eg-btn-ft').click(); await idle();
    assert(!dialog(),'invalid data has no dialog'); assert(sends.length===0,'no sends');
});
const travel = {can_travel:true,destinations:Array.from({length:3},(_,i)=>({name:'Town '+i,hook:'Meet a friend',time_cost:'1 hour'}))};
await test('FT refresh, editing, cue preview and double-click protection', async () => {
    settings.showCuePreview=true; let analyses=0; fetchHandler=async()=>{analyses++;return completion(JSON.stringify(travel));};
    document.getElementById('bb-eg-btn-ft').click(); await until(()=>button('Refresh options')); click('Refresh options'); await until(()=>analyses===2&&button('Apply transition'));
    dialog().querySelector('.bb-eg-option').click(); const fields=dialog().querySelectorAll('input,textarea'); fields[0].value='Edited <img src=x onerror=alert(1)>'; fields[1].value='2 hours'; fields[2].value='Visit $&';
    const apply=button('Apply transition'); apply.click(); apply.click(); await until(()=>button('Send'));
    assert(!dialog().querySelector('img'),'preview escapes HTML'); click('Send'); await idle();
    assert(sends.length===1,'one send'); assert(sends[0].input.includes('Edited &lt;img'),'cue escapes markup'); assert(sends[0].input.includes('2 hours'),'edited time'); assert(sends[0].input.includes('Visit $&'),'literal dollars');
});
await test('FT window cannot send into another chat', async () => {
    fetchHandler=async()=>completion(JSON.stringify(travel)); document.getElementById('bb-eg-btn-ft').click(); await until(()=>button('Apply transition'));
    key='chat-b'; chat=[]; emit(events.CHAT_CHANGED); await idle(); assert(!dialog(),'closed'); assert(sends.length===0,'no cross-chat send');
});
await test('TS explicit author override sends edited intention', async () => {
    fetchHandler=async()=>completion('{"can_skip":false,"lock_reason":"Conversation in progress"}');
    document.getElementById('bb-eg-btn-ts').click(); await until(()=>button('Apply transition'));
    const fields=dialog().querySelectorAll('input:not([type=checkbox]),textarea'); fields[0].value='Dawn'; fields[1].value='8 hours'; fields[2].value='End the conversation';
    click('Apply transition'); assert(dialog(),'override required'); dialog().querySelector('[type=checkbox]').checked=true; click('Apply transition'); await idle();
    assert(sends.length===1&&sends[0].input.includes('End the conversation'),'override direction sent');
});
await test('manual roll bypasses model, history is scoped by chat, and markup is escaped', async () => {
    settings.manualRoll=true; const before=requests; document.getElementById('bb-eg-btn-dice').click(); await until(()=>button('Roll'));
    dialog().querySelector('input').value='<img src=x onerror=alert(1)> win?'; click('Roll'); await until(()=>button('Continue')); assert(!dialog().querySelector('img'),'roll question safe'); click('Continue'); await idle();
    assert(requests===before,'no model call'); assert(sends.length===1,'roll sent');
    document.getElementById('bb-eg-btn-history').click(); await until(()=>dialog()); assert(dialog().textContent.includes('win?'),'history a'); click('Close'); await idle();
    key='chat-b'; chat=[]; emit(events.CHAT_CHANGED); document.getElementById('bb-eg-btn-history').click(); await until(()=>dialog()); assert(!dialog().textContent.includes('win?'),'history b isolated'); click('Close'); await idle();
});
await test('director to bot uses native swipe and persists escaped cue', async () => {
    ta().value=''; settings.tensionType='conflict'; document.getElementById('bb-eg-btn-director').click(); document.querySelector('[data-vibe=dir_tension]').click(); document.querySelector('[data-target=bot]').click(); await idle();
    assert(saved===1,'saved updated message'); assert(sends.length===1&&sends[0].type==='swipe','native swipe'); assert(sends[0].message.includes('Do not introduce romance'),'tension setting');
});
await test('prompt contains settings and bounded clean context; literal macros remain data', async () => {
    settings.expansion='3'; settings.preserveDialogue=true; settings.narrativePerson='third'; settings.outputLanguage='en'; settings.contextBudget=4000;
    ta().value='Literal {{unknown}} $&'; let prompt=''; fetchHandler=async(_url,options)=>{prompt=JSON.parse(options.body).messages[1].content;return completion('Done');};
    document.getElementById('bb-eg-btn-enhance').click(); await until(()=>button('Apply')&&!button('Apply').disabled);
    assert(prompt.includes('approximately 3 times'),'expansion'); assert(prompt.includes('verbatim'),'dialogue'); assert(prompt.includes('third person'),'person'); assert(prompt.includes('Literal {{unknown}} $&'),'literal input');
    assert(prompt.includes('Human traveler')&&prompt.includes('Friendly host')&&prompt.includes('Old friends'),'canonical context');
    assert(prompt.match(/<context>([\s\S]*?)<\/context>/)[1].length<=4000,'budget'); click('Cancel'); await idle();
});
await test('fallback to main model is explicit and cancellation never triggers fallback', async () => {
    settings.fallbackToMain=true; fetchHandler=async()=>{throw new TypeError('network');}; let main=0; mainHandler=async()=>{main++;return 'Fallback';};
    document.getElementById('bb-eg-btn-enhance').click(); await until(()=>button('Apply')&&!button('Apply').disabled); assert(main===1,'fallback called'); click('Cancel'); await idle();
    fetchHandler=(_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(options.signal.reason)));
    document.getElementById('bb-eg-btn-enhance').click(); await until(()=>dialog()); await pause(); click('Cancel'); await idle(); assert(main===1,'no fallback after cancel');
});
await test('native generation blocks extension and external generation cancels a stale preview', async () => {
    emit(events.GENERATION_STARTED,'normal',{},false); assert(document.getElementById('bb-eg-btn-enhance').disabled,'blocked'); emit(events.GENERATION_ENDED);
    document.getElementById('bb-eg-btn-enhance').click(); await until(()=>button('Apply')&&!button('Apply').disabled);
    emit(events.GENERATION_STARTED,'normal',{},false); await idle(); assert(!dialog(),'preview cancelled'); emit(events.GENERATION_ENDED);
});
await test('language settings rebuild once and dialogs trap Tab', async () => {
    const selector=document.querySelector('[data-setting=uiLanguage]'); selector.value='ru'; selector.dispatchEvent(new Event('change'));
    assert(document.querySelectorAll('#bb-enhance-wrapper').length===1,'single toolbar');
    assert(document.querySelector('#bb-eg-settings-container').textContent.includes('Язык интерфейса'),'RU settings');
    const english=document.querySelector('[data-setting=uiLanguage]'); english.value='en'; english.dispatchEvent(new Event('change'));
    document.getElementById('bb-eg-btn-enhance').click(); await until(()=>button('Apply')&&!button('Apply').disabled);
    const last=button('Retry'); last.focus(); last.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));
    assert(document.activeElement!==last&&dialog().contains(document.activeElement),'tab trapped'); click('Cancel'); await idle();
});

await test('native send failure restores draft and edited message, then releases the lock', async () => {
    nativeHandler=async()=>{throw new Error('synthetic failure');};
    const direct=()=>{document.getElementById('bb-eg-btn-director').click();document.querySelector('[data-vibe=dir_blessing]').click();document.querySelector('[data-target=bot]').click();};
    direct();await idle();assert(ta().value==='Original draft','failed send restores draft');
    ta().value='';const old=chat[0].mes;direct();await idle();assert(chat[0].mes===old,'failed swipe restores message');assert(!document.getElementById('bb-eg-btn-enhance').disabled,'lock released');
});
await test('unaccepted native message is restored and reported', async () => {
    nativeHandler=async()=>{};
    document.getElementById('bb-eg-btn-director').click();document.querySelector('[data-vibe=dir_blessing]').click();document.querySelector('[data-target=bot]').click();await idle();
    assert(ta().value==='Original draft','unaccepted draft restored');assert(notifications.at(-1).message.includes('did not accept'),'reported');
});
await test('reasoning-only and limited responses cannot be applied or fall back silently', async () => {
    settings.fallbackToMain=true;let main=0;mainHandler=async()=>{main++;return 'bad fallback';};
    fetchHandler=async()=>new Response(JSON.stringify({choices:[{message:{content:'<think>private</think>'},finish_reason:'stop'}]}));
    document.getElementById('bb-eg-btn-enhance').click();await until(()=>button('Retry')&&!button('Retry').disabled);assert(button('Apply').disabled,'reasoning blocked');
    fetchHandler=async()=>new Response(JSON.stringify({choices:[{message:{content:'Partial'},finish_reason:'length'}]}));click('Retry');await until(()=>!button('Retry').disabled);
    assert(button('Apply').disabled&&main===0,'limited answer blocked without fallback');click('Cancel');await idle();
});
await test('Custom API timeout is visible and preserves the draft', async () => {
    const originalTimeout=window.setTimeout;
    window.setTimeout=(fn,ms,...args)=>originalTimeout(fn,ms===120000?5:ms,...args);
    try {
        fetchHandler=(_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(options.signal.reason)));
        document.getElementById('bb-eg-btn-enhance').click();await until(()=>button('Retry')&&!button('Retry').disabled);
        assert(dialog().textContent.includes('timed out'),'timeout displayed');assert(ta().value==='Original draft','preserved');click('Cancel');await idle();
    } finally {window.setTimeout=originalTimeout;}
});
await test('main quiet generation works and errors release the global generation flag', async () => {
    settings.useCustomApi=false;mainHandler=async()=>{throw new Error('synthetic failure');};
    document.getElementById('bb-eg-btn-enhance').click();await until(()=>button('Retry')&&!button('Retry').disabled);
    mainHandler=async()=> 'Native quiet result';click('Retry');await until(()=>!button('Apply').disabled);click('Apply');await idle();
    assert(ta().value==='Native quiet result','native result applied');assert(!document.getElementById('bb-eg-btn-enhance').disabled,'unlocked');
});
await test('main model timeout closes preview, reports timeout and unlocks', async () => {
    settings.useCustomApi=false;
    const originalTimeout=window.setTimeout;
    window.setTimeout=(fn,ms,...args)=>originalTimeout(fn,ms===120000?5:ms,...args);
    try {
        mainHandler=()=>new Promise((_resolve,reject)=>{
            const handler=()=>reject(new DOMException('provider aborted','AbortError'));
            handlers.set(events.GENERATION_STOPPED,[...(handlers.get(events.GENERATION_STOPPED)||[]),handler]);
        });
        document.getElementById('bb-eg-btn-enhance').click();await idle();
        assert(!dialog(),'preview closed');assert(ta().value==='Original draft','draft preserved');
        assert(notifications.at(-1).message.includes('timed out'),'native timeout reported');
    } finally {window.setTimeout=originalTimeout;}
});
await test('settings clamp numeric limits on change, model listing stays text-only', async () => {
    const limit=document.querySelector('[data-setting=maxTokensMicro]');limit.value='12';limit.dispatchEvent(new Event('change'));assert(settings.maxTokensMicro===64,'lower bound');
    limit.value='0';limit.dispatchEvent(new Event('change'));assert(settings.maxTokensMicro===0,'omit limit');
    fetchHandler=async()=>new Response(JSON.stringify({data:[{id:'<img src=x onerror=alert(1)>'}]}));
    const connect=[...document.querySelectorAll('#bb-eg-settings-container button')].find(b=>b.textContent.includes('Refresh models'));connect.click();await until(()=>!connect.disabled);
    assert(!document.querySelector('#bb-eg-model-list img'),'models escaped');assert(document.querySelector('#bb-eg-model-list option').value.includes('<img'),'literal model retained');
});

window.__showPreview = async () => {
    await reset();
    ta().value='I pause at the doorway, listening to the rain.';
    fetchHandler=async()=>completion('I pause at the doorway. Rain taps against the window, and the cool air carries the scent of wet stone.');
    document.getElementById('bb-eg-toggle-btn').click();
    document.getElementById('bb-eg-btn-enhance').click();
    await until(()=>button('Apply')&&!button('Apply').disabled);
};

window.__suite.done=true;
document.getElementById('results').textContent=JSON.stringify(window.__suite,null,2);
