// Uses the existing synthetic context setup, then exercises the real current modules.
const { DEFAULT_WRITING_INSTRUCTIONS } = await import('/writing.js');
const originalReset = reset;
let savedSettings = 0;
ctx.saveSettingsDebounced = () => { savedSettings++; };
function changeLanguage(value) {
    const language = document.querySelector('[data-setting=uiLanguage]'); language.value = value; language.dispatchEvent(new Event('change'));
}
reset = async () => {
    document.querySelector('.bb-eg-dialog .bb-eg-close')?.click();
    await originalReset(); settings.writingInstructions = {}; settings.customButtons = [];
    settings.preserveDialogue = false; settings.narrativePerson = 'preserve'; settings.outputLanguage = 'auto';
    settings.btnEnhance = settings.btnImprove = settings.btnDirector = settings.btnDice = settings.btnFastTravel = settings.btnTimeSkip = true;
    changeLanguage('en');
};
function enter(selector, value) { const input = document.querySelector(selector); input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })); return input; }
function saveInstruction(type, value) {
    const input = enter(`[data-writing-instruction=${type}]`, value); input.closest('details').open = true;
    document.querySelector(`[data-writing-save=${type}]`).click();
}
function addButton(name = 'Shorten', instruction = 'Shorten the draft.', icon = '✧') {
    document.querySelector('[data-custom-add]').click();
    enter('[data-custom-field=name]', name); enter('[data-custom-field=icon]', icon); enter('[data-custom-field=instruction]', instruction);
    document.querySelector('[data-custom-save]').click();
    return settings.customButtons.at(-1);
}
function action(item) { return document.getElementById(`bb-eg-btn-${item.id}`); }
function promptFrom(options) { return JSON.parse(options.body).messages.map(message => message.content).join('\n'); }
function showSettings() {
    document.querySelector('#bb-eg-settings-container > .inline-drawer-content').style.display = 'block';
    document.querySelector('[data-section=custom-buttons]').open = true;
}

await test('Enhance/Improve instruction save, defaults and shared context/settings', async () => {
    showSettings();
    saveInstruction('enhance', 'Give the draft a spare, restrained voice.');
    let prompt;
    settings.expansion = '3'; settings.preserveDialogue = true; settings.narrativePerson = 'third'; settings.outputLanguage = 'en';
    fetchHandler = async (_url, options) => { prompt = promptFrom(options); return completion('New prose.'); };
    document.getElementById('bb-eg-btn-enhance').click(); await idle();
    assert(prompt.includes('spare, restrained') && !prompt.includes('deep sensory'), 'edited instruction used');
    assert(prompt.includes('Human traveler') && prompt.includes('Evening in town') && prompt.includes('Welcome.') && prompt.includes('Original draft'), 'context and draft retained');
    assert(prompt.includes('3 times') && prompt.includes('verbatim') && prompt.includes('third person') && prompt.includes('strictly in English'), 'output settings retained');
    assert(!dialog() && ta().value === 'New prose.', 'direct generation');
    document.querySelector('[data-writing-reset=enhance]').click();
    assert(document.querySelector('[data-writing-instruction=enhance]').value === DEFAULT_WRITING_INSTRUCTIONS.enhance, 'reset visible');
    assert(!settings.writingInstructions.enhance, 'default selected');
    saveInstruction('improve', 'Polish with a brisk rhythm.');
    document.getElementById('bb-eg-btn-improve').click(); await idle();
    assert(prompt.includes('brisk rhythm') && !prompt.includes('3 times'), 'Improve override without Enhance length');
    assert(savedSettings > 0, 'settings persisted via host');
});

