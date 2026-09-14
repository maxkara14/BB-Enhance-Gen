import { openModal, textField } from './ui.js';
import { DEFAULT_WRITING_INSTRUCTIONS, WRITING_LIMITS, cleanButtonIcon, customButtons, writingInstruction } from './writing.js';

export function renderWritingSettings(parent, { getSettings, saveSettings, tr, onChange }) {
    function note(target, text) {
        const p = document.createElement('p'); p.className = 'bb-eg-settings-note'; p.textContent = text; target.append(p); return p;
    }
    function button(target, label, handler) {
        const el = document.createElement('button'); el.type = 'button'; el.className = 'menu_button'; el.textContent = label; el.onclick = handler; target.append(el); return el;
    }
    note(parent, tr('Меняйте инструкцию, а не весь промпт. Персона, персонаж и контекст чата добавляются автоматически. Результат заменяет черновик в поле ввода.',
        'Edit the instruction, not a full prompt. Persona, character and chat context are added automatically. The result replaces the draft in the chat input.'));
    note(parent, tr('Язык, лицо повествования и сохранение реплик из настроек имеют приоритет. Множитель длины действует только для Enhance. Повтор использует инструкцию исходного запроса.',
        'Language, narrative person and dialogue preservation settings take priority. The length multiplier applies only to Enhance. Retry uses the instruction from the original request.'));
    for (const type of ['enhance', 'improve']) {
        const section = document.createElement('details'); section.className = 'bb-eg-instruction-editor';
        const summary = document.createElement('summary'); summary.textContent = type === 'enhance' ? 'Enhance' : 'Improve'; section.append(summary); parent.append(section);
        const input = textField(section, tr('Инструкция модели', 'Model instruction'), writingInstruction(type, getSettings().writingInstructions), true);
        input.dataset.writingInstruction = type; input.maxLength = WRITING_LIMITS.instruction; input.required = true;
        const actions = document.createElement('div'); actions.className = 'bb-eg-editor-actions'; section.append(actions);
        const status = note(section, ''); status.setAttribute('role', 'status');
        button(actions, tr('Сохранить', 'Save'), () => {
            input.setCustomValidity(input.value.trim() && input.value.length <= WRITING_LIMITS.instruction ? '' : tr('Введите инструкцию длиной до 8000 символов.', 'Enter an instruction of up to 8000 characters.'));
            if (!input.reportValidity()) return;
            const s = getSettings();
            s.writingInstructions = Object.fromEntries(['enhance', 'improve'].map(key => [key, writingInstruction(key, s.writingInstructions)]));
            s.writingInstructions[type] = input.value.trim(); saveSettings(); status.textContent = tr('Сохранено.', 'Saved.');
        }).dataset.writingSave = type;
        button(actions, tr('Восстановить стандартную', 'Restore default'), () => {
            const s = getSettings(), other = type === 'enhance' ? 'improve' : 'enhance';
            s.writingInstructions = { [other]: writingInstruction(other, s.writingInstructions) };
            input.value = DEFAULT_WRITING_INSTRUCTIONS[type]; input.setCustomValidity(''); saveSettings();
            status.textContent = tr('Стандартная инструкция восстановлена.', 'Default instruction restored.');
        }).dataset.writingReset = type;
        input.oninput = () => { input.setCustomValidity(''); status.textContent = tr('Есть несохранённые изменения.', 'Unsaved changes.'); };
    }
    const heading = document.createElement('h4'); heading.textContent = tr('Свои кнопки', 'Custom buttons'); parent.append(heading);
    note(parent, tr('До 20 кнопок. Для каждой нужен непустой черновик. Используются общее подключение и лимит ответа Enhance / Improve.',
        'Up to 20 buttons. Each requires a non-empty draft and uses the shared connection and Enhance / Improve response limit.'));
    const list = document.createElement('div'); list.className = 'bb-eg-custom-list'; parent.append(list);
    const add = button(parent, tr('Добавить кнопку', 'Add button'), () => edit()); add.dataset.customAdd = '';
    function persist(items) {
        getSettings().customButtons = items; saveSettings(); onChange(); renderList();
    }
    function renderList() {
        list.replaceChildren();
        const items = customButtons(getSettings().customButtons);
        if (!items.length) note(list, tr('Своих кнопок пока нет.', 'No custom buttons yet.'));
        add.disabled = items.length >= WRITING_LIMITS.buttons;
        for (const item of items) {
            const row = document.createElement('div'); row.className = 'bb-eg-custom-row'; row.dataset.customId = item.id;
            const label = document.createElement('label'); label.className = 'checkbox_label';
            const enabled = document.createElement('input'); enabled.type = 'checkbox'; enabled.checked = item.enabled;
            enabled.setAttribute('aria-label', tr('Включить: ', 'Enable: ') + item.name);
            enabled.onchange = () => persist(customButtons(getSettings().customButtons).map(current => current.id === item.id ? { ...current, enabled: enabled.checked } : current));
            const name = document.createElement('span'); name.textContent = `${item.icon} ${item.name}`;
            label.append(enabled, name); row.append(label);
            const actions = document.createElement('div'); actions.className = 'bb-eg-editor-actions'; row.append(actions);
            button(actions, tr('Изменить', 'Edit'), () => edit(item)).dataset.customEdit = item.id;
            button(actions, tr('Удалить', 'Delete'), () => {
                const view = openModal(tr('Удалить кнопку?', 'Delete button?'), { cancelLabel: tr('Отмена', 'Cancel') });
                note(view.body, tr('Удалить «', 'Delete “') + item.name + tr('» из настроек расширения?', '” from the extension settings?'));
                view.button(tr('Отмена', 'Cancel'), () => view.close());
                view.button(tr('Удалить', 'Delete'), () => {
                    persist(customButtons(getSettings().customButtons).filter(current => current.id !== item.id)); view.close(); add.focus();
                }, true).dataset.deleteConfirm = item.id;
            }).dataset.customDelete = item.id;
            list.append(row);
        }
    }
    function edit(item) {
        if (!item && customButtons(getSettings().customButtons).length >= WRITING_LIMITS.buttons) return;
        const view = openModal(item ? tr('Изменить кнопку', 'Edit button') : tr('Новая кнопка', 'New button'), { cancelLabel: tr('Отмена', 'Cancel') });
        const name = textField(view.body, tr('Название', 'Name'), item?.name || '');
        const icon = textField(view.body, tr('Иконка — символ или эмодзи', 'Icon — symbol or emoji'), item?.icon || '✧');
        const instruction = textField(view.body, tr('Инструкция модели', 'Model instruction'), item?.instruction || '', true);
        name.placeholder = tr('Например: Сократить', 'For example: Shorten');
        instruction.placeholder = tr('Сократи черновик, сохранив его смысл и ключевые действия.', 'Shorten the draft while preserving its meaning and key actions.');
        for (const [key, input] of Object.entries({ name, icon, instruction })) {
            input.maxLength = WRITING_LIMITS[key]; input.required = true; input.dataset.customField = key;
            input.oninput = () => input.setCustomValidity('');
        }
        const cleanIcon = () => {
            const position = icon.selectionStart;
            const caret = cleanButtonIcon(icon.value.slice(0, position ?? icon.value.length)).length;
            icon.value = cleanButtonIcon(icon.value); icon.setCustomValidity('');
            if (position !== null) icon.setSelectionRange(caret, caret);
        };
        icon.oninput = event => { if (!event.isComposing) cleanIcon(); };
        icon.addEventListener('compositionend', cleanIcon);
        icon.addEventListener('keydown', event => { if (event.key === 'Enter') event.preventDefault(); });
        icon.addEventListener('beforeinput', event => {
            if (event.inputType === 'insertLineBreak' || event.inputType === 'insertParagraph') event.preventDefault();
        });
        note(view.body, tr('Иконка: только цифры, символы и эмодзи, без букв, пробелов и переносов строк.',
            'Icon: numbers, symbols and emoji only. No letters, spaces or line breaks.'));
        note(view.body, tr('Опишите только задачу. Контекст и настройки текста добавятся автоматически; отдельный шаблон не нужен.',
            'Describe only the task. Context and writing settings are added automatically; no template is needed.'));
        view.button(tr('Отмена', 'Cancel'), () => view.close());
        view.button(tr('Сохранить', 'Save'), () => {
            cleanIcon();
            for (const input of [name, icon, instruction]) {
                input.setCustomValidity(input.value.trim() && input.value.length <= input.maxLength ? '' : tr(`Заполните поле: не более ${input.maxLength} символов.`, `Fill in this field: up to ${input.maxLength} characters.`));
                if (!input.reportValidity()) return;
            }
            const items = customButtons(getSettings().customButtons);
            if (item && !items.some(current => current.id === item.id)) { view.close(); return; }
            if (!item && items.length >= WRITING_LIMITS.buttons) { view.close(); return; }
            let id = item?.id;
            while (!id || (!item && items.some(current => current.id === id))) id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
            const next = { id, name: name.value.trim(), icon: icon.value.trim(), instruction: instruction.value.trim(), enabled: item ? items.find(current => current.id === id).enabled : true };
            persist(item ? items.map(current => current.id === id ? next : current) : [...items, next]);
            view.close(); parent.querySelector(`[data-custom-edit="${id}"]`)?.focus();
        }, true).dataset.customSave = '';
    }
    renderList();
}
