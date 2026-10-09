import { GenerationError } from './core.js';

// Approved direction: preserve history by default; rewriting is an explicit action.
export function transitionChat(chat, mode) {
    if (!['me', 'continue', 'rewrite'].includes(mode)) throw new GenerationError('invalid_action');
    if (mode !== 'rewrite') return chat.slice();
    const last = chat.at(-1);
    if (!last || last.is_user || last.is_system) throw new GenerationError('no_reply');
    return chat.slice(0, -1);
}

export function transitionText(kind, selected) {
    const label = kind === 'ft' ? 'FAST TRAVEL' : 'TIME SKIP';
    if (selected.surprise) return `${label}: Move to a logical new location and introduce an unexpected encounter.`;
    return `${label}: ${selected.title}. Time passed: ${selected.time}. Author direction: ${selected.summary}.`;
}

export function appendTransition(draft, cue) {
    const text = draft ? `${draft}\n\n${cue}` : cue;
    // A scene transition must never execute a slash command from author prose.
    return text.trimStart().startsWith('/') ? '\u200B' + text : text;
}

export function assertTransitionChat(snapshot, chat) {
    if (snapshot.length !== chat.length || snapshot.some((message, index) =>
        message.ref !== chat[index] || message.mes !== chat[index].mes || message.swipeId !== chat[index].swipe_id)) {
        throw new GenerationError('stale_scene');
    }
}

export function captureTransitionChat(chat) {
    return chat.map(ref => ({ ref, mes: ref.mes, swipeId: ref.swipe_id }));
}
