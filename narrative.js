import { cleanNarrative, GenerationError, stripCues } from './core.js';

function cleanText(text) {
    // Some chat styles use Hangul fillers as word separators. Do not copy them
    // into player drafts; preserve actual Unicode letters, emoji and formatting.
    return cleanNarrative(String(text || '').replace(/[\u3164\uffa0]/g, ' '));
}

// Parse only a detached template: context markup is never attached or executed.
export function narrativeContext(text) {
    const source = cleanText(stripCues(text))
        .replace(/```(?:html|javascript|js|css)\b[^\n]*\n[\s\S]*?(?:```|$)/gi, '').trim();
    if (!/<\/?(?:p|div|span|br|b|i|em|strong|details|summary|script|style|iframe|object|embed|template|img|table|section)\b/i.test(source)) return source;
    const template = document.createElement('template');
    template.innerHTML = source;
    template.content.querySelectorAll('script,style,iframe,object,embed,template,link,meta,img,[hidden],[aria-hidden="true"]').forEach(node => node.remove());
    template.content.querySelectorAll('*').forEach(node => {
        if (node.style.display === 'none' || node.style.visibility === 'hidden') node.remove();
    });
    template.content.querySelectorAll('*').forEach(node => {
        if (node instanceof HTMLUnknownElement) node.replaceWith(node.outerHTML);
    });
    template.content.querySelectorAll('br').forEach(node => node.replaceWith('\n'));
    template.content.querySelectorAll('p,div,section,article,li,tr,blockquote,details,summary,h1,h2,h3').forEach(node => node.append('\n'));
    return cleanText(template.content.textContent);
}

export function validateNarrative(text) {
    // Reject clear technical output; do not guess which unknown tags are prose.
    if (/<\/?(?:script|style|iframe|object|embed|html|body)\b/i.test(text)
        || /```(?:html|javascript|js|css|json)\b/i.test(text)) throw new GenerationError('non_narrative');
    return cleanText(text);
}
