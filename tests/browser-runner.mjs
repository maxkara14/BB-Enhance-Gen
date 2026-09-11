import { createServer } from 'node:http';
import { readFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const chrome = process.env.CHROME_PATH || ['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
if (!chrome) throw new Error('Set CHROME_PATH to a Chromium browser executable.');
const files = new Set(['/index.js','/core.js','/ui.js','/style.css','/tests/browser.html','/tests/browser.js']);
// Use the installed Sorter's actual discovery/title functions, not a guessed selector.
const sorterSource = await readFile(resolve(root, '../BB-Extension-Sorter/index.js'), 'utf8');
const sorterContract = ['normalizeText', 'cleanTitle', 'isRealExtension', 'getTitle', 'getExtensionKey'].map(name => {
    const start = sorterSource.indexOf(`function ${name}(`);
    assert.ok(start >= 0, `Installed Sorter exposes ${name}`);
    return 'export ' + sorterSource.slice(start, sorterSource.indexOf('\n}', start) + 2);
}).join('\n');
const server = createServer(async (req,res) => {
    const path = new URL(req.url,'http://localhost').pathname;
    if (path === '/shared.js') { res.setHeader('Content-Type', 'text/javascript'); res.end('export const ConnectionManagerRequestService = globalThis.__profileService;'); return; }
    if (path === '/tests/sorter-contract.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(sorterContract); return; }
    if (path === '/jquery.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(await readFile(resolve(root, '../../../../lib/jquery-3.5.1.min.js'))); return; }
    if (!files.has(path)) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript; charset=utf-8':path.endsWith('.css')?'text/css':'text/html; charset=utf-8');
    res.end(await readFile(join(root,path)));
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const profile=await mkdtemp(join(tmpdir(),'bb-enhance-browser-'));
const browser=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
try {
    let port;
    for(let i=0;i<100;i++){try {port=(await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break;} catch {await sleep(100);}}
    assert.ok(port,'Chrome DevTools started');
    const pages=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
    await new Promise((done,reject)=>{ws.addEventListener('open',done,{once:true});ws.addEventListener('error',reject,{once:true});});
    let id=0;const pending=new Map();
    ws.addEventListener('message',event=>{const message=JSON.parse(event.data);if(pending.has(message.id)){const {done,reject}=pending.get(message.id);pending.delete(message.id);message.error?reject(new Error(message.error.message)):done(message.result);}});
    const command=(method,params={})=>new Promise((done,reject)=>{const request=++id;pending.set(request,{done,reject});ws.send(JSON.stringify({id:request,method,params}));});
    await command('Page.enable');
    if(process.env.ENHANCE_MOBILE) await command('Emulation.setDeviceMetricsOverride',{width:375,height:667,deviceScaleFactor:1,mobile:true});
    else await command('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
    await command('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/tests/browser.html`});
    let suite;
    for(let i=0;i<600;i++) {
        const response=await command('Runtime.evaluate',{expression:'window.__suite',returnByValue:true}); suite=response.result?.value;
        if(suite?.done)break;await sleep(100);
    }
    console.log(JSON.stringify(suite,null,2));
    if(process.env.ENHANCE_SCREENSHOT){
        const views = process.env.ENHANCE_VIEW === 'review' ? ['settings', 'menu'] : [process.env.ENHANCE_VIEW || 'preview'];
        for (const view of views) {
            const show = { settings: '__showSettings', menu: '__showMenu', custom: '__showCustom', direction: '__showDirection' }[view] || '__showPreview';
            const opened = await command('Runtime.evaluate',{expression:`window.${show}()`,awaitPromise:true});
            assert.ok(!opened.exceptionDetails, 'Screenshot view opened');
            const shot=await command('Page.captureScreenshot',{format:'png'});
            const file = views.length > 1 ? process.env.ENHANCE_SCREENSHOT.replace(/\.png$/, `-${view}.png`) : process.env.ENHANCE_SCREENSHOT;
            await writeFile(file,Buffer.from(shot.data,'base64'));
        }
    }
    assert.ok(suite?.done,'Browser suite completed');
    assert.equal(suite.errors.length,0,'No runtime errors');
    assert.equal(suite.results.filter(r=>!r.pass).length,0,'All browser scenarios passed');
} finally {
    ws?.close();browser.kill();server.close();
    await sleep(700);
    const resolved=resolve(profile), tempRoot=resolve(tmpdir())+sep;
    if(!resolved.startsWith(tempRoot)||!resolved.includes('bb-enhance-browser-'))throw new Error('Refusing profile cleanup outside the temporary directory');
    await rm(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
