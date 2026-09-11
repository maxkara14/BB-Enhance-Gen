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
    mainApi: 'openai',
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
    async generateQuietPrompt() { throw new Error('Must not use chat assembly / output regex'); },
    async generateRawData(params) { return mainHandler ? await mainHandler(params) : 'Main result'; },
    extractMessageFromData(data, api) { assert(api==='openai','API snapshot passed to extraction');return typeof data==='string'?data:data?.choices?.[0]?.message?.content; },
    stopGeneration() { emit(events.GENERATION_STOPPED); },
};
window.SillyTavern = { getContext: () => ctx };
window.toastr = Object.fromEntries(['info','warning','error','success'].map(type => [type, message => notifications.push({ type,message })]));
// Host drawer behaviour; actual installed jQuery also runs the Sorter contract below.
$(document).on('click', '.inline-drawer-toggle', function () {
    const drawer = $(this).closest('.inline-drawer');
    drawer.children('.inline-drawer-content').toggle();
    drawer.find('>.inline-drawer-header .inline-drawer-icon').toggleClass('down up');
});
const profileCalls = [];
let supportedProfiles = [{ id: 'profile-a', name: 'Creative profile' }], profilesAvailable = true, profileHandler = async () => ({ content: 'Profile result' });
window.__profileService = {
    getSupportedProfiles() { if (!profilesAvailable) throw new Error('Connection Manager disabled'); return supportedProfiles; },
    async sendRequest(...args) { profileCalls.push(args); return profileHandler(...args); },
};
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
    settings.useCustomApi=true; settings.generationSource='custom'; settings.connectionProfileId=''; settings.askDifficultyEveryTime=false; settings.skipAnimation=true;
    supportedProfiles=[{id:'profile-a',name:'Creative profile'}];profilesAvailable=true;profileCalls.length=0;profileHandler=async()=>({content:'Profile result'});
    settings.tensionType='romantic'; settings.outputLanguage='auto'; settings.expansion='2';
    fetchHandler = async () => completion('A polished draft.'); nativeHandler=null; mainHandler=null; ta().value='Original draft'; sends=[]; saved=0;
}
async function test(name, fn) {
    try { await reset(); await fn(); results.push({ name, pass:true }); }
    catch(error) { results.push({ name, pass:false, error:String(error) }); }
    document.getElementById('results').textContent=JSON.stringify(results,null,2);
}
await import('/index.js');
await until(()=>document.getElementById('bb-eg-btn-enhance'), 'extension registration');
const sorter = await import('/tests/sorter-contract.js');
const migratedLegacySource = settings.generationSource;

