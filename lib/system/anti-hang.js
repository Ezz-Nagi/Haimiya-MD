import fs from 'fs';
import path from 'path';
import { repairCreds } from '../wa-robust.js';
import { capSessionFiles, MAX_SESSION_FILES } from '../wa/auth-store.js';
import { hasPending, isRestarting, isReviving, markRestarting } from '../wa/session-guard.js';
const SILENT_MS = 12 * 60 * 1000;
const CHECK_EVERY = 3 * 60 * 1000;
const MAX_REPAIR_PER_HOUR = 4;
const repairs = new Map();
function sessionDirs() {
    const root = path.join(process.cwd(), 'Sessions');
    const out = [];
    for (const folder of ['Subs']) {
        const base = path.join(root, folder);
        if (!fs.existsSync(base))
            continue;
        for (const name of fs.readdirSync(base)) {
            if (name.startsWith('_') || name.startsWith('.'))
                continue;
            const dir = path.join(base, name);
            if (fs.existsSync(path.join(dir, 'creds.json'))) {
                out.push({ id: String(name).replace(/\D/g, ''), dir, folder });
            }
        }
    }
    return out.filter(x => x.id.length >= 8);
}
function dirSizeMb(dir) {
    let total = 0;
    try {
        const walk = (d) => {
            for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
                const p = path.join(d, ent.name);
                try {
                    if (ent.isDirectory())
                        walk(p);
                    else
                        total += fs.statSync(p).size;
                }
                catch { }
            }
        };
        walk(dir);
    }
    catch { }
    return total / (1024 * 1024);
}
function cleanSessionJunk(dir) {
    let removed = 0;
    try {
        for (const name of fs.readdirSync(dir)) {
            if (/\.tmp$/i.test(name) || name.endsWith('-journal') || name === 'app-state-sync-version-tmp') {
                try {
                    fs.rmSync(path.join(dir, name), { force: true });
                    removed++;
                }
                catch { }
            }
        }
    }
    catch { }
    return removed;
}
function canRepair(id) {
    const now = Date.now();
    let e = repairs.get(id);
    if (!e || now - e.windowStart > 60 * 60 * 1000) {
        e = { n: 0, windowStart: now };
        repairs.set(id, e);
    }
    if (e.n >= MAX_REPAIR_PER_HOUR)
        return false;
    e.n++;
    return true;
}
export function markBotActivity(sock, { isCommand = false } = {}) {
    try {
        const now = Date.now();
        sock.lastMsgAt = now;
        if (isCommand)
            sock.lastCommandAt = now;
        const id = String(sock.userId || sock.user?.id || '').split(':')[0].replace(/\D/g, '');
        if (id) {
            global.__botActivity = global.__botActivity || new Map();
            const prev = global.__botActivity.get(id) || {};
            global.__botActivity.set(id, {
                lastMsgAt: now,
                lastCommandAt: isCommand ? now : (prev.lastCommandAt || 0)
            });
        }
    }
    catch { }
}
async function botTypeOf(id) {
    try {
        const db = (await import('./database.js')).default;
        const st = await db.getSettings(`${id}@s.whatsapp.net`);
        return st?.type === 'Premium' || Number(st?.botprem) === 1 ? 'Premium' : 'Sub';
    }
    catch {
        return 'Sub';
    }
}
async function restartSub(id, dir) {
    if (!markRestarting(id))
        return false;
    try {
        repairCreds(dir);
        cleanSessionJunk(dir);
        try {
            capSessionFiles(dir, MAX_SESSION_FILES);
        }
        catch { }
        console.warn(`[anti-hang] Reiniciando subbot ${id}…`);
        const { startSubBot } = await import('../../cmds/socket/subbot.js');
        await startSubBot(null, null, '', false, id, '', false, await botTypeOf(id));
        return true;
    }
    catch (e) {
        console.error(`[anti-hang] Falló restart ${id}:`, e?.message || e);
        return false;
    }
    finally {
        const timer = setTimeout(() => global.__restarting?.delete(String(id).replace(/\D/g, '')), 20_000);
        timer.unref?.();
    }
}
async function isAlive(conn) {
    try {
        if (!conn?.user)
            return false;
        const ws = conn.ws;
        if (ws) {
            if (typeof ws.isOpen === 'boolean') {
                if (!ws.isOpen)
                    return false;
            }
            else {
                const rs = ws.readyState ?? ws.socket?.readyState;
                if (rs !== undefined && rs !== 1)
                    return false;
            }
        }
        await Promise.race([
            Promise.resolve(conn.query({ tag: 'iq', attrs: { to: 's.whatsapp.net', type: 'get', xmlns: 'w:p' }, content: [{ tag: 'ping', attrs: {} }] }, 15_000)),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 20_000))
        ]);
        return true;
    }
    catch {
        return false;
    }
}
export function diagnoseSub(id, dir, conn) {
    const sizeMb = dirSizeMb(dir);
    const now = Date.now();
    const last = conn?.lastMsgAt || global.__botActivity?.get(id)?.lastMsgAt || 0;
    const silentMin = last ? Math.round((now - last) / 60000) : null;
    const issues = [];
    if (!conn)
        issues.push('no_en_memoria');
    if (conn && !conn.user?.id)
        issues.push('sin_user');
    if (silentMin != null && silentMin >= 12)
        issues.push(`silencio_${silentMin}min`);
    if (sizeMb > 80)
        issues.push(`carpeta_grande_${sizeMb.toFixed(0)}mb`);
    try {
        const n = fs.readdirSync(dir).length;
        if (n > 400)
            issues.push(`muchos_archivos_${n}`);
    }
    catch { }
    return { id, sizeMb, silentMin, issues, last };
}
export function pruneAllSessionsLight() {
    for (const folder of ['Owner', 'Subs']) {
        const base = path.join(process.cwd(), 'Sessions', folder);
        if (!fs.existsSync(base))
            continue;
        for (const name of fs.readdirSync(base)) {
            if (name.startsWith('_') || name.startsWith('.'))
                continue;
            const dir = path.join(base, name);
            if (!fs.existsSync(path.join(dir, 'creds.json')))
                continue;
            try {
                const removed = capSessionFiles(dir, MAX_SESSION_FILES);
                if (removed)
                    console.warn(`[anti-hang] ${folder}/${name}: -${removed} archivos sobrantes (límite ${MAX_SESSION_FILES})`);
            }
            catch { }
        }
    }
}
export async function runAntiHangPass() {
    const sessions = sessionDirs();
    const conns = Array.isArray(global.conns) ? global.conns : [];
    const byId = global.connsById instanceof Map ? new Map(global.connsById) : new Map();
    for (const c of conns) {
        const id = String(c.userId || c.user?.id || '').split(':')[0].replace(/\D/g, '');
        if (id)
            byId.set(id, c);
    }
    for (const { id, dir } of sessions) {
        const conn = byId.get(id);
        const act = global.__botActivity?.get(id);
        const last = conn?.lastMsgAt || act?.lastMsgAt || 0;
        const shouldWatch = !!conn || (last && Date.now() - last < 24 * 3600 * 1000);
        if (!shouldWatch)
            continue;
        const diag = diagnoseSub(id, dir, conn);
        if (hasPending(dir) || isRestarting(id) || isReviving(id))
            continue;
        if (conn && (!last || Date.now() - last > SILENT_MS)) {
            if (await isAlive(conn)) {
                conn.lastMsgAt = Date.now();
                continue;
            }
            console.warn(`[anti-hang] Subbot ${id} no responde`, diag.issues.join(', ') || 'sin actividad');
            if (!canRepair(id)) {
                console.warn(`[anti-hang] ${id} límite de reparaciones esta hora`);
                continue;
            }
            const rm = cleanSessionJunk(dir);
            if (rm)
                console.warn(`[anti-hang] ${id}: eliminados ${rm} temporales`);
            await restartSub(id, dir);
            continue;
        }
        if (!conn && act && Date.now() - act.lastMsgAt < 6 * 3600 * 1000) {
            console.warn(`[anti-hang] ${id} sesión en disco pero no en memoria → arranque`);
            if (canRepair(id))
                await restartSub(id, dir);
        }
    }
}
export function startAntiHangLoop() {
    if (global.__antiHangLoop)
        return;
    global.__antiHangLoop = setInterval(() => {
        try {
            pruneAllSessionsLight();
        }
        catch { }
        runAntiHangPass().catch(e => console.error('[anti-hang]', e?.message || e));
    }, CHECK_EVERY);
    if (global.__antiHangLoop.unref)
        global.__antiHangLoop.unref();
    console.log('[anti-hang] vigilancia de subbots activa');
}
