(function () {
    const MODULE_NAME = "BB-Enhance-Gen";

    const TEMPLATES = {
        enhance: `<context>\nProtagonist: {{user}} ({{persona}})\nScene details: {{authorsNote}}\nStory Summary: {{summary}}\nLast chat message: """{{lastMessage}}"""\n</context>\n\n<task>\nExpand the user's brief draft below into a rich, immersive, and highly detailed literary segment.\n</task>\n\n<rules>\n1. Expand actions with deep sensory details (sight, sound, smell, texture).\n2. Describe {{user}}'s internal thoughts, micro-expressions, and physical sensations.\n3. Polish {{user}}'s spoken dialogue to align perfectly with their personality.\n4. ONLY expand the current moment. DO NOT advance the plot.\n5. DO NOT speak, act, or react for other characters.\n6. You MAY use HTML formatting if it matches the chat style. Output ONLY the raw expanded story text. Absolutely no conversational filler, greetings, or meta-commentary. Do not use markdown code blocks (\`\`\`).\n</rules>\n\n<draft>\n{{input}}\n</draft>`,
        
        improve: `<context>\nProtagonist: {{user}} ({{persona}})\nLast chat message: """{{lastMessage}}"""\n</context>\n\n<task>\nEdit and polish the draft below to improve its literary flow, grammar, and phrasing.\n</task>\n\n<rules>\n1. PARAPHRASE ONLY. Do not write new plot.\n2. DO NOT add new actions, thoughts, or dialogue that are not in the draft.\n3. DO NOT answer the previous message. DO NOT advance time.\n4. Keep the output roughly the EXACT SAME LENGTH as the original draft.\n5. Preserve any HTML formatting or markdown. Do not use markdown code blocks (\`\`\`).\n6. Output ONLY the rewritten text. No conversational filler or commentary.\n</rules>\n\n<draft>\n{{input}}\n</draft>`,

        dir_disaster: `<context>\nProtagonist: {{user}} ({{persona}})\nScene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n</context>\n\n<task>\nWrite the next segment of this story from the perspective of {{user}}. Introduce a DRAMATIC DISRUPTION, DANGER, or BAD EVENT.\n</task>\n\n<rules>\n1. Create a sharp conflict, physical danger, bad news, or painful memory.\n2. Use the current location and objects explicitly.\n3. STRICT IN-CHARACTER RULE: The event must be logically grounded in the setting. Other characters must react STRICTLY according to their established personalities. DO NOT break character logic.\n4. Keep it highly tense. DO NOT resolve the situation yet.\n5. Output ONLY the pure story text without meta-commentary.\n</rules>`,
        
        dir_blessing: `<context>\nProtagonist: {{user}} ({{persona}})\nScene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n</context>\n\n<task>\nWrite the next segment of this story from the perspective of {{user}}. Introduce a BLESSING or GOOD EVENT.\n</task>\n\n<rules>\n1. Create an unexpected stroke of luck, deep comfort, or pleasant discovery.\n2. Use the current location and objects explicitly.\n3. STRICT IN-CHARACTER RULE: The blessing must be logical for the setting. Help from another character MUST perfectly match their established personality.\n4. Output ONLY the pure story text without meta-commentary.\n</rules>`,
        
        dir_tension: `<context>\nProtagonist: {{user}} ({{persona}})\nScene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n</context>\n\n<task>\nWrite the next segment of this story from the perspective of {{user}}. Focus on TENSION or DEEP EMOTION.\n</task>\n\n<rules>\n1. RELATIONSHIP LOGIC: If {{user}} and the character are romantically involved, escalate passion and physical intimacy. If NOT involved, introduce a sudden spark of deep interest, a breathless awkward pause, or revealing micro-expression.\n2. Focus heavily on {{user}}'s heartbeat, breathing, and physical proximity.\n3. Keep the interaction STRICTLY In-Character.\n4. Output ONLY the pure story text without meta-commentary.\n</rules>`,
        
        dir_absurd: `<context>\nProtagonist: {{user}} ({{persona}})\nScene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n</context>\n\n<task>\nWrite the next segment of this story from the perspective of {{user}}. Introduce an ABSURD or COMEDIC EVENT.\n</task>\n\n<rules>\n1. Create a ridiculous misunderstanding, clumsy mistake, or awkwardly funny situational irony.\n2. STRICT IN-CHARACTER RULE: The humor must not break character logic. Show how serious characters react NATURALLY to the absurdity.\n3. Output ONLY the pure story text without meta-commentary.\n</rules>`,

        dir_tragedy: `<context>\nProtagonist: {{user}} ({{persona}})\nScene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n</context>\n\n<task>\nWrite the next segment of this story from the perspective of {{user}}. Introduce a TRAGIC EVENT or SEVERE EMOTIONAL DAMAGE.\n</task>\n\n<rules>\n1. Create a terrible revelation, an irreversible mistake, a painful loss, or deep despair.\n2. Characters must react STRICTLY In-Character. Do not resolve it easily.\n3. Output ONLY the pure story text without meta-commentary.\n</rules>`,
        
        ft_analyzer: `<task>\nAnalyze the current roleplay context, character locations, and the user's intended action to determine if the user ({{user}}) can use Fast Travel, and suggest 3 destinations.\n</task>\n\n<context>\nRecent chat: """{{lastMessage}}"""\nUser's Intended Action: """{{input}}""" (If empty, assume user wants to travel away from their current location)\n</context>\n\n<rules>\n1. If the user is in battle, an important active dialogue, a lesson, or physically restrained, set "can_travel" to false and provide a "lock_reason" (in Russian).\n2. If the user is free to go, set "can_travel" to true and provide EXACTLY 3 logical "destinations" based on the world, time, and motives.\n3. Keep the "hook" descriptions VERY SHORT.\n4. Output STRICTLY as a raw JSON object starting with { and ending with }.\n5. DO NOT wrap the output in markdown code blocks.\n</rules>\n\n<format>\n{\n  "can_travel": true,\n  "lock_reason": "",\n  "destinations": [\n    { "name": "Название (Russian)", "hook": "Краткая причина.", "time_cost": "Время (напр. 15 мин)" }\n  ]\n}\n</format>`,

        ts_analyzer: `<task>\nAnalyze the current roleplay context and determine if the user ({{user}}) can execute a TIME SKIP. Suggest 3 chapter-like skip options.\n</task>\n\n<context>\nRecent chat: """{{lastMessage}}"""\n</context>\n\n<rules>\n1. If the characters are mid-battle, in an active conversation, or in a critical immediate situation, set "can_skip" to false and provide a "lock_reason" (in Russian).\n2. If the scene is winding down, transitioning, or free to skip, set "can_skip" to true and provide EXACTLY 3 "options".\n3. Option types: Short skip (hours/next day), Medium skip (days/weekend), Long skip (weeks/contextual).\n4. Keep the "summary" descriptions VERY SHORT.\n5. Output STRICTLY as a raw JSON object starting with { and ending with }.\n6. DO NOT wrap the output in markdown code blocks.\n</rules>\n\n<format>\n{\n  "can_skip": true,\n  "lock_reason": "",\n  "options": [\n    { "time": "Завтра утром", "title": "Глава: Новое начало", "summary": "Персонажи просыпаются и готовы к новому дню." }\n  ]\n}\n</format>`
    };

    const BOT_CUES = {
        dir_disaster: `\n\n> 💥 **Событие: ОПАСНОСТЬ** <span style="display:none;">\n<system_note>\nNARRATIVE DIRECTION: In your next response, introduce a DRAMATIC DISRUPTION, DANGER, or BAD EVENT. CRITICAL RULE: Stay STRICTLY In-Character (IC). The event must make logical sense for the setting, and characters' reactions must perfectly match their established personalities. Do not resolve the tension yet.\n</system_note>\n</span>`,
        dir_blessing: `\n\n> 🎁 **Событие: УДАЧА** <span style="display:none;">\n<system_note>\nNARRATIVE DIRECTION: In your next response, introduce a BLESSING or UNEXPECTED LUCK for the user. CRITICAL RULE: Stay STRICTLY In-Character (IC). If another character provides help, they must do so in a way that fits their exact personality and dynamic with the user. The event must make sense in this world.\n</system_note>\n</span>`,
        dir_tension: `\n\n> ❤️ **Событие: НАПРЯЖЕНИЕ** <span style="display:none;">\n<system_note>\nNARRATIVE DIRECTION: In your next response, focus heavily on TENSION. CRITICAL RULE: Analyze the relationship status. If characters are romantically involved, escalate passion. If NOT involved, create a sudden breathless moment of deep interest, lingering eye contact, or accidental touch. Stay STRICTLY In-Character.\n</system_note>\n</span>`,
        dir_absurd: `\n\n> 🃏 **Событие: АБСУРД** <span style="display:none;">\n<system_note>\nNARRATIVE DIRECTION: In your next response, introduce an ABSURD or COMEDIC SITUATION (e.g., clumsy mistake, misunderstanding). CRITICAL RULE: Stay STRICTLY In-Character (IC). Do not break a character's core personality for a joke; show how they logically react to the absurdity based on their persona.\n</system_note>\n</span>`,
        dir_tragedy: `\n\n> 💀 **Событие: ТРАГЕДИЯ** <span style="display:none;">\n<system_note>\nNARRATIVE DIRECTION: In your next response, introduce a TRAGIC EVENT or severe emotional damage. A terrible revelation, an irreversible mistake, a painful loss, or deep despair. Characters must react STRICTLY In-Character. Do not resolve it easily.\n</system_note>\n</span>`,
        
        roll_crit_success: `\n\n> 🎲 **КРИТИЧЕСКИЙ УСПЕХ (20)** | *{{question}}* <span style="display:none;">\n<system_note>\nDICE OF FATE — CRITICAL SUCCESS (Rolled 20!). The user's action succeeded brilliantly. Describe an absolute triumph with an unexpected bonus. CRITICAL RULE: NPCs must react STRICTLY In-Character (e.g., deep shock, immense respect, complete defeat).\n</system_note>\n</span>`,
        roll_success: `\n\n> 🎲 **УСПЕХ ({{roll}} из {{dc}})** | *{{question}}* <span style="display:none;">\n<system_note>\nDICE OF FATE — SUCCESS (Roll: {{roll}} vs DC: {{dc}}). The user's action was successful. Describe how their plan worked perfectly. CRITICAL RULE: Ensure NPC reactions are logical and STRICTLY In-Character.\n</system_note>\n</span>`,
        roll_failure: `\n\n> 🎲 **ПРОВАЛ ({{roll}} из {{dc}})** | *{{question}}* <span style="display:none;">\n<system_note>\nDICE OF FATE — FAILURE (Roll: {{roll}} vs DC: {{dc}}). The user's action failed. Describe a fiasco (plan collapsed, weapon slipped). CRITICAL RULE: NPCs must react STRICTLY In-Character to this failure (e.g., an enemy triumphs, a mentor sighs).\n</system_note>\n</span>`,
        roll_crit_failure: `\n\n> 🎲 **КРИТИЧЕСКИЙ ПРОВАЛ (1)** | *{{question}}* <span style="display:none;">\n<system_note>\nDICE OF FATE — CRITICAL FAILURE (Rolled 1!). The user's action turned into an absolute catastrophe. The situation got 10 times worse. CRITICAL RULE: Describe the worst logical outcome. Characters must react STRICTLY In-Character (e.g., intense anger, cruel mockery).\n</system_note>\n</span>`,

        ft_travel_specific: `\n\n> 📍 **Путешествие:** *{{loc}}* ⏳ ({{time}}) <span style="display:none;">\n<system_note>\nFAST TRAVEL EVENT: The user has decided to Fast Travel to "{{loc}}". Reason: "{{hook}}". Time passed: {{time}}. In your next response, smoothly transition the narrative. Describe the user arriving at the destination, close the previous scene, and initiate a new event there.\n</system_note>\n</span>`,
        ft_travel_surprise: `\n\n> ⚡ **Путешествие:** *Шаг в неизвестность (Случайное событие)* <span style="display:none;">\n<system_note>\nFAST TRAVEL EVENT: The user wanders off randomly (Surprise Me). In your next response, smoothly transition the narrative. Describe the user leaving their current spot and stumbling into an UNEXPECTED ENCOUNTER, interesting event, or obstacle in a new location. Ensure it makes logical sense.\n</system_note>\n</span>`,

        ts_specific: `\n\n> ⏩ **ПРОМОТКА ВРЕМЕНИ:** *{{title}}* ⏳ ({{time}}) <span style="display:none;">\n<system_note>\nTIME SKIP EVENT: Execute a logical TIME SKIP forward by {{time}}. New Chapter: "{{title}}". Summary of situation: "{{summary}}". In your next response, seamlessly transition the narrative to the start of this new timeframe, establish the setting, and initiate the new scene.\n</system_note>\n</span>`
    };

    const DEFAULT_SETTINGS = {
        btnEnhance: true, 
        btnImprove: true, 
        btnDirector: true, 
        btnDice: true, 
        btnFastTravel: true, 
        btnTimeSkip: true,
        useCustomApi: false,
        customApiUrl: 'https://api.groq.com/openai/v1',
        customApiKey: '',
        customApiModel: ''
    };

    let activeDirectorVibe = null;
    let isPopupOpen = false;

    // === БЕЗОПАСНЫЙ ПАРСЕР JSON ===
    function extractJSON(text) {
        let str = String(text).trim();
        str = str.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
        
        let start = str.indexOf('{');
        let end = str.lastIndexOf('}');
        
        if (start === -1 || end === -1) {
            throw new Error(`Модель не выдала JSON. Ответ: ${str.substring(0, 80)}...`);
        }
        
        let jsonStr = str.substring(start, end + 1);
        try {
            return JSON.parse(jsonStr);
        } catch (e) {
            throw new Error(`Ошибка чтения формата: ${e.message}`);
        }
    }

    // === ФУНКЦИЯ УМНОЙ ОЧИСТКИ (ЛАСТИК) ===
    function removeExtensionCues(text) {
        if (!text) return text;
        const regex = /(?:\r?\n)*> (?:💥|🎁|❤️|🃏|💀|⏩|🎲|📍|⚡).*?<span style="display:none;">[\s\S]*?<\/span>\s*$/;
        return text.replace(regex, '').trim();
    }

    function getSettings() {
        const { extensionSettings } = SillyTavern.getContext();
        if (!extensionSettings[MODULE_NAME]) {
            extensionSettings[MODULE_NAME] = structuredClone(DEFAULT_SETTINGS);
        }
        const s = extensionSettings[MODULE_NAME];
        if (typeof s.btnTimeSkip === 'undefined') s.btnTimeSkip = true;
        if (typeof s.useCustomApi === 'undefined') s.useCustomApi = false;
        if (!s.customApiUrl) s.customApiUrl = '';
        if (typeof s.customApiKey === 'undefined') s.customApiKey = '';
        if (typeof s.customApiModel === 'undefined') s.customApiModel = '';
        return extensionSettings[MODULE_NAME];
    }

    function saveSettings() {
        SillyTavern.getContext().saveSettingsDebounced();
        updateToolbarVisibility();
    }

    // =======================================================
    // ДВИЖОК УМНОЙ И БЕЗОПАСНОЙ ГЕНЕРАЦИИ (FAST PROMPT API)
    // =======================================================
    async function runMainGen(promptText) {
        const ctx = SillyTavern.getContext();
        // @ts-ignore
        if (typeof ctx.generateQuietPrompt === 'function') {
            // @ts-ignore
            return await ctx.generateQuietPrompt(promptText);
        } else if (typeof window['generateQuietPrompt'] === 'function') {
            return await window['generateQuietPrompt'](promptText);
        } else {
            throw new Error("Функция генерации Таверны не найдена.");
        }
    }

    async function generateEnhanceFast(promptText) {
        const s = getSettings();
        if (s.useCustomApi && s.customApiUrl && s.customApiModel) {
            try {
                const baseUrl = s.customApiUrl.replace(/\/$/, '');
                const endpoint = baseUrl + '/chat/completions';
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${s.customApiKey || ''}`
                    },
                    body: JSON.stringify({
                        model: s.customApiModel,
                        messages: [
                            { role: 'system', content: 'You are an internal assistant. Follow the instructions strictly and output only the required data.' },
                            { role: 'user', content: promptText }
                        ],
                        temperature: 0.7,
                        max_tokens: 4000,
                        stream: false
                    })
                });
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                const content = data?.choices?.[0]?.message?.content || "";
                if (!content.trim()) throw new Error("Прокси вернул пустоту.");
                return content;
            } catch (e) {
                console.warn(`[BB Enhance] Ошибка кастомного API (${e.message}), перехват на основной API...`);
                return await runMainGen(promptText);
            }
        } else {
            return await runMainGen(promptText);
        }
    }

    // === ГЕНЕРАЦИЯ ENHANCE И IMPROVE ===
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
            // ВЫТАСКИВАЕМ КОНТЕКСТ ВРУЧНУЮ ДЛЯ КАСТОМНОГО API
            const ctx = SillyTavern.getContext();
            const chat = ctx.chat;
            const recentMessages = chat && chat.length > 0 ? chat.slice(-4).map(m => `${m.name}: ${m.mes}`).join('\\n\\n') : '';

            let promptRaw = TEMPLATES[type].replace('{{input}}', inputText).replace(/\{\{lastMessage\}\}/g, recentMessages);
            let finalPrompt = promptRaw;

            // @ts-ignore
            if (typeof window.substituteParams === 'function') finalPrompt = await window.substituteParams(promptRaw);
            // @ts-ignore
            else if (typeof window.substituteParamsExtended === 'function') finalPrompt = await window.substituteParamsExtended(promptRaw);

            // ИСПОЛЬЗУЕМ FAST API
            let result = await generateEnhanceFast(finalPrompt);

            const resultStr = String(result).trim();
            if (result === undefined || result === null || resultStr === '' || resultStr === 'undefined' || resultStr === 'null') {
                // @ts-ignore
                toastr.error('Ошибка генерации: API вернуло пустой ответ.', 'BB Enhance');
                return;
            }

            let cleanResult = resultStr;
            cleanResult = cleanResult.replace(/<think>[\s\S]*?<\/think>/gi, '');
            cleanResult = cleanResult.replace(/<\/?think[^>]*>/gi, '');
            cleanResult = cleanResult.replace(/<info>[\s\S]*?<\/info>/gi, ''); 
            cleanResult = cleanResult.replace(/::[A-Z_]+_START::[\s\S]*?::[A-Z_]+_END::/gi, '');
            cleanResult = cleanResult.replace(/※SCENE:[^※]*※/gi, '');
            cleanResult = cleanResult.replace(/※\/SCENE※/gi, '');
            cleanResult = cleanResult.replace(/⟦[A-Za-zА-Яа-яЁё\s_]+:[^⟧]*⟧/gi, '');
            cleanResult = cleanResult.replace(/⟦\/[A-Za-zА-Яа-яЁё\s_]+⟧/gi, '');

            cleanResult = cleanResult.trim();
            if(cleanResult.startsWith('"') && cleanResult.endsWith('"')) {
                cleanResult = cleanResult.slice(1, -1).trim();
            }
            
            if (cleanResult.length > 0) {
                ta.value = cleanResult; 
                ta.dispatchEvent(new Event('input', { bubbles: true })); 
                // @ts-ignore
                toastr.success('Готово!', 'BB Director');
            } else {
                ta.value = resultStr; 
                ta.dispatchEvent(new Event('input', { bubbles: true })); 
                // @ts-ignore
                toastr.warning('Фильтр удалил всё. Возвращен сырой текст!', 'BB Director');
            }
            
        } catch (err) {
            console.error(err);
            // @ts-ignore
            toastr.error('Ошибка: ' + (err.message || String(err)), 'BB Enhance');
        } finally {
            btnElement.classList.remove('loading');
            btnElement.innerHTML = oldHtml;
        }
    }

    // === КУБИК (DICE) ===
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
                    if(cubeEl) cubeEl.classList.add('stopped'); 
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
        const ta = document.getElementById('send_textarea');
        // @ts-ignore
        const inputText = ta ? ta.value.trim() : '';
        let targetText = ''; let isPreSend = false; let lastUserIndex = -1;

        if (inputText) { targetText = inputText; isPreSend = true; } 
        else {
            if (!chat || chat.length === 0) return;
            for (let i = chat.length - 1; i >= 0; i--) { if (chat[i].is_user) { lastUserIndex = i; break; } }
            if (lastUserIndex === -1) return;
            targetText = removeExtensionCues(chat[lastUserIndex].mes);
        }
        
        btnElement.classList.add('loading');
        const oldHtml = btnElement.innerHTML; btnElement.innerHTML = `⏳ <span>Бросок...</span>`;

        try {
            const prompt = `[TASK]\nRead the user's action: """${targetText}"""\nFormulate a single, short dramatic question describing the skill check they are attempting.\nRules:\n- Strictly in Russian.\n- Max 8-10 words.\n- Output ONLY the question, nothing else. No intro, no quotes.`;
            
            // ИСПОЛЬЗУЕМ FAST API ДЛЯ ФОРМИРОВАНИЯ ВОПРОСА
            let actionQuestion = await generateEnhanceFast(prompt);
            const qStr = String(actionQuestion).trim();
            if (!qStr || qStr === 'undefined' || qStr === 'null') throw new Error("Пустой ответ API");

            actionQuestion = qStr.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<\/?think[^>]*>/gi, '').trim();
            if(actionQuestion.startsWith('"')) actionQuestion = actionQuestion.slice(1, -1);
            if(!actionQuestion || actionQuestion.length > 100) actionQuestion = "Удастся ли задуманное действие?";

            btnElement.classList.remove('loading'); btnElement.innerHTML = oldHtml;

            const dc = Math.floor(Math.random() * 7) + 10; 
            const roll = Math.floor(Math.random() * 20) + 1; 
            
            let outcomeType = ''; let outcomeText = ''; let outcomeColor = '';
            if (roll === 20) { outcomeType = 'roll_crit_success'; outcomeText = 'КРИТИЧЕСКИЙ УСПЕХ'; outcomeColor = '#d4af37'; }
            else if (roll === 1) { outcomeType = 'roll_crit_failure'; outcomeText = 'КРИТИЧЕСКИЙ ПРОВАЛ'; outcomeColor = '#dc2626'; }
            else if (roll >= dc) { outcomeType = 'roll_success'; outcomeText = 'УСПЕХ'; outcomeColor = '#10b981'; }
            else { outcomeType = 'roll_failure'; outcomeText = 'ПРОВАЛ'; outcomeColor = '#f97316'; }

            await showDiceModal(actionQuestion, dc, roll, outcomeText, outcomeColor);

            const cue = BOT_CUES[outcomeType].replace(/{{dc}}/g, String(dc)).replace(/{{roll}}/g, String(roll)).replace(/{{question}}/g, actionQuestion);

            // ОТВЕТ БОТА ГЕНЕРИРУЕТСЯ СТАНДАРТНО ЧЕРЕЗ ТАВЕРНУ (send_but/swipe_right)
            if (isPreSend) {
                // @ts-ignore
                ta.value = removeExtensionCues(targetText) + cue; ta.dispatchEvent(new Event('input', { bubbles: true }));
                document.getElementById('send_but')?.click();
            } else {
                const cleanedText = removeExtensionCues(chat[lastUserIndex].mes); chat[lastUserIndex].mes = cleanedText + cue;
                const isLastMsgBot = !chat[chat.length - 1].is_user;
                if (isLastMsgBot) {
                    const swipeRightBtn = document.querySelector('.last_mes .swipe_right');
                    // @ts-ignore
                    if (swipeRightBtn) swipeRightBtn.click(); else document.getElementById('send_but')?.click();
                } else { document.getElementById('send_but')?.click(); }
            }
        } catch (err) {
            console.error(err); btnElement.classList.remove('loading'); btnElement.innerHTML = oldHtml;
            // @ts-ignore
            toastr.error('Ошибка Кубика: ' + (err.message || String(err)), 'BB Dice');
        }
    }

    // === РЕЖИССЕР (DIRECTOR) ===
    async function handleBotGeneration(type) {
        const chat = SillyTavern.getContext().chat;
        const ta = document.getElementById('send_textarea');
        // @ts-ignore
        const inputText = ta ? ta.value.trim() : '';

        const cue = BOT_CUES[type];

        // ОТВЕТ БОТА ГЕНЕРИРУЕТСЯ СТАНДАРТНО ЧЕРЕЗ ТАВЕРНУ (send_but/swipe_right)
        if (inputText) {
            // @ts-ignore
            ta.value = removeExtensionCues(inputText) + cue; ta.dispatchEvent(new Event('input', { bubbles: true }));
            document.getElementById('send_but')?.click();
        } else {
            if (!chat || chat.length === 0) return;
            let lastUserIndex = -1;
            for (let i = chat.length - 1; i >= 0; i--) { if (chat[i].is_user) { lastUserIndex = i; break; } }
            if (lastUserIndex === -1) return;

            const cleanedText = removeExtensionCues(chat[lastUserIndex].mes); chat[lastUserIndex].mes = cleanedText + cue;

            const isLastMsgBot = !chat[chat.length - 1].is_user;
            if (isLastMsgBot) {
                const swipeRightBtn = document.querySelector('.last_mes .swipe_right');
                // @ts-ignore
                if (swipeRightBtn) swipeRightBtn.click(); else document.getElementById('send_but')?.click();
            } else { document.getElementById('send_but')?.click(); }
        }
    }

    function renderPopupVibes() {
        return `
            <div class="bb-eg-popup-header">Выберите событие</div>
            <button class="bb-eg-vibe-btn" data-vibe="dir_disaster">💥 Disaster (Опасность)</button>
            <button class="bb-eg-vibe-btn" data-vibe="dir_blessing">🎁 Blessing (Удача)</button>
            <button class="bb-eg-vibe-btn" data-vibe="dir_tension">❤️ Tension (Напряжение)</button>
            <button class="bb-eg-vibe-btn" data-vibe="dir_absurd">🃏 Absurd (Комедия)</button>
            <button class="bb-eg-vibe-btn" style="border-top: 1px dashed rgba(255, 255, 255, 0.1); margin-top: 4px; color: #ef4444;" data-vibe="dir_tragedy">💀 Tragedy (Трагедия)</button>
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
            e.preventDefault(); e.stopPropagation(); isPopupOpen = !isPopupOpen;
            if (isPopupOpen) { popup.innerHTML = renderPopupVibes(); popup.classList.add('show'); } else { popup.classList.remove('show'); }
        };

        popup.onclick = (e) => {
            e.stopPropagation();
            // @ts-ignore
            const target = e.target.closest('button'); if (!target) return;

            if (target.classList.contains('bb-eg-vibe-btn')) { activeDirectorVibe = target.getAttribute('data-vibe'); popup.innerHTML = renderPopupTargets(); } 
            else if (target.classList.contains('bb-eg-back-btn')) { popup.innerHTML = renderPopupVibes(); }
            else if (target.classList.contains('bb-eg-target-btn')) {
                const targetType = target.getAttribute('data-target'); popup.classList.remove('show'); isPopupOpen = false;
                if (targetType === 'me') handleGeneration(activeDirectorVibe, mainBtn); else if (targetType === 'bot') handleBotGeneration(activeDirectorVibe);
            }
        };
        wrap.appendChild(mainBtn); wrap.appendChild(popup); return wrap;
    }

    document.addEventListener('click', (e) => {
        const wrap = document.getElementById('bb-eg-director-wrap'); const popup = document.getElementById('bb-eg-popup');
        // @ts-ignore
        if (isPopupOpen && wrap && !wrap.contains(e.target)) { isPopupOpen = false; popup.classList.remove('show'); }
    });

    // === FAST TRAVEL ===
    async function handleFastTravel(btnElement) {
        const ta = document.getElementById('send_textarea');
        // @ts-ignore
        const inputText = ta ? ta.value.trim() : '';

        btnElement.classList.add('loading');
        const oldHtml = btnElement.innerHTML; btnElement.innerHTML = `⏳ <span>Скан...</span>`;

        try {
            // ВЫТАСКИВАЕМ КОНТЕКСТ ВРУЧНУЮ ДЛЯ КАСТОМНОГО API
            const ctx = SillyTavern.getContext();
            const chat = ctx.chat;
            const recentMessages = chat && chat.length > 0 ? chat.slice(-4).map(m => `${m.name}: ${m.mes}`).join('\\n\\n') : '';

            let promptRaw = TEMPLATES.ft_analyzer.replace('{{input}}', inputText).replace(/\{\{lastMessage\}\}/g, recentMessages);
            let finalPrompt = promptRaw;

            // @ts-ignore
            if (typeof window.substituteParams === 'function') finalPrompt = await window.substituteParams(promptRaw);
            // @ts-ignore
            else if (typeof window.substituteParamsExtended === 'function') finalPrompt = await window.substituteParamsExtended(promptRaw);

            // ИСПОЛЬЗУЕМ FAST API ДЛЯ АНАЛИЗА
            let result = await generateEnhanceFast(finalPrompt);
            
            const data = extractJSON(result);
            showFastTravelModal(data);
            
        } catch (err) { 
            console.error(err); 
            // @ts-ignore
            toastr.error('Ошибка Fast Travel: ' + err.message, 'BB FT'); 
        } finally { 
            btnElement.classList.remove('loading'); btnElement.innerHTML = oldHtml; 
        }
    }

    function showFastTravelModal(data) {
        const overlay = document.createElement('div'); overlay.className = 'bb-ft-overlay';
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

        const closeModal = () => { overlay.style.opacity = '0'; setTimeout(() => overlay.remove(), 400); };
        const closeBtn = overlay.querySelector('#bb-ft-close'); if (closeBtn) closeBtn.addEventListener('click', closeModal);

        const executeTravel = (loc, hook, time) => {
            closeModal(); const chat = SillyTavern.getContext().chat; const ta = document.getElementById('send_textarea');
            // @ts-ignore
            const inputText = ta ? ta.value.trim() : '';
            let cue = (loc && hook) ? BOT_CUES.ft_travel_specific.replace(/{{loc}}/g, loc).replace(/{{hook}}/g, hook).replace(/{{time}}/g, time || 'неизвестно') : BOT_CUES.ft_travel_surprise;

            if (inputText) {
                // @ts-ignore
                ta.value = removeExtensionCues(inputText) + cue; ta.dispatchEvent(new Event('input', { bubbles: true })); document.getElementById('send_but')?.click();
            } else {
                if (!chat || chat.length === 0) return;
                let lastUserIndex = -1; for (let i = chat.length - 1; i >= 0; i--) { if (chat[i].is_user) { lastUserIndex = i; break; } }
                if (lastUserIndex === -1) return;

                const cleanedText = removeExtensionCues(chat[lastUserIndex].mes); chat[lastUserIndex].mes = cleanedText + cue;
                const isLastMsgBot = !chat[chat.length - 1].is_user;
                if (isLastMsgBot) { const swipeRightBtn = document.querySelector('.last_mes .swipe_right'); 
                // @ts-ignore
                if (swipeRightBtn) swipeRightBtn.click(); else document.getElementById('send_but')?.click(); } 
                else { document.getElementById('send_but')?.click(); }
            }
        };

        const cards = overlay.querySelectorAll('.bb-ft-card');
        cards.forEach(card => { card.addEventListener('click', () => { executeTravel(card.getAttribute('data-loc'), card.getAttribute('data-hook'), card.getAttribute('data-time')); }); });
        const surpriseBtn = overlay.querySelector('#bb-ft-btn-surprise');
        if (surpriseBtn) { surpriseBtn.addEventListener('click', () => executeTravel(null, null, null)); }
    }

    // === TIME SKIP ===
    async function handleTimeSkip(btnElement) {
        const ta = document.getElementById('send_textarea');
        // @ts-ignore
        const inputText = ta ? ta.value.trim() : '';

        btnElement.classList.add('loading');
        const oldHtml = btnElement.innerHTML; btnElement.innerHTML = `⏳ <span>Анализ...</span>`;

        try {
            // ВЫТАСКИВАЕМ КОНТЕКСТ ВРУЧНУЮ ДЛЯ КАСТОМНОГО API
            const ctx = SillyTavern.getContext();
            const chat = ctx.chat;
            const recentMessages = chat && chat.length > 0 ? chat.slice(-4).map(m => `${m.name}: ${m.mes}`).join('\\n\\n') : '';

            let promptRaw = TEMPLATES.ts_analyzer.replace(/\{\{lastMessage\}\}/g, recentMessages);
            let finalPrompt = promptRaw;

            // @ts-ignore
            if (typeof window.substituteParams === 'function') finalPrompt = await window.substituteParams(promptRaw);
            // @ts-ignore
            else if (typeof window.substituteParamsExtended === 'function') finalPrompt = await window.substituteParamsExtended(promptRaw);

            // ИСПОЛЬЗУЕМ FAST API ДЛЯ АНАЛИЗА
            let result = await generateEnhanceFast(finalPrompt);
            
            const data = extractJSON(result);
            showTimeSkipModal(data);
            
        } catch (err) { 
            console.error(err); 
            // @ts-ignore
            toastr.error('Ошибка Time Skip: ' + err.message, 'BB TS'); 
        } finally { 
            btnElement.classList.remove('loading'); btnElement.innerHTML = oldHtml; 
        }
    }

    function showTimeSkipModal(data) {
        const overlay = document.createElement('div'); overlay.className = 'bb-ts-overlay';
        let contentHtml = '';
        
        if (data.can_skip === false) {
            contentHtml = `
                <div class="bb-ts-modal denied">
                    <div class="bb-ts-title">🚫 СКИП НЕВОЗМОЖЕН</div>
                    <div class="bb-ts-reason">«${data.lock_reason || 'События слишком важны, чтобы их пропускать.'}»</div>
                    <button class="bb-ts-close" id="bb-ts-close">Ясно</button>
                </div>
            `;
        } else {
            let cardsHtml = '';
            if (data.options && Array.isArray(data.options)) {
                data.options.forEach(opt => {
                    const safeTitle = (opt.title || '').replace(/"/g, '&quot;'); 
                    const safeSummary = (opt.summary || '').replace(/"/g, '&quot;'); 
                    const safeTime = (opt.time || '').replace(/"/g, '&quot;');
                    cardsHtml += `
                        <div class="bb-ts-card" data-title="${safeTitle}" data-summary="${safeSummary}" data-time="${safeTime}">
                            <div class="bb-ts-card-header">
                                <span class="bb-ts-dest">${safeTitle}</span>
                                <span class="bb-ts-time"><i class="fa-solid fa-hourglass-half"></i> ${safeTime}</span>
                            </div>
                            <div class="bb-ts-hook">${safeSummary}</div>
                        </div>
                    `;
                });
            }
            contentHtml = `
                <div class="bb-ts-modal">
                    <div class="bb-ts-title">⏩ ТАЙМСКИП (ВЫБОР ГЛАВЫ)</div>
                    <div class="bb-ts-grid">${cardsHtml}</div>
                    <button class="bb-ts-close" id="bb-ts-close" style="margin-top: 10px; background: transparent; color: #a78bfa; border: 1px solid #4c1d95;">Отмена</button>
                </div>
            `;
        }

        overlay.innerHTML = contentHtml; document.body.appendChild(overlay); requestAnimationFrame(() => overlay.style.opacity = '1');

        const closeModal = () => { overlay.style.opacity = '0'; setTimeout(() => overlay.remove(), 400); };
        const closeBtn = overlay.querySelector('#bb-ts-close'); if (closeBtn) closeBtn.addEventListener('click', closeModal);

        const executeSkip = (title, summary, time) => {
            closeModal(); const chat = SillyTavern.getContext().chat; const ta = document.getElementById('send_textarea');
            // @ts-ignore
            const inputText = ta ? ta.value.trim() : '';
            let cue = BOT_CUES.ts_specific.replace(/{{title}}/g, title).replace(/{{summary}}/g, summary).replace(/{{time}}/g, time);

            if (inputText) {
                // @ts-ignore
                ta.value = removeExtensionCues(inputText) + cue; ta.dispatchEvent(new Event('input', { bubbles: true })); document.getElementById('send_but')?.click();
            } else {
                if (!chat || chat.length === 0) return;
                let lastUserIndex = -1; for (let i = chat.length - 1; i >= 0; i--) { if (chat[i].is_user) { lastUserIndex = i; break; } }
                if (lastUserIndex === -1) return;

                const cleanedText = removeExtensionCues(chat[lastUserIndex].mes); chat[lastUserIndex].mes = cleanedText + cue;
                const isLastMsgBot = !chat[chat.length - 1].is_user;
                if (isLastMsgBot) { const swipeRightBtn = document.querySelector('.last_mes .swipe_right'); 
                // @ts-ignore
                if (swipeRightBtn) swipeRightBtn.click(); else document.getElementById('send_but')?.click(); } 
                else { document.getElementById('send_but')?.click(); }
            }
        };

        const cards = overlay.querySelectorAll('.bb-ts-card');
        cards.forEach(card => { card.addEventListener('click', () => { executeSkip(card.getAttribute('data-title'), card.getAttribute('data-summary'), card.getAttribute('data-time')); }); });
    }

    // === ИНЖЕКТ ПАНЕЛИ И КНОПОК ===
    function updateToolbarVisibility() {
        const s = getSettings();
        const btnE = document.getElementById('bb-eg-btn-enhance'); if (btnE) btnE.style.display = s.btnEnhance ? 'flex' : 'none';
        const btnI = document.getElementById('bb-eg-btn-improve'); if (btnI) btnI.style.display = s.btnImprove ? 'flex' : 'none';
        const wrapD = document.getElementById('bb-eg-director-wrap'); if (wrapD) wrapD.style.display = s.btnDirector ? 'block' : 'none';
        const btnDice = document.getElementById('bb-eg-btn-dice'); if (btnDice) btnDice.style.display = s.btnDice ? 'flex' : 'none';
        const btnFT = document.getElementById('bb-eg-btn-ft'); if (btnFT) btnFT.style.display = s.btnFastTravel ? 'flex' : 'none';
        const btnTS = document.getElementById('bb-eg-btn-ts'); if (btnTS) btnTS.style.display = s.btnTimeSkip ? 'flex' : 'none';
        
        const wrapper = document.getElementById('bb-enhance-wrapper');
        const hasAny = s.btnEnhance || s.btnImprove || s.btnDirector || s.btnDice || s.btnFastTravel || s.btnTimeSkip;
        if (wrapper) wrapper.style.display = hasAny ? 'inline-flex' : 'none';
    }

    function injectToolbar() {
        if (document.getElementById('bb-enhance-wrapper')) return;

        const wrapper = document.createElement('div'); wrapper.id = 'bb-enhance-wrapper';
        const toggleBtn = document.createElement('div'); toggleBtn.id = 'bb-eg-toggle-btn'; toggleBtn.innerHTML = 'E'; toggleBtn.title = 'BB Enhance Panel';
        const toolbar = document.createElement('div'); toolbar.id = 'bb-enhance-toolbar';

        const btnE = document.createElement('button'); btnE.className = 'bb-eg-btn'; btnE.id = 'bb-eg-btn-enhance'; btnE.innerHTML = '✨ Enhance';
        btnE.onclick = (e) => { e.preventDefault(); handleGeneration('enhance', btnE); }; toolbar.appendChild(btnE);

        const btnI = document.createElement('button'); btnI.className = 'bb-eg-btn'; btnI.id = 'bb-eg-btn-improve'; btnI.innerHTML = '🔮 Improve';
        btnI.onclick = (e) => { e.preventDefault(); handleGeneration('improve', btnI); }; toolbar.appendChild(btnI);

        toolbar.appendChild(buildDirectorPopup());

        const btnDice = document.createElement('button'); btnDice.className = 'bb-eg-btn'; btnDice.id = 'bb-eg-btn-dice'; btnDice.innerHTML = '🎲 Action Roll';
        btnDice.onclick = (e) => { e.preventDefault(); handleSkillCheck(btnDice); }; toolbar.appendChild(btnDice);

        const btnFT = document.createElement('button'); btnFT.className = 'bb-eg-btn'; btnFT.id = 'bb-eg-btn-ft'; btnFT.innerHTML = '📍 Fast Travel';
        btnFT.onclick = (e) => { e.preventDefault(); handleFastTravel(btnFT); }; toolbar.appendChild(btnFT);

        const btnTS = document.createElement('button'); btnTS.className = 'bb-eg-btn'; btnTS.id = 'bb-eg-btn-ts'; btnTS.innerHTML = '⏩ Time Skip';
        btnTS.onclick = (e) => { e.preventDefault(); handleTimeSkip(btnTS); }; toolbar.appendChild(btnTS);

        wrapper.appendChild(toggleBtn); wrapper.appendChild(toolbar);

        const optionsBtn = document.getElementById('options_button');
        if (optionsBtn && optionsBtn.parentNode) { optionsBtn.parentNode.insertBefore(wrapper, optionsBtn.nextSibling); } 
        else { const sendForm = document.getElementById('send_form'); if (sendForm && sendForm.parentNode) sendForm.parentNode.insertBefore(wrapper, sendForm); }

        let isMenuOpen = false; 
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); isMenuOpen = !isMenuOpen;
            if (isMenuOpen) { toolbar.classList.add('expanded'); toggleBtn.classList.add('active'); } 
            else { toolbar.classList.remove('expanded'); toggleBtn.classList.remove('active'); }
        });

        document.addEventListener('click', (e) => {
            // @ts-ignore
            if (isMenuOpen && !wrapper.contains(e.target)) { isMenuOpen = false; toolbar.classList.remove('expanded'); toggleBtn.classList.remove('active'); }
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
                <div class="inline-drawer-content" style="padding: 10px;">
                    <div class="bb-eg-settings-panel" style="display: flex; flex-direction: column; gap: 8px;">
                        <label class="checkbox_label"><input type="checkbox" id="bb-eg-cfg-enhance" ${s.btnEnhance ? 'checked' : ''}> <span>Показать [✨ Enhance]</span></label>
                        <label class="checkbox_label"><input type="checkbox" id="bb-eg-cfg-improve" ${s.btnImprove ? 'checked' : ''}> <span>Показать [🔮 Improve]</span></label>
                        <label class="checkbox_label"><input type="checkbox" id="bb-eg-cfg-director" ${s.btnDirector ? 'checked' : ''}> <span>Показать [🎬 Event Director]</span></label>
                        <label class="checkbox_label"><input type="checkbox" id="bb-eg-cfg-dice" ${s.btnDice ? 'checked' : ''}> <span>Показать [🎲 Action Roll]</span></label>
                        <label class="checkbox_label"><input type="checkbox" id="bb-eg-cfg-ft" ${s.btnFastTravel ? 'checked' : ''}> <span>Показать [📍 Fast Travel]</span></label>
                        <label class="checkbox_label"><input type="checkbox" id="bb-eg-cfg-ts" ${s.btnTimeSkip ? 'checked' : ''}> <span>Показать [⏩ Time Skip]</span></label>
                    </div>

                    <hr style="border-color: rgba(255,255,255,0.1); margin: 10px 0;">
                
                    <span style="font-size: 13px; color: #cbd5e1; font-weight:bold;">⚡ Custom API (Для быстрой генерации):</span>
                    <label class="checkbox_label" style="margin-top: 5px;">
                        <input type="checkbox" id="bb-eg-cfg-usecustom" ${s.useCustomApi ? 'checked' : ''}>
                        <span>Использовать свой API-ключ</span>
                    </label>
                    
                    <div id="bb-eg-custom-api-block" style="display: ${s.useCustomApi ? 'flex' : 'none'}; flex-direction: column; gap: 8px; margin-top: 8px; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">
                        <input type="text" id="bb-eg-cfg-url" class="text_pole" placeholder="URL: http://example:1234/v1" value="${s.customApiUrl || ''}">
                        <input type="password" id="bb-eg-cfg-key" class="text_pole" placeholder="API Ключ" value="${s.customApiKey || ''}">
                        <button id="bb-eg-btn-connect" class="menu_button"><i class="fa-solid fa-plug"></i>&nbsp; Подключиться / Обновить</button>
                        <select id="bb-eg-cfg-model" class="text_pole" ${!s.customApiModel ? 'disabled' : ''}>
                            <option value="${s.customApiModel || ''}">${s.customApiModel || 'Модели не загружены'}</option>
                        </select>
                        <span style="font-size: 10px; color: #94a3b8; line-height: 1.2;">* Работает по стандарту OpenAI. Идеально для Flash-моделей.</span>
                    </div>
                </div>
            </div>
        `;

        const target = document.querySelector("#extensions_settings2") || document.querySelector("#extensions_settings");
        if (target) {
            target.insertAdjacentHTML('beforeend', html);
            
            const toggles = ['enhance', 'improve', 'director', 'dice', 'ft', 'ts'];
            toggles.forEach(t => {
                document.getElementById(`bb-eg-cfg-${t}`).addEventListener('change', (e) => { 
                    // @ts-ignore
                    getSettings()[`btn${t.charAt(0).toUpperCase() + t.slice(1).replace('ft','FastTravel').replace('ts','TimeSkip')}`] = e.target.checked; saveSettings(); 
                });
            });

            // Настройки кастомного API
            $('#bb-eg-cfg-usecustom').on('change', function() {
                const isChecked = $(this).is(':checked');
                getSettings().useCustomApi = isChecked;
                if (isChecked) $('#bb-eg-custom-api-block').slideDown(200);
                else $('#bb-eg-custom-api-block').slideUp(200);
                saveSettings();
            });

            $('#bb-eg-cfg-url, #bb-eg-cfg-key').on('change input', function() {
                getSettings().customApiUrl = $('#bb-eg-cfg-url').val();
                getSettings().customApiKey = $('#bb-eg-cfg-key').val();
                saveSettings();
            });
            
            $(document).on('change', '#bb-eg-cfg-model', function() {
                getSettings().customApiModel = $(this).val();
                saveSettings();
            });

            $('#bb-eg-btn-connect').on('click', async function() {
                const btn = $(this);
                // @ts-ignore
                const url = $('#bb-eg-cfg-url').val().replace(/\/$/, '');
                const key = $('#bb-eg-cfg-key').val();
                btn.html('<i class="fa-solid fa-spinner fa-spin"></i>&nbsp; Подключение...');

                try {
                    const response = await fetch(url + '/models', {
                        method: 'GET', headers: { 'Authorization': `Bearer ${key}` }
                    });
                    if (!response.ok) throw new Error(`Ошибка ${response.status}`);
                    const data = await response.json();
                    
                    if (data && data.data && Array.isArray(data.data)) {
                        const select = $('#bb-eg-cfg-model');
                        select.empty();
                        data.data.forEach(m => select.append(`<option value="${m.id}">${m.id}</option>`));
                        select.prop('disabled', false);
                        
                        if (getSettings().customApiModel && select.find(`option[value="${getSettings().customApiModel}"]`).length) {
                            select.val(getSettings().customApiModel);
                        } else {
                            getSettings().customApiModel = select.val();
                        }
                        // @ts-ignore
                        toastr.success("Модели загружены!", "BB Enhance");
                        saveSettings();
                    } else throw new Error("Нет моделей.");
                } catch (e) {
                    console.error(e);
                    // @ts-ignore
                    toastr.error(`Ошибка: ${e.message}`, "BB Enhance");
                } finally {
                    btn.html('<i class="fa-solid fa-plug"></i>&nbsp; Подключиться / Обновить');
                }
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