await test('legacy Custom API source survives migration and incomplete config preserves native fallback', async () => {
    assert(migratedLegacySource==='custom','legacy custom setting retained');
    const model=settings.customApiModel;settings.customApiModel='';
    try {
        document.getElementById('bb-eg-btn-enhance').click();await until(()=>button('Apply')&&!button('Apply').disabled);
        assert(dialog().querySelectorAll('textarea')[1].value==='Main result','existing incomplete-config fallback preserved');click('Cancel');await idle();
    } finally {settings.customApiModel=model;}
});

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
await test('main raw generation works and errors release the operation lock', async () => {
    settings.useCustomApi=false;settings.generationSource='main';mainHandler=async()=>{throw new Error('synthetic failure');};
    document.getElementById('bb-eg-btn-enhance').click();await until(()=>button('Retry')&&!button('Retry').disabled);
    mainHandler=async()=> 'Native quiet result';click('Retry');await until(()=>!button('Apply').disabled);click('Apply');await idle();
    assert(ta().value==='Native quiet result','native result applied');assert(!document.getElementById('bb-eg-btn-enhance').disabled,'unlocked');
});
await test('main model timeout closes preview, reports timeout and unlocks', async () => {
    settings.useCustomApi=false;settings.generationSource='main';
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

await test('Sorter discovers the standard drawer and keeps its identity in a folder after language changes', async () => {
    const panel=document.getElementById('bb-eg-settings-container');
    assert(panel.matches('div.inline-drawer'),'standard extension root');assert(sorter.isRealExtension(panel),'real Sorter discovery');
    const title=sorter.getTitle(panel),identity=sorter.getExtensionKey(panel);
    assert(title.includes('BB Enhance Generation')&&!title.includes('1.2.'),'stable title without version');
    const folder=document.createElement('div');folder.className='bb-folder-content';document.getElementById('extensions_settings').append(folder);folder.append(panel);
    const before=panel;
    const language=panel.querySelector('[data-setting=uiLanguage]');language.value='ru';language.dispatchEvent(new Event('change'));
    const rebuilt=document.getElementById('bb-eg-settings-container');
    assert(rebuilt===before&&rebuilt.parentElement===folder,'same node stays in folder');
    assert(sorter.getTitle(rebuilt)===title&&sorter.getExtensionKey(rebuilt)===identity,'stable Sorter identity');
    const english=rebuilt.querySelector('[data-setting=uiLanguage]');english.value='en';english.dispatchEvent(new Event('change'));
    document.getElementById('extensions_settings').append(rebuilt);folder.remove();
});
await test('profile list, selected profile and request options do not change the active connection', async () => {
    const mode=document.querySelector('[data-setting=generationSource]');mode.value='profile';mode.dispatchEvent(new Event('change'));
    const profile=document.querySelector('[data-setting=connectionProfileId]');await until(()=>!profile.disabled&&profile.options.length===2,'profiles loaded');
    profile.value='profile-a';profile.dispatchEvent(new Event('change'));
    const currentId=key;const before=requests;const beforeLimit=settings.maxTokensEnhance;settings.maxTokensEnhance=0;
    document.getElementById('bb-eg-btn-enhance').click();await until(()=>button('Apply')&&!button('Apply').disabled);
    const [id,messages,limit,options]=profileCalls[0];
    assert(id==='profile-a'&&messages[1].content.includes('Original draft'),'selected profile and prompt');assert(limit===undefined,'0 omits max tokens');
    assert(options.signal instanceof AbortSignal&&options.includePreset&&options.includeInstruct&&!options.stream,'native profile options');
    assert(requests===before&&sends.length===0&&key===currentId,'no direct fetch or main generation');
    click('Apply');await idle();assert(ta().value==='Profile result','profile output applied');settings.maxTokensEnhance=beforeLimit;
});
await test('missing or unsupported profile cannot silently fall back to another model', async () => {
    settings.generationSource='profile';settings.connectionProfileId='missing';settings.fallbackToMain=true;
    let native=0;mainHandler=async()=>{native++;return 'Wrong model';};const before=requests;
    document.getElementById('bb-eg-btn-enhance').click();await until(()=>button('Retry')&&!button('Retry').disabled);
    assert(button('Apply').disabled&&profileCalls.length===0&&requests===before&&native===0,'missing profile not sent elsewhere');click('Cancel');await idle();
});
await test('disabled Connection Manager gives an actionable error without sending a request', async () => {
    settings.generationSource='profile';settings.connectionProfileId='profile-a';profilesAvailable=false;
    document.getElementById('bb-eg-btn-enhance').click();await until(()=>button('Retry')&&!button('Retry').disabled);
    assert(profileCalls.length===0&&button('Apply').disabled,'disabled service not called');assert(dialog().textContent.includes('Connection Manager'),'actionable error');click('Cancel');await idle();
});
await test('profile request is aborted on chat change and cannot overwrite a new draft', async () => {
    settings.generationSource='profile';settings.connectionProfileId='profile-a';let cancelled=false;
    profileHandler=(_id,_messages,_limit,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>{cancelled=true;reject(options.signal.reason);}));
    document.getElementById('bb-eg-btn-enhance').click();await until(()=>profileCalls.length===1);key='other-profile-chat';chat=[];ta().value='Other draft';emit(events.CHAT_CHANGED);await idle();
    assert(cancelled&&!dialog()&&ta().value==='Other draft','profile request cancelled safely');
});
await test('profile timeout and empty result stay errors with the draft intact', async () => {
    settings.generationSource='profile';settings.connectionProfileId='profile-a';const realTimeout=window.setTimeout;
    window.setTimeout=(fn,ms,...args)=>realTimeout(fn,ms===120000?5:ms,...args);
    try {
        profileHandler=(_id,_messages,_limit,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('wrapper failure',{cause:options.signal.reason}))));
        document.getElementById('bb-eg-btn-enhance').click();await until(()=>button('Retry')&&!button('Retry').disabled);assert(dialog().textContent.includes('timed out'),'profile timeout reported');
        profileHandler=async()=>({content:''});click('Retry');await until(()=>!button('Retry').disabled);assert(button('Apply').disabled,'empty profile result blocked');assert(ta().value==='Original draft','draft intact');click('Cancel');await idle();
    } finally {window.setTimeout=realTimeout;}
});
await test('profile names are text and unavailable saved profile stays visible', async () => {
    supportedProfiles=[{id:'profile-a',name:'<img src=x onerror=alert(1)>'}];settings.connectionProfileId='deleted-profile';
    const mode=document.querySelector('[data-setting=generationSource]');mode.value='profile';mode.dispatchEvent(new Event('change'));
    const profile=document.querySelector('[data-setting=connectionProfileId]');await until(()=>profile.querySelector('[value="deleted-profile"]'));
    assert(profile.value==='deleted-profile'&&!profile.querySelector('img'),'missing selection and safe names preserved');
});
await test('event flyout opens sideways without moving toolbar items and remains inside the viewport', async () => {
    const toggle=document.getElementById('bb-eg-toggle-btn');if(!document.getElementById('bb-enhance-toolbar').classList.contains('expanded'))toggle.click();
    await new Promise(resolve=>setTimeout(resolve,240));
    const dice=document.getElementById('bb-eg-btn-dice'),before=dice.getBoundingClientRect();
    document.getElementById('bb-eg-btn-director').click();await new Promise(resolve=>setTimeout(resolve,200));
    const popup=document.getElementById('bb-eg-popup'),rect=popup.getBoundingClientRect(),after=dice.getBoundingClientRect();
    assert(Math.abs(before.top-after.top)<1,'toolbar items do not shift');
    assert(rect.left>=0&&rect.right<=document.documentElement.clientWidth+1&&rect.top>=0&&rect.bottom<=innerHeight+1,'flyout inside viewport');
    const anchor=document.getElementById('bb-eg-btn-director').getBoundingClientRect();
    if(innerWidth>=700)assert(rect.left>=anchor.right||rect.right<=anchor.left,'desktop flyout opens sideways');
    popup.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert(!popup.classList.contains('show'),'Escape closes flyout');
    document.getElementById('bb-eg-btn-director').click();toggle.click();assert(!popup.classList.contains('show'),'toolbar collapse closes flyout');
});

