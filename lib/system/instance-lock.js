import fs from 'fs';
import path from 'path';
const FILE = path.resolve(process.cwd(), 'database', '.instance.lock');
const STALE_MS = 45_000, BEAT_MS = 10_000;
function alive(pid) {
    try {
        process.kill(pid, 0);
        return true;
    }
    catch (e) {
        return e?.code === 'EPERM';
    }
}
function read() {
    try {
        return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    }
    catch {
        return null;
    }
}
function write() { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify({ pid: process.pid, at: Date.now() })); }
function heldByOther(l) { return !!l && l.pid !== process.pid && alive(l.pid) && Date.now() - Number(l.at || 0) < STALE_MS; }
export async function acquireInstanceLock({ waitMs = 90_000, log = console.log } = {}) {
    const t0 = Date.now();
    let warned = false;
    while (heldByOther(read())) {
        if (!warned) {
            log(`[lock] Hay otra instancia (pid ${read()?.pid}) usando estas sesiones. Espero a que termine…`);
            warned = true;
        }
        if (Date.now() - t0 > waitMs)
            throw new Error('Otra instancia del bot sigue activa con las mismas sesiones. Ciérrala antes de iniciar esta.');
        await new Promise(r => setTimeout(r, 2000));
    }
    write();
    const beat = setInterval(() => {
        try {
            const l = read();
            if (!l || l.pid === process.pid)
                write();
        }
        catch { }
    }, BEAT_MS);
    beat.unref?.();
    const release = () => {
        try {
            const l = read();
            if (l?.pid === process.pid)
                fs.rmSync(FILE, { force: true });
        }
        catch { }
    };
    process.on('exit', release);
    return release;
}
