// One modal lifecycle: cancellation, focus restoration, keyboard access and cleanup.
export function openModal(title, { signal, cancelLabel = 'Cancel', wide = false } = {}) {
    const previousFocus = document.activeElement;
    const overlay = document.createElement('div');
    overlay.className = 'bb-modal-overlay bb-eg-dialog';
    const box = document.createElement('section');
    box.className = 'bb-modal-box' + (wide ? ' bb-eg-wide' : '');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', title);
    box.tabIndex = -1;
    const heading = document.createElement('h3');
    heading.className = 'bb-modal-title'; heading.textContent = title;
    const body = document.createElement('div'); body.className = 'bb-eg-dialog-body';
    const status = document.createElement('p'); status.className = 'bb-eg-status'; status.setAttribute('role', 'status');
    const actions = document.createElement('div'); actions.className = 'bb-preview-actions';
    box.append(heading, body, status, actions); overlay.append(box);
    let resolve, closed = false;
    const result = new Promise(done => { resolve = done; });
    const cleanup = new Set();
    function close(value = null) {
        if (closed) return;
        closed = true;
        signal?.removeEventListener('abort', abort);
        cleanup.forEach(fn => fn()); overlay.remove();
        // The triggering toolbar button can still be disabled until its task unwinds.
        queueMicrotask(() => {
            const canRestore = previousFocus?.isConnected && previousFocus !== document.body && !previousFocus.disabled && getComputedStyle(previousFocus).visibility !== 'hidden';
            const target = canRestore ? previousFocus : document.getElementById('bb-eg-toggle-btn');
            target?.focus();
        });
        resolve(value);
    }
    const abort = () => close();
    function button(label, handler, primary = false) {
        const el = document.createElement('button'); el.type = 'button';
        el.className = primary ? 'bb-modal-ok' : 'bb-modal-cancel'; el.textContent = label;
        el.addEventListener('click', handler); actions.append(el); return el;
    }
    button(cancelLabel, () => close());
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.addEventListener('keydown', e => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
        if (e.key !== 'Tab') return;
        const focusable = [...box.querySelectorAll('button, input, textarea, select, [tabindex="0"]')].filter(el => !el.disabled && !el.hidden);
        const first = focusable[0], last = focusable.at(-1);
        if (!first) { e.preventDefault(); box.focus(); }
        else if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    if (signal?.aborted) close();
    else {
        document.body.append(overlay); overlay.style.opacity = '1';
        signal?.addEventListener('abort', abort, { once: true });
        queueMicrotask(() => { if (!closed) (box.querySelector('input, textarea, button') || box).focus(); });
    }
    return { overlay, box, body, status, actions, button, close, result, cleanup, get closed() { return closed; } };
}

export function textField(parent, label, value = '', multiline = false) {
    const wrap = document.createElement('label'); wrap.className = 'bb-eg-field';
    const caption = document.createElement('span'); caption.textContent = label;
    const input = document.createElement(multiline ? 'textarea' : 'input');
    input.className = 'text_pole'; input.value = value;
    if (multiline) input.rows = 6;
    wrap.append(caption, input); parent.append(wrap); return input;
}
