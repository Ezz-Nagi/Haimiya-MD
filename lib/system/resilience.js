import os from 'os';
const state = {
    lagMs: 0,
    lastLagCheck: 0,
    shedUntil: 0,
    errorsWindow: [],
};
let lagTimer = null;
export function startLagMonitor() {
    if (lagTimer)
        return;
    let last = Date.now();
    lagTimer = setInterval(() => {
        const now = Date.now();
        const expected = 2000;
        const drift = now - last - expected;
        state.lagMs = Math.max(0, drift);
        last = now;
        if (state.lagMs > 1500)
            state.shedUntil = Math.max(state.shedUntil, now + 15_000);
    }, 2000);
    lagTimer.unref?.();
}
export function eventLoopLag() { return state.lagMs; }
export function memoryPressure() {
    const used = process.memoryUsage();
    const rssMb = used.rss / 1024 / 1024;
    const heapRatio = used.heapUsed / Math.max(used.heapTotal, 1);
    return { rssMb, heapRatio, heapUsed: used.heapUsed, heapTotal: used.heapTotal };
}
export function shouldShedLoad() {
    const now = Date.now();
    if (now < state.shedUntil)
        return true;
    const { rssMb, heapRatio } = memoryPressure();
    if (rssMb > 1800 || heapRatio > 0.92) {
        state.shedUntil = now + 20_000;
        return true;
    }
    if (state.lagMs > 1200) {
        state.shedUntil = now + 12_000;
        return true;
    }
    return false;
}
export function noteError() {
    const now = Date.now();
    state.errorsWindow.push(now);
    state.errorsWindow = state.errorsWindow.filter(t => now - t < 30_000);
    if (state.errorsWindow.length > 80)
        state.shedUntil = Math.max(state.shedUntil, now + 25_000);
}
export function resilienceStatus() {
    return {
        lagMs: state.lagMs,
        shedding: Date.now() < state.shedUntil,
        shedMsLeft: Math.max(0, state.shedUntil - Date.now()),
        memory: memoryPressure(),
        errors30s: state.errorsWindow.length,
        freeMemMb: os.freemem() / 1024 / 1024
    };
}
const breakers = new Map();
export function breakerAllow(key, { failThreshold = 8, coolMs = 30_000 } = {}) {
    const now = Date.now();
    let b = breakers.get(key);
    if (!b) {
        b = { fails: 0, openUntil: 0 };
        breakers.set(key, b);
    }
    if (b.openUntil > now)
        return false;
    return true;
}
export function breakerSuccess(key) {
    const b = breakers.get(key);
    if (b) {
        b.fails = 0;
        b.openUntil = 0;
    }
}
export function breakerFail(key, { failThreshold = 8, coolMs = 30_000 } = {}) {
    let b = breakers.get(key);
    if (!b) {
        b = { fails: 0, openUntil: 0 };
        breakers.set(key, b);
    }
    b.fails++;
    if (b.fails >= failThreshold) {
        b.openUntil = Date.now() + coolMs;
        b.fails = 0;
    }
}