await test('custom direction fits the flyout and preserves text through target selection', async () => {
    const toggle=document.getElementById('bb-eg-toggle-btn');
    if(!document.getElementById('bb-enhance-toolbar').classList.contains('expanded'))toggle.click();
    await new Promise(resolve=>setTimeout(resolve,240));
    document.getElementById('bb-eg-btn-director').click();
    await new Promise(resolve=>setTimeout(resolve,200));
    const popup=document.getElementById('bb-eg-popup');popup.querySelector('[data-vibe=dir_custom]').click();
    await new Promise(resolve=>setTimeout(resolve,200));
    const field=popup.querySelector('textarea');
    const fits=()=>{
        const box=popup.getBoundingClientRect(),input=popup.querySelector('textarea').getBoundingClientRect();
        assert(popup.scrollWidth<=popup.clientWidth,'no horizontal scrollbar');
        assert(input.left>=box.left&&input.right<=box.right,'input fits popup');
        assert(box.left>=0&&box.right<=innerWidth&&box.top>=0&&box.bottom<=innerHeight,'custom popup fits viewport');
    };
    fits();assert(document.activeElement===field,'custom input focused');
    const value='A mysterious visitor arrives. '+ 'LongDirection'.repeat(50);
    field.value=value;field.dispatchEvent(new Event('input',{bubbles:true}));fits();
    popup.querySelector('.bb-eg-custom-next-btn').click();
    assert(popup.querySelectorAll('.bb-eg-target-btn').length===2,'both targets preserved');
    popup.querySelector('.bb-eg-back-btn').click();
    assert(popup.querySelector('textarea').value===value,'text preserved on back');fits();
    popup.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));toggle.click();
});
await test('direction help explains scope and updates for every value in both languages', async () => {
    for(const language of ['ru','en']) {
        const languageSelect=document.querySelector('[data-setting=uiLanguage]');languageSelect.value=language;languageSelect.dispatchEvent(new Event('change'));
        for(const key of ['eventIntensity','tensionType']) {
            const select=document.querySelector(`[data-setting=${key}]`),note=document.getElementById(select.getAttribute('aria-describedby'));
            assert(note&&select.parentElement.nextElementSibling===note,'associated help below field');
            const descriptions=new Set();
            for(const option of select.options) {
                select.value=option.value;select.dispatchEvent(new Event('change'));
                assert(settings[key]===option.value,'setting still saved');
                assert(note.textContent.includes('Event Director'),'tool scope explained');
                if(key==='tensionType')assert(note.textContent.includes(language==='ru'?'Только для события «Напряжение»':'Only for the Tension event'),'tension scope explicit');
                descriptions.add(note.textContent);
            }
            assert(descriptions.size===3,'each option explained');
        }
    }
});

