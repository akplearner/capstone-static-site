import { chromium } from 'playwright';
const OUT='/tmp/claude-0/-home-user-capstone-static-site/f833204c-d5b4-525b-8579-3963cb1e3dff/scratchpad';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({viewport:{width:390,height:844}, storageState:`${OUT}/state.json`})).newPage();
p.on('pageerror', e => console.log('PAGEERROR:', e.message, '\n', (e.stack||'').split('\n').slice(0,6).join('\n')));
p.on('console', m => { if (m.type()==='error') console.log('CONSOLE:', m.text().slice(0,400)); });
await p.goto('http://localhost:3210/courses/server-plus?tab=tasks', { waitUntil:'networkidle' });
await p.waitForTimeout(1500);
await b.close();