await test('custom creation, editing, safe labels and persisted language rebuild', async () => {
    showSettings();
    const item = addButton('<img src=x onerror=alert(1)>', 'Keep {{input}} and $& literal.', '<svg>');
    assert(action(item) && !action(item).querySelector('img,svg'), 'label and icon are text');
    assert(!document.querySelector('.bb-eg-custom-row img'), 'settings label is text');
    assert(action(item).classList.contains('bb-eg-btn'), 'shared button class');
    changeLanguage('ru');
    assert(action(item) && document.querySelector('[data-custom-add]').textContent === 'Добавить кнопку', 'rebuild retains settings and translates controls');
    document.querySelector(`[data-custom-edit="${item.id}"]`).click();
    assert(document.querySelector('[data-custom-field=instruction]').value === item.instruction, 'instruction roundtrip');
    enter('[data-custom-field=name]', 'Atmosphere'); enter('[data-custom-field=icon]', '☾');
    document.querySelector('[data-custom-save]').click();
    assert(action(item).textContent.includes('☾Atmosphere'), 'edited button rendered');
});

await test('empty instructions and cancelled custom editor do not change saved settings', async () => {
    showSettings();saveInstruction('enhance', '  ');
    assert(!settings.writingInstructions.enhance, 'empty override not saved');
    document.querySelector('[data-custom-add]').click();document.querySelector('[data-custom-save]').click();
    assert(dialog() && settings.customButtons.length === 0, 'blank definition rejected');
    enter('[data-custom-field=name]', 'x'.repeat(49));enter('[data-custom-field=instruction]', 'Shorten.');document.querySelector('[data-custom-save]').click();
    assert(dialog() && settings.customButtons.length === 0, 'oversized definition rejected without disappearing');
    document.querySelector('.bb-eg-close').click();assert(!dialog() && !settings.customButtons.length, 'cancel discards edit');
});

await test('default instructions restore normal drafting behavior and isolate user text', async () => {
    settings.writingInstructions = { enhance: null, improve: '' };let prompt;
    ta().value = 'A draft containing {{persona}} and __BB_WRITING_INSTRUCTION__.';
    fetchHandler = async (_url, options) => { prompt = promptFrom(options);return completion('Polished prose.'); };
    document.getElementById('bb-eg-btn-enhance').click();await idle();
    assert(prompt.includes(DEFAULT_WRITING_INSTRUCTIONS.enhance) && prompt.includes('approximately 2 times'), 'default Enhance instructions');
    assert(prompt.includes('<draft>\nA draft containing {{persona}} and __BB_WRITING_INSTRUCTION__.\n</draft>'), 'draft macros stay literal');
    document.getElementById('bb-eg-btn-improve').click();await idle();
    assert(prompt.includes(DEFAULT_WRITING_INSTRUCTIONS.improve) && !prompt.includes('approximately 2 times'), 'default Improve and length');
});

await test('custom action preserves literal instruction and uses original instruction/draft for retry', async () => {
    const item = addButton('Shorten', 'Rewrite tersely. {{user}} $& __BB_INPUT__');
    const prompts = [];fetchHandler = async (_url, options) => { prompts.push(promptFrom(options)); return completion(`Result ${prompts.length}`); };
    action(item).click();await idle();
    assert(prompts[0].includes(item.instruction), 'no macro or sentinel expansion in custom instruction');
    assert(prompts[0].includes('<draft>\nOriginal draft\n</draft>'), 'draft supplied');
    assert(!prompts[0].includes('approximately 2 times'), 'no Enhance expansion on custom action');
    document.querySelector(`[data-custom-edit="${item.id}"]`).click();enter('[data-custom-field=instruction]', 'A different task.');document.querySelector('[data-custom-save]').click();
    document.getElementById('bb-eg-retry').click();await idle();
    assert(prompts[1].includes(item.instruction) && !prompts[1].includes('A different task.'), 'retry snapshot');
    assert(prompts[1].includes('<draft>\nOriginal draft\n</draft>'), 'retry original draft');
    document.getElementById('bb-eg-undo').click();await idle();assert(ta().value === 'Original draft', 'undo original');
});

