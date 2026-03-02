(function () {
    const MODULE_NAME = "BB-Enhance-Gen";

    const TEMPLATES = {
        enhance: `[CONTEXT REMINDER]\nCharacter: {{user}} ({{persona}})\nCurrent scene details: {{authorsNote}}\nStory Summary: {{summary}}\nLast message in chat: """{{lastMessage}}"""\n\n[TASK]\nYou are a master author. Take the user's brief draft below and EXPAND it significantly into a rich, immersive, and highly detailed literary masterpiece.\n\nYour goals:\n1. Expand actions with deep sensory details (sight, sound, smell, texture).\n2. Describe {{user}}'s internal thoughts, micro-expressions, and physical sensations.\n3. Enhance and rewrite {{user}}'s spoken dialogue. Feel free to rephrase, expand, or stylize their words to make them sound more natural, expressive, and perfectly aligned with their personality ({{persona}}).\n4. Embellish the surrounding environment and atmosphere.\n5. You MUST make the text substantially longer and more descriptive than the draft.\n\n⚠️ CRITICAL RULES:\n1. ONLY expand the current moment. DO NOT advance the plot or decide what happens next.\n2. DO NOT speak, act, or react for other characters.\n3. ABSOLUTELY NO HTML formatting, no colored text, no UI blocks. Use standard text and markdown (* for italics).\n4. Output ONLY the raw expanded story text.\n\nDraft to enhance: """{{input}}"""`,
        
        // НОВЫЙ ЖЕСТКИЙ ПРОМПТ ДЛЯ ИМПРУВА
        improve: `[TEXT EDITING TASK]\nYou are a strict text editor. Your ONLY job is to rephrase and polish the user's draft to make it sound more literary and grammatically correct.\n\nContext for tone: Character is {{user}} ({{persona}}). Previous message in chat: """{{lastMessage}}"""\n\n⚠️ CRITICAL RULES:\n1. PARAPHRASE ONLY. You are editing, NOT roleplaying.\n2. DO NOT add ANY new actions, thoughts, or dialogue that are not explicitly mentioned in the draft.\n3. DO NOT answer the previous message. DO NOT advance the plot or time even by a second.\n4. Keep the output roughly the EXACT SAME LENGTH as the original draft.\n5. ABSOLUTELY NO HTML formatting, no UI blocks. Output ONLY the rewritten text.\n\nDraft to rewrite: """{{input}}"""`,
        
        random: `[NARRATIVE DIRECTION: PLOT TWIST]\nAuthor's Context:\nProtagonist: {{user}} ({{persona}})\nWorld/Scene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n\n[WRITING PROMPT]\nWrite the next segment of this fictional story from the perspective of {{user}}. Introduce an unexpected narrative complication to drive character development.\n\nRequirements:\n1. Introduce a dramatic disruption (e.g., an unexpected arrival, a sudden environmental shift, a bizarre discovery).\n2. Describe {{user}}'s visceral sensory and emotional reaction.\n3. Create tension that forces characters to react immediately.\n4. Keep the narrative flow natural. DO NOT resolve the situation yet.\n\n⚠️ CRITICAL RULES:\nDO NOT generate ANY system UI blocks, radio interfaces, time infos, or tags like ::OS_START:: or <info>. Output ONLY the pure story text without meta-commentary.`
    };

    const DEFAULT_SETTINGS = {
        btnEnhance: true,
        btnImprove: true,
        btnRandom: true
    };

    function getSettings() {
        const { extensionSettings } = SillyTavern.getContext();
        if (!extensionSettings[MODULE_NAME]) {
            extensionSettings[MODULE_NAME] = structuredClone(DEFAULT_SETTINGS);
        }
        return extensionSettings[MODULE_NAME];
    }

    function saveSettings() {
        SillyTavern.getContext().saveSettingsDebounced();
        updateToolbarVisibility();
    }

    async function handleGeneration(type, btnElement) {
        const ta = /** @type {HTMLTextAreaElement} */ (document.getElementById('send_textarea'));
        if (!ta) return;

        const inputText = ta.value.trim();

        if ((type === 'enhance' || type === 'improve') && !inputText) {
            // @ts-ignore
            toastr.warning('Сначала напиши текст в поле ввода!', 'BB Enhance');
            return;
        }

        btnElement.classList.add('loading');
        const oldHtml = btnElement.innerHTML;
        btnElement.innerHTML = `⏳ <span>Думаю...</span>`;

        try {
            let promptRaw = TEMPLATES[type].replace('{{input}}', inputText);
            
            let finalPrompt = promptRaw;
            // @ts-ignore
            if (typeof window.substituteParams === 'function') {
                // @ts-ignore
                finalPrompt = await window.substituteParams(promptRaw);
            // @ts-ignore
            } else if (typeof window.substituteParamsExtended === 'function') {
                // @ts-ignore
                finalPrompt = await window.substituteParamsExtended(promptRaw);
            }

            const ctx = SillyTavern.getContext();
            
            let result = await ctx.generateQuietPrompt(finalPrompt);

            if (result) {
                let cleanResult = String(result);
                
                cleanResult = cleanResult.replace(/<think>[\s\S]*?<\/think>/gi, '');
                cleanResult = cleanResult.replace(/<think>/gi, '');
                cleanResult = cleanResult.replace(/<\/think>/gi, '');
                
                cleanResult = cleanResult.replace(/::[A-Z_]+_START::[\s\S]*?::[A-Z_]+_END::/gi, '');
                cleanResult = cleanResult.replace(/<info>[\s\S]*?<\/info>/gi, '');
                
                cleanResult = cleanResult.replace(/<span[^>]*>/gi, '');
                cleanResult = cleanResult.replace(/<\/span>/gi, '');
                cleanResult = cleanResult.replace(/<font[^>]*>/gi, '');
                cleanResult = cleanResult.replace(/<\/font>/gi, '');
                
                cleanResult = cleanResult.trim();
                
                if(cleanResult.startsWith('"') && cleanResult.endsWith('"')) {
                    cleanResult = cleanResult.slice(1, -1);
                }
                
                if (cleanResult.trim().length > 0) {
                    ta.value = cleanResult.trim();
                    ta.dispatchEvent(new Event('input', { bubbles: true })); 
                    // @ts-ignore
                    toastr.success('Готово!', 'BB Enhance');
                } else {
                    // @ts-ignore
                    toastr.warning('После очистки текста от тегов ничего не осталось.', 'BB Enhance');
                }
            } else {
                // @ts-ignore
                toastr.warning('Нейросеть вернула пустой ответ.', 'BB Enhance');
            }

        } catch (err) {
            console.error("[BB Enhance Error]:", err);
            // @ts-ignore
            toastr.error('Ошибка: ' + err.message, 'BB Enhance');
        } finally {
            btnElement.classList.remove('loading');
            btnElement.innerHTML = oldHtml;
        }
    }

    function createButton(label, type) {
        const btn = document.createElement('button');
        btn.className = 'bb-eg-btn';
        btn.id = `bb-eg-btn-${type}`;
        btn.innerHTML = label;
        btn.onclick = (e) => {
            e.preventDefault();
            handleGeneration(type, btn);
        };
        return btn;
    }

    function updateToolbarVisibility() {
        const s = getSettings();
        const btnE = document.getElementById('bb-eg-btn-enhance');
        if (btnE) btnE.style.display = s.btnEnhance ? 'flex' : 'none';
        
        const btnI = document.getElementById('bb-eg-btn-improve');
        if (btnI) btnI.style.display = s.btnImprove ? 'flex' : 'none';
        
        const btnR = document.getElementById('bb-eg-btn-random');
        if (btnR) btnR.style.display = s.btnRandom ? 'flex' : 'none';
        
        const toolbar = document.getElementById('bb-enhance-toolbar');
        if (toolbar) {
            toolbar.style.display = (s.btnEnhance || s.btnImprove || s.btnRandom) ? 'flex' : 'none';
        }
    }

    function injectToolbar() {
        if (document.getElementById('bb-enhance-toolbar')) return;

        const toolbar = document.createElement('div');
        toolbar.id = 'bb-enhance-toolbar';

        toolbar.appendChild(createButton('✨ Enhance', 'enhance'));
        toolbar.appendChild(createButton('🔮 Improve', 'improve'));
        toolbar.appendChild(createButton('🎲 Random Event', 'random'));

        const sendForm = document.getElementById('send_form');
        if (sendForm && sendForm.parentNode) {
            sendForm.parentNode.insertBefore(toolbar, sendForm);
        }

        updateToolbarVisibility();
    }

    function injectSettingsPanel() {
        if (document.getElementById('bb-eg-settings-container')) return;

        const s = getSettings();
        const html = `
            <div id="bb-eg-settings-container" class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>✨ BB Enhance Generation</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="bb-eg-settings-panel">
                        <label>
                            <input type="checkbox" id="bb-eg-cfg-enhance" ${s.btnEnhance ? 'checked' : ''}>
                            Показать кнопку [✨ Enhance]
                        </label>
                        <label>
                            <input type="checkbox" id="bb-eg-cfg-improve" ${s.btnImprove ? 'checked' : ''}>
                            Показать кнопку [🔮 Improve]
                        </label>
                        <label>
                            <input type="checkbox" id="bb-eg-cfg-random" ${s.btnRandom ? 'checked' : ''}>
                            Показать кнопку [🎲 Random Event]
                        </label>
                    </div>
                </div>
            </div>
        `;

        const target = document.querySelector("#extensions_settings2") || document.querySelector("#extensions_settings");
        if (target) {
            target.insertAdjacentHTML('beforeend', html);

            document.getElementById('bb-eg-cfg-enhance').addEventListener('change', (e) => {
                // @ts-ignore
                getSettings().btnEnhance = e.target.checked;
                saveSettings();
            });
            document.getElementById('bb-eg-cfg-improve').addEventListener('change', (e) => {
                // @ts-ignore
                getSettings().btnImprove = e.target.checked;
                saveSettings();
            });
            document.getElementById('bb-eg-cfg-random').addEventListener('change', (e) => {
                // @ts-ignore
                getSettings().btnRandom = e.target.checked;
                saveSettings();
            });
        }
    }

    jQuery(async () => {
        try {
            const { eventSource, event_types } = SillyTavern.getContext();
            eventSource.on(event_types.APP_READY, () => {
                injectToolbar();
                injectSettingsPanel();
            });
            
            injectToolbar();
            injectSettingsPanel();
        } catch (e) {
            console.error("[BB Enhance] Ошибка запуска:", e);
        }
    });

})();