import fs from 'fs';
import os from 'os';
import path from 'path';
import * as baileys from 'ezz-baileys';
const BufferJSON = {
    replacer: (k, value) => {
        if (Buffer.isBuffer(value) || value instanceof Uint8Array || value?.type === 'Buffer') {
            return { type: 'Buffer', data: Buffer.from(value?.data || value).toString('base64') };
        }
        return value;
    },
    reviver: (_, value) => {
        if (typeof value === 'object' && !!value && (value.buffer === true || value.type === 'Buffer')) {
            const val = value.data || value.value;
            return typeof val === 'string' ? Buffer.from(val, 'base64') : Buffer.from(val || []);
        }
        return value;
    }
};
async function freshCreds() {
    if (typeof baileys.initAuthCreds === 'function')
        return baileys.initAuthCreds();
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'creds-'));
    try {
        return (await baileys.useMultiFileAuthState(tmp)).state.creds;
    }
    finally {
        try {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
        catch { }
    }
}
const appStateKey = v => {
    const f = baileys.proto?.Message?.AppStateSyncKeyData?.fromObject;
    return typeof f === 'function' ? f.call(baileys.proto.Message.AppStateSyncKeyData, v) : v;
};
export const MAX_SESSION_FILES = 200;
const LEGACY_TYPES = ['app-state-sync-version', 'app-state-sync-key', 'sender-key-memory', 'sender-key', 'lid-mapping', 'device-list', 'pre-key', 'session', 'tctoken'];
const PEER_TYPES = ['session', 'sender-key'];
const stores = global.__authStores instanceof Map ? global.__authStores : (global.__authStores = new Map());
const shardFileName = type => `keys-${String(type).replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
const isProtected = name => name === 'creds.json' || name === 'creds.json.bak' || /^keys-[\w-]+\.json$/.test(name);
function writeAtomic(file, text) {
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, text);
    fs.renameSync(tmp, file);
}
function loadShard(dir, type) {
    const sh = { file: path.join(dir, shardFileName(type)), map: new Map(), dirty: false };
    try {
        const obj = JSON.parse(fs.readFileSync(sh.file, 'utf8'), BufferJSON.reviver);
        for (const [k, v] of Object.entries(obj || {}))
            sh.map.set(k, v);
    }
    catch (e) {
        if (e?.code !== 'ENOENT') {
            console.warn(`[auth-store] ${path.basename(sh.file)} dañado, se aparta:`, e?.message || e);
            try {
                fs.renameSync(sh.file, sh.file + '.corrupt');
            }
            catch { }
        }
    }
    return sh;
}
async function readCreds(dir) {
    try {
        return JSON.parse(fs.readFileSync(path.join(dir, 'creds.json'), 'utf8'), BufferJSON.reviver);
    }
    catch {
        return freshCreds();
    }
}
function migrateLegacy(store) {
    let names = [];
    try {
        names = fs.readdirSync(store.dir);
    }
    catch {
        return 0;
    }
    const done = [];
    for (const name of names) {
        if (!name.endsWith('.json') || isProtected(name))
            continue;
        const type = LEGACY_TYPES.find(t => name.startsWith(t + '-'));
        if (!type)
            continue;
        try {
            let id = name.slice(type.length + 1, -5).replace(/__/g, '/');
            if (type === 'sender-key')
                id = id.replace('--', '::');
            const value = JSON.parse(fs.readFileSync(path.join(store.dir, name), 'utf8'), BufferJSON.reviver);
            const sh = store.shard(type);
            if (!sh.map.has(id)) {
                sh.map.set(id, value);
                sh.dirty = true;
            }
            done.push(name);
        }
        catch { }
    }
    if (!done.length)
        return 0;
    store.flush();
    for (const name of done) {
        try {
            fs.unlinkSync(path.join(store.dir, name));
        }
        catch { }
    }
    console.log(`[auth-store] ${path.basename(store.dir)}: ${done.length} archivos sueltos migrados a ${store.shards.size} archivos compactos`);
    return done.length;
}
function createStore(dir, flushMs) {
    const store = { dir, shards: new Map(), timer: null };
    store.shard = type => {
        let s = store.shards.get(type);
        if (!s)
            store.shards.set(type, s = loadShard(dir, type));
        return s;
    };
    store.flush = () => {
        if (store.timer) {
            clearTimeout(store.timer);
            store.timer = null;
        }
        for (const sh of store.shards.values()) {
            if (!sh.dirty)
                continue;
            try {
                writeAtomic(sh.file, JSON.stringify(Object.fromEntries(sh.map), BufferJSON.replacer));
                sh.dirty = false;
            }
            catch (e) {
                console.error('[auth-store] no se pudo guardar', path.basename(sh.file), e?.message || e);
            }
        }
    };
    store.schedule = () => {
        if (!store.timer) {
            store.timer = setTimeout(store.flush, flushMs);
            store.timer?.unref?.();
        }
    };
    store.deletePeer = user => {
        let n = 0;
        const u = String(user || '').replace(/\D/g, '');
        if (!u)
            return 0;
        const escaped = u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const peerPattern = new RegExp(`(^|[^0-9])${escaped}(?=$|[^0-9])`);
        for (const type of PEER_TYPES) {
            const sh = store.shard(type);
            for (const id of [...sh.map.keys()])
                if (peerPattern.test(id)) {
                    sh.map.delete(id);
                    sh.dirty = true;
                    n++;
                }
        }
        if (n)
            store.flush();
        return n;
    };
    store.keys = {
        get: async (type, ids) => {
            const sh = store.shard(type), data = {};
            for (const id of ids) {
                let v = sh.map.get(String(id));
                if (v && type === 'app-state-sync-key')
                    v = appStateKey(v);
                data[id] = v ?? null;
            }
            return data;
        },
        set: async (data) => {
            for (const type of Object.keys(data)) {
                const sh = store.shard(type);
                for (const id of Object.keys(data[type])) {
                    const v = data[type][id];
                    if (v)
                        sh.map.set(String(id), v);
                    else
                        sh.map.delete(String(id));
                }
                sh.dirty = true;
            }
            store.schedule();
        }
    };
    return store;
}
let exitHooked = false;
function hookExit() {
    if (exitHooked)
        return;
    exitHooked = true;
    const flushAll = () => {
        for (const s of stores.values()) {
            try {
                s.flush();
            }
            catch { }
        }
    };
    process.on('exit', flushAll);
    for (const sig of ['SIGINT', 'SIGTERM']) {
        if (process.listenerCount(sig) === 0)
            process.once(sig, () => { flushAll(); process.kill(process.pid, sig); });
    }
}
export function capSessionFiles(dir, max = MAX_SESSION_FILES) {
    let names;
    try {
        names = fs.readdirSync(dir);
    }
    catch {
        return 0;
    }
    if (names.length <= max)
        return 0;
    const extra = names.filter(n => !isProtected(n)).map(n => {
        try {
            return { n, t: fs.statSync(path.join(dir, n)).mtimeMs };
        }
        catch {
            return null;
        }
    }).filter(Boolean).sort((a, b) => a.t - b.t);
    let removed = 0;
    for (const e of extra) {
        if (names.length - removed <= max)
            break;
        try {
            fs.unlinkSync(path.join(dir, e.n));
            removed++;
        }
        catch { }
    }
    return removed;
}
export const isCompactDir = dir => {
    try {
        return fs.readdirSync(dir).some(n => /^keys-[\w-]+\.json$/.test(n));
    }
    catch {
        return false;
    }
};
export async function useCompactAuthState(folder, { flushMs = 1000 } = {}) {
    const dir = path.resolve(folder);
    fs.mkdirSync(dir, { recursive: true });
    let store = stores.get(dir);
    if (store && !fs.existsSync(path.join(dir, 'creds.json'))) {
        if (store.timer)
            clearTimeout(store.timer);
        for (const sh of store.shards.values())
            sh.dirty = false;
        stores.delete(dir);
        store = null;
    }
    if (!store) {
        store = createStore(dir, flushMs);
        stores.set(dir, store);
        hookExit();
    }
    migrateLegacy(store);
    capSessionFiles(dir);
    const creds = await readCreds(dir);
    const saveCreds = async () => writeAtomic(path.join(dir, 'creds.json'), JSON.stringify(creds, BufferJSON.replacer, 2));
    return { state: { creds, keys: store.keys }, saveCreds, flush: store.flush, store };
}
export default useCompactAuthState;
export function disposeCompactAuthState(folder, { flush = true } = {}) {
    const dir = path.resolve(folder);
    const store = stores.get(dir);
    if (!store)
        return false;
    if (flush)
        store.flush();
    else if (store.timer)
        clearTimeout(store.timer);
    stores.delete(dir);
    return true;
}
