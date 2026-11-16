import fs from 'fs';
import path from 'path';
import { hasPending } from './wa/session-guard.js';
const readJson = f => {
    try {
        return JSON.parse(fs.readFileSync(f, 'utf8'));
    }
    catch {
        return null;
    }
};
export const credsValid = c => !!(c && typeof c === 'object' && c.noiseKey && c.signedIdentityKey && c.advSecretKey);
export function repairCreds(dir) {
    const f = path.join(dir, 'creds.json'), b = f + '.bak', cur = readJson(f);
    if (credsValid(cur))
        return { ok: true, restored: false, registered: cur.registered === true };
    const bak = readJson(b);
    if (credsValid(bak)) {
        try {
            fs.copyFileSync(b, f);
        }
        catch {
            return { ok: false, restored: false, registered: false };
        }
        return { ok: true, restored: true, registered: bak.registered === true };
    }
    return { ok: false, restored: false, registered: false };
}
export function saveCredsSafe(dir, saveCreds) {
    const f = path.join(dir, 'creds.json');
    return async (...args) => {
        await saveCreds(...args);
        try {
            const j = readJson(f);
            if (credsValid(j)) {
                fs.writeFileSync(f + '.bak.tmp', JSON.stringify(j));
                fs.renameSync(f + '.bak.tmp', f + '.bak');
            }
        }
        catch { }
    };
}
export function quarantine(dir) {
    try {
        if (!fs.existsSync(dir))
            return null;
        const authDir = path.resolve(dir);
        const authStore = global.__authStores?.get(authDir);
        try {
            authStore?.flush?.();
        }
        catch { }
        if (authStore?.timer)
            clearTimeout(authStore.timer);
        global.__authStores?.delete(authDir);
        const dest = path.join(path.dirname(dir), '_invalid', `${path.basename(dir)}-${Date.now()}`);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.renameSync(dir, dest);
        return dest;
    }
    catch (e) {
        console.error('[wa-robust] no se pudo apartar la sesión; se conserva intacta:', e?.message || e);
        return null;
    }
}
export const watchdogError = reason => Object.assign(new Error('watchdog: ' + reason), { output: { statusCode: 408 } });
const RX_EVENTS = ['messages.upsert', 'messages.update', 'message-receipt.update', 'presence.update', 'chats.update', 'chats.upsert', 'contacts.update', 'groups.update', 'group-participants.update'];
export function attachWatchdog(sock, { restart, name = 'sock', idleMs = 12 * 60_000, maxAgeMs = 0, tickMs = 45_000, log = () => { } } = {}) {
    let last = Date.now(), born = Date.now(), lastPing = 0, buffering = 0, stopped = false, restarting = false;
    const touch = () => { last = Date.now(); };
    for (const ev of RX_EVENTS) {
        try {
            sock.ev.on(ev, touch);
        }
        catch { }
    }
    const isOpen = () => {
        const ws = sock.ws;
        if (!ws)
            return false;
        if (typeof ws.isOpen === 'boolean')
            return ws.isOpen;
        const rs = ws.readyState !== undefined ? ws.readyState : (ws.socket ? ws.socket.readyState : undefined);
        return rs === undefined ? true : rs === 1;
    };
    const go = reason => {
        if (restarting || stopped || global.shuttingDown)
            return;
        const id = String(sock.userId || sock.user?.id || sock.user?.lid || '').split(':')[0].replace(/\D/g, '');
        if (id && global.__reviving?.has(id))
            return;
        if (sock.__sessionDir && hasPending(sock.__sessionDir))
            return;
        global.__restarting ||= new Set();
        if (id && global.__restarting.has(id))
            return;
        if (id)
            global.__restarting.add(id);
        restarting = true;
        try {
            global.__authStores?.get(path.resolve(sock.sessionFolder || sock.__sessionDir || ''))?.flush?.();
        }
        catch (e) {
            log(`${name}: fallo flush auth: ${e?.message || e}`);
        }
        log(`${name}: reiniciando socket (${reason})`);
        try {
            restart(reason);
        }
        catch (e) {
            log(`${name}: fallo reinicio: ${e?.message || e}`);
        }
        if (id) {
            const release = setTimeout(() => global.__restarting?.delete(id), 20_000);
            release.unref?.();
        }
    };
    const timer = setInterval(async () => {
        if (stopped || restarting || global.shuttingDown || !sock.user)
            return;
        try {
            if (!isOpen())
                return go('WebSocket cerrado');
            if (typeof sock.ev.isBuffering === 'function' && sock.ev.isBuffering()) {
                buffering++;
                if (buffering === 3 && typeof sock.ev.flush === 'function') {
                    try {
                        sock.ev.flush();
                    }
                    catch { }
                }
                if (buffering >= 6)
                    return go('eventos retenidos');
            }
            else
                buffering = 0;
            if (Date.now() - last > idleMs && Date.now() - lastPing > idleMs) {
                lastPing = Date.now();
                const ok = await Promise.race([
                    Promise.resolve(sock.query({ tag: 'iq', attrs: { to: 's.whatsapp.net', type: 'get', xmlns: 'w:p' }, content: [{ tag: 'ping', attrs: {} }] }, 15_000)).then(() => true).catch(() => false),
                    new Promise(r => setTimeout(() => r(false), 20_000))
                ]);
                if (!ok)
                    return go('sin respuesta al ping');
                last = Date.now();
            }
            if (maxAgeMs > 0 && Date.now() - born > maxAgeMs && Date.now() - (sock.lastCommandAt || 0) > 60_000)
                return go('rotación programada');
        }
        catch { }
    }, tickMs);
    if (timer.unref)
        timer.unref();
    const stop = () => { stopped = true; clearInterval(timer); };
    try {
        sock.ev.on('connection.update', u => {
            if (u && u.connection === 'close')
                stop();
            if (u && u.connection === 'open') {
                born = Date.now();
                last = Date.now();
            }
        });
    }
    catch { }
    return stop;
}
const MAC_LOG_COOLDOWN = 60_000;
const _macLogAt = new Map();
export function isBadMacError(err) {
    const s = String(err?.message || err?.stack || err || '');
    return /Bad MAC|Failed to decrypt|Session error|doDecryptWhisper|verifyMAC|No matching sessions/i.test(s);
}
export function clearPeerSessions(sessionDir, jid) {
    if (!sessionDir || !jid || !fs.existsSync(sessionDir))
        return 0;
    const user = String(jid).split('@')[0].split(':')[0];
    if (!user)
        return 0;
    const compact = global.__authStores?.get(path.resolve(sessionDir));
    if (compact)
        return compact.deletePeer(user);
    let n = 0;
    try {
        for (const name of fs.readdirSync(sessionDir)) {
            if (!/^(session|pre-key|sender-key|app-state|sender-key-status)/i.test(name))
                continue;
            if (!name.includes(user))
                continue;
            try {
                fs.unlinkSync(path.join(sessionDir, name));
                n++;
            }
            catch { }
        }
    }
    catch { }
    return n;
}
const isCompact = dir => {
    try {
        return fs.readdirSync(dir).some(n => /^keys-[\w-]+\.json$/.test(n));
    }
    catch {
        return false;
    }
};
export function pruneStaleSignalKeys(sessionDir, maxAgeMs = 14 * 24 * 3600_000) {
    if (!sessionDir || !fs.existsSync(sessionDir) || isCompact(sessionDir))
        return 0;
    const now = Date.now();
    let n = 0;
    try {
        for (const name of fs.readdirSync(sessionDir)) {
            if (!/^(session|pre-key|sender-key)/i.test(name))
                continue;
            const f = path.join(sessionDir, name);
            try {
                const st = fs.statSync(f);
                if (now - st.mtimeMs > maxAgeMs) {
                    fs.unlinkSync(f);
                    n++;
                }
            }
            catch { }
        }
    }
    catch { }
    return n;
}
export function pruneSessionFolderAggressive(sessionDir, { maxFiles = 800, maxAgeMs = 7 * 24 * 3600_000 } = {}) {
    if (!sessionDir || !fs.existsSync(sessionDir) || isCompact(sessionDir))
        return { removed: 0, total: 0 };
    let entries = [];
    try {
        for (const name of fs.readdirSync(sessionDir)) {
            if (!/^(session|pre-key|sender-key)/i.test(name))
                continue;
            const f = path.join(sessionDir, name);
            try {
                const st = fs.statSync(f);
                entries.push({ name, f, mtime: st.mtimeMs, size: st.size });
            }
            catch { }
        }
    }
    catch {
        return { removed: 0, total: 0 };
    }
    const total = entries.length;
    let removed = 0;
    const now = Date.now();
    for (const e of entries) {
        if (now - e.mtime > maxAgeMs) {
            try {
                fs.unlinkSync(e.f);
                removed++;
                e._gone = true;
            }
            catch { }
        }
    }
    entries = entries.filter(e => !e._gone);
    if (entries.length > maxFiles) {
        entries.sort((a, b) => a.mtime - b.mtime);
        const excess = entries.length - maxFiles;
        for (let i = 0; i < excess; i++) {
            try {
                fs.unlinkSync(entries[i].f);
                removed++;
            }
            catch { }
        }
    }
    return { removed, total };
}
export function handleBadMac(err, { sessionDir, jid, log = console.log } = {}) {
    if (!isBadMacError(err))
        return false;
    const key = sessionDir || 'global';
    const last = _macLogAt.get(key) || 0;
    if (Date.now() - last > MAC_LOG_COOLDOWN) {
        _macLogAt.set(key, Date.now());
        log(`[wa-robust] Bad MAC (sesión de señal desfasada)${jid ? ' peer=' + jid : ''}`);
    }
    if (sessionDir && jid)
        clearPeerSessions(sessionDir, jid);
    return true;
}
export function reconnectDelay(attempts = 1, code = 0) {
    const base = code === 500 || code === 408 ? 4000 : 2500;
    const jitter = Math.floor(Math.random() * 1500);
    return Math.min(base * Math.max(1, attempts) + jitter, 90_000);
}
