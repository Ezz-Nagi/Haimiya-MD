import './settings.js';
import chalk from 'chalk';
import cmdsLoader from '#cmdsloader';
import { tryRestoreWhatsApp, getWAStatus } from './lib/wa/connection.js';
import { acquireInstanceLock } from './lib/system/instance-lock.js';
import { reviveSubs } from './lib/wa/revive.js';
import { startThemeLoop, season } from './lib/system/theme.js';
import { startDrain } from './lib/system/lifecycle.js';
import { OWNER_NUMBER } from './lib/haimiya.js';
import { normalizeJid } from './lib/serialize.js';
import { startLagMonitor } from './lib/system/resilience.js';

startLagMonitor();
const seasonNow = season();
const paint = seasonNow === 'halloween' ? chalk.hex('#ff8a1f') : seasonNow === 'christmas' ? chalk.hex('#e5484d') : chalk.magentaBright;
console.log(paint('\n  ╭──────────────────────────────────────────╮'));
console.log(paint(seasonNow === 'halloween' ? '  │  🎃 Haimiya-MD · Halloween 👻 │' : seasonNow === 'christmas' ? '  │  🎄 Haimiya-MD · Navidad 🎅   │' : '  │   Haimiya-MD · Haimiya mío      │'));
console.log(paint('  ╰──────────────────────────────────────────╯\n'));
startThemeLoop();

async function notifyOwner(text) {
    const socket = global.waSock;
    if (!socket?.sendMessage) return;
    const targets = [...new Set([...(global.ownerWA || []), ...(OWNER_NUMBER ? [OWNER_NUMBER] : [])])];
    for (const value of targets) {
        const jid = normalizeJid(String(value).includes('@') ? value : `${String(value).replace(/\D/g, '')}@s.whatsapp.net`);
        if (!jid) continue;
        try { await socket.sendMessage(jid, { text }); } catch { }
    }
}

async function start() {
    await acquireInstanceLock({ log: m => console.log(chalk.yellow(m)) });
    try {
        const db = (await import('./lib/system/database.js')).default;
        if (typeof db.initDB === 'function') db.initDB();
    } catch (e) { console.error(chalk.red('[db]'), e?.message || e); }
    try { (await import('./lib/system/promos.js')).warmPromos(); } catch { }
    await cmdsLoader();
    await tryRestoreWhatsApp(notifyOwner);
    reviveSubs({ log: m => console.log(chalk.cyan(m)) }).catch(e => console.error(chalk.red('[revive]'), e?.message || e));
    try {
        (await import('./lib/system/healthcheck.js')).startHealthLoop();
        (await import('./lib/system/anti-hang.js')).startAntiHangLoop();
    } catch { }
    const st = getWAStatus();
    console.log(chalk.cyan(st.ready ? '[ ✿ ] WhatsApp: conectado' : '[ ✿ ] WhatsApp: esperando vinculación'));
    console.log(chalk.green('[ ✿ ] Sistema listo.\n'));
    setTimeout(() => notifyOwner('✅ *Haimiya mío está en línea.*').catch(() => { }), 1500);
}

start().catch(e => { console.error(chalk.red('[start]'), e); process.exit(1); });
process.on('uncaughtException', e => {
    const s = String(e?.message || e?.stack || e || '');
    if (/Bad MAC|Failed to decrypt|doDecryptWhisper|verifyMAC/i.test(s)) return;
    console.error(chalk.red('[uncaught]'), e?.stack || e?.message || e);
});
process.on('unhandledRejection', e => {
    const s = String(e?.message || e?.stack || e || '');
    if (/Bad MAC|Failed to decrypt|doDecryptWhisper|verifyMAC/i.test(s)) return;
    console.error(chalk.red('[unhandled]'), e?.message || e);
});

global.gracefulShutdown = true;
let shuttingDown = false;
async function gracefulExit(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    global.shuttingDown = true;
    console.log(chalk.gray(`[ Haimiya-MD ] ${signal}: esperando a que terminen las tareas activas…`));
    await startDrain();
    try {
        for (const auth of global.__authStores?.values?.() || []) {
            try { await auth.flush?.(); } catch (error) { console.error('[auth flush]', error?.message || error); throw error; }
        }
        const sockets = [...new Set([...(global.conns || []), global.waSock].filter(Boolean))];
        for (const socket of sockets) {
            try { socket.__superseded = true; socket.end(undefined); }
            catch (error) { console.error('[socket close]', error?.message || error); }
        }
        try { (await import('./lib/system/database.js')).flushDatabase(); }
        catch (error) { console.error('[database flush]', error?.message || error); throw error; }
        try { (await import('./lib/system/healthcheck.js')).flushHealth(); } catch { }
        await new Promise(resolve => setTimeout(resolve, 250));
    } catch (error) { console.error('[shutdown]', error?.stack || error); process.exitCode = 1; }
    process.exit(process.exitCode || 0);
}
global.gracefulExit = gracefulExit;
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => gracefulExit(signal));