await test('custom button requires draft and cannot overwrite manual edits with retry or undo', async () => {
    const item = addButton(); const before = requests;
    ta().value = ' ';action(item).click();await idle();assert(requests === before, 'no request for empty draft');
    ta().value = 'Start';action(item).click();await idle();ta().value = 'My edits';
    const after = requests;document.getElementById('bb-eg-retry').click();await idle();document.getElementById('bb-eg-undo').click();await idle();
    assert(requests === after && ta().value === 'My edits', 'manual edits preserved');
});

await test('custom action shares main model and profile paths', async () => {
    const item = addButton(); settings.generationSource = 'main';let nativePrompt;
    mainHandler = async options => { nativePrompt = options.prompt;return 'Native prose.'; };
    action(item).click();await idle();assert(ta().value === 'Native prose.' && nativePrompt.includes(item.instruction), 'native generation');
    settings.generationSource = 'profile';settings.connectionProfileId = 'profile-a';
    profileHandler = async () => ({content:'Profile prose.'});
    action(item).click();await idle();assert(ta().value === 'Profile prose.' && profileCalls[0][0] === 'profile-a', 'profile generation');
});

await test('stream cancellation restores previous retry result and keeps later typing', async () => {
    const item = addButton();action(item).click();await idle();const previous = ta().value;
    settings.generationSource = 'profile';settings.connectionProfileId = 'profile-a';settings.enableStreaming = true;
    let release;profileHandler = async () => async function*(){yield {text:'Partial'};await new Promise(resolve => {release=resolve;});yield {text:'Late'};};
    document.getElementById('bb-eg-retry').click();await until(()=>release && ta().value === 'Partial');
    document.getElementById('bb-eg-stop').click();assert(ta().value === previous, 'cancel immediately restores previous result');
    ta().value = 'Typing after cancel';release();await idle();assert(ta().value === 'Typing after cancel', 'late chunks ignored');
});

await test('chat changes cancel custom requests; technical results never replace drafts', async () => {
    const item = addButton();let finish;
    fetchHandler = () => new Promise(resolve => { finish = resolve; });
    action(item).click();await until(()=>finish);
    key='other';chat=[];ta().value='Other chat';emit(events.CHAT_CHANGED);finish(completion('Late prose'));await idle();
    assert(ta().value === 'Other chat', 'new chat preserved');
    fetchHandler = async () => completion('<script>alert(1)</script>');action(item).click();await idle();
    assert(ta().value === 'Other chat' && !document.querySelector('#send_form script'), 'technical result rejected');
});

await test('only custom tools keep toolbar visible; disable/delete remove actions and stale retry', async () => {
    const item = addButton();for(const key of ['btnEnhance','btnImprove','btnDirector','btnDice','btnFastTravel','btnTimeSkip'])settings[key]=false;
    changeLanguage('en');assert(document.getElementById('bb-enhance-wrapper').style.display !== 'none', 'custom-only toolbar visible');
    action(item).click();await idle();
    document.querySelector(`[data-custom-id="${item.id}"] input`).click();
    assert(!action(item) && document.getElementById('bb-eg-retry').hidden, 'disabled action and retry hidden');
    document.querySelector(`[data-custom-id="${item.id}"] input`).click();assert(action(item), 're-enabled');
    document.querySelector(`[data-custom-delete="${item.id}"]`).click();document.querySelector('[data-delete-confirm]').click();
    assert(!action(item) && settings.customButtons.length === 0, 'deleted');
});

await test('busy feedback follows custom button; native generation blocks it', async () => {
    const item = addButton();let finish;
    fetchHandler=()=>new Promise(resolve=>{finish=resolve;});action(item).click();await until(()=>finish);
    assert(action(item).classList.contains('loading') && action(item).getAttribute('aria-busy')==='true', 'active feedback');
    const before=requests;action(item).click();assert(requests===before,'busy lock prevents duplicate');finish(completion('Done'));await idle();
    emit(events.GENERATION_STARTED,'normal',{},false);assert(action(item).disabled,'native busy disables custom');emit(events.GENERATION_ENDED);assert(!action(item).disabled,'reenabled');
});

