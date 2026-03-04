(function () {
    const MODULE_NAME = "BB-Enhance-Gen";

    const TEMPLATES = {
        enhance: `[CONTEXT REMINDER]\nCharacter: {{user}} ({{persona}})\nCurrent scene details: {{authorsNote}}\nStory Summary: {{summary}}\nLast message in chat: """{{lastMessage}}"""\n\n[TASK]\nYou are a master author. Take the user's brief draft below and EXPAND it significantly into a rich, immersive, and highly detailed literary masterpiece.\n\nYour goals:\n1. Expand actions with deep sensory details (sight, sound, smell, texture).\n2. Describe {{user}}'s internal thoughts, micro-expressions, and physical sensations.\n3. Enhance and rewrite {{user}}'s spoken dialogue. Feel free to rephrase, expand, or stylize their words to make them sound more natural, expressive, and perfectly aligned with their personality ({{persona}}).\n4. Embellish the surrounding environment and atmosphere.\n5. You MUST make the text substantially longer and more descriptive than the draft.\n\n⚠️ CRITICAL RULES:\n1. ONLY expand the current moment. DO NOT advance the plot or decide what happens next.\n2. DO NOT speak, act, or react for other characters.\n3. ABSOLUTELY NO HTML formatting, no colored text, no UI blocks. Use standard text and markdown (* for italics).\n4. Output ONLY the raw expanded story text.\n\nDraft to enhance: """{{input}}"""`,
        
        improve: `[TEXT EDITING TASK]\nYou are a strict text editor. Your ONLY job is to rephrase and polish the user's draft to make it sound more literary and grammatically correct.\n\nContext for tone: Character is {{user}} ({{persona}}). Previous message in chat: """{{lastMessage}}"""\n\n⚠️ CRITICAL RULES:\n1. PARAPHRASE ONLY. You are editing, NOT roleplaying.\n2. DO NOT add ANY new actions, thoughts, or dialogue that are not explicitly mentioned in the draft.\n3. DO NOT answer the previous message. DO NOT advance the plot or time even by a second.\n4. Keep the output roughly the EXACT SAME LENGTH as the original draft.\n5. ABSOLUTELY NO HTML formatting, no UI blocks. Output ONLY the rewritten text.\n\nDraft to rewrite: """{{input}}"""`,

        dir_disaster: `[NARRATIVE DIRECTION: DISASTER]\nAuthor's Context:\nProtagonist: {{user}} ({{persona}})\nWorld/Scene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n\n[WRITING PROMPT]\nWrite the next segment of this fictional story from the perspective of {{user}}. Introduce a DRAMATIC DISRUPTION or BAD EVENT.\n\nRequirements:\n1. Create a sharp conflict, physical danger, bad news, or a painful memory triggered by the environment.\n2. Use the current location and objects explicitly.\n3. Keep it natural but highly tense. DO NOT resolve the situation yet.\n\n⚠️ CRITICAL RULES:\nDO NOT generate ANY system UI blocks, radio interfaces, time infos, or tags like ::OS_START:: or <info>. Output ONLY the pure story text without meta-commentary.`,
        
        dir_blessing: `[NARRATIVE DIRECTION: BLESSING]\nAuthor's Context:\nProtagonist: {{user}} ({{persona}})\nWorld/Scene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n\n[WRITING PROMPT]\nWrite the next segment of this fictional story from the perspective of {{user}}. Introduce a BLESSING or GOOD EVENT.\n\nRequirements:\n1. Create an unexpected stroke of luck, a moment of deep comfort, help from an unexpected source, or a pleasant discovery.\n2. Use the current location and objects explicitly to ground the scene.\n3. Make the atmosphere feel relieving or heartwarming.\n\n⚠️ CRITICAL RULES:\nDO NOT generate ANY system UI blocks, radio interfaces, time infos, or tags like ::OS_START:: or <info>. Output ONLY the pure story text without meta-commentary.`,
        
        dir_tension: `[NARRATIVE DIRECTION: ROMANTIC TENSION]\nAuthor's Context:\nProtagonist: {{user}} ({{persona}})\nWorld/Scene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n\n[WRITING PROMPT]\nWrite the next segment of this fictional story from the perspective of {{user}}. Focus on TENSION or DEEP EMOTION.\n\nRequirements:\n1. Create a micro-interaction: a lingering touch, intense eye contact, a sudden awkward pause, or a breathtaking revelation.\n2. Focus heavily on {{user}}'s heartbeat, breathing, and physical proximity to others.\n3. Keep it subtle but electric.\n\n⚠️ CRITICAL RULES:\nDO NOT generate ANY system UI blocks, radio interfaces, time infos, or tags like ::OS_START:: or <info>. Output ONLY the pure story text without meta-commentary.`,
        
        dir_absurd: `[NARRATIVE DIRECTION: ABSURD COMEDY]\nAuthor's Context:\nProtagonist: {{user}} ({{persona}})\nWorld/Scene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n\n[WRITING PROMPT]\nWrite the next segment of this fictional story from the perspective of {{user}}. Introduce an ABSURD or COMEDIC EVENT.\n\nRequirements:\n1. Create a ridiculous misunderstanding, a clumsy mistake (someone tripping, dropping something), or an awkwardly funny situational irony.\n2. Contrast the seriousness of the characters with the silliness of the event.\n3. Make it fit a comedy-drama style naturally.\n\n⚠️ CRITICAL RULES:\nDO NOT generate ANY system UI blocks, radio interfaces, time infos, or tags like ::OS_START:: or <info>. Output ONLY the pure story text without meta-commentary.`,

        dir_timeskip: `[NARRATIVE DIRECTION: TIME SKIP]\nAuthor's Context:\nProtagonist: {{user}} ({{persona}})\nWorld/Scene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n\n[WRITING PROMPT]\nWrite the next segment of this fictional story from the perspective of {{user}}. Execute a logical TIME SKIP to push the plot forward.\n\nRequirements:\n1. Analyze the current situation and jump forward in time to the NEXT SIGNIFICANT EVENT or meaningful interaction.\n2. Briefly summarize what happened during the skipped time (e.g., travel, resting, routine).\n3. Establish the new time and location explicitly.\n4. Initiate the new plot event or conversation to keep the story moving.\n\n⚠️ CRITICAL RULES:\nDO NOT generate ANY system UI blocks, radio interfaces, time infos, or tags like ::OS_START:: or <info>. Output ONLY the pure story text without meta-commentary.`
    };

    const BOT_CUES = {
        dir_disaster: `\n\n[Director's Cue: In your next response, introduce a DRAMATIC DISRUPTION or BAD EVENT (e.g., sharp conflict, physical danger, bad news, or painful memory). Do not resolve it yet.]`,
        dir_blessing: `\n\n[Director's Cue: In your next response, introduce a BLESSING or GOOD EVENT (e.g., unexpected luck, deep comfort, or a pleasant discovery).]`,
        dir_tension: `\n\n[Director's Cue: In your next response, focus heavily on ROMANTIC TENSION or DEEP EMOTION (e.g., a lingering touch, intense eye contact, sudden awkward pause).]`,
        dir_absurd: `\n\n[Director's Cue: In your next response, introduce an ABSURD or COMEDIC EVENT (e.g., a ridiculous misunderstanding, a clumsy mistake).]`,
        dir_timeskip: `\n\n[Director's Cue: In your next response, execute a logical TIME SKIP. Jump forward in time to the next significant plot event or new location. Briefly summarize the skipped time, establish the new setting, and initiate the new scene.]`,
        
        // --- ENGLISH PROMPTS FOR DICE CUES ---
        roll_crit_success: `\n\n[SYSTEM: DICE OF FATE — CRITICAL SUCCESS (Rolled 20!). The user's action succeeded brilliantly and inconceivably. Describe an absolute triumph with an unexpected bonus. The opponent is completely shocked or defeated.]`,
        roll_success: `\n\n[SYSTEM: DICE OF FATE — SUCCESS (Roll: {{roll}} vs DC: {{dc}}). The user's action was successful. Describe how their plan worked out perfectly, and the opponents believed it, got scared, or lost.]`,
        roll_failure: `\n\n[SYSTEM: DICE OF FATE — FAILURE (Roll: {{roll}} vs DC: {{dc}}). The user's action failed. Describe a fiasco: the plan collapsed, a weapon slipped, the voice trembled, or the lie was obvious. The opponent triumphs or gets angry.]`,
        roll_crit_failure: `\n\n[SYSTEM: DICE OF FATE — CRITICAL FAILURE (Rolled 1!). The user's action turned into an absolute catastrophe and humiliation. Describe the worst possible outcome, a ridiculous mistake, or a painful blow. The situation just got 10 times worse.]`
    };

    const DEFAULT_SETTINGS = {
        btnEnhance: true,
        btnImprove: true,
        btnDirector: true,
        btnDice: true
    };

    let activeDirectorVibe = null;
    let isPopupOpen = false;

    function getSettings() {
        const { extensionSettings } = SillyTavern.getContext();
        if (!extensionSettings[MODULE_NAME]) extensionSettings[MODULE_NAME] = structuredClone(DEFAULT_SETTINGS);
        return extensionSettings[MODULE_NAME];
    }

    function saveSettings() {
        SillyTavern.getContext().saveSettingsDebounced();
        updateToolbarVisibility();
    }

    // --- ГЕНЕРАЦИЯ ДЛЯ МЕНЯ ---
    async function handleGeneration(type, btnElement) {
        const ta = /** @type {HTMLTextAreaElement} */ (document.getElementById('send_textarea'));
        if (!ta) return;
        const inputText = ta.value.trim();
        if ((type === 'enhance' || type === 'improve') && !inputText) {
            // @ts-ignore
            toastr.warning('Сначала напиши текст в поле ввода!', 'BB Enhance'); return;
        }

        btnElement.classList.add('loading');
        const oldHtml = btnElement.innerHTML;
        btnElement.innerHTML = `⏳ <span>Генерация...</span>`;

        try {
            let promptRaw = TEMPLATES[type].replace('{{input}}', inputText);
            let finalPrompt = promptRaw;
            // @ts-ignore
            if (typeof window.substituteParams === 'function') finalPrompt = await window.substituteParams(promptRaw);
            // @ts-ignore
            else if (typeof window.substituteParamsExtended === 'function') finalPrompt = await window.substituteParamsExtended(promptRaw);

            const ctx = SillyTavern.getContext();
            let result = await ctx.generateQuietPrompt(finalPrompt);

            if (result) {
                let originalResult = String(result).trim();
                let cleanResult = originalResult;
                
                cleanResult = cleanResult.replace(/<think>[\s\S]*?<\/think>/gi, '');
                cleanResult = cleanResult.replace(/::[A-Z_]+_START::[\s\S]*?::[A-Z_]+_END::/gi, '');
                cleanResult = cleanResult.replace(/※SCENE:[^※]*※/gi, '');
                cleanResult = cleanResult.replace(/※\/SCENE※/gi, '');
                cleanResult = cleanResult.replace(/⟦[A-Za-zА-Яа-яЁё\s_]+:[^⟧]*⟧/gi, '');
                cleanResult = cleanResult.replace(/⟦\/[A-Za-zА-Яа-яЁё\s_]+⟧/gi, '');

                cleanResult = cleanResult.trim();
                if(cleanResult.startsWith('"') && cleanResult.endsWith('"')) cleanResult = cleanResult.slice(1, -1).trim();
                
                if (cleanResult.length > 0) {
                    ta.value = cleanResult; ta.dispatchEvent(new Event('input', { bubbles: true })); 
                    // @ts-ignore
                    toastr.success('Готово!', 'BB Director');
                } else if (originalResult.length > 0) {
                    ta.value = originalResult; ta.dispatchEvent(new Event('input', { bubbles: true })); 
                    // @ts-ignore
                    toastr.warning('Фильтр удалил всё. Возвращен сырой текст!', 'BB Director');
                } else {
                    // @ts-ignore
                    toastr.warning('Нейросеть вернула пустой ответ.', 'BB Director');
                }
            }
        } catch (err) {
            console.error(err);
            // @ts-ignore
            toastr.error('Ошибка: ' + err.message, 'BB Director');
        } finally {
            btnElement.classList.remove('loading');
            btnElement.innerHTML = oldHtml;
        }
    }

    // --- КИНОШНАЯ МОДАЛКА ДЛЯ КУБИКА ---
    function showDiceModal(question, dc, finalRoll, outcomeText, outcomeColor) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.id = 'bb-dice-overlay';
            overlay.className = 'bb-dice-overlay';
            overlay.style.opacity = '0'; 
            
            overlay.innerHTML = `
                <div class="bb-dice-box">
                    <div class="bb-dice-title">🎲 Проверка Навыка</div>
                    <div class="bb-dice-question">«${question}»</div>
                    <div class="bb-dice-dc">СЛОЖНОСТЬ: <span style="color:#d4af37">${dc}</span></div>
                    
                    <div class="bb-dice-scene">
                        <div id="bb-dice-cube" class="bb-dice-cube">
                            <div class="bb-cube-face bb-face-front" id="bb-face-main">?</div>
                            <div class="bb-cube-face bb-face-back bb-rand-face">?</div>
                            <div class="bb-cube-face bb-face-right bb-rand-face">?</div>
                            <div class="bb-cube-face bb-face-left bb-rand-face">?</div>
                            <div class="bb-cube-face bb-face-top bb-rand-face">?</div>
                            <div class="bb-cube-face bb-face-bottom bb-rand-face">?</div>
                        </div>
                    </div>

                    <div id="bb-dice-outcome" class="bb-dice-outcome" style="opacity: 0;">${outcomeText}</div>
                </div>
            `;
            document.body.appendChild(overlay);

            requestAnimationFrame(() => overlay.style.opacity = '1');

            const cubeEl = document.getElementById('bb-dice-cube');
            const mainFace = document.getElementById('bb-face-main');
            const randFaces = document.querySelectorAll('.bb-rand-face');
            const outcomeEl = document.getElementById('bb-dice-outcome');
            
            let ticks = 0;
            const maxTicks = 40; 
            let currentDelay = 30; 

            function rollTick() {
                if (ticks < maxTicks) {
                    // @ts-ignore
                    mainFace.innerText = String(Math.floor(Math.random() * 20) + 1);
                    randFaces.forEach(face => {
                        // @ts-ignore
                        face.innerText = String(Math.floor(Math.random() * 20) + 1);
                    });

                    ticks++;
                    
                    if (ticks > 25) {
                        currentDelay += 20;
                    }
                    
                    setTimeout(rollTick, currentDelay);
                } else {
                    cubeEl.classList.add('stopped'); 
                    
                    mainFace.innerText = String(finalRoll);
                    mainFace.style.color = outcomeColor;
                    mainFace.style.textShadow = `0 0 20px ${outcomeColor}, 0 0 10px #fff`;
                    mainFace.style.fontSize = "60px";
                    mainFace.style.borderColor = outcomeColor;
                    mainFace.style.boxShadow = `inset 0 0 30px ${outcomeColor}, 0 0 40px ${outcomeColor}`;
                    mainFace.style.background = "rgba(10, 5, 5, 0.95)";
                    
                    outcomeEl.innerText = outcomeText;
                    outcomeEl.style.color = outcomeColor;
                    outcomeEl.style.opacity = '1';
                    
                    setTimeout(() => {
                        overlay.style.opacity = '0'; 
                        setTimeout(() => {
                            overlay.remove();
                            resolve();
                        }, 800);
                    }, 4500); 
                }
            }
            
            setTimeout(rollTick, 600); 
        });
    }

    // --- ЛОГИКА БРОСКА КУБИКА ---
    async function handleSkillCheck(btnElement) {
        const ctx = SillyTavern.getContext();
        const chat = ctx.chat;

        if (!chat || chat.length === 0) {
            // @ts-ignore
            toastr.warning('Чат пуст!', 'BB Dice'); return;
        }

        let lastUserIndex = -1;
        for (let i = chat.length - 1; i >= 0; i--) {
            if (chat[i].is_user) { lastUserIndex = i; break; }
        }

        if (lastUserIndex === -1) {
            // @ts-ignore
            toastr.warning('Не найдено сообщение от вас для броска кубика.', 'BB Dice'); return;
        }

        const lastUserMessage = chat[lastUserIndex].mes;
        
        btnElement.classList.add('loading');
        const oldHtml = btnElement.innerHTML;
        btnElement.innerHTML = `⏳ <span>Бросок...</span>`;

        try {
            const prompt = `[TASK]\nRead the user's last action in the roleplay: """${lastUserMessage}"""\nFormulate a single, short dramatic question describing the skill check they are attempting (e.g., "Сможет ли Рин незаметно украсть письмо?", "Удастся ли запугать хулигана?").\nRules:\n- Strictly in Russian.\n- Max 8-10 words.\n- Output ONLY the question, nothing else. No intro, no quotes.`;
            
            // @ts-ignore 
            let actionQuestion = await ctx.generateQuietPrompt(prompt);
            actionQuestion = String(actionQuestion).replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            if(actionQuestion.startsWith('"')) actionQuestion = actionQuestion.slice(1, -1);
            if(!actionQuestion || actionQuestion.length > 100) actionQuestion = "Удастся ли задуманное действие?";

            btnElement.classList.remove('loading');
            btnElement.innerHTML = oldHtml;

            const dc = Math.floor(Math.random() * 7) + 10; 
            const roll = Math.floor(Math.random() * 20) + 1; 
            
            let outcomeType = ''; let outcomeText = ''; let outcomeColor = '';
            
            if (roll === 20) { outcomeType = 'roll_crit_success'; outcomeText = 'КРИТИЧЕСКИЙ УСПЕХ'; outcomeColor = '#d4af37'; }
            else if (roll === 1) { outcomeType = 'roll_crit_failure'; outcomeText = 'КРИТИЧЕСКИЙ ПРОВАЛ'; outcomeColor = '#dc2626'; }
            else if (roll >= dc) { outcomeType = 'roll_success'; outcomeText = 'УСПЕХ'; outcomeColor = '#16a34a'; }
            else { outcomeType = 'roll_failure'; outcomeText = 'ПРОВАЛ'; outcomeColor = '#ea580c'; }

            await showDiceModal(actionQuestion, dc, roll, outcomeText, outcomeColor);

            const originalText = chat[lastUserIndex].mes;
            const cue = BOT_CUES[outcomeType].replace('{{dc}}', String(dc)).replace('{{roll}}', String(roll));
            chat[lastUserIndex].mes = originalText + cue;

            const isLastMsgBot = !chat[chat.length - 1].is_user;
            if (isLastMsgBot) {
                const swipeRightBtn = document.querySelector('.last_mes .swipe_right');
                // @ts-ignore
                if (swipeRightBtn) swipeRightBtn.click();
                else document.getElementById('send_but')?.click();
            } else {
                document.getElementById('send_but')?.click();
            }

            setTimeout(() => {
                if (chat[lastUserIndex]) chat[lastUserIndex].mes = originalText;
            }, 3000);

        } catch (err) {
            console.error(err);
            btnElement.classList.remove('loading');
            btnElement.innerHTML = oldHtml;
            // @ts-ignore
            toastr.error('Ошибка кубика: ' + err.message, 'BB Dice');
        }
    }

    // --- РЕЖИССЕР (Для бота) ---
    async function handleBotGeneration(type) {
        const ctx = SillyTavern.getContext();
        const chat = ctx.chat;
        
        if (!chat || chat.length === 0) return;
        let lastUserIndex = -1;
        for (let i = chat.length - 1; i >= 0; i--) {
            if (chat[i].is_user) { lastUserIndex = i; break; }
        }

        if (lastUserIndex === -1) {
            // @ts-ignore
            toastr.warning('Не найдено сообщение от вас.', 'BB Director'); return;
        }

        const originalText = chat[lastUserIndex].mes;
        const cue = BOT_CUES[type];
        chat[lastUserIndex].mes = originalText + cue;

        const isLastMsgBot = !chat[chat.length - 1].is_user;
        if (isLastMsgBot) {
            const swipeRightBtn = document.querySelector('.last_mes .swipe_right');
            // @ts-ignore
            if (swipeRightBtn) swipeRightBtn.click();
            else document.getElementById('send_but')?.click();
        } else {
            document.getElementById('send_but')?.click();
        }

        setTimeout(() => { if (chat[lastUserIndex]) chat[lastUserIndex].mes = originalText; }, 2500);
    }

    // --- ЛОГИКА МЕНЮ РЕЖИССЕРА ---
    function renderPopupVibes() {
        return `
            <div class="bb-eg-popup-header">Выберите событие</div>
            <button class="bb-eg-vibe-btn" data-vibe="dir_disaster">💥 Disaster (Опасность)</button>
            <button class="bb-eg-vibe-btn" data-vibe="dir_blessing">🎁 Blessing (Удача)</button>
            <button class="bb-eg-vibe-btn" data-vibe="dir_tension">❤️ Tension (Напряжение)</button>
            <button class="bb-eg-vibe-btn" data-vibe="dir_absurd">🃏 Absurd (Комедия)</button>
            <button class="bb-eg-vibe-btn" style="border-top: 1px dashed rgba(212, 175, 55, 0.3); margin-top: 4px;" data-vibe="dir_timeskip">⏩ Time Skip (Промотка)</button>
        `;
    }
    function renderPopupTargets() {
        return `
            <button class="bb-eg-back-btn"><i class="fa-solid fa-arrow-left"></i> Назад</button>
            <div class="bb-eg-popup-header">Куда направить?</div>
            <div class="bb-eg-target-grid">
                <button class="bb-eg-target-btn" data-target="me"><i class="fa-solid fa-user"></i> Мне</button>
                <button class="bb-eg-target-btn" data-target="bot"><i class="fa-solid fa-robot"></i> Боту</button>
            </div>
        `;
    }
    function buildDirectorPopup() {
        const wrap = document.createElement('div');
        wrap.className = 'bb-eg-director-wrap'; wrap.id = 'bb-eg-director-wrap';
        const mainBtn = document.createElement('button');
        mainBtn.className = 'bb-eg-btn'; mainBtn.id = 'bb-eg-btn-director';
        mainBtn.innerHTML = '🎬 Event Director';
        const popup = document.createElement('div');
        popup.className = 'bb-eg-popup'; popup.id = 'bb-eg-popup';
        popup.innerHTML = renderPopupVibes();

        mainBtn.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            isPopupOpen = !isPopupOpen;
            if (isPopupOpen) { popup.innerHTML = renderPopupVibes(); popup.classList.add('show'); } 
            else { popup.classList.remove('show'); }
        };

        popup.onclick = (e) => {
            e.stopPropagation();
            // @ts-ignore
            const target = e.target.closest('button');
            if (!target) return;

            if (target.classList.contains('bb-eg-vibe-btn')) {
                activeDirectorVibe = target.getAttribute('data-vibe');
                popup.innerHTML = renderPopupTargets();
            } 
            else if (target.classList.contains('bb-eg-back-btn')) { popup.innerHTML = renderPopupVibes(); }
            else if (target.classList.contains('bb-eg-target-btn')) {
                const targetType = target.getAttribute('data-target');
                popup.classList.remove('show'); isPopupOpen = false;
                if (targetType === 'me') handleGeneration(activeDirectorVibe, mainBtn);
                else if (targetType === 'bot') handleBotGeneration(activeDirectorVibe);
            }
        };
        wrap.appendChild(mainBtn); wrap.appendChild(popup);
        return wrap;
    }

    document.addEventListener('click', (e) => {
        const wrap = document.getElementById('bb-eg-director-wrap');
        const popup = document.getElementById('bb-eg-popup');
        // @ts-ignore
        if (isPopupOpen && wrap && !wrap.contains(e.target)) {
            isPopupOpen = false; popup.classList.remove('show');
        }
    });

    function updateToolbarVisibility() {
        const s = getSettings();
        const btnE = document.getElementById('bb-eg-btn-enhance'); if (btnE) btnE.style.display = s.btnEnhance ? 'flex' : 'none';
        const btnI = document.getElementById('bb-eg-btn-improve'); if (btnI) btnI.style.display = s.btnImprove ? 'flex' : 'none';
        const wrapD = document.getElementById('bb-eg-director-wrap'); if (wrapD) wrapD.style.display = s.btnDirector ? 'inline-block' : 'none';
        const btnDice = document.getElementById('bb-eg-btn-dice'); if (btnDice) btnDice.style.display = s.btnDice ? 'flex' : 'none';
        
        const toolbar = document.getElementById('bb-enhance-toolbar');
        if (toolbar) toolbar.style.display = (s.btnEnhance || s.btnImprove || s.btnDirector || s.btnDice) ? 'flex' : 'none';
    }

    function injectToolbar() {
        if (document.getElementById('bb-enhance-toolbar')) return;

        const toolbar = document.createElement('div');
        toolbar.id = 'bb-enhance-toolbar';

        const btnE = document.createElement('button'); btnE.className = 'bb-eg-btn'; btnE.id = 'bb-eg-btn-enhance'; btnE.innerHTML = '✨ Enhance';
        btnE.onclick = (e) => { e.preventDefault(); handleGeneration('enhance', btnE); };
        toolbar.appendChild(btnE);

        const btnI = document.createElement('button'); btnI.className = 'bb-eg-btn'; btnI.id = 'bb-eg-btn-improve'; btnI.innerHTML = '🔮 Improve';
        btnI.onclick = (e) => { e.preventDefault(); handleGeneration('improve', btnI); };
        toolbar.appendChild(btnI);

        toolbar.appendChild(buildDirectorPopup());

        // --- ДОБАВЛЯЕМ КНОПКУ КУБИКА ---
        const btnDice = document.createElement('button');
        btnDice.className = 'bb-eg-btn';
        btnDice.id = 'bb-eg-btn-dice';
        btnDice.innerHTML = '🎲 Action Roll';
        btnDice.onclick = (e) => { e.preventDefault(); handleSkillCheck(btnDice); };
        toolbar.appendChild(btnDice);

        const sendForm = document.getElementById('send_form');
        if (sendForm && sendForm.parentNode) sendForm.parentNode.insertBefore(toolbar, sendForm);

        updateToolbarVisibility();
    }

    function injectSettingsPanel() {
        if (document.getElementById('bb-eg-settings-container')) return;

        const s = getSettings();
        const html = `
            <div id="bb-eg-settings-container" class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>🎬 BB Event Director & Enhance</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="bb-eg-settings-panel">
                        <label><input type="checkbox" id="bb-eg-cfg-enhance" ${s.btnEnhance ? 'checked' : ''}> Показать [✨ Enhance]</label>
                        <label><input type="checkbox" id="bb-eg-cfg-improve" ${s.btnImprove ? 'checked' : ''}> Показать [🔮 Improve]</label>
                        <label><input type="checkbox" id="bb-eg-cfg-director" ${s.btnDirector ? 'checked' : ''}> Показать [🎬 Event Director]</label>
                        <label><input type="checkbox" id="bb-eg-cfg-dice" ${s.btnDice ? 'checked' : ''}> Показать [🎲 Action Roll]</label>
                    </div>
                </div>
            </div>
        `;

        const target = document.querySelector("#extensions_settings2") || document.querySelector("#extensions_settings");
        if (target) {
            target.insertAdjacentHTML('beforeend', html);
            document.getElementById('bb-eg-cfg-enhance').addEventListener('change', (e) => { 
                // @ts-ignore
                getSettings().btnEnhance = e.target.checked; saveSettings(); 
            });
            document.getElementById('bb-eg-cfg-improve').addEventListener('change', (e) => { 
                // @ts-ignore
                getSettings().btnImprove = e.target.checked; saveSettings(); 
            });
            document.getElementById('bb-eg-cfg-director').addEventListener('change', (e) => { 
                // @ts-ignore
                getSettings().btnDirector = e.target.checked; saveSettings(); 
            });
            document.getElementById('bb-eg-cfg-dice').addEventListener('change', (e) => { 
                // @ts-ignore
                getSettings().btnDice = e.target.checked; saveSettings(); 
            });
        }
    }

    jQuery(async () => {
        try {
            const { eventSource, event_types } = SillyTavern.getContext();
            eventSource.on(event_types.APP_READY, () => { injectToolbar(); injectSettingsPanel(); });
            injectToolbar(); injectSettingsPanel();
        } catch (e) { console.error("[BB Director] Ошибка запуска:", e); }
    });

})();