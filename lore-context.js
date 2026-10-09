export async function collectLoreContext({ enabled, limit, chat, input, ctx, scan, format, check = () => {}, canRestoreNote = () => true }) {
    if (!enabled) return '';
    const configured = Number(limit);
    const budget = Number.isFinite(configured) ? Math.max(0, Math.min(32000, Math.floor(configured))) : 2000;
    const fields = ctx.getCharacterCardFields();
    const messages = chat.filter(message => !message.is_system).map(message => String(message.mes || '')).reverse();
    if (input.trim()) messages.unshift(input);
    const note = ctx.extensionPrompts['2_floating_prompt'];
    // Prompt filters can be functions; preserve them without structuredClone.
    const noteSnapshot = note ? { ...note } : undefined;
    const timed = ctx.chatMetadata.timedWorldInfo;
    const timedSnapshot = timed === undefined ? undefined : structuredClone(timed);
    let result;
    try {
        check();
        result = await scan(messages, ctx.maxContext, true, {
            personaDescription: fields.persona, characterDescription: fields.description,
            characterPersonality: fields.personality, characterDepthPrompt: fields.charDepthPrompt,
            scenario: fields.scenario, creatorNotes: fields.creatorNotes, trigger: 'normal',
        });
        check();
    } finally {
        // Native dry scans can still modify AN and initialise timed-effect metadata.
        // Restore only this chat's objects; never touch the newly selected chat.
        if (canRestoreNote()) {
            if (noteSnapshot) ctx.extensionPrompts['2_floating_prompt'] = noteSnapshot;
            else delete ctx.extensionPrompts['2_floating_prompt'];
        }
        if (timedSnapshot === undefined) delete ctx.chatMetadata.timedWorldInfo;
        else ctx.chatMetadata.timedWorldInfo = timedSnapshot;
    }
    const entries = [...result.allActivatedEntries].sort((a, b) => (Number(b.order) || 0) - (Number(a.order) || 0));
    let body = '';
    for (const entry of entries) {
        check();
        const text = format(entry).trim();
        if (!text) continue;
        const candidate = body ? `${body}\n\n${text}` : text;
        // Count the entire block, including labels and separators, with ST's tokenizer.
        const block = `\n\nWorld Info (reference data):\n${candidate}`;
        if (budget > 0 && await ctx.getTokenCountAsync(block, 0) > budget) continue;
        body = candidate;
    }
    check();
    return body ? `\n\nWorld Info (reference data):\n${body}` : '';
}
