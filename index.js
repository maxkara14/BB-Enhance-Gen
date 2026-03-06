(function () {
    const MODULE_NAME = "BB-Enhance-Gen";

    const TEMPLATES = {
        enhance: `[CONTEXT REMINDER]\nCharacter: {{user}} ({{persona}})\nCurrent scene details: {{authorsNote}}\nStory Summary: {{summary}}\nLast message in chat: """{{lastMessage}}"""\n\n[TASK]\nYou are a master author. Take the user's brief draft below and EXPAND it significantly into a rich, immersive, and highly detailed literary masterpiece.\n\nYour goals:\n1. Expand actions with deep sensory details (sight, sound, smell, texture).\n2. Describe {{user}}'s internal thoughts, micro-expressions, and physical sensations.\n3. Enhance and rewrite {{user}}'s spoken dialogue. Feel free to rephrase, expand, or stylize their words to make them sound more natural, expressive, and perfectly aligned with their personality ({{persona}}).\n4. Embellish the surrounding environment and atmosphere.\n5. You MUST make the text substantially longer and more descriptive than the draft.\n\n⚠️ CRITICAL RULES:\n1. ONLY expand the current moment. DO NOT advance the plot or decide what happens next.\n2. DO NOT speak, act, or react for other characters.\n3. You MAY use HTML formatting and markdown if it matches the established chat style. DO NOT wrap your response in markdown code blocks (\`\`\`).\n4. Output ONLY the raw expanded story text.\n\nDraft to enhance: """{{input}}"""`,
        
        improve: `[TEXT EDITING TASK]\nYou are a strict text editor. Your ONLY job is to rephrase and polish the user's draft to make it sound more literary and grammatically correct.\n\nContext for tone: Character is {{user}} ({{persona}}). Previous message in chat: """{{lastMessage}}"""\n\n⚠️ CRITICAL RULES:\n1. PARAPHRASE ONLY. You are editing, NOT roleplaying.\n2. DO NOT add ANY new actions, thoughts, or dialogue that are not explicitly mentioned in the draft.\n3. DO NOT answer the previous message. DO NOT advance the plot or time even by a second.\n4. Keep the output roughly the EXACT SAME LENGTH as the original draft.\n5. Preserve any HTML formatting or markdown present in the original draft. DO NOT wrap your response in markdown code blocks (\`\`\`). Output ONLY the rewritten text.\n\nDraft to rewrite: """{{input}}"""`,

        dir_disaster: `[NARRATIVE DIRECTION: DISASTER]\nAuthor's Context:\nProtagonist: {{user}} ({{persona}})\nWorld/Scene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n\n[WRITING PROMPT]\nWrite the next segment of this fictional story from the perspective of {{user}}. Introduce a DRAMATIC DISRUPTION, DANGER, or BAD EVENT.\n\nRequirements:\n1. Create a sharp conflict, physical danger, bad news, or a painful memory triggered by the environment.\n2. Use the current location and objects explicitly.\n3. ⚠️ STRICT IN-CHARACTER RULE: The event must be logically grounded in the current setting. Other characters must react STRICTLY according to their established personalities (e.g., a protector must protect, a cruel person might mock, a coward will hide). DO NOT break character logic.\n4. Keep it natural but highly tense. DO NOT resolve the situation yet.\n\n⚠️ CRITICAL RULES:\nDO NOT generate ANY system UI blocks, radio interfaces, time infos, or tags like ::OS_START:: or <info>. Output ONLY the pure story text without meta-commentary.`,
        
        dir_blessing: `[NARRATIVE DIRECTION: BLESSING]\nAuthor's Context:\nProtagonist: {{user}} ({{persona}})\nWorld/Scene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n\n[WRITING PROMPT]\nWrite the next segment of this fictional story from the perspective of {{user}}. Introduce a BLESSING or GOOD EVENT.\n\nRequirements:\n1. Create an unexpected stroke of luck, a moment of deep comfort, help from an unexpected source, or a pleasant discovery.\n2. Use the current location and objects explicitly to ground the scene.\n3. ⚠️ STRICT IN-CHARACTER RULE: The blessing must be logical for the setting. If help or comfort comes from another character, it MUST perfectly match their established personality and current attitude towards {{user}} (e.g., a strict mentor might offer gruff but genuine praise; a friend will be warm).\n\n⚠️ CRITICAL RULES:\nDO NOT generate ANY system UI blocks, radio interfaces, time infos, or tags like ::OS_START:: or <info>. Output ONLY the pure story text without meta-commentary.`,
        
        dir_tension: `[NARRATIVE DIRECTION: ROMANTIC TENSION]\nAuthor's Context:\nProtagonist: {{user}} ({{persona}})\nWorld/Scene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n\n[WRITING PROMPT]\nWrite the next segment of this fictional story from the perspective of {{user}}. Focus on TENSION or DEEP EMOTION.\n\nRequirements:\n1. ⚠️ RELATIONSHIP LOGIC: Analyze the current dynamic. If {{user}} and the character are already romantically involved, escalate the passion and physical intimacy. If they are NOT involved, introduce a sudden spark of deep interest, a breathless awkward pause, or a revealing micro-expression.\n2. Focus heavily on {{user}}'s heartbeat, breathing, and physical proximity to others.\n3. Keep the interaction STRICTLY In-Character. Do not force actions that violate the character's core personality.\n\n⚠️ CRITICAL RULES:\nDO NOT generate ANY system UI blocks, radio interfaces, time infos, or tags like ::OS_START:: or <info>. Output ONLY the pure story text without meta-commentary.`,
        
        dir_absurd: `[NARRATIVE DIRECTION: ABSURD COMEDY]\nAuthor's Context:\nProtagonist: {{user}} ({{persona}})\nWorld/Scene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n\n[WRITING PROMPT]\nWrite the next segment of this fictional story from the perspective of {{user}}. Introduce an ABSURD or COMEDIC EVENT.\n\nRequirements:\n1. Create a ridiculous misunderstanding, a clumsy mistake, or an awkwardly funny situational irony.\n2. ⚠️ STRICT IN-CHARACTER RULE: The humor must not break character logic. Show how serious or specific characters react NATURALLY to the ridiculousness of the situation (e.g., a stoic character might sigh in exasperation, not laugh out loud). Do not turn characters into clowns if it contradicts their persona.\n\n⚠️ CRITICAL RULES:\nDO NOT generate ANY system UI blocks, radio interfaces, time infos, or tags like ::OS_START:: or <info>. Output ONLY the pure story text without meta-commentary.`,

        dir_timeskip: `[NARRATIVE DIRECTION: TIME SKIP]\nAuthor's Context:\nProtagonist: {{user}} ({{persona}})\nWorld/Scene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n\n[WRITING PROMPT]\nWrite the next segment of this fictional story from the perspective of {{user}}. Execute a logical TIME SKIP to push the plot forward.\n\nRequirements:\n1. Analyze the current situation and jump forward in time to the NEXT SIGNIFICANT EVENT or meaningful interaction. It must make logical sense for the plot.\n2. Briefly summarize what happened during the skipped time (e.g., travel, resting, routine).\n3. Establish the new time and location explicitly.\n4. Initiate the new plot event or conversation to keep the story moving.\n\n⚠️ CRITICAL RULES:\nDO NOT generate ANY system UI blocks, radio interfaces, time infos, or tags like ::OS_START:: or <info>. Output ONLY the pure story text without meta-commentary.`,
        
        ft_analyzer: `[SYSTEM INSTRUCTION: FAST TRAVEL SYSTEM]
Analyze the current roleplay context, character locations, and the latest events.
Your task is to determine if the user ({{user}}) can currently leave their location and suggest 3 logical destinations.

Context constraints:
Recent chat: """{{lastMessage}}"""

Rules:
1. If the user is in the middle of a battle, an important active dialogue, a lesson, or physically restrained, set "can_travel" to false and provide a "lock_reason" (in Russian).
2. If the user is relatively free to go, set "can_travel" to true and provide EXACTLY 3 logical "destinations" based on the world, time, and character motivations.
3. Output STRICTLY as a raw JSON object. Do not include markdown formatting like \`\`\`json or any other text.

Format required:
{
  "can_travel": true,
  "lock_reason": "",
  "destinations": [
    { "name": "Название локации (Russian)", "hook": "Причина пойти туда / мотив", "time_cost": "Примерное время в пути (напр. 15 мин)" }
  ]
}`
    };

    const BOT_CUES = {
        dir_disaster: `\n\n[Director's Cue: In your next response, introduce a DRAMATIC DISRUPTION, DANGER, or BAD EVENT. CRITICAL RULE: Stay STRICTLY In-Character (IC). The event must make logical sense for the current setting, and the characters' reactions must perfectly match their established personalities (e.g., supportive characters should try to help, antagonists should gloat or attack). Do not resolve the tension yet.]`,
        dir_blessing: `\n\n[Director's Cue: In your next response, introduce a BLESSING or UNEXPECTED LUCK for the user (e.g., timely help, deep comfort, a lucky find). CRITICAL RULE: Stay STRICTLY In-Character (IC). If another character provides the help or comfort, they must do so in a way that fits their exact personality and dynamic with the user. The luck must make sense in this world.]`,
        dir_tension: `\n\n[Director's Cue: In your next response, focus heavily on TENSION. CRITICAL RULE: Analyze the relationship status. If the characters are romantically involved, escalate the passion and intimacy. If they are NOT involved, create a sudden breathless moment of deep interest, lingering eye contact, or accidental touch. Stay STRICTLY In-Character and respect their established dynamic.]`,
        dir_absurd: `\n\n[Director's Cue: In your next response, introduce an ABSURD or COMEDIC SITUATION (e.g., a clumsy mistake, a funny misunderstanding). CRITICAL RULE: Stay STRICTLY In-Character (IC). Do not break a character's core personality just for a joke; show how they naturally and logically react to the absurdity based on their persona.]`,
        dir_timeskip: `\n\n[Director's Cue: In your next response, execute a logical TIME SKIP. Jump forward in time to the next significant plot event or new location. Briefly summarize the skipped time, establish the new setting, and initiate the new scene. Ensure the transition respects the current context and character motivations.]`,
        
        roll_crit_success: `\n\n[SYSTEM: DICE OF FATE — CRITICAL SUCCESS (Rolled 20!). The user's action succeeded brilliantly and inconceivably. Describe an absolute triumph with an unexpected bonus. CRITICAL RULE: NPCs must react STRICTLY In-Character based on this outcome (e.g., deep shock, immense respect, or complete defeat). The narrative must fit the logic of the setting.]`,
        roll_success: `\n\n[SYSTEM: DICE OF FATE — SUCCESS (Roll: {{roll}} vs DC: {{dc}}). The user's action was successful. Describe how their plan worked out perfectly. CRITICAL RULE: Ensure the reactions of other characters are logical and STRICTLY In-Character. A proud opponent might be begrudgingly impressed, a weak one terrified, etc.]`,
        roll_failure: `\n\n[SYSTEM: DICE OF FATE — FAILURE (Roll: {{roll}} vs DC: {{dc}}). The user's action failed. Describe a fiasco: the plan collapsed, a weapon slipped, or a lie was obvious. CRITICAL RULE: NPCs must react STRICTLY In-Character to this failure (e.g., an enemy triumphs, a strict mentor sighs in disappointment). Maintain the logic of the world.]`,
        roll_crit_failure: `\n\n[SYSTEM: DICE OF FATE — CRITICAL FAILURE (Rolled 1!). The user's action turned into an absolute catastrophe. The situation just got 10 times worse. CRITICAL RULE: Describe the worst logical outcome. Characters must react STRICTLY In-Character (e.g., intense anger, cruel mockery, or panic) based on their established traits.]`,

        ft_travel_specific: `\n\n[System Notification: The user has decided to use Fast Travel to go to "{{loc}}". Reason: "{{hook}}". Time passed: {{time}}. In your next response, smoothly transition the narrative. Describe the user arriving at the destination, close the previous scene, establish the new location, and initiate an event or dialogue there.]`,
        ft_travel_surprise: `\n\n[System Notification: The user has decided to wander off randomly (Fast Travel: Surprise Me). In your next response, smoothly transition the narrative. Describe the user leaving their current spot and stumbling into an UNEXPECTED ENCOUNTER, interesting event, or obstacle in a new location. Ensure it makes logical sense for the setting.]`
    };

    const DEFAULT_SETTINGS = {
        btnEnhance: true,
        btnImprove: true,
        btnDirector: true,
        btnDice: true,
        btnFastTravel: true
    };

    let activeDirectorVibe = null;
    let isPopupOpen = false;

    function getSettings() {
        const { extensionSettings } = SillyTavern.getContext();
        if (!extensionSettings[MODULE_NAME]) extensionSettings[MODULE_NAME] = structuredClone(DEFAULT_SETTINGS);
        if (typeof extensionSettings[MODULE_NAME].btnFastTravel === 'undefined') {
            extensionSettings[MODULE_NAME].btnFastTravel = DEFAULT_SETTINGS.btnFastTravel;
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
            toastr.warning('Сначала напиши текст в поле ввода!', 'BB Enhance'); return;
        }

        btnElement.classList.add('loading');
        const oldHtml = btnElement.innerHTML;
        btnElement.innerHTML = `⏳ <span>Загрузка...</span>`;

        try {
            let promptRaw = TEMPLATES[type].replace('{{input}}', inputText);
            let finalPrompt = promptRaw;
            // @ts-ignore
            if (typeof window.substituteParams === 'function') finalPrompt = await window.substituteParams(promptRaw);
            // @ts-ignore
            else if (typeof window.substituteParamsExtended === 'function') finalPrompt = await window.substituteParamsExtended(promptRaw);

            const ctx = SillyTavern.getContext();
            let result = await ctx.generateQuietPrompt(finalPrompt);

            const resultStr = String(result).trim();
            if (result === undefined || result === null || resultStr === '' || resultStr === 'undefined' || resultStr === 'null') {
                // @ts-ignore
                toastr.error('Ошибка генерации: API не подключено или вернуло пустой ответ.', 'BB Enhance');
                return;
            }

            let cleanResult = resultStr;
            cleanResult = cleanResult.replace(/<think>[\s\S]*?<\/think>/gi, '');
            cleanResult = cleanResult.replace(/<info>[\s\S]*?<\/info>/gi, ''); // Удаляем тег часов, если ИИ его подхватил [cite: 8]
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
            } else if (resultStr.length > 0) {
                ta.value = resultStr; ta.dispatchEvent(new Event('input', { bubbles: true })); 
                // @ts-ignore
                toastr.warning('Фильтр удалил всё. Возвращен сырой текст!', 'BB Director');
            } else {
                // @ts-ignore
                toastr.warning('Нейросеть вернула пустой ответ.', 'BB Director');
            }
            
        } catch (err) {
            console.error(err);
            let errMsg = err.message || String(err);
            if (errMsg.toLowerCase().includes('fetch') || errMsg.toLowerCase().includes('network')) {
                errMsg = 'API недоступно (Network Error / Failed to fetch).';
            }
            // @ts-ignore
            toastr.error('Техническая ошибка: ' + errMsg, 'BB Enhance');
        } finally {
            btnElement.classList.remove('loading');
            btnElement.innerHTML = oldHtml;
        }
    }

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
            
            let ticks = 0; const maxTicks = 40; let currentDelay = 30; 

            function rollTick() {
                if (ticks < maxTicks) {
                    // @ts-ignore
                    mainFace.innerText = String(Math.floor(Math.random() * 20) + 1);
                    randFaces.forEach(face => {
                        // @ts-ignore
                        face.innerText = String(Math.floor(Math.random() * 20) + 1);
                    });
                    ticks++;
                    if (ticks > 25) currentDelay += 20;
                    setTimeout(rollTick, currentDelay);
                } else {
                    cubeEl.classList.add('stopped'); 
                    // @ts-ignore
                    mainFace.innerText = String(finalRoll);
                    mainFace.style.color = outcomeColor;
                    mainFace.style.textShadow = `0 0 20px ${outcomeColor}, 0 0 10px #fff`;
                    mainFace.style.fontSize = "60px";
                    mainFace.style.borderColor = outcomeColor;
                    mainFace.style.boxShadow = `inset 0 0 30px ${outcomeColor}, 0 0 40px ${outcomeColor}`;
                    mainFace.style.background = "rgba(10, 5, 5, 0.95)";
                    // @ts-ignore
                    outcomeEl.innerText = outcomeText;
                    outcomeEl.style.color = outcomeColor;
                    outcomeEl.style.opacity = '1';
                    
                    setTimeout(() => {
                        overlay.style.opacity = '0'; 
                        setTimeout(() => { overlay.remove(); resolve(); }, 800);
                    }, 4500); 
                }
            }
            setTimeout(rollTick, 600); 
        });
    }

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
            const prompt = `[TASK]\nRead the user's last action in the roleplay: """${lastUserMessage}"""\nFormulate a single, short dramatic question describing the skill check they are attempting.\nRules:\n- Strictly in Russian.\n- Max 8-10 words.\n- Output ONLY the question, nothing else. No intro, no quotes.`;
            
            // @ts-ignore 
            let actionQuestion = await ctx.generateQuietPrompt(prompt);
            const qStr = String(actionQuestion).trim();
            if (actionQuestion === undefined || actionQuestion === null || qStr === '' || qStr === 'undefined' || qStr === 'null') {
                throw new Error("Пустой ответ API");
            }

            actionQuestion = qStr.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
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
            } else { document.getElementById('send_but')?.click(); }

            setTimeout(() => { if (chat[lastUserIndex]) chat[lastUserIndex].mes = originalText; }, 3000);

        } catch (err) {
            console.error(err);
            btnElement.classList.remove('loading');
            btnElement.innerHTML = oldHtml;
            // @ts-ignore
            toastr.error('Техническая ошибка: API недоступно.', 'BB Dice');
        }
    }

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
        } else { document.getElementById('send_but')?.click(); }

        setTimeout(() => { if (chat[lastUserIndex]) chat[lastUserIndex].mes = originalText; }, 2500);
    }

    function renderPopupVibes() {
        return `
            <div class="bb-eg-popup-header">Выберите событие</div>
            <button class="bb-eg-vibe-btn" data-vibe="dir_disaster">💥 Disaster (Опасность)</button>
            <button class="bb-eg-vibe-btn" data-vibe="dir_blessing">🎁 Blessing (Удача)</button>
            <button class="bb-eg-vibe-btn" data-vibe="dir_tension">❤️ Tension (Напряжение)</button>
            <button class="bb-eg-vibe-btn" data-vibe="dir_absurd">🃏 Absurd (Комедия)</button>
            <button class="bb-eg-vibe-btn" style="border-top: 1px dashed rgba(255, 255, 255, 0.1); margin-top: 4px;" data-vibe="dir_timeskip">⏩ Time Skip (Промотка)</button>
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
        const wrap = document.createElement('div'); wrap.className = 'bb-eg-director-wrap'; wrap.id = 'bb-eg-director-wrap';
        const mainBtn = document.createElement('button'); mainBtn.className = 'bb-eg-btn'; mainBtn.id = 'bb-eg-btn-director'; 
        mainBtn.innerHTML = '🎬 Event Director';
        const popup = document.createElement('div'); popup.className = 'bb-eg-popup'; popup.id = 'bb-eg-popup';
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

    async function handleFastTravel(btnElement) {
        btnElement.classList.add('loading');
        const oldHtml = btnElement.innerHTML;
        btnElement.innerHTML = `⏳ <span>Скан...</span>`;

        try {
            let finalPrompt = TEMPLATES.ft_analyzer;
            // @ts-ignore
            if (typeof window.substituteParams === 'function') finalPrompt = await window.substituteParams(TEMPLATES.ft_analyzer);
            // @ts-ignore
            else if (typeof window.substituteParamsExtended === 'function') finalPrompt = await window.substituteParamsExtended(TEMPLATES.ft_analyzer);

            const ctx = SillyTavern.getContext();
            // @ts-ignore
            let result = await ctx.generateQuietPrompt(finalPrompt);

            const resultStr = String(result).trim();
            const jsonMatch = resultStr.match(/\{[\s\S]*\}/);
            
            if (!jsonMatch) {
                console.error("Fast Travel Raw Output:", resultStr);
                throw new Error("Нейросеть не смогла сгенерировать варианты перемещения.");
            }

            const data = JSON.parse(jsonMatch[0]);
            showFastTravelModal(data);

        } catch (err) {
            console.error(err);
            // @ts-ignore
            toastr.error('Ошибка Fast Travel: ' + (err.message || "Сбой API"), 'BB Fast Travel');
        } finally {
            btnElement.classList.remove('loading');
            btnElement.innerHTML = oldHtml;
        }
    }

    function showFastTravelModal(data) {
        const overlay = document.createElement('div');
        overlay.className = 'bb-ft-overlay';
        
        let contentHtml = '';

        if (data.can_travel === false) {
            contentHtml = `
                <div class="bb-ft-modal denied">
                    <div class="bb-ft-title">🚫 ДОСТУП ЗАКРЫТ</div>
                    <div class="bb-ft-reason">«${data.lock_reason || 'Вы не можете покинуть это место прямо сейчас.'}»</div>
                    <button class="bb-ft-close" id="bb-ft-close">Понятно</button>
                </div>
            `;
        } else {
            let cardsHtml = '';
            if (data.destinations && Array.isArray(data.destinations)) {
                data.destinations.forEach(dest => {
                    const safeName = (dest.name || '').replace(/"/g, '&quot;');
                    const safeHook = (dest.hook || '').replace(/"/g, '&quot;');
                    const safeTime = (dest.time_cost || '').replace(/"/g, '&quot;');
                    
                    cardsHtml += `
                        <div class="bb-ft-card" data-loc="${safeName}" data-hook="${safeHook}" data-time="${safeTime}">
                            <div class="bb-ft-card-header">
                                <span class="bb-ft-dest">${safeName}</span>
                                <span class="bb-ft-time"><i class="fa-regular fa-clock"></i> ${safeTime}</span>
                            </div>
                            <div class="bb-ft-hook">${safeHook}</div>
                        </div>
                    `;
                });
            }

            contentHtml = `
                <div class="bb-ft-modal">
                    <div class="bb-ft-title">📍 БЫСТРОЕ ПЕРЕМЕЩЕНИЕ</div>
                    <div class="bb-ft-grid">${cardsHtml}</div>
                    <button class="bb-ft-surprise" id="bb-ft-btn-surprise"><i class="fa-solid fa-bolt"></i> Случайное событие (Surprise me)</button>
                    <button class="bb-ft-close" id="bb-ft-close" style="margin-top: 15px; background: transparent; color: #9ca3af; border: 1px solid #3f2c2c;">Отмена</button>
                </div>
            `;
        }

        overlay.innerHTML = contentHtml;
        document.body.appendChild(overlay);

        requestAnimationFrame(() => overlay.style.opacity = '1');

        const closeModal = () => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 400);
        };

        const closeBtn = overlay.querySelector('#bb-ft-close');
        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        const executeTravel = (loc, hook, time) => {
            closeModal();
            const ctx = SillyTavern.getContext();
            const chat = ctx.chat;
            if (!chat || chat.length === 0) return;

            let lastUserIndex = -1;
            for (let i = chat.length - 1; i >= 0; i--) {
                if (chat[i].is_user) { lastUserIndex = i; break; }
            }
            if (lastUserIndex === -1) return;

            const originalText = chat[lastUserIndex].mes;
            let cue = '';
            
            if (loc && hook) {
                cue = BOT_CUES.ft_travel_specific.replace('{{loc}}', loc).replace('{{hook}}', hook).replace('{{time}}', time || 'неизвестно');
            } else {
                cue = BOT_CUES.ft_travel_surprise;
            }

            chat[lastUserIndex].mes = originalText + cue;

            const isLastMsgBot = !chat[chat.length - 1].is_user;
            if (isLastMsgBot) {
                const swipeRightBtn = document.querySelector('.last_mes .swipe_right');
                // @ts-ignore
                if (swipeRightBtn) swipeRightBtn.click();
                else document.getElementById('send_but')?.click();
            } else { document.getElementById('send_but')?.click(); }

            setTimeout(() => { if (chat[lastUserIndex]) chat[lastUserIndex].mes = originalText; }, 3000);
        };

        const cards = overlay.querySelectorAll('.bb-ft-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const loc = card.getAttribute('data-loc');
                const hook = card.getAttribute('data-hook');
                const time = card.getAttribute('data-time');
                executeTravel(loc, hook, time);
            });
        });

        const surpriseBtn = overlay.querySelector('#bb-ft-btn-surprise');
        if (surpriseBtn) {
            surpriseBtn.addEventListener('click', () => executeTravel(null, null, null));
        }
    }

    function updateToolbarVisibility() {
        const s = getSettings();
        const btnE = document.getElementById('bb-eg-btn-enhance'); if (btnE) btnE.style.display = s.btnEnhance ? 'flex' : 'none';
        const btnI = document.getElementById('bb-eg-btn-improve'); if (btnI) btnI.style.display = s.btnImprove ? 'flex' : 'none';
        const wrapD = document.getElementById('bb-eg-director-wrap'); if (wrapD) wrapD.style.display = s.btnDirector ? 'block' : 'none';
        const btnDice = document.getElementById('bb-eg-btn-dice'); if (btnDice) btnDice.style.display = s.btnDice ? 'flex' : 'none';
        const btnFT = document.getElementById('bb-eg-btn-ft'); if (btnFT) btnFT.style.display = s.btnFastTravel ? 'flex' : 'none';
        
        const wrapper = document.getElementById('bb-enhance-wrapper');
        const hasAny = s.btnEnhance || s.btnImprove || s.btnDirector || s.btnDice || s.btnFastTravel;
        if (wrapper) wrapper.style.display = hasAny ? 'inline-flex' : 'none';
    }

    // === ИНЖЕКТ МЕНЮ ===
    function injectToolbar() {
        if (document.getElementById('bb-enhance-wrapper')) return;

        const wrapper = document.createElement('div');
        wrapper.id = 'bb-enhance-wrapper';

        // Аккуратная квадратная кнопка
        const toggleBtn = document.createElement('div');
        toggleBtn.id = 'bb-eg-toggle-btn';
        toggleBtn.innerHTML = 'E';
        toggleBtn.title = 'BB Enhance Panel';

        const toolbar = document.createElement('div');
        toolbar.id = 'bb-enhance-toolbar';

        const btnE = document.createElement('button'); btnE.className = 'bb-eg-btn'; btnE.id = 'bb-eg-btn-enhance'; btnE.innerHTML = '✨ Enhance';
        btnE.onclick = (e) => { e.preventDefault(); handleGeneration('enhance', btnE); };
        toolbar.appendChild(btnE);

        const btnI = document.createElement('button'); btnI.className = 'bb-eg-btn'; btnI.id = 'bb-eg-btn-improve'; btnI.innerHTML = '🔮 Improve';
        btnI.onclick = (e) => { e.preventDefault(); handleGeneration('improve', btnI); };
        toolbar.appendChild(btnI);

        toolbar.appendChild(buildDirectorPopup());

        const btnDice = document.createElement('button');
        btnDice.className = 'bb-eg-btn'; btnDice.id = 'bb-eg-btn-dice'; btnDice.innerHTML = '🎲 Action Roll';
        btnDice.onclick = (e) => { e.preventDefault(); handleSkillCheck(btnDice); };
        toolbar.appendChild(btnDice);

        const btnFT = document.createElement('button');
        btnFT.className = 'bb-eg-btn'; btnFT.id = 'bb-eg-btn-ft'; btnFT.innerHTML = '📍 Fast Travel';
        btnFT.onclick = (e) => { e.preventDefault(); handleFastTravel(btnFT); };
        toolbar.appendChild(btnFT);

        wrapper.appendChild(toggleBtn);
        wrapper.appendChild(toolbar);

        // ИНЖЕКТ ПРЯМО К ВОЛШЕБНОЙ ПАЛОЧКЕ
        const optionsBtn = document.getElementById('options_button');
        if (optionsBtn && optionsBtn.parentNode) {
            optionsBtn.parentNode.insertBefore(wrapper, optionsBtn.nextSibling);
        } else {
            const sendForm = document.getElementById('send_form');
            if (sendForm && sendForm.parentNode) sendForm.parentNode.insertBefore(wrapper, sendForm);
        }

        // Локальное состояние меню (Всегда закрыто при старте)
        let isMenuOpen = false; 

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isMenuOpen = !isMenuOpen;
            if (isMenuOpen) {
                toolbar.classList.add('expanded');
                toggleBtn.classList.add('active');
            } else {
                toolbar.classList.remove('expanded');
                toggleBtn.classList.remove('active');
            }
        });

        // УМНОЕ ЗАКРЫТИЕ ПРИ КЛИКЕ МИМО МЕНЮ
        document.addEventListener('click', (e) => {
            // @ts-ignore
            if (isMenuOpen && !wrapper.contains(e.target)) {
                isMenuOpen = false;
                toolbar.classList.remove('expanded');
                toggleBtn.classList.remove('active');
            }
        });

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
                        <label><input type="checkbox" id="bb-eg-cfg-ft" ${s.btnFastTravel ? 'checked' : ''}> Показать [📍 Fast Travel]</label>
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
            document.getElementById('bb-eg-cfg-ft').addEventListener('change', (e) => { 
                // @ts-ignore
                getSettings().btnFastTravel = e.target.checked; saveSettings(); 
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
