let active = 0;
let draining = false;
let drainPromise = null;
const waiters = new Set();
export function beginTask() {
    if (draining)
        return null;
    active++;
    let closed = false;
    return () => {
        if (closed)
            return;
        closed = true;
        active = Math.max(0, active - 1);
        if (active === 0) {
            for (const resolve of waiters)
                resolve();
            waiters.clear();
        }
    };
}
export function startDrain() {
    draining = true;
    global.shuttingDown = true;
    if (active === 0)
        return Promise.resolve();
    if (!drainPromise) {
        drainPromise = new Promise(resolve => waiters.add(resolve)).finally(() => {
            drainPromise = null;
        });
    }
    return drainPromise;
}
export function isDraining() {
    return draining;
}
export function activeTasks() {
    return active;
}
export function resumeTasks() {
    if (active !== 0)
        return false;
    draining = false;
    return true;
}
export function requestGracefulRestart() {
    startDrain().then(() => global.gracefulExit?.('RESTART')).catch(error => {
        console.error('[shutdown]', error?.message || error);
    });
}
