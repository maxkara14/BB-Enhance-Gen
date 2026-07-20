(function () {
    'use strict';
    const MODULE_NAME = "BB-Enhance-Gen";
    const VERSION = '1.1.4';
    const HISTORY_KEY = 'bb-enhance-gen.rollHistory';
    const HISTORY_MAX = 10;

    // Explicit setting key mapping (replaces fragile .replace() chains).
    const SETTING_KEYS = Object.freeze({
        enhance: 'btnEnhance',
        improve: 'btnImprove',
        director: 'btnDirector',
        dice: 'btnDice',
        ft: 'btnFastTravel',
        ts: 'btnTimeSkip',
    });

    const PLAYER_CONTEXT = `Player character name: {{user}}\nPlayer persona description (canonical, must not be contradicted):\n"""{{persona}}"""`;

    const PLAYER_IDENTITY_RULE = `CANONICAL PLAYER IDENTITY: {{user}} is the player/protagonist described in the Player persona description. Never change {{user}}'s race, age, role, appearance, equipment, backstory, or personality. If the narrative direction mentions {{user}} by name, it refers to this same player character, not a new NPC.`;

    const TEMPLATES = {
        enhance: `<context>\n${PLAYER_CONTEXT}\nScene details: {{authorsNote}}\nStory Summary: {{summary}}\nLast chat message: """{{lastMessage}}"""\n</context>\n\n<task>\nExpand the user's brief draft below into a rich, immersive, and highly detailed literary segment.\n</task>\n\n<rules>\n1. ${PLAYER_IDENTITY_RULE}\n2. Expand actions with deep sensory details (sight, sound, smell, texture).\n3. Describe {{user}}'s internal thoughts, micro-expressions, and physical sensations.\n4. Polish {{user}}'s spoken dialogue to align perfectly with their personality.\n5. ONLY expand the current moment. DO NOT advance the plot.\n6. DO NOT speak, act, or react for other characters.\n7. LENGTH BUDGET: Keep the output proportional to the draft. Do not exceed ~2x the original length. Prefer one tight, vivid pass over multiple repetitive paragraphs. Avoid restating the same beat with different words.\n8. You MAY use HTML formatting if it matches the chat style. Output ONLY the raw expanded story text. Absolutely no conversational filler, greetings, or meta-commentary. Do not use markdown code blocks (\`\`\`).\n</rules>\n\n<draft>\n{{input}}\n</draft>`,
        
        improve: `<context>\n${PLAYER_CONTEXT}\nLast chat message: """{{lastMessage}}"""\n</context>\n\n<task>\nEdit and polish the draft below to improve its literary flow, grammar, and phrasing.\n</task>\n\n<rules>\n1. ${PLAYER_IDENTITY_RULE}\n2. PARAPHRASE ONLY. Do not write new plot.\n3. DO NOT add new actions, thoughts, or dialogue that are not in the draft.\n4. DO NOT answer the previous message. DO NOT advance time.\n5. LENGTH BUDGET: Keep the output the EXACT SAME LENGTH as the original draft (±10%). Do not pad with extra descriptions.\n6. Preserve any HTML formatting or markdown. Do not use markdown code blocks (\`\`\`).\n7. Output ONLY the rewritten text. No conversational filler or commentary.\n</rules>\n\n<draft>\n{{input}}\n</draft>`,

        dir_disaster: `<context>\n${PLAYER_CONTEXT}\nCurrent chat character: {{char}}\nScene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n</context>\n\n<task>\nWrite the next segment of this story from the perspective of {{user}}. Introduce a DRAMATIC DISRUPTION, DANGER, or BAD EVENT.\n</task>\n\n<rules>\n1. ${PLAYER_IDENTITY_RULE}\n2. Do not introduce {{user}} as a stranger, new candidate, or different species if the context already contains them.\n3. Create a sharp conflict, physical danger, bad news, or painful memory.\n4. Use the current location and objects explicitly.\n5. STRICT IN-CHARACTER RULE: The event must be logically grounded in the setting. Other characters must react STRICTLY according to their established personalities. DO NOT break character logic.\n6. Keep it highly tense. DO NOT resolve the situation yet.\n7. Output ONLY the pure story text without meta-commentary.\n</rules>`,
        
        dir_blessing: `<context>\n${PLAYER_CONTEXT}\nCurrent chat character: {{char}}\nScene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n</context>\n\n<task>\nWrite the next segment of this story from the perspective of {{user}}. Introduce a BLESSING or GOOD EVENT.\n</task>\n\n<rules>\n1. ${PLAYER_IDENTITY_RULE}\n2. Do not introduce {{user}} as a stranger, new candidate, or different species if the context already contains them.\n3. Create an unexpected stroke of luck, deep comfort, or pleasant discovery.\n4. Use the current location and objects explicitly.\n5. STRICT IN-CHARACTER RULE: The blessing must be logical for the setting. Help from another character MUST perfectly match their established personality.\n6. Output ONLY the pure story text without meta-commentary.\n</rules>`,
        
        dir_tension: `<context>\n${PLAYER_CONTEXT}\nCurrent chat character: {{char}}\nScene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n</context>\n\n<task>\nWrite the next segment of this story from the perspective of {{user}}. Focus on TENSION or DEEP EMOTION.\n</task>\n\n<rules>\n1. ${PLAYER_IDENTITY_RULE}\n2. Do not introduce {{user}} as a stranger, new candidate, or different species if the context already contains them.\n3. RELATIONSHIP LOGIC: If {{user}} and the character are romantically involved, escalate passion and physical intimacy. If NOT involved, introduce a sudden spark of deep interest, a breathless awkward pause, or revealing micro-expression.\n4. Focus heavily on {{user}}'s heartbeat, breathing, and physical proximity.\n5. Keep the interaction STRICTLY In-Character.\n6. Output ONLY the pure story text without meta-commentary.\n</rules>`,
        
        dir_absurd: `<context>\n${PLAYER_CONTEXT}\nCurrent chat character: {{char}}\nScene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n</context>\n\n<task>\nWrite the next segment of this story from the perspective of {{user}}. Introduce an ABSURD or COMEDIC EVENT.\n</task>\n\n<rules>\n1. ${PLAYER_IDENTITY_RULE}\n2. Do not introduce {{user}} as a stranger, new candidate, or different species if the context already contains them.\n3. Create a ridiculous misunderstanding, clumsy mistake, or awkwardly funny situational irony.\n4. STRICT IN-CHARACTER RULE: The humor must not break character logic. Show how serious characters react NATURALLY to the absurdity.\n5. Output ONLY the pure story text without meta-commentary.\n</rules>`,

        dir_tragedy: `<context>\n${PLAYER_CONTEXT}\nCurrent chat character: {{char}}\nScene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n</context>\n\n<task>\nWrite the next segment of this story from the perspective of {{user}}. Introduce a TRAGIC EVENT or SEVERE EMOTIONAL DAMAGE.\n</task>\n\n<rules>\n1. ${PLAYER_IDENTITY_RULE}\n2. Do not introduce {{user}} as a stranger, new candidate, or different species if the context already contains them.\n3. Create a terrible revelation, an irreversible mistake, a painful loss, or deep despair.\n4. Characters must react STRICTLY In-Character. Do not resolve it easily.\n5. Output ONLY the pure story text without meta-commentary.\n</rules>`,

        dir_custom: `<context>\n${PLAYER_CONTEXT}\nCurrent chat character: {{char}}\nScene: {{authorsNote}}\nStory Summary: {{summary}}\nPrevious Context: """{{lastMessage}}"""\n</context>\n\n<task>\nWrite the next segment of this story from the perspective of {{user}}. Follow this NARRATIVE DIRECTION from the author:\n"""{{customDirection}}"""\n</task>\n\n<rules>\n1. ${PLAYER_IDENTITY_RULE}\n2. If the author's direction names {{user}}, treat that named person as the player/protagonist from the persona block, not as a newly invented NPC.\n3. Do not introduce {{user}} as a stranger, new candidate, or different species if the context already contains them.\n4. Follow the author's direction faithfully. Interpret it as a creative instruction for the next story beat.\n5. Use the current location, characters, and objects explicitly.\n6. STRICT IN-CHARACTER RULE: All characters must react according to their established personalities.\n7. Output ONLY the pure story text without meta-commentary.\n</rules>`,
        
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
        customApiModel: '',
        // New in 1.1.0
        showCuePreview: false,
        enableStreaming: false,
        defaultDifficulty: 'random', // 'easy' | 'normal' | 'hard' | 'epic' | 'random'
        askDifficultyEveryTime: false, // When true, Action Roll opens the difficulty picker each time; otherwise uses defaultDifficulty silently.
        // New in 1.1.1
        maxTokens: 1500, // [Legacy] kept only for one-time migration into per-purpose limits below.
        // New in 1.1.4 — per-purpose response length caps for Custom API.
        // Each: 0 = unlimited (max_tokens omitted), otherwise clamped to [64..8000].
        maxTokensDirector: 5000,  // Director → "Мне": full narrative segment.
        maxTokensEnhance: 1500,   // Enhance / Improve: polish a short draft.
        maxTokensContext: 2000,   // Fast Travel / Time Skip: small JSON answer.
        maxTokensMicro: 500,      // Action Roll question (one short line).
    };

    // === I18N ===
    const I18N = {
        ru: {
            btn_enhance: '✨ Enhance', btn_improve: '🔮 Improve', btn_director: '🎬 Event Director',
            btn_dice: '🎲 Action Roll', btn_ft: '📍 Fast Travel', btn_ts: '⏩ Time Skip',
            btn_history: '📜 История', toggle_title: 'BB Enhance Panel',
            loading: '⏳ Загрузка...', scanning: '⏳ Скан...', analyzing: '⏳ Анализ...', rolling: '⏳ Бросок...',
            toast_need_input: 'Сначала напиши текст в поле ввода!',
            toast_busy: 'Подождите, идёт генерация...',
            toast_done: 'Готово!', toast_empty_response: 'Ошибка генерации: API вернуло пустой ответ.',
            toast_filter_empty: 'Фильтр удалил всё. Возвращён сырой текст!',
            toast_custom_fallback: 'Custom API недоступен, используется основная модель.',
            toast_models_loaded: 'Модели загружены!', toast_err_dice: 'Ошибка Кубика: ',
            toast_err_ft: 'Ошибка Fast Travel: ', toast_err_ts: 'Ошибка Time Skip: ', toast_err_generic: 'Ошибка: ',
            dice_title: '🎲 Проверка Навыка', dice_dc: 'СЛОЖНОСТЬ:',
            outcome_crit_success: 'КРИТИЧЕСКИЙ УСПЕХ', outcome_success: 'УСПЕХ',
            outcome_failure: 'ПРОВАЛ', outcome_crit_failure: 'КРИТИЧЕСКИЙ ПРОВАЛ',
            diff_title: 'Выберите сложность броска', diff_easy: 'Лёгкая', diff_normal: 'Средняя',
            diff_hard: 'Сложная', diff_epic: 'Эпическая', diff_random: 'Случайная', diff_cancel: 'Отмена',
            dir_choose_event: 'Выберите событие', dir_choose_target: 'Куда направить?',
            dir_back: 'Назад', dir_to_me: 'Мне', dir_to_bot: 'Боту',
            dir_disaster: '💥 Disaster (Опасность)', dir_blessing: '🎁 Blessing (Удача)',
            dir_tension: '❤️ Tension (Напряжение)', dir_absurd: '🃏 Absurd (Комедия)',
            dir_tragedy: '💀 Tragedy (Трагедия)',
            dir_custom: '✏️ Своё',
            dir_custom_placeholder: 'Опишите направление для сюжета...',
            dir_custom_next: 'Далее',
            dir_custom_empty: 'Введите текст направления!',
            ft_title: '📍 БЫСТРОЕ ПЕРЕМЕЩЕНИЕ', ft_denied: '🚫 ДОСТУП ЗАКРЫТ',
            ft_denied_default: 'Вы не можете покинуть это место прямо сейчас.',
            ft_surprise: 'Случайное событие (Surprise me)', ft_cancel: 'Отмена', ft_ok: 'Понятно',
            ts_title: '⏩ ТАЙМСКИП (ВЫБОР ГЛАВЫ)', ts_denied: '🚫 СКИП НЕВОЗМОЖЕН',
            ts_denied_default: 'События слишком важны, чтобы их пропускать.',
            ts_cancel: 'Отмена', ts_ok: 'Ясно',
            preview_title: 'Превью cue',
            preview_desc: 'Этот скрытый текст будет добавлен к сообщению, чтобы направить бота:',
            preview_send: 'Отправить', preview_cancel: 'Отмена',
            history_title: '📜 История бросков', history_empty: 'История пуста.',
            history_clear: 'Очистить', history_close: 'Закрыть', history_dc: 'DC', history_roll: 'Бросок',
            set_extras_title: '🛠 Дополнительно:',
            set_show_preview: 'Показывать предпросмотр подсказки для бота',
            set_ask_diff_every_time: 'Каждый раз спрашивать сложность',
            set_max_tokens_group: 'Лимиты длины ответа (max_tokens) для Custom API',
            set_max_tokens_hint: '0 — без ограничения. Иначе значение зажимается в [64..8000]. Касается только Custom API.',
            set_max_tokens_director: '🎬 Режиссёр → «Мне» (художественный сегмент)',
            set_max_tokens_enhance: '✨🔮 Enhance / Improve',
            set_max_tokens_context: '⏩📍 Контекст-анализ (Fast Travel / Time Skip)',
            set_max_tokens_micro: '🎲 Микро (вопрос для броска кубика)',
            set_streaming: 'Включить стриминг для Custom API (Enhance/Improve)',
            set_default_diff: 'Сложность по умолчанию (Action Roll):',
            set_language: 'Язык интерфейса:',
            set_lang_auto: 'Авто', set_lang_ru: 'Русский', set_lang_en: 'English',
            set_security_warn: '⚠ API-ключ сохраняется в настройках в открытом виде.',
        },
        en: {
            btn_enhance: '✨ Enhance', btn_improve: '🔮 Improve', btn_director: '🎬 Event Director',
            btn_dice: '🎲 Action Roll', btn_ft: '📍 Fast Travel', btn_ts: '⏩ Time Skip',
            btn_history: '📜 History', toggle_title: 'BB Enhance Panel',
            loading: '⏳ Loading...', scanning: '⏳ Scanning...', analyzing: '⏳ Analyzing...', rolling: '⏳ Rolling...',
            toast_need_input: 'Type some text in the input field first!',
            toast_busy: 'Please wait, generation in progress...',
            toast_done: 'Done!', toast_empty_response: 'Generation error: API returned an empty response.',
            toast_filter_empty: 'Filter removed everything. Raw text restored!',
            toast_custom_fallback: 'Custom API unavailable, falling back to the main model.',
            toast_models_loaded: 'Models loaded!', toast_err_dice: 'Dice error: ',
            toast_err_ft: 'Fast Travel error: ', toast_err_ts: 'Time Skip error: ', toast_err_generic: 'Error: ',
            dice_title: '🎲 Skill Check', dice_dc: 'DIFFICULTY:',
            outcome_crit_success: 'CRITICAL SUCCESS', outcome_success: 'SUCCESS',
            outcome_failure: 'FAILURE', outcome_crit_failure: 'CRITICAL FAILURE',
            diff_title: 'Choose roll difficulty', diff_easy: 'Easy', diff_normal: 'Normal',
            diff_hard: 'Hard', diff_epic: 'Epic', diff_random: 'Random', diff_cancel: 'Cancel',
            dir_choose_event: 'Choose an event', dir_choose_target: 'Send to?',
            dir_back: 'Back', dir_to_me: 'To me', dir_to_bot: 'To bot',
            dir_disaster: '💥 Disaster', dir_blessing: '🎁 Blessing', dir_tension: '❤️ Tension',
            dir_absurd: '🃏 Absurd', dir_tragedy: '💀 Tragedy',
            dir_custom: '✏️ Custom',
            dir_custom_placeholder: 'Describe the narrative direction...',
            dir_custom_next: 'Next',
            dir_custom_empty: 'Enter direction text first!',
            ft_title: '📍 FAST TRAVEL', ft_denied: '🚫 ACCESS DENIED',
            ft_denied_default: 'You cannot leave this place right now.',
            ft_surprise: 'Random event (Surprise me)', ft_cancel: 'Cancel', ft_ok: 'Got it',
            ts_title: '⏩ TIME SKIP (CHOOSE A CHAPTER)', ts_denied: '🚫 SKIP IMPOSSIBLE',
            ts_denied_default: 'These events are too important to skip.',
            ts_cancel: 'Cancel', ts_ok: 'Got it',
            preview_title: 'Cue preview',
            preview_desc: 'This hidden text will be added to the message to direct the bot:',
            preview_send: 'Send', preview_cancel: 'Cancel',
            history_title: '📜 Roll History', history_empty: 'No history yet.',
            history_clear: 'Clear', history_close: 'Close', history_dc: 'DC', history_roll: 'Roll',
            set_extras_title: '🛠 Extras:',
            set_show_preview: 'Show a preview of the bot hint',
            set_ask_diff_every_time: 'Ask for difficulty every time',
            set_max_tokens_group: 'Response length caps (max_tokens) for Custom API',
            set_max_tokens_hint: '0 = unlimited. Otherwise clamped to [64..8000]. Applies only to Custom API.',
            set_max_tokens_director: '🎬 Director → "Me" (full narrative segment)',
            set_max_tokens_enhance: '✨🔮 Enhance / Improve',
            set_max_tokens_context: '⏩📍 Context analysis (Fast Travel / Time Skip)',
            set_max_tokens_micro: '🎲 Micro (dice-roll question)',
            set_streaming: 'Enable streaming for Custom API (Enhance/Improve)',
            set_default_diff: 'Default difficulty (Action Roll):',
            set_language: 'UI language:',
            set_lang_auto: 'Auto', set_lang_ru: 'Russian', set_lang_en: 'English',
            set_security_warn: '⚠ The API key is stored in plain text in settings.',
        },
    };

    function currentLang() {
        // UI language is auto-detected via navigator.language. No manual override —
        // most user-facing strings are localized, but bot-facing prompts/cues stay English.
        const nav = (typeof navigator !== 'undefined' && navigator.language) || 'en';
        return nav.toLowerCase().startsWith('ru') ? 'ru' : 'en';
    }
    function t(key) {
        const lang = currentLang();
        return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
    }

    // === STATE ===
    let isBusy = false;
    let activeDirectorVibe = null;
    let customDirectorText = '';
    let isPopupOpen = false;
    let customApiWarnedThisSession = false;
    let pendingBotResponse = false;

    // === UTILS ===
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    function escapeRegExp(str) {
        return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    function buildRecentContext() {
        const ctx = SillyTavern.getContext();
        const chat = ctx.chat;
        if (!chat || chat.length === 0) return '';
        return chat.slice(-8).map(m => `${m.name}: ${m.mes}`).join('\n\n');
    }
    async function substitutePromptMacros(promptRaw) {
        const ctx = SillyTavern.getContext();
        let finalPrompt = promptRaw;

        if (ctx && typeof ctx.substituteParams === 'function') {
            finalPrompt = await ctx.substituteParams(promptRaw);
        // @ts-ignore
        } else if (typeof window.substituteParams === 'function') {
            // @ts-ignore
            finalPrompt = await window.substituteParams(promptRaw);
        // @ts-ignore
        } else if (typeof window.substituteParamsExtended === 'function') {
            // @ts-ignore
            finalPrompt = await window.substituteParamsExtended(promptRaw);
        }

        if (/\{\{[^}]+\}\}/.test(finalPrompt)) {
            console.warn('[BB Enhance] Some macros were not substituted:', finalPrompt.match(/\{\{[^}]+\}\}/g));
        }

        console.debug('[BB Enhance] Final prompt sent to generation:', finalPrompt);
        return finalPrompt;
    }
    function stripLeadingUserName(text) {
        const ctx = SillyTavern.getContext();
        const userName = String(ctx?.name1 || '').trim();
        if (!text || !userName) return text;

        const escapedName = escapeRegExp(userName);
        const wrappers = `(?:\\*\\*|__|\\*|_|["'«»“”])?`;
        const namePrefix = `${wrappers}${escapedName}${wrappers}`;
        const patterns = [
            new RegExp(`^\\s*${namePrefix}\\s*(?:[:：]|[—–-])\\s*`, 'i'),
            new RegExp(`^\\s*${namePrefix}\\s*(?:\\r?\\n)+`, 'i'),
        ];

        let cleaned = text;
        for (const pattern of patterns) {
            cleaned = cleaned.replace(pattern, '');
        }
        return cleaned.trimStart();
    }
    async function withBusyLock(fn) {
        if (isBusy) {
            // @ts-ignore
            toastr.info(t('toast_busy'), 'BB Enhance');
            return;
        }
        isBusy = true;
        try { return await fn(); } finally { isBusy = false; }
    }
    function loadRollHistory() {
        try { const raw = localStorage.getItem(HISTORY_KEY); if (!raw) return [];
            const arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; }
        catch (_) { return []; }
    }
    function saveRollHistory(entry) {
        try { const history = loadRollHistory(); history.unshift(entry);
            while (history.length > HISTORY_MAX) history.pop();
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (e) { console.warn('[BB Enhance] Cannot save roll history:', e); }
    }
    function clearRollHistory() { try { localStorage.removeItem(HISTORY_KEY); } catch (_) {} }
    function fadeOutAndRemove(overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 400);
    }

    /**
     * Collapse whitespace left over by regex-based cleanups:
     *  - normalize CRLF/CR to LF
     *  - strip trailing spaces/tabs at end of every line
     *  - collapse 3+ consecutive newlines into exactly 2 (i.e. single blank line)
     *  - strip leading/trailing blank lines
     */
    function tidyWhitespace(str) {
        if (!str) return '';
        return String(str)
            .replace(/\r\n?/g, '\n')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/^\s+|\s+$/g, '');
    }

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
        const regex = /(?:\r?\n)*> (?:💥|🎁|❤️|🃏|💀|📝|⏩|🎲|📍|⚡).*?<span style="display:none;">[\s\S]*?<\/span>\s*$/;
        return text.replace(regex, '').trim();
    }

    function getSettings() {
        const { extensionSettings } = SillyTavern.getContext();
        if (!extensionSettings[MODULE_NAME]) {
            extensionSettings[MODULE_NAME] = structuredClone(DEFAULT_SETTINGS);
        }
        const s = extensionSettings[MODULE_NAME];
        // One-time migration: invert legacy 'skipDifficultyPicker' into 'askDifficultyEveryTime'.
        if (typeof s.skipDifficultyPicker !== 'undefined' && typeof s.askDifficultyEveryTime === 'undefined') {
            s.askDifficultyEveryTime = !s.skipDifficultyPicker;
        }
        if (typeof s.skipDifficultyPicker !== 'undefined') {
            try { delete s.skipDifficultyPicker; } catch (_) { s.skipDifficultyPicker = undefined; }
        }
        // One-time migration (1.1.4): old single 'maxTokens' -> 'maxTokensEnhance'.
        // (The user's old value was used for Enhance/Improve in practice — keep that meaning.)
        if (typeof s.maxTokens !== 'undefined' && typeof s.maxTokensEnhance === 'undefined') {
            s.maxTokensEnhance = s.maxTokens;
        }
        // Migrate / fill in any missing defaults (forward compatible).
        for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
            if (typeof s[k] === 'undefined') s[k] = v;
        }
        return s;
    }

    function saveSettings() {
        SillyTavern.getContext().saveSettingsDebounced();
        updateToolbarVisibility();
    }

    // =======================================================
    // === UI HELPERS: difficulty picker, cue preview, busy badge, roll history ===

    /**
     * Show a modal asking the user to pick roll difficulty.
     * @param {string} defaultDifficulty Difficulty highlighted as default.
     * @returns {Promise<string|null>} chosen difficulty or null if cancelled.
     */
    function pickDifficulty(defaultDifficulty) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'bb-modal-overlay bb-diff-overlay';
            overlay.style.opacity = '0';
            const def = defaultDifficulty || 'random';
            const opts = [
                { key: 'easy',   label: t('diff_easy'),   dc: 8 },
                { key: 'normal', label: t('diff_normal'), dc: 12 },
                { key: 'hard',   label: t('diff_hard'),   dc: 16 },
                { key: 'epic',   label: t('diff_epic'),   dc: 20 },
                { key: 'random', label: t('diff_random'), dc: '10-16' },
            ];
            const btns = opts.map(o => `<button class="bb-diff-btn${o.key === def ? ' default' : ''}" data-key="${o.key}">${escapeHtml(o.label)} <span class="bb-diff-dc">DC ${o.dc}</span></button>`).join('');
            overlay.innerHTML = `
                <div class="bb-modal-box bb-diff-box">
                    <div class="bb-modal-title">${escapeHtml(t('diff_title'))}</div>
                    <div class="bb-diff-grid">${btns}</div>
                    <button class="bb-modal-cancel" data-key="__cancel__">${escapeHtml(t('diff_cancel'))}</button>
                </div>`;
            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.style.opacity = '1');
            const close = (val) => { fadeOutAndRemove(overlay); resolve(val); };
            overlay.addEventListener('click', (ev) => {
                if (ev.target === overlay) { close(null); return; }
                // @ts-ignore
                const btn = ev.target.closest('button[data-key]'); if (!btn) return;
                const key = btn.getAttribute('data-key');
                if (key === '__cancel__') return close(null);
                try { const s = getSettings(); s.defaultDifficulty = key; SillyTavern.getContext().saveSettingsDebounced(); } catch (_) {}
                close(key);
            });
        });
    }

    /**
     * Optionally show a cue preview modal. Returns true if user confirmed.
     * Resolves to true immediately when preview is disabled in settings.
     * @param {string} cue Full cue text (with HTML).
     * @returns {Promise<boolean>}
     */
    function maybeShowCuePreview(cue) {
        return new Promise((resolve) => {
            const s = getSettings();
            if (!s.showCuePreview) { resolve(true); return; }
            const overlay = document.createElement('div');
            overlay.className = 'bb-modal-overlay bb-preview-overlay';
            overlay.style.opacity = '0';
            overlay.innerHTML = `
                <div class="bb-modal-box bb-preview-box">
                    <div class="bb-modal-title">${escapeHtml(t('preview_title'))}</div>
                    <div class="bb-preview-desc">${escapeHtml(t('preview_desc'))}</div>
                    <pre class="bb-preview-code">${escapeHtml(cue)}</pre>
                    <div class="bb-preview-actions">
                        <button class="bb-modal-cancel" data-act="cancel">${escapeHtml(t('preview_cancel'))}</button>
                        <button class="bb-modal-ok" data-act="ok">${escapeHtml(t('preview_send'))}</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.style.opacity = '1');
            const close = (val) => { fadeOutAndRemove(overlay); resolve(val); };
            overlay.addEventListener('click', (ev) => {
                if (ev.target === overlay) { close(false); return; }
                // @ts-ignore
                const btn = ev.target.closest('button[data-act]'); if (!btn) return;
                close(btn.getAttribute('data-act') === 'ok');
            });
        });
    }

    /** Toggle a small busy badge on the 'E' toggle button while a bot response is pending. */
    function updateBusyBadge() {
        const toggle = document.getElementById('bb-eg-toggle-btn');
        if (!toggle) return;
        if (pendingBotResponse) toggle.classList.add('bb-busy');
        else toggle.classList.remove('bb-busy');
    }

    /** Show a modal with the latest roll history entries from localStorage. */
    function showRollHistory() {
        const history = loadRollHistory();
        const overlay = document.createElement('div');
        overlay.className = 'bb-modal-overlay bb-history-overlay';
        overlay.style.opacity = '0';
        let body;
        if (history.length === 0) {
            body = `<div class="bb-history-empty">${escapeHtml(t('history_empty'))}</div>`;
        } else {
            body = '<div class="bb-history-list">' + history.map(h => {
                const d = new Date(h.timestamp || Date.now());
                const ts = d.toLocaleString();
                return `<div class="bb-history-item">
                    <div class="bb-history-meta"><span class="bb-history-ts">${escapeHtml(ts)}</span> <span class="bb-history-diff">${escapeHtml(h.difficulty || '')}</span></div>
                    <div class="bb-history-q">${escapeHtml(h.question || '')}</div>
                    <div class="bb-history-result">${escapeHtml(t('history_dc'))}: <b>${h.dc}</b> · ${escapeHtml(t('history_roll'))}: <b>${h.roll}</b> · ${escapeHtml(h.outcome || '')}</div>
                </div>`;
            }).join('') + '</div>';
        }
        overlay.innerHTML = `
            <div class="bb-modal-box bb-history-box">
                <div class="bb-modal-title">${escapeHtml(t('history_title'))}</div>
                ${body}
                <div class="bb-preview-actions">
                    <button class="bb-modal-cancel" data-act="clear">${escapeHtml(t('history_clear'))}</button>
                    <button class="bb-modal-ok" data-act="close">${escapeHtml(t('history_close'))}</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.style.opacity = '1');
        const close = () => fadeOutAndRemove(overlay);
        overlay.addEventListener('click', (ev) => {
            if (ev.target === overlay) { close(); return; }
            // @ts-ignore
            const btn = ev.target.closest('button[data-act]'); if (!btn) return;
            const act = btn.getAttribute('data-act');
            if (act === 'clear') { clearRollHistory(); close(); }
            else close();
        });
    }

    // ДВИЖОК УМНОЙ И БЕЗОПАСНОЙ ГЕНЕРАЦИИ (FAST PROMPT API)
    // =======================================================
    async function runMainGen(promptText, purpose = 'enhance') {
        const ctx = SillyTavern.getContext();
        const limit = resolveMaxTokens(getSettings(), purpose);
        const params = { quietPrompt: promptText };
        if (limit > 0) params.responseLength = limit;
        // @ts-ignore
        if (typeof ctx.generateQuietPrompt === 'function') {
            // @ts-ignore
            return await ctx.generateQuietPrompt(params);
        } else if (typeof window['generateQuietPrompt'] === 'function') {
            return await window['generateQuietPrompt'](params);
        } else {
            throw new Error('SillyTavern generation function not found.');
        }
    }

    /**
     * Consume an OpenAI-compatible SSE stream and return the full concatenated text.
     * Optionally invokes onChunk(deltaText, totalSoFar) for each new piece of content,
     * so callers can render incremental output in real time.
     * @param {Response} response fetch Response with stream body.
     * @param {(delta: string, total: string) => void} [onChunk] Optional incremental callback.
     * @returns {Promise<string>}
     */
    async function consumeOpenAIStream(response, onChunk) {
        if (!response.body || typeof response.body.getReader !== 'function') {
            // Stream API unavailable, fall back to plain JSON read.
            const data = await response.json();
            const text = data?.choices?.[0]?.message?.content || '';
            if (text && typeof onChunk === 'function') onChunk(text, text);
            return text;
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let result = '';
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const raw of lines) {
                const line = raw.trim();
                if (!line || !line.startsWith('data:')) continue;
                const payload = line.slice(5).trim();
                if (payload === '[DONE]') return result;
                try {
                    const json = JSON.parse(payload);
                    const delta = json?.choices?.[0]?.delta?.content || json?.choices?.[0]?.message?.content || '';
                    if (delta) {
                        result += delta;
                        if (typeof onChunk === 'function') onChunk(delta, result);
                    }
                } catch (_) { /* ignore malformed chunks */ }
            }
        }
        return result;
    }

    /**
     * Run the configured fast API (custom OpenAI-compatible or the main SillyTavern model).
     * @param {string} promptText The full prompt to send.
     * @param {(delta: string, total: string) => void} [onChunk] Optional streaming callback.
     *   Only honored when Custom API + streaming are enabled.
     * @returns {Promise<string>}
     */
    /**
     * Resolve the per-purpose max_tokens limit. 0 / negative / NaN => unlimited (omit).
     * @param {{maxTokensDirector?:number, maxTokensEnhance?:number, maxTokensContext?:number, maxTokensMicro?:number}} s settings
     * @param {'director'|'enhance'|'context'|'micro'} purpose
     * @returns {number} 0 means "omit max_tokens", otherwise an integer in [64..8000].
     */
    function resolveMaxTokens(s, purpose) {
        const map = {
            director: s.maxTokensDirector,
            enhance:  s.maxTokensEnhance,
            context:  s.maxTokensContext,
            micro:    s.maxTokensMicro,
        };
        const fallback = { director: 5000, enhance: 1500, context: 2000, micro: 500 };
        let raw = Number(map[purpose]);
        if (!Number.isFinite(raw)) raw = fallback[purpose] ?? 1500;
        if (raw <= 0) return 0;
        return Math.max(64, Math.min(8000, Math.floor(raw)));
    }

    async function generateEnhanceFast(promptText, onChunk, purpose) {
        const s = getSettings();
        // Default to the most restrictive bucket so an unannotated call can't accidentally produce a huge answer.
        const purposeKey = (purpose === 'director' || purpose === 'enhance' || purpose === 'context' || purpose === 'micro') ? purpose : 'micro';
        if (s.useCustomApi && s.customApiUrl && s.customApiModel) {
            try {
                const baseUrl = s.customApiUrl.replace(/\/$/, '');
                const endpoint = baseUrl + '/chat/completions';
                const useStream = !!s.enableStreaming;

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${s.customApiKey || ''}`,
                        ...(useStream ? { 'Accept': 'text/event-stream' } : {}),
                    },
                    body: (() => {
                        // 0 means "unlimited" — omit max_tokens entirely from the payload.
                        const limit = resolveMaxTokens(s, purposeKey);
                        const payload = {
                            model: s.customApiModel,
                            messages: [
                                { role: 'system', content: 'You are an internal assistant. Follow the instructions strictly and output only the required data.' },
                                { role: 'user', content: promptText }
                            ],
                            temperature: 0.7,
                            stream: useStream,
                        };
                        if (limit > 0) payload.max_tokens = limit;
                        return JSON.stringify(payload);
                    })(),
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                let content = '';
                if (useStream) {
                    content = await consumeOpenAIStream(response, onChunk);
                } else {
                    const data = await response.json();
                    content = data?.choices?.[0]?.message?.content || '';
                }
                if (!content.trim()) throw new Error('Proxy returned empty content.');
                return content;
            } catch (e) {
                console.warn(`[BB Enhance] Custom API error (${e.message}), falling back to main API...`);
                if (!customApiWarnedThisSession) {
                    customApiWarnedThisSession = true;
                    // @ts-ignore
                    toastr.warning(t('toast_custom_fallback'), 'BB Enhance');
                }
                return await runMainGen(promptText, purposeKey);
            }
        } else {
            return await runMainGen(promptText, purposeKey);
        }
    }

    // === ГЕНЕРАЦИЯ ENHANCE И IMPROVE ===
    async function handleGeneration(type, btnElement) {
        return withBusyLock(async () => {
        const ta = /** @type {HTMLTextAreaElement} */ (document.getElementById('send_textarea'));
        if (!ta) return;
        const inputText = ta.value.trim();
        if ((type === 'enhance' || type === 'improve') && !inputText) {
            // @ts-ignore
            toastr.warning(t('toast_need_input'), 'BB Enhance'); return;
        }

        btnElement.classList.add('loading');
        const oldHtml = btnElement.innerHTML;
        btnElement.innerHTML = `<span>${t('loading')}</span>`;

        // Preserve the user's original input so we can show streaming progress without
        // losing it on errors. The textarea is cleared only when we have first content.
        const originalInput = ta.value;
        let streamingActive = false;

        // Throttle DOM updates: collect deltas and flush at most ~30 fps via rAF.
        let pendingChunk = '';
        let rafScheduled = false;
        const flushStream = () => {
            rafScheduled = false;
            if (!pendingChunk) return;
            if (!streamingActive) {
                ta.value = '';
                streamingActive = true;
            }
            ta.value += pendingChunk;
            pendingChunk = '';
            ta.dispatchEvent(new Event('input', { bubbles: true }));
            // Keep cursor / scroll at the end so the user sees fresh tokens appear.
            ta.scrollTop = ta.scrollHeight;
        };
        const onChunk = (delta) => {
            pendingChunk += delta;
            if (!rafScheduled) {
                rafScheduled = true;
                requestAnimationFrame(flushStream);
            }
        };

        try {
            const recentMessages = buildRecentContext();
            let promptRaw = TEMPLATES[type].replace('{{input}}', inputText).replace(/\{\{lastMessage\}\}/g, recentMessages).replace('{{customDirection}}', customDirectorText || '');
            let finalPrompt = await substitutePromptMacros(promptRaw);

            // Use fast API (Custom or main). Stream only when Custom API + streaming are enabled.
            const s = getSettings();
            const willStream = !!(s.useCustomApi && s.customApiUrl && s.customApiModel && s.enableStreaming);
            // Director (Disaster/Blessing/Tension/Absurd/Tragedy/Custom) writes a full narrative segment — needs a bigger budget.
            // Enhance / Improve only polish a short draft.
            const purpose = (typeof type === 'string' && type.startsWith('dir_')) ? 'director' : 'enhance';
            let result = await generateEnhanceFast(finalPrompt, willStream ? onChunk : undefined, purpose);

            // Ensure any buffered chunks are flushed before we replace with the cleaned text.
            flushStream();

            const resultStr = String(result || '').trim();
            if (!resultStr || resultStr === 'undefined' || resultStr === 'null') {
                // @ts-ignore
                toastr.error(t('toast_empty_response'), 'BB Enhance');
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

            // Collapse blank lines and trailing whitespace left over by the regex cleanups above.
            cleanResult = tidyWhitespace(cleanResult);
            if (cleanResult.startsWith('"') && cleanResult.endsWith('"')) {
                cleanResult = cleanResult.slice(1, -1).trim();
            }
            cleanResult = stripLeadingUserName(cleanResult);
            
            if (cleanResult.length > 0) {
                ta.value = cleanResult;
                ta.dispatchEvent(new Event('input', { bubbles: true }));
                // @ts-ignore
                toastr.success(t('toast_done'), 'BB Enhance');
            } else {
                ta.value = resultStr;
                ta.dispatchEvent(new Event('input', { bubbles: true }));
                // @ts-ignore
                toastr.warning(t('toast_filter_empty'), 'BB Enhance');
            }

        } catch (err) {
            console.error(err);
            // Restore user's input if the stream broke before we could produce a result.
            if (streamingActive && (!ta.value || ta.value.trim().length === 0)) {
                ta.value = originalInput;
                ta.dispatchEvent(new Event('input', { bubbles: true }));
            }
            // @ts-ignore
            toastr.error(t('toast_err_generic') + (err.message || String(err)), 'BB Enhance');
        } finally {
            btnElement.classList.remove('loading');
            btnElement.innerHTML = oldHtml;
        }
        });
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

    function computeDC(difficulty) {
        switch (difficulty) {
            case 'easy':   return 8;
            case 'normal': return 12;
            case 'hard':   return 16;
            case 'epic':   return 20;
            case 'random':
            default:       return Math.floor(Math.random() * 7) + 10;
        }
    }

    async function handleSkillCheck(btnElement) {
        return withBusyLock(async () => {
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

        // Pick difficulty:
        // - By default, silently use the saved 'defaultDifficulty'.
        // - If 'askDifficultyEveryTime' is enabled, show the picker (default highlighted, user may cancel).
        const settings = getSettings();
        const difficulty = settings.askDifficultyEveryTime
            ? await pickDifficulty(settings.defaultDifficulty)
            : (settings.defaultDifficulty || 'random');
        if (difficulty === null) return;

        btnElement.classList.add('loading');
        const oldHtml = btnElement.innerHTML;
        btnElement.innerHTML = `<span>${t('rolling')}</span>`;

        try {
            const lang = currentLang();
            const langInstr = lang === 'ru' ? 'Strictly in Russian.' : 'Strictly in English.';
            const prompt = `[TASK]\nRead the user's action: """${targetText}"""\nFormulate a single, short dramatic question describing the skill check they are attempting.\nRules:\n- ${langInstr}\n- Max 8-10 words.\n- Output ONLY the question, nothing else. No intro, no quotes.`;

            // Action Roll asks for a single short question (8-10 words) — tiny budget is enough.
            let actionQuestion = await generateEnhanceFast(prompt, undefined, 'micro');
            const qStr = String(actionQuestion || '').trim();
            if (!qStr || qStr === 'undefined' || qStr === 'null') throw new Error('Empty API response');

            actionQuestion = qStr.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<\/?think[^>]*>/gi, '').trim();
            if (actionQuestion.startsWith('"')) actionQuestion = actionQuestion.slice(1, -1);
            if (!actionQuestion || actionQuestion.length > 100) {
                actionQuestion = lang === 'ru' ? 'Удастся ли задуманное действие?' : 'Will the planned action succeed?';
            }

            btnElement.classList.remove('loading'); btnElement.innerHTML = oldHtml;

            const dc = computeDC(difficulty);
            const roll = Math.floor(Math.random() * 20) + 1;

            let outcomeType = ''; let outcomeText = ''; let outcomeColor = '';
            if (roll === 20)      { outcomeType = 'roll_crit_success'; outcomeText = t('outcome_crit_success'); outcomeColor = '#d4af37'; }
            else if (roll === 1)  { outcomeType = 'roll_crit_failure'; outcomeText = t('outcome_crit_failure'); outcomeColor = '#dc2626'; }
            else if (roll >= dc)  { outcomeType = 'roll_success';      outcomeText = t('outcome_success');      outcomeColor = '#10b981'; }
            else                  { outcomeType = 'roll_failure';      outcomeText = t('outcome_failure');      outcomeColor = '#f97316'; }

            await showDiceModal(actionQuestion, dc, roll, outcomeText, outcomeColor);

            saveRollHistory({
                question: actionQuestion, dc, roll,
                outcome: outcomeText, difficulty, timestamp: Date.now(),
            });

            const cue = BOT_CUES[outcomeType]
                .replace(/{{dc}}/g, String(dc))
                .replace(/{{roll}}/g, String(roll))
                .replace(/{{question}}/g, actionQuestion);

            const confirmed = await maybeShowCuePreview(cue);
            if (!confirmed) return;

            pendingBotResponse = true; updateBusyBadge();
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
            toastr.error(t('toast_err_dice') + (err.message || String(err)), 'BB Dice');
        }
        });
    }

    // === РЕЖИССЕР (DIRECTOR) ===
    async function handleBotGeneration(type) {
        return withBusyLock(async () => {
        const chat = SillyTavern.getContext().chat;
        const ta = document.getElementById('send_textarea');
        // @ts-ignore
        const inputText = ta ? ta.value.trim() : '';

        const cue = type === 'dir_custom'
            ? `\n\n> 📝 **Направление** <span style="display:none;">\n<system_note>\nNARRATIVE DIRECTION: ${customDirectorText}\n</system_note>\n</span>`
            : BOT_CUES[type];
        const confirmed = await maybeShowCuePreview(cue);
        if (!confirmed) return;

        pendingBotResponse = true; updateBusyBadge();
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
        });
    }

    function renderPopupVibes() {
        return `
            <div class="bb-eg-popup-header">Выберите событие</div>
            <button class="bb-eg-vibe-btn" data-vibe="dir_disaster">💥 Disaster (Опасность)</button>
            <button class="bb-eg-vibe-btn" data-vibe="dir_blessing">🎁 Blessing (Удача)</button>
            <button class="bb-eg-vibe-btn" data-vibe="dir_tension">❤️ Tension (Напряжение)</button>
            <button class="bb-eg-vibe-btn" data-vibe="dir_absurd">🃏 Absurd (Комедия)</button>
            <button class="bb-eg-vibe-btn" style="border-top: 1px dashed rgba(255, 255, 255, 0.1); margin-top: 4px; color: #ef4444;" data-vibe="dir_tragedy">💀 Tragedy (Трагедия)</button>
            <button class="bb-eg-vibe-btn bb-eg-vibe-custom" style="border-top: 1px dashed rgba(255, 255, 255, 0.1); margin-top: 4px;" data-vibe="dir_custom">${t('dir_custom')}</button>
        `;
    }
    
    function renderPopupCustomInput() {
        return `
            <button class="bb-eg-back-btn" data-back="vibes"><i class="fa-solid fa-arrow-left"></i> ${t('dir_back')}</button>
            <div class="bb-eg-popup-header">${t('dir_custom')}</div>
            <textarea class="bb-eg-custom-textarea" placeholder="${escapeHtml(t('dir_custom_placeholder'))}" rows="3">${escapeHtml(customDirectorText)}</textarea>
            <button class="bb-eg-custom-next-btn">${t('dir_custom_next')}</button>
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

            if (target.classList.contains('bb-eg-vibe-btn')) {
                activeDirectorVibe = target.getAttribute('data-vibe');
                if (activeDirectorVibe === 'dir_custom') {
                    popup.innerHTML = renderPopupCustomInput();
                    const ta = popup.querySelector('.bb-eg-custom-textarea');
                    if (ta) requestAnimationFrame(() => ta.focus());
                } else {
                    customDirectorText = '';
                    popup.innerHTML = renderPopupTargets();
                }
            }
            else if (target.classList.contains('bb-eg-custom-next-btn')) {
                const ta = popup.querySelector('.bb-eg-custom-textarea');
                // @ts-ignore
                const val = ta ? ta.value.trim() : '';
                if (!val) {
                    // @ts-ignore
                    toastr.warning(t('dir_custom_empty'), 'BB Director');
                    return;
                }
                customDirectorText = val;
                popup.innerHTML = renderPopupTargets();
            }
            else if (target.classList.contains('bb-eg-back-btn')) {
                if (target.getAttribute('data-back') === 'vibes') {
                    popup.innerHTML = renderPopupVibes();
                } else {
                    // Back from target picker: go to custom input if custom, else vibes
                    if (activeDirectorVibe === 'dir_custom') {
                        popup.innerHTML = renderPopupCustomInput();
                        const ta = popup.querySelector('.bb-eg-custom-textarea');
                        if (ta && customDirectorText) { /** @type {HTMLTextAreaElement} */ (ta).value = customDirectorText; }
                    } else {
                        popup.innerHTML = renderPopupVibes();
                    }
                }
            }
            else if (target.classList.contains('bb-eg-target-btn')) {
                const targetType = target.getAttribute('data-target'); popup.classList.remove('show'); isPopupOpen = false;
                if (targetType === 'me') handleGeneration(activeDirectorVibe, mainBtn); else if (targetType === 'bot') handleBotGeneration(activeDirectorVibe);
            }
        };

        popup.addEventListener('input', (e) => {
            const target = e.target;
            if (target instanceof HTMLTextAreaElement && target.classList.contains('bb-eg-custom-textarea')) {
                customDirectorText = target.value;
            }
        });
        wrap.appendChild(mainBtn); wrap.appendChild(popup); return wrap;
    }

    document.addEventListener('click', (e) => {
        const wrap = document.getElementById('bb-eg-director-wrap'); const popup = document.getElementById('bb-eg-popup');
        // @ts-ignore
        if (isPopupOpen && wrap && !wrap.contains(e.target)) { isPopupOpen = false; popup.classList.remove('show'); }
    });

    // === FAST TRAVEL ===
    async function handleFastTravel(btnElement) {
        return withBusyLock(async () => {
        const ta = document.getElementById('send_textarea');
        // @ts-ignore
        const inputText = ta ? ta.value.trim() : '';

        btnElement.classList.add('loading');
        const oldHtml = btnElement.innerHTML;
        btnElement.innerHTML = `<span>${t('scanning')}</span>`;

        try {
            const recentMessages = buildRecentContext();
            let promptRaw = TEMPLATES.ft_analyzer.replace('{{input}}', inputText).replace(/\{\{lastMessage\}\}/g, recentMessages);
            let finalPrompt = await substitutePromptMacros(promptRaw);

            // ИСПОЛЬЗУЕМ FAST API ДЛЯ АНАЛИЗА (контекст чата -> компактный JSON)
            let result = await generateEnhanceFast(finalPrompt, undefined, 'context');
            
            const data = extractJSON(result);
            showFastTravelModal(data);
            
        } catch (err) {
            console.error(err);
            // @ts-ignore
            toastr.error(t('toast_err_ft') + err.message, 'BB FT');
        } finally {
            btnElement.classList.remove('loading'); btnElement.innerHTML = oldHtml;
        }
        });
    }

    function showFastTravelModal(data) {
        const overlay = document.createElement('div'); overlay.className = 'bb-ft-overlay';
        let contentHtml = '';

        if (data.can_travel === false) {
            contentHtml = `
                <div class="bb-ft-modal denied">
                    <div class="bb-ft-title">${escapeHtml(t('ft_denied'))}</div>
                    <div class="bb-ft-reason">«${escapeHtml(data.lock_reason || t('ft_denied_default'))}»</div>
                    <button class="bb-ft-close" id="bb-ft-close">${escapeHtml(t('ft_ok'))}</button>
                </div>
            `;
        } else {
            let cardsHtml = '';
            if (data.destinations && Array.isArray(data.destinations)) {
                data.destinations.forEach(dest => {
                    const safeName = escapeHtml(dest.name || '');
                    const safeHook = escapeHtml(dest.hook || '');
                    const safeTime = escapeHtml(dest.time_cost || '');
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
                    <div class="bb-ft-title">${escapeHtml(t('ft_title'))}</div>
                    <div class="bb-ft-grid">${cardsHtml}</div>
                    <button class="bb-ft-surprise" id="bb-ft-btn-surprise"><i class="fa-solid fa-bolt"></i> ${escapeHtml(t('ft_surprise'))}</button>
                    <button class="bb-ft-close" id="bb-ft-close" style="margin-top: 15px; background: transparent; color: #9ca3af; border: 1px solid #3f2c2c;">${escapeHtml(t('ft_cancel'))}</button>
                </div>
            `;
        }

        overlay.innerHTML = contentHtml;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.style.opacity = '1');

        const closeModal = () => { overlay.style.opacity = '0'; setTimeout(() => overlay.remove(), 400); };
        const closeBtn = overlay.querySelector('#bb-ft-close'); if (closeBtn) closeBtn.addEventListener('click', closeModal);

        const executeTravel = async (loc, hook, time) => {
            closeModal();
            const chat = SillyTavern.getContext().chat;
            const ta = document.getElementById('send_textarea');
            // @ts-ignore
            const inputText = ta ? ta.value.trim() : '';
            const cue = (loc && hook)
                ? BOT_CUES.ft_travel_specific.replace(/{{loc}}/g, loc).replace(/{{hook}}/g, hook).replace(/{{time}}/g, time || (currentLang() === 'ru' ? 'неизвестно' : 'unknown'))
                : BOT_CUES.ft_travel_surprise;

            const confirmed = await maybeShowCuePreview(cue);
            if (!confirmed) return;

            pendingBotResponse = true; updateBusyBadge();
            if (inputText) {
                // @ts-ignore
                ta.value = removeExtensionCues(inputText) + cue; ta.dispatchEvent(new Event('input', { bubbles: true })); document.getElementById('send_but')?.click();
            } else {
                if (!chat || chat.length === 0) return;
                let lastUserIndex = -1; for (let i = chat.length - 1; i >= 0; i--) { if (chat[i].is_user) { lastUserIndex = i; break; } }
                if (lastUserIndex === -1) return;
                const cleanedText = removeExtensionCues(chat[lastUserIndex].mes); chat[lastUserIndex].mes = cleanedText + cue;
                const isLastMsgBot = !chat[chat.length - 1].is_user;
                if (isLastMsgBot) {
                    const swipeRightBtn = document.querySelector('.last_mes .swipe_right');
                    // @ts-ignore
                    if (swipeRightBtn) swipeRightBtn.click(); else document.getElementById('send_but')?.click();
                } else { document.getElementById('send_but')?.click(); }
            }
        };

        overlay.querySelectorAll('.bb-ft-card').forEach(card => {
            card.addEventListener('click', () => {
                executeTravel(card.getAttribute('data-loc'), card.getAttribute('data-hook'), card.getAttribute('data-time'));
            });
        });
        const surpriseBtn = overlay.querySelector('#bb-ft-btn-surprise');
        if (surpriseBtn) surpriseBtn.addEventListener('click', () => executeTravel(null, null, null));
    }

    // === TIME SKIP ===
    async function handleTimeSkip(btnElement) {
        return withBusyLock(async () => {
        const ta = document.getElementById('send_textarea');
        // @ts-ignore
        const inputText = ta ? ta.value.trim() : '';

        btnElement.classList.add('loading');
        const oldHtml = btnElement.innerHTML;
        btnElement.innerHTML = `<span>${t('analyzing')}</span>`;

        try {
            const recentMessages = buildRecentContext();
            let promptRaw = TEMPLATES.ts_analyzer.replace(/\{\{lastMessage\}\}/g, recentMessages);
            let finalPrompt = await substitutePromptMacros(promptRaw);

            // ИСПОЛЬЗУЕМ FAST API ДЛЯ АНАЛИЗА (контекст чата -> компактный JSON)
            let result = await generateEnhanceFast(finalPrompt, undefined, 'context');
            
            const data = extractJSON(result);
            showTimeSkipModal(data);
            
        } catch (err) {
            console.error(err);
            // @ts-ignore
            toastr.error(t('toast_err_ts') + err.message, 'BB TS');
        } finally {
            btnElement.classList.remove('loading'); btnElement.innerHTML = oldHtml;
        }
        });
    }

    function showTimeSkipModal(data) {
        const overlay = document.createElement('div'); overlay.className = 'bb-ts-overlay';
        let contentHtml = '';

        if (data.can_skip === false) {
            contentHtml = `
                <div class="bb-ts-modal denied">
                    <div class="bb-ts-title">${escapeHtml(t('ts_denied'))}</div>
                    <div class="bb-ts-reason">«${escapeHtml(data.lock_reason || t('ts_denied_default'))}»</div>
                    <button class="bb-ts-close" id="bb-ts-close">${escapeHtml(t('ts_ok'))}</button>
                </div>
            `;
        } else {
            let cardsHtml = '';
            if (data.options && Array.isArray(data.options)) {
                data.options.forEach(opt => {
                    const safeTitle = escapeHtml(opt.title || '');
                    const safeSummary = escapeHtml(opt.summary || '');
                    const safeTime = escapeHtml(opt.time || '');
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
                    <div class="bb-ts-title">${escapeHtml(t('ts_title'))}</div>
                    <div class="bb-ts-grid">${cardsHtml}</div>
                    <button class="bb-ts-close" id="bb-ts-close" style="margin-top: 10px; background: transparent; color: #a78bfa; border: 1px solid #4c1d95;">${escapeHtml(t('ts_cancel'))}</button>
                </div>
            `;
        }

        overlay.innerHTML = contentHtml; document.body.appendChild(overlay); requestAnimationFrame(() => overlay.style.opacity = '1');

        const closeModal = () => { overlay.style.opacity = '0'; setTimeout(() => overlay.remove(), 400); };
        const closeBtn = overlay.querySelector('#bb-ts-close'); if (closeBtn) closeBtn.addEventListener('click', closeModal);

        const executeSkip = async (title, summary, time) => {
            closeModal();
            const chat = SillyTavern.getContext().chat;
            const ta = document.getElementById('send_textarea');
            // @ts-ignore
            const inputText = ta ? ta.value.trim() : '';
            const cue = BOT_CUES.ts_specific.replace(/{{title}}/g, title).replace(/{{summary}}/g, summary).replace(/{{time}}/g, time);

            const confirmed = await maybeShowCuePreview(cue);
            if (!confirmed) return;

            pendingBotResponse = true; updateBusyBadge();
            if (inputText) {
                // @ts-ignore
                ta.value = removeExtensionCues(inputText) + cue; ta.dispatchEvent(new Event('input', { bubbles: true })); document.getElementById('send_but')?.click();
            } else {
                if (!chat || chat.length === 0) return;
                let lastUserIndex = -1; for (let i = chat.length - 1; i >= 0; i--) { if (chat[i].is_user) { lastUserIndex = i; break; } }
                if (lastUserIndex === -1) return;
                const cleanedText = removeExtensionCues(chat[lastUserIndex].mes); chat[lastUserIndex].mes = cleanedText + cue;
                const isLastMsgBot = !chat[chat.length - 1].is_user;
                if (isLastMsgBot) {
                    const swipeRightBtn = document.querySelector('.last_mes .swipe_right');
                    // @ts-ignore
                    if (swipeRightBtn) swipeRightBtn.click(); else document.getElementById('send_but')?.click();
                } else { document.getElementById('send_but')?.click(); }
            }
        };

        overlay.querySelectorAll('.bb-ts-card').forEach(card => {
            card.addEventListener('click', () => {
                executeSkip(card.getAttribute('data-title'), card.getAttribute('data-summary'), card.getAttribute('data-time'));
            });
        });
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
        const toggleBtn = document.createElement('div'); toggleBtn.id = 'bb-eg-toggle-btn'; toggleBtn.innerHTML = 'E'; toggleBtn.title = t('toggle_title');
        const toolbar = document.createElement('div'); toolbar.id = 'bb-enhance-toolbar';

        const btnE = document.createElement('button'); btnE.className = 'bb-eg-btn'; btnE.id = 'bb-eg-btn-enhance'; btnE.innerHTML = t('btn_enhance');
        btnE.onclick = (e) => { e.preventDefault(); handleGeneration('enhance', btnE); }; toolbar.appendChild(btnE);

        const btnI = document.createElement('button'); btnI.className = 'bb-eg-btn'; btnI.id = 'bb-eg-btn-improve'; btnI.innerHTML = t('btn_improve');
        btnI.onclick = (e) => { e.preventDefault(); handleGeneration('improve', btnI); }; toolbar.appendChild(btnI);

        toolbar.appendChild(buildDirectorPopup());

        const btnDice = document.createElement('button'); btnDice.className = 'bb-eg-btn'; btnDice.id = 'bb-eg-btn-dice'; btnDice.innerHTML = t('btn_dice');
        btnDice.onclick = (e) => { e.preventDefault(); handleSkillCheck(btnDice); }; toolbar.appendChild(btnDice);

        const btnFT = document.createElement('button'); btnFT.className = 'bb-eg-btn'; btnFT.id = 'bb-eg-btn-ft'; btnFT.innerHTML = t('btn_ft');
        btnFT.onclick = (e) => { e.preventDefault(); handleFastTravel(btnFT); }; toolbar.appendChild(btnFT);

        const btnTS = document.createElement('button'); btnTS.className = 'bb-eg-btn'; btnTS.id = 'bb-eg-btn-ts'; btnTS.innerHTML = t('btn_ts');
        btnTS.onclick = (e) => { e.preventDefault(); handleTimeSkip(btnTS); }; toolbar.appendChild(btnTS);

        const btnHist = document.createElement('button'); btnHist.className = 'bb-eg-btn bb-eg-btn-history'; btnHist.id = 'bb-eg-btn-history'; btnHist.innerHTML = t('btn_history');
        btnHist.onclick = (e) => { e.preventDefault(); showRollHistory(); }; toolbar.appendChild(btnHist);

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
                    <b>🎬 Enhance Generation</b>
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
                        <span style="font-size: 11px; color: #f59e0b; line-height: 1.3;">${escapeHtml(t('set_security_warn'))}</span>
                    </div>

                    <hr style="border-color: rgba(255,255,255,0.1); margin: 10px 0;">
                    <span style="font-size: 13px; color: #cbd5e1; font-weight:bold;">${escapeHtml(t('set_extras_title'))}</span>
                    <label class="checkbox_label" style="margin-top: 5px;">
                        <input type="checkbox" id="bb-eg-cfg-preview" ${s.showCuePreview ? 'checked' : ''}>
                        <span>${escapeHtml(t('set_show_preview'))}</span>
                    </label>
                    <label class="checkbox_label">
                        <input type="checkbox" id="bb-eg-cfg-stream" ${s.enableStreaming ? 'checked' : ''}>
                        <span>${escapeHtml(t('set_streaming'))}</span>
                    </label>
                    <label style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">
                        <span style="font-size: 12px; color: #cbd5e1;">${escapeHtml(t('set_default_diff'))}</span>
                        <select id="bb-eg-cfg-diff" class="text_pole" ${s.askDifficultyEveryTime ? 'disabled' : ''}>
                            <option value="easy" ${s.defaultDifficulty === 'easy' ? 'selected' : ''}>${escapeHtml(t('diff_easy'))} (DC 8)</option>
                            <option value="normal" ${s.defaultDifficulty === 'normal' ? 'selected' : ''}>${escapeHtml(t('diff_normal'))} (DC 12)</option>
                            <option value="hard" ${s.defaultDifficulty === 'hard' ? 'selected' : ''}>${escapeHtml(t('diff_hard'))} (DC 16)</option>
                            <option value="epic" ${s.defaultDifficulty === 'epic' ? 'selected' : ''}>${escapeHtml(t('diff_epic'))} (DC 20)</option>
                            <option value="random" ${s.defaultDifficulty === 'random' ? 'selected' : ''}>${escapeHtml(t('diff_random'))} (DC 10-16)</option>
                        </select>
                    </label>
                    <label class="checkbox_label" style="margin-top: 4px;">
                        <input type="checkbox" id="bb-eg-cfg-askdiff" ${s.askDifficultyEveryTime ? 'checked' : ''}>
                        <span>${escapeHtml(t('set_ask_diff_every_time'))}</span>
                    </label>
                    <details style="margin-top: 8px; border: 1px solid #374151; border-radius: 6px; padding: 6px 8px;">
                        <summary style="cursor: pointer; font-size: 13px; color: #cbd5e1; font-weight: bold;">${escapeHtml(t('set_max_tokens_group'))}</summary>
                        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 8px;">
                            <label style="display: flex; flex-direction: column; gap: 2px;">
                                <span style="font-size: 12px; color: #cbd5e1;">${escapeHtml(t('set_max_tokens_director'))}</span>
                                <input type="number" id="bb-eg-cfg-mt-director" class="text_pole" min="0" max="8000" step="100" value="${Number.isFinite(Number(s.maxTokensDirector)) ? Number(s.maxTokensDirector) : 5000}">
                            </label>
                            <label style="display: flex; flex-direction: column; gap: 2px;">
                                <span style="font-size: 12px; color: #cbd5e1;">${escapeHtml(t('set_max_tokens_enhance'))}</span>
                                <input type="number" id="bb-eg-cfg-mt-enhance" class="text_pole" min="0" max="8000" step="100" value="${Number.isFinite(Number(s.maxTokensEnhance)) ? Number(s.maxTokensEnhance) : 1500}">
                            </label>
                            <label style="display: flex; flex-direction: column; gap: 2px;">
                                <span style="font-size: 12px; color: #cbd5e1;">${escapeHtml(t('set_max_tokens_context'))}</span>
                                <input type="number" id="bb-eg-cfg-mt-context" class="text_pole" min="0" max="8000" step="100" value="${Number.isFinite(Number(s.maxTokensContext)) ? Number(s.maxTokensContext) : 2000}">
                            </label>
                            <label style="display: flex; flex-direction: column; gap: 2px;">
                                <span style="font-size: 12px; color: #cbd5e1;">${escapeHtml(t('set_max_tokens_micro'))}</span>
                                <input type="number" id="bb-eg-cfg-mt-micro" class="text_pole" min="0" max="8000" step="100" value="${Number.isFinite(Number(s.maxTokensMicro)) ? Number(s.maxTokensMicro) : 500}">
                            </label>
                            <span style="font-size: 11px; color: #94a3b8; line-height: 1.3;">${escapeHtml(t('set_max_tokens_hint'))}</span>
                        </div>
                    </details>
                </div>
            </div>
        `;

        const target = document.querySelector("#extensions_settings2") || document.querySelector("#extensions_settings");
        if (target) {
            target.insertAdjacentHTML('beforeend', html);
            
            // Use the explicit SETTING_KEYS map (fixes a fragile .replace() chain).
            for (const [shortKey, settingKey] of Object.entries(SETTING_KEYS)) {
                const el = document.getElementById(`bb-eg-cfg-${shortKey}`);
                if (!el) continue;
                el.addEventListener('change', (e) => {
                    // @ts-ignore
                    getSettings()[settingKey] = e.target.checked;
                    saveSettings();
                    updateToolbarVisibility();
                });
            }

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

            // Extras (1.1.0)
            $('#bb-eg-cfg-preview').on('change', function() {
                getSettings().showCuePreview = $(this).is(':checked'); saveSettings();
            });
            $('#bb-eg-cfg-stream').on('change', function() {
                getSettings().enableStreaming = $(this).is(':checked'); saveSettings();
            });
            $('#bb-eg-cfg-diff').on('change', function() {
                getSettings().defaultDifficulty = String($(this).val()); saveSettings();
            });
            $('#bb-eg-cfg-askdiff').on('change', function() {
                const checked = $(this).is(':checked');
                getSettings().askDifficultyEveryTime = checked;
                // When 'ask every time' is on, the default difficulty value is unused — disable the select to make it clear.
                $('#bb-eg-cfg-diff').prop('disabled', checked);
                saveSettings();
            });
            // Per-purpose max_tokens fields. 0 = unlimited, otherwise clamped to [64..8000].
            const MT_FIELDS = [
                { id: '#bb-eg-cfg-mt-director', key: 'maxTokensDirector', def: 5000 },
                { id: '#bb-eg-cfg-mt-enhance',  key: 'maxTokensEnhance',  def: 1500 },
                { id: '#bb-eg-cfg-mt-context',  key: 'maxTokensContext',  def: 2000 },
                { id: '#bb-eg-cfg-mt-micro',    key: 'maxTokensMicro',    def: 500  },
            ];
            for (const f of MT_FIELDS) {
                $(f.id).on('change input', function() {
                    let v = parseInt(String($(this).val()), 10);
                    if (!Number.isFinite(v)) v = f.def;
                    if (v <= 0) v = 0;
                    else v = Math.max(64, Math.min(8000, v));
                    getSettings()[f.key] = v;
                    saveSettings();
                });
            }


            $('#bb-eg-btn-connect').on('click', async function() {
                const btn = $(this);
                // @ts-ignore
                const url = $('#bb-eg-cfg-url').val().replace(/\/$/, '');
                const key = $('#bb-eg-cfg-key').val();
                btn.html('<i class="fa-solid fa-spinner fa-spin"></i>&nbsp; ' + escapeHtml(t('loading')));

                try {
                    const response = await fetch(url + '/models', {
                        method: 'GET', headers: { 'Authorization': `Bearer ${key}` }
                    });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const data = await response.json();

                    if (data && data.data && Array.isArray(data.data)) {
                        const select = $('#bb-eg-cfg-model');
                        select.empty();
                        data.data.forEach(m => select.append(`<option value="${escapeHtml(m.id)}">${escapeHtml(m.id)}</option>`));
                        select.prop('disabled', false);

                        if (getSettings().customApiModel && select.find(`option[value="${getSettings().customApiModel}"]`).length) {
                            select.val(getSettings().customApiModel);
                        } else {
                            getSettings().customApiModel = select.val();
                        }
                        // @ts-ignore
                        toastr.success(t('toast_models_loaded'), 'BB Enhance');
                        saveSettings();
                    } else throw new Error('No models in response.');
                } catch (e) {
                    console.error(e);
                    // @ts-ignore
                    toastr.error(t('toast_err_generic') + e.message, 'BB Enhance');
                } finally {
                    btn.html('<i class="fa-solid fa-plug"></i>&nbsp; Connect / Refresh');
                }
            });
        }
    }

    jQuery(async () => {
        try {
            const { eventSource, event_types } = SillyTavern.getContext();
            eventSource.on(event_types.APP_READY, () => { injectToolbar(); injectSettingsPanel(); });
            // Clear the busy badge when the bot's response arrives or generation ends.
            const clearBusy = () => { pendingBotResponse = false; updateBusyBadge(); };
            if (event_types.MESSAGE_RECEIVED) eventSource.on(event_types.MESSAGE_RECEIVED, clearBusy);
            if (event_types.GENERATION_ENDED) eventSource.on(event_types.GENERATION_ENDED, clearBusy);
            if (event_types.GENERATION_STOPPED) eventSource.on(event_types.GENERATION_STOPPED, clearBusy);
            injectToolbar(); injectSettingsPanel();
        } catch (e) { console.error(`[${MODULE_NAME}] Startup error:`, e); }
    });

})();