await test('Director and JSON transition contracts are unaffected by writing overrides', async () => {
    saveInstruction('enhance','WRITING ONLY');saveInstruction('improve','WRITING ONLY');let prompt;
    fetchHandler=async(_url,options)=>{prompt=promptFrom(options);return completion(JSON.stringify({can_travel:false,lock_reason:'Stay here.'}));};
    document.getElementById('bb-eg-btn-ft').click();await until(()=>dialog());
    assert(prompt.includes('can_travel')&&!prompt.includes('WRITING ONLY'),'FT schema preserved');document.querySelector('.bb-eg-close').click();await idle();
    fetchHandler=async(_url,options)=>{prompt=promptFrom(options);return completion('I approach the doorway.');};
    document.getElementById('bb-eg-btn-director').click();document.querySelector('[data-vibe=dir_custom]').click();enter('#bb-eg-popup textarea','Approach the doorway.');document.querySelector('[data-target=me]').click();await idle();
    assert(prompt.includes('Approach the doorway.')&&!prompt.includes('WRITING ONLY')&&ta().value==='I approach the doorway.','Director preserved');
});

await test('long custom labels and editor fit narrow viewport; hidden popup stays absent', async () => {
    showSettings();const item=addButton('LongUnbrokenName'.repeat(3),'Make the description atmospheric.');
    document.getElementById('bb-eg-toggle-btn').click();
    assert(action(item).scrollWidth <= action(item).clientWidth+1,'button label wraps');
    assert(document.getElementById('bb-eg-popup').getClientRects().length===0,'closed Director does not expand viewport');
    document.querySelector(`[data-custom-edit="${item.id}"]`).click();
    const box=dialog().querySelector('.bb-modal-box'), rect=box.getBoundingClientRect();
    assert(rect.left>=0&&rect.right<=innerWidth&&box.scrollWidth<=box.clientWidth+1,'editor fits');
    document.querySelector('.bb-eg-close').click();
});

window.__showWriting = async () => {await reset();showSettings();addButton('Add atmosphere','Add sensory detail without advancing the scene.','☾');document.querySelector('[data-writing-instruction=enhance]').closest('details').open=true;document.getElementById('results').hidden=true;};
window.__showEditor = async () => {await window.__showWriting();document.querySelector('[data-custom-edit]').click();};
await test('icon input filters letters, blocks Enter and preserves emoji', async () => {
    document.querySelector('[data-custom-add]').click();
    enter('[data-custom-field=name]', 'Symbols'); enter('[data-custom-field=instruction]', 'Shorten.');
    const icon = enter('[data-custom-field=icon]', 'abcЯ文\u2028 12★');
    assert(icon.value === '12★', 'letters and inserted whitespace removed');
    const keyEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    icon.dispatchEvent(keyEvent);assert(keyEvent.defaultPrevented, 'Enter blocked');
    const newline = new InputEvent('beforeinput', { inputType: 'insertLineBreak', bubbles: true, cancelable: true });
    icon.dispatchEvent(newline);assert(newline.defaultPrevented, 'line break blocked');
    enter('[data-custom-field=icon]', '🧑🏽‍🚀');document.querySelector('[data-custom-save]').click();
    const item = settings.customButtons.at(-1);assert(item.icon === '🧑🏽‍🚀', 'emoji sequence saved');
    assert(getComputedStyle(action(item).querySelector('.bb-eg-tool-icon')).whiteSpace === 'nowrap', 'icon cannot wrap');
    document.querySelector(`[data-custom-edit="${item.id}"]`).click();
    document.querySelector('[data-custom-field=icon]').value = 'OnlyLetters';document.querySelector('[data-custom-save]').click();
    assert(dialog() && settings.customButtons.at(-1).icon === '🧑🏽‍🚀', 'save revalidates without changing settings');
    document.querySelector('.bb-eg-close').click();
});

window.__suite.done = true;
document.getElementById('results').textContent = JSON.stringify(window.__suite, null, 2);
