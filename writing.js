// Editable instructions are plain text. Context and output settings stay in the shared builder.
export const WRITING_LIMITS = Object.freeze({ buttons: 20, name: 48, icon: 16, instruction: 8000 });

// Keep emoji joiners, variation selectors and flag tags, but no letters or spacing.
export function cleanButtonIcon(value) {
    return typeof value === 'string' ? value.replace(/[^\p{N}\p{P}\p{S}\p{M}\u200d\u{e0020}-\u{e007f}]/gu, '') : '';
}

export const DEFAULT_WRITING_INSTRUCTIONS = Object.freeze({
    enhance: `Expand the user's brief draft into a rich, immersive literary segment.
Expand actions with sensory details, internal thoughts, micro-expressions and physical sensations.
Polish the player's spoken dialogue to match their personality.
Only expand the current moment. Do not advance the plot or speak, act or react for other characters.
Follow the output length setting. Avoid repetition and restating the same beat.
You may use HTML formatting if it matches the chat style.`,
    improve: `Edit and polish the draft to improve its literary flow, grammar and phrasing.
Paraphrase only. Do not add new plot, actions, thoughts or dialogue.
Do not answer the previous message or advance time.
Keep approximately the same length as the draft (within 10%). Do not pad with extra descriptions.
Preserve existing HTML formatting and markdown.`,
});

export function writingInstruction(type, overrides) {
    if (!Object.hasOwn(DEFAULT_WRITING_INSTRUCTIONS, type)) return '';
    const fallback = DEFAULT_WRITING_INSTRUCTIONS[type];
    const value = overrides && Object.hasOwn(overrides, type) ? overrides[type] : undefined;
    return typeof value === 'string' && value.trim() && value.length <= WRITING_LIMITS.instruction ? value.trim() : fallback;
}

export function customButtons(value) {
    if (!Array.isArray(value)) return [];
    const ids = new Set();
    return value.filter(item => {
        if (!item || typeof item !== 'object' || typeof item.id !== 'string'
            || !/^custom-[a-z0-9-]{1,64}$/.test(item.id) || ids.has(item.id)) return false;
        if (['name', 'icon', 'instruction'].some(key => typeof item[key] !== 'string'
            || !item[key].trim() || item[key].length > WRITING_LIMITS[key])) return false;
        ids.add(item.id); return true;
    }).slice(0, WRITING_LIMITS.buttons).map(({ id, name, icon, instruction, enabled }) => ({
        id, name: name.trim(), icon: cleanButtonIcon(icon) || '✧', instruction: instruction.trim(), enabled: enabled !== false,
    }));
}