await test('context removes inert technical HTML but preserves prose and unknown markers', async () => {
    const {narrativeContext,validateNarrative}=await import('/narrative.js');
    const source='<p>First <em>sentence</em>.</p><script>window.__executed=true</script><style>.hud{}</style><div hidden>hidden metadata</div><div style="display:none">private</div><iframe src="https://test.invalid"></iframe><p>Second sentence.</p>';
    const result=narrativeContext(source);
    assert(result==='First sentence.\nSecond sentence.','readable prose with paragraph boundary');
    assert(!window.__executed,'scripts never executed');
    const prose='«Ключ: ⟦Север⟧». <info>A fictional inscription</info> ※SCENE※';
    assert(validateNarrative(prose)===prose,'unknown markers and literary tags preserved');
    assert(narrativeContext('Story\n```js\nalert(1)\n```')==='Story','technical fence excluded from context');
});
await test('custom for me uses explicit direction and raw main response without chat regex', async () => {
    settings.generationSource='main';let captured;
    chat[1].mes='<p>The door is shut.</p><script>widget()</script><div hidden>HUD_SECRET</div>';
    mainHandler=async params=>{captured=params;return {choices:[{message:{content:'I open the door. ⟦North⟧'},finish_reason:'stop'}]};};
    document.getElementById('bb-eg-btn-director').click();
    const popup=document.getElementById('bb-eg-popup');popup.querySelector('[data-vibe=dir_custom]').click();
    const field=popup.querySelector('textarea');field.value='Open the door slowly. Literal {{lastMessage}}';field.dispatchEvent(new Event('input',{bubbles:true}));
    popup.querySelector('.bb-eg-custom-next-btn').click();popup.querySelector('[data-target=me]').click();
    await until(()=>button('Apply')&&!button('Apply').disabled);
    assert(captured.api==='openai'&&!('quietPrompt' in captured),'raw request uses current connection');
    assert(captured.prompt.includes('Open the door slowly.')&&captured.prompt.includes('have NOT happened yet'),'direction is a future action to enact');
    assert(captured.prompt.includes('The door is shut.')&&!captured.prompt.includes('HUD_SECRET')&&!captured.prompt.includes('widget()'),'only story context supplied');
    assert(!captured.prompt.includes('{{lastMessage}}'),'native second macro expansion blocked');
    assert(ta().value==='Original draft','draft unchanged before Apply');
    click('Apply');await idle();assert(ta().value==='I open the door. ⟦North⟧','raw prose and unknown marker preserved');
});
await test('technical output and limited main responses cannot be applied; retry preserves prose', async () => {
    settings.generationSource='main';mainHandler=async()=>'<script>widget()</script>Story';
    document.getElementById('bb-eg-btn-enhance').click();await until(()=>button('Retry')&&!button('Retry').disabled);
    assert(button('Apply').disabled&&dialog().textContent.includes('technical block'),'technical output rejected');
    mainHandler=async()=>({choices:[{message:{content:'Partial'},finish_reason:'length'}]});click('Retry');await until(()=>!button('Retry').disabled);
    assert(button('Apply').disabled&&ta().value==='Original draft','limited response preserves draft');
    mainHandler=async()=> 'Complete prose.';click('Retry');await until(()=>!button('Apply').disabled);click('Apply');await idle();assert(ta().value==='Complete prose.','retry works');
});
await test('raw request is cancelled on chat change and late output cannot overwrite draft', async () => {
    settings.generationSource='main';let resolve,started=false,stopped=false;
    const listener=()=>{stopped=true;};handlers.set(events.GENERATION_STOPPED,[...(handlers.get(events.GENERATION_STOPPED)||[]),listener]);
    mainHandler=()=>{started=true;return new Promise(done=>{resolve=done;});};
    document.getElementById('bb-eg-btn-enhance').click();await until(()=>started);
    key='new-raw-chat';ta().value='New draft';emit(events.CHAT_CHANGED);resolve('Late response');await idle();
    assert(stopped&&!dialog()&&ta().value==='New draft','cancelled and late output discarded');
    handlers.set(events.GENERATION_STOPPED,handlers.get(events.GENERATION_STOPPED).filter(fn=>fn!==listener));
});

