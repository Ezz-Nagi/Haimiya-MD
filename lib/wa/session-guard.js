import path from 'path';
const slots = global.__sessionSlots instanceof Map ? global.__sessionSlots : (global.__sessionSlots = new Map());
const starting = global.__sessionStarting instanceof Map ? global.__sessionStarting : (global.__sessionStarting = new Map());
const keyOf = dir => path.resolve(String(dir));
const slotOf = dir => {
    const k = keyOf(dir);
    let s = slots.get(k);
    if (!s)
        slots.set(k, s = { sock: null, timer: null });
    return s;
};
function flushSession(dir) {
    try {
        global.__authStores?.get(keyOf(dir))?.flush?.();
    }
    catch (e) {
        console.error('[session-guard] no se pudo hacer flush antes de cerrar:', e?.message || e);
    }
}
function closeQuietly(sock) {
    try {
        sock.end?.(undefined);
    }
    catch { }
    try {
        sock.ws?.close?.();
    }
    catch { }
}
export function supersede(dir, sock) {
    if (!sock)
        return false;
    cancel(dir);
    try {
        sock.__superseded = true;
    }
    catch { }
    flushSession(dir);
    unregisterConnection(sock);
    const s = slotOf(dir);
    if (s.sock === sock)
        s.sock = null;
    closeQuietly(sock);
    return true;
}
export function markRestarting(id) {
    const key = String(id || '').replace(/\D/g, '');
    if (!key)
        return false;
    global.__restarting ||= new Set();
    if (global.__restarting.has(key))
        return false;
    global.__restarting.add(key);
    return true;
}
export function clearRestarting(id) {
    global.__restarting?.delete(String(id || '').replace(/\D/g, ''));
}
export function isRestarting(id) { return !!global.__restarting?.has(String(id || '').replace(/\D/g, '')); }
export function isReviving(id) { return !!global.__reviving?.has(String(id || '').replace(/\D/g, '')); }
export function registerConnection(sock) {
    if (!sock)
        return;
    global.conns ||= [];
    global.connsById ||= new Map();
    const id = String(sock.userId || sock.user?.id || sock.user?.lid || '').split(':')[0].replace(/\D/g, '');
    if (id) {
        const previous = global.connsById.get(id);
        if (previous && previous !== sock) {
            const i = global.conns.indexOf(previous);
            if (i >= 0)
                global.conns.splice(i, 1);
        }
        global.connsById.set(id, sock);
    }
    if (!global.conns.includes(sock))
        global.conns.push(sock);
}
export function unregisterConnection(sock) {
    if (!sock)
        return;
    const id = String(sock.userId || sock.user?.id || sock.user?.lid || '').split(':')[0].replace(/\D/g, '');
    if (id && global.connsById?.get(id) === sock)
        global.connsById.delete(id);
    if (Array.isArray(global.conns)) {
        const i = global.conns.indexOf(sock);
        if (i >= 0)
            global.conns.splice(i, 1);
    }
}
export async function withSessionLock(dir, fn) {
    const k = keyOf(dir);
    while (starting.has(k)) {
        try {
            await starting.get(k);
        }
        catch { }
    }
    let resolve;
    const p = new Promise(r => { resolve = r; });
    starting.set(k, p);
    try {
        return await fn();
    }
    finally {
        starting.delete(k);
        resolve();
    }
}
export function claim(dir, sock) {
    const s = slotOf(dir);
    if (s.timer) {
        clearTimeout(s.timer);
        s.timer = null;
    }
    const prev = s.sock;
    if (prev && prev !== sock) {
        try {
            prev.__superseded = true;
        }
        catch { }
        flushSession(dir);
        unregisterConnection(prev);
        closeQuietly(prev);
    }
    s.sock = sock;
    try {
        sock.__sessionDir = keyOf(dir);
        sock.__superseded = false;
    }
    catch { }
    return sock;
}
export const isCurrent = (dir, sock) => !!sock && slotOf(dir).sock === sock && !sock.__superseded;
export function schedule(dir, fn, ms) {
    if (global.shuttingDown)
        return false;
    const s = slotOf(dir);
    if (s.timer)
        clearTimeout(s.timer);
    s.timer = setTimeout(() => {
        s.timer = null;
        if (global.shuttingDown)
            return;
        Promise.resolve().then(fn).catch(e => console.error('[session-guard] reconexión:', e?.message || e));
    }, Math.max(0, ms || 0));
    s.timer.unref?.();
    return true;
}
export function cancel(dir) {
    const s = slotOf(dir);
    if (s.timer) {
        clearTimeout(s.timer);
        s.timer = null;
    }
}
export function release(dir, sock) {
    const s = slotOf(dir);
    if (s.sock === sock)
        s.sock = null;
}
export const hasPending = dir => !!slotOf(dir).timer || starting.has(keyOf(dir));
export const currentSocket = dir => slotOf(dir).sock;
