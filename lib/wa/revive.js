import fs from 'fs';
import path from 'path';
import { repairCreds } from '../wa-robust.js';
import { hasPending, isRestarting } from './session-guard.js';
const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function reviveSubs({ log = console.log, concurrency = 2 } = {}) {
    const base = path.resolve(process.cwd(), 'Sessions', 'Subs');
    if (!fs.existsSync(base))
        return 0;
    const { startSubBot } = await import('../../cmds/socket/subbot.js');
    const db = (await import('../system/database.js')).default;
    global.conns = global.conns || [];
    global.__reviving ||= new Set();
    const queue = [];
    for (const name of fs.readdirSync(base)) {
        if (!/^\d{6,15}$/.test(name))
            continue;
        const dir = path.join(base, name);
        if (hasPending(dir) || isRestarting(name) || global.__reviving?.has(name))
            continue;
        const fix = repairCreds(dir);
        if (!fix.ok || !fix.registered)
            continue;
        if (global.connsById?.has(name) || global.conns.some(c => c && c.userId === name && !c.__superseded))
            continue;
        queue.push(name);
    }
    let started = 0, cursor = 0;
    const workers = Array.from({ length: Math.max(1, Math.min(3, Number(concurrency) || 2)) }, async () => {
        while (cursor < queue.length) {
            const name = queue[cursor++];
            if (global.__reviving.has(name))
                continue;
            global.__reviving.add(name);
            let keepMarker = false;
            try {
                const st = await db.getSettings(`${name}@s.whatsapp.net`);
                const type = st?.type === 'Premium' || Number(st?.botprem) === 1 ? 'Premium' : 'Sub';
                await startSubBot(null, null, '', false, name, '', false, type);
                started++;
                keepMarker = true;
            }
            catch (e) {
                log(`[revive] ${name}: ${e?.message || e}`);
            }
            finally {
                if (keepMarker) {
                    const timer = setTimeout(() => global.__reviving?.delete(name), 20_000);
                    timer.unref?.();
                }
                else
                    global.__reviving.delete(name);
            }
            await sleep(1200 + Math.floor(Math.random() * 500));
        }
    });
    await Promise.all(workers);
    if (started)
        log(`[revive] ${started} subbot(s) de WhatsApp reconectados`);
    return started;
}