await test('installed raw API bypasses output regex, preserves prompt and supports stop events', async () => {
    const listeners=new Map();let sent,signal;
    window.__rawHarness={
        event_types:{GENERATION_STOPPED:'stop',CHAT_COMPLETION_PROMPT_READY:'ready'},
        eventSource:{on:(key,fn)=>listeners.set(key,fn),removeListener:key=>listeners.delete(key),emit:async()=>{}},
        TempResponseLength:{isCustomized:()=>false,setupEventHook:()=>()=>{}},
        substituteParams:text=>{assert(!text.includes('{{'),'literal macros must not be evaluated again');return text;},
        sendOpenAIRequest:async(type,prompt,abortSignal)=>{sent={type,prompt};signal=abortSignal;return {choices:[{message:{content:'Raw story'},finish_reason:'stop'}]};},
    };
    const native=await import('/tests/raw-contract.js');
    const data=await native.generateRawData({prompt:'Enact this action. {\u200B{lastMessage}}',api:'openai'});
    assert(sent.type==='quiet'&&sent.prompt.length===1&&sent.prompt[0].content.includes('Enact this action.'),'only supplied prompt reaches transport');
    assert(native.extractMessageFromData(data,'openai')==='Raw story','raw text extracted without regex');
    assert(listeners.size===0&&!signal.aborted,'stop handler removed after success');
    window.__rawHarness.eventSource.emit=async()=>{listeners.get('stop')?.();};
    let aborted=false;try {await native.generateRawData({prompt:'Cancelled',api:'openai'});}catch{aborted=true;}
    assert(aborted&&listeners.size===0,'stop before transport aborts and cleans up');
});
await test('main response respects native reasoning parsing and missing raw API stays an error', async () => {
    settings.generationSource='main';const raw=ctx.generateRawData;
    ctx.powerUserSettings={reasoning:{auto_parse:true}};
    ctx.parseReasoningFromString=text=>({content:text.replace(/^PRIVATE\|/, '')});
    try {
        mainHandler=async()=> 'PRIVATE|Story without reasoning.';
        document.getElementById('bb-eg-btn-enhance').click();await until(()=>button('Apply')&&!button('Apply').disabled);
        click('Apply');await idle();assert(ta().value==='Story without reasoning.','configured reasoning removed');
        ctx.generateRawData=undefined;
        document.getElementById('bb-eg-btn-enhance').click();await until(()=>button('Retry')&&!button('Retry').disabled);
        assert(button('Apply').disabled&&ta().value==='Story without reasoning.','no silent quiet fallback');click('Cancel');await idle();
    } finally {ctx.generateRawData=raw;delete ctx.powerUserSettings;delete ctx.parseReasoningFromString;}
});

window.__showSettings = async () => {
    await reset();document.getElementById('results').hidden=true;
    const language=document.querySelector('[data-setting=uiLanguage]');language.value='ru';language.dispatchEvent(new Event('change'));
    const root=document.getElementById('bb-eg-settings-container');root.querySelector('.inline-drawer-content').style.display='block';
    const mode=root.querySelector('[data-setting=generationSource]');mode.value='profile';mode.dispatchEvent(new Event('change'));
    root.querySelector('[data-section=connection]').open=true;
    await until(()=>!root.querySelector('[data-setting=connectionProfileId]').disabled);
    const profile=root.querySelector('[data-setting=connectionProfileId]');profile.value='profile-a';profile.dispatchEvent(new Event('change'));
    window.scrollTo(0,0);
};
window.__showMenu = async () => {
    await reset();document.getElementById('results').hidden=true;
    if(!document.getElementById('bb-enhance-toolbar').classList.contains('expanded'))document.getElementById('bb-eg-toggle-btn').click();
    await new Promise(resolve=>setTimeout(resolve,240));document.getElementById('bb-eg-btn-director').click();await new Promise(resolve=>setTimeout(resolve,200));
};
window.__showCustom = async () => {
    await window.__showSettings();
    document.querySelector('#bb-eg-settings-container .inline-drawer-content').style.display='none';
    await window.__showMenu();document.querySelector('#bb-eg-popup [data-vibe=dir_custom]').click();
    const field=document.querySelector('#bb-eg-popup textarea');field.value='';field.dispatchEvent(new Event('input',{bubbles:true}));
};
window.__showDirection = async () => {
    await window.__showSettings();
    const root=document.getElementById('bb-eg-settings-container');
    root.querySelector('[data-section=connection]').open=false;root.querySelector('[data-section=direction]').open=true;
    document.getElementById('send_form').hidden=true;
    root.querySelector('[data-setting=eventIntensity]').parentElement.scrollIntoView();
};
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
