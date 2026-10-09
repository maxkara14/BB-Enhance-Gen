// Isolated browser regression fixture: real extension UI/modules, fake chat and API.
// Run: node tests/browser-server.mjs; open http://127.0.0.1:8123.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const stub = `
export let generating = false;
export const isGenerating = () => generating;
export function ensureSwipes(m) { m.swipes ??= [m.mes]; m.swipe_id ??= 0; m.swipe_info ??= [{ extra: structuredClone(m.extra || {}) }]; }
export function syncMesToSwipe() { const m = window.fixture.ctx.chat.at(-1); m.swipes[m.swipe_id] = m.mes; }
export const regex_placement = { WORLD_INFO: 5 };
export const getRegexedString = text => text;
export async function checkWorldInfo() { return { allActivatedEntries: new Set([{ content: 'LORE_SENTINEL: Garden keeper is named Robin.', order: 100 }]) }; }
export function setGenerating(value) { generating = value; }
`;
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/style.css"><style>body{background:#151519;color:#eee;font:16px system-ui;margin:20px}#send_form{position:fixed;bottom:16px;left:16px;right:16px;display:flex;align-items:center;gap:12px}#send_textarea{width:60%;height:70px;background:#242429;color:#eee}#extensions_settings2{max-width:620px}.text_pole{background:#242429;color:#eee;padding:8px;border:1px solid #666;border-radius:4px;max-width:100%;box-sizing:border-box}.menu_button{padding:8px}#results{max-height:30vh;overflow:auto}#scene{padding:20px}</style></head><body>
<h1>Enhance Gen — isolated regression fixture</h1><pre id="results">Running…</pre><div id="scene">Player: Wait here.<br>Keeper: The bridge collapsed.</div><div id="extensions_settings2"></div><div id="send_form"><div id="options_button"></div><textarea id="send_textarea"></textarea></div>
<script type="module" src="/tests/browser-fixture.js"></script></body></html>`;
const server = createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    try {
        if (pathname === '/') { res.setHeader('Content-Type', 'text/html'); return res.end(html); }
        if (pathname === '/native-stub.js') { res.setHeader('Content-Type', 'text/javascript'); return res.end(stub); }
        const file = resolve(root, '.' + pathname);
        if (!file.startsWith(root.endsWith(sep) ? root : root + sep)) { res.writeHead(403); return res.end(); }
        let source = await readFile(file, 'utf8');
        if (pathname === '/index.js') source = source.replace(/from '(?:\.\.\/){2,4}(?:script\.js|world-info\.js|regex\/engine\.js)'/g, "from '/native-stub.js'");
        res.setHeader('Content-Type', pathname.endsWith('.css') ? 'text/css' : 'text/javascript');
        res.end(source);
    } catch { res.writeHead(404); res.end(); }
});
server.listen(8123, '127.0.0.1', () => console.log('Isolated Enhance Gen fixture: http://127.0.0.1:8123'));
