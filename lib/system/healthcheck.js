import fs from 'fs';
import path from 'path';
const STATE = path.join(process.cwd(), 'database', 'health.json');
let cache = null;
let saveTimer = null;
let saveBusy = false;
function load() {
    if (cache)
        return cache;
    try {
        cache = JSON.parse(fs.readFileSync(STATE, 'utf8'));
    }
    catch {
        cache = { lastWaMsg: 0, alerts: [] };
    }
    return cache;
}
function scheduleSave() {
    if (saveTimer)
        return;
    saveTimer = setTimeout(async () => {
        saveTimer = null;
        if (saveBusy)
            return scheduleSave();
        saveBusy = true;
        try {
            const data = JSON.stringify(load(), null, 2);
            await fs.promises.mkdir(path.dirname(STATE), { recursive: true });
            const tmp = STATE + '.tmp';
            await fs.promises.writeFile(tmp, data);
            await fs.promises.rename(tmp, STATE);
        }
        catch (e) {
            console.error('[health] No se pudo guardar el estado:', e?.message || e);
        }
        finally {
            saveBusy = false;
        }
    }, 1500);
    saveTimer.unref?.();
}
export function flushHealth() {
    if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
    }
    try {
        fs.mkdirSync(path.dirname(STATE), { recursive: true });
        const tmp = STATE + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(load(), null, 2));
        fs.renameSync(tmp, STATE);
    }
    catch (e) {
        console.error('[health] No se pudo cerrar el estado:', e?.message || e);
    }
}
export function touchWa() {
    load().lastWaMsg = Date.now();
    scheduleSave();
}
export function snapshot() {
    const d = load();
    const now = Date.now();
    const waAge = d.lastWaMsg ? now - d.lastWaMsg : null;
    const hungWa = waAge != null && waAge > 45 * 60 * 1000 && global.waReady;
    return {
        waReady: !!global.waReady,
        lastWaMsg: d.lastWaMsg || null,
        waSilentMin: waAge != null ? Math.round(waAge / 60000) : null,
        hungWa,
        uptimeSec: Math.floor(process.uptime()),
        memMb: Math.round(process.memoryUsage().rss / 1024 / 1024)
    };
}
export function startHealthLoop() {
    if (global.__healthLoop)
        return;
    global.__healthLoop = setInterval(() => {
        try {
            const s = snapshot();
            if (s.hungWa) {
                console.warn(`[health] WA sin mensajes hace ${s.waSilentMin} min (sesión puede estar colgada)`);
                try {
                    const { pushNotification } = require('./promos.js');
                }
                catch { }
                import('./promos.js').then(m => {
                    m.pushNotification({
                        userId: 'dev',
                        type: 'health',
                        text: `WhatsApp sin actividad hace ${s.waSilentMin} min. Revisa la sesión.`
                    });
                }).catch(() => { });
            }
        }
        catch { }
    }, 5 * 60 * 1000);
    if (global.__healthLoop.unref)
        global.__healthLoop.unref();
}
