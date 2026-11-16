import { repairCreds, saveCredsSafe, attachWatchdog, watchdogError, handleBadMac } from '../wa-robust.js';
import { markBotActivity } from '../system/anti-hang.js';
import makeWASocket, { Browsers, makeCacheableSignalKeyStore, useMultiFileAuthState, DisconnectReason } from 'ezz-baileys';
import pino from 'pino';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { smsg } from '#serialize';
import handlerWA from '#handler';
import events from '#events';
import { OWNER_JID, isCreator } from '../haimiya.js';
import db from '#db';
import { useCompactAuthState } from './auth-store.js';
import { claim, isCurrent, schedule, withSessionLock, registerConnection, unregisterConnection, supersede } from './session-guard.js';
import { noteWaUpsert } from './telemetry.js';
const SESSION_DIR = path.join(process.cwd(), 'Sessions', 'Owner');
const log = {
    info: m => console.log(chalk.bgBlue.white.bold(' WA '), chalk.white(m)),
    ok: m => console.log(chalk.bgGreen.white.bold(' WA '), chalk.greenBright(m)),
    warn: m => console.log(chalk.bgYellow.black.bold(' WA '), chalk.yellow(m)),
    err: m => console.log(chalk.bgRed.white.bold(' WA '), chalk.redBright(m))
};
let pairingNotify = null;
let isStarting = false;
let reconexion = 0;
const retriesLimit = 8;
const msgStore = new Map();
const msgLimit = 500;
let bootTime = Date.now();
function normalizePhone(input) {
    let s = String(input).replace(/\D/g, '');
    if (!s)
        return '';
    if (s.startsWith('0'))
        s = s.replace(/^0+/, '');
    if (s.length === 10 && s.startsWith('3'))
        s = '57' + s;
    if (s.startsWith('52') && !s.startsWith('521') && s.length >= 12)
        s = '521' + s.slice(2);
    if (s.startsWith('54') && !s.startsWith('549') && s.length >= 11)
        s = '549' + s.slice(2);
    return s;
}
function clearSession() {
    try {
        try {
            global.__authStores?.get(path.resolve(SESSION_DIR))?.flush?.();
        }
        catch { }
        const authStore = global.__authStores?.get(path.resolve(SESSION_DIR));
        if (authStore?.timer)
            clearTimeout(authStore.timer);
        global.__authStores?.delete(path.resolve(SESSION_DIR));
        if (!fs.existsSync(SESSION_DIR))
            return;
        for (const file of fs.readdirSync(SESSION_DIR)) {
            try {
                fs.unlinkSync(path.join(SESSION_DIR, file));
            }
            catch { }
        }
        log.warn('Sesión Owner limpiada');
    }
    catch (e) {
        log.err(`clearSession: ${e.message}`);
    }
}
async function startWhatsAppUnlocked(opts = {}) {
    if (isStarting) {
        return { ok: false, error: 'Ya hay un arranque de WhatsApp en curso.' };
    }
    isStarting = true;
    if (opts.notify)
        pairingNotify = opts.notify;
    if (opts.forcePair) {
        if (global.waSock) {
            unregisterConnection(global.waSock);
            supersede(SESSION_DIR, global.waSock);
            global.waSock = null;
        }
        global.waReady = false;
        clearSession();
    }
    fs.mkdirSync(SESSION_DIR, { recursive: true });
    try {
        repairCreds(SESSION_DIR);
        const { state, saveCreds } = await useCompactAuthState(SESSION_DIR);
        const sock = makeWASocket({
            // Ezz Baileys utiliza la versión de WhatsApp Web fijada en sus Defaults.
            // No sobrescribirla con la versión obtenida del upstream de WhiskeySockets.
            autoFollowNewsletterOnConnect: true,
            autoFollowNewsletterDelayMs: 90_000,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser: Browsers.ubuntu('Chrome'),
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
            },
            markOnlineOnConnect: true,
            syncFullHistory: false,
            keepAliveIntervalMs: 30_000,
            getMessage: async (key) => msgStore.get(key.remoteJid + ':' + key.id)
        });
        claim(SESSION_DIR, sock);
        sock.isPrincipal = true;
        sock.uptime = Date.now();
        global.waSock = sock;
        global.sock = sock;
        sock.ev.on('creds.update', saveCredsSafe(SESSION_DIR, saveCreds));
        attachWatchdog(sock, { name: 'WhatsApp principal', log: m => log.warn(m), restart: reason => {
                try {
                    sock.end(watchdogError(reason));
                }
                catch { }
            } });
        if (!state.creds.registered) {
            const phone = normalizePhone(opts.phone || '');
            if (!phone) {
                isStarting = false;
                return {
                    ok: false,
                    error: 'No hay sesión guardada. Usa #codeprincipal <número> con el número a vincular (código país, sin +).'
                };
            }
            setTimeout(async () => {
                try {
                    if (!sock.authState?.creds?.registered) {
                        const pairing = await sock.requestPairingCode(phone, 'HAIMIYAS');
                        const codeBot = pairing?.match(/.{1,4}/g)?.join('-') || pairing;
                        log.ok(`Código de emparejamiento: ${codeBot}`);
                        if (pairingNotify) {
                            await pairingNotify(`📱 *Código de emparejamiento WhatsApp*\n\n` +
                                `Número: \`+${phone}\`\n` +
                                `Código: \`${codeBot}\`\n\n` +
                                `_Ábrelo en WhatsApp → Dispositivos vinculados → Vincular con número_`);
                        }
                    }
                }
                catch (err) {
                    log.err(`Pairing: ${err?.message || err}`);
                    if (pairingNotify)
                        await pairingNotify(`💢 Error generando código: ${err?.message || err}`);
                }
            }, 2500);
        }
        let socketReady = false;
        sock.ev.on('messages.upsert', async ({ messages = [], type }) => {
            noteWaUpsert('principal', messages, type);
            if (!socketReady)
                return;
            if (type !== 'notify')
                return;
            for (const msg of messages) {
                if (msg?.message && msg?.key?.id) {
                    const sid = msg.key.remoteJid + ':' + msg.key.id;
                    msgStore.set(sid, msg.message);
                    if (msgStore.size > msgLimit)
                        msgStore.delete(msgStore.keys().next().value);
                }
                try {
                    if (!msg?.message || msg.key?.remoteJid === 'status@broadcast')
                        continue;
                    if (Number(msg.messageTimestamp?.low ?? msg.messageTimestamp) * 1000 < bootTime - 15_000)
                        continue;
                    if (msg.message.ephemeralMessage)
                        msg.message = msg.message.ephemeralMessage.message;
                    const m = await smsg(sock, msg);
                    if (typeof handlerWA === 'function') {
                        handlerWA(sock, m, messages).catch(err => console.error('[WA handler]', err?.message || err));
                    }
                }
                catch (err) {
                    try {
                        handleBadMac(err, { sessionDir: SESSION_DIR, jid: msg?.key?.remoteJid });
                    }
                    catch { }
                    console.error('[WA msg]', err?.message || err);
                }
            }
        });
        try {
            await events(sock, null);
        }
        catch (err) {
            log.warn(`events: ${err?.message || err}`);
        }
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (qr && pairingNotify) {
            }
            if (connection === 'open') {
                bootTime = Date.now();
                reconexion = 0;
                global.waReady = true;
                socketReady = true;
                registerConnection(sock);
                isStarting = false;
                const name = sock.user?.name || 'Haimiya';
                const jid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
                log.ok(`WhatsApp conectado: ${name} (${jid})`);
                try {
                    const CH = global.my?.chJid || global.config?.channelJid || '120363424850969101@newsletter';
                    if (typeof sock.newsletterFollow === 'function') {
                        await sock.newsletterFollow(CH).catch(() => { });
                    }
                    else if (typeof sock.subscribeNewsletter === 'function') {
                        await sock.subscribeNewsletter(CH).catch(() => { });
                    }
                    else if (sock.query) {
                        await sock.query({
                            tag: 'iq',
                            attrs: { to: CH, type: 'set', xmlns: 'newsletter' },
                            content: [{ tag: 'follow', attrs: {} }]
                        }).catch(() => { });
                    }
                    log.ok('Canal oficial seguido');
                }
                catch (e) {
                    log.warn(`canal: ${e?.message || e}`);
                }
                try {
                    const current = db.getSettings(jid);
                    if (!current.owner)
                        await db.updateSettings(jid, 'owner', OWNER_JID);
                    await db.updateSettings(jid, 'type', 'Owner');
                }
                catch { }
                if (pairingNotify) {
                    await pairingNotify(`✅ *WhatsApp vinculado*\n\nBot: *${name}*\nJID: \`${jid}\``);
                }
            }
            if (connection === 'close') {
                if (global.shuttingDown || sock.__superseded || !isCurrent(SESSION_DIR, sock))
                    return;
                unregisterConnection(sock);
                socketReady = false;
                global.waReady = false;
                isStarting = false;
                const reason = lastDisconnect?.error?.output?.statusCode || 0;
                if (reason === DisconnectReason.loggedOut) {
                    log.warn(`Desvinculado (${reason}) — limpiando sesión`);
                    try {
                        global.__authStores?.get(path.resolve(SESSION_DIR))?.flush?.();
                    }
                    catch { }
                    clearSession();
                    return;
                }
                if (reason === DisconnectReason.connectionReplaced) {
                    log.warn('Conexión reemplazada (otra sesión abierta)');
                    return;
                }
                reconexion++;
                const delay = Math.min(3000 * reconexion, 60000);
                log.warn(`Reconectando en ${delay / 1000}s (intento ${reconexion})...`);
                schedule(SESSION_DIR, () => startWhatsApp({ phone: opts.phone, notify: pairingNotify }).catch(() => { }), delay);
            }
        });
        return { ok: true, pending: !state.creds.registered };
    }
    catch (e) {
        isStarting = false;
        log.err(e?.message || e);
        return { ok: false, error: e?.message || String(e) };
    }
}
export async function startWhatsApp(opts = {}) {
    if (!opts.forcePair && global.__waStartPromise)
        return global.__waStartPromise;
    const task = withSessionLock(SESSION_DIR, () => startWhatsAppUnlocked(opts));
    if (!opts.forcePair) {
        global.__waStartPromise = task;
        const cleanup = () => {
            if (global.__waStartPromise === task)
                global.__waStartPromise = null;
        };
        task.then(cleanup, cleanup);
    }
    return task;
}
export async function tryRestoreWhatsApp(notify) {
    const creds = path.join(SESSION_DIR, 'creds.json');
    if (!fs.existsSync(creds)) {
        log.info('Sin sesión WhatsApp guardada. Usa #codeprincipal <número> desde WhatsApp.');
        return { ok: false, restored: false };
    }
    log.info('Restaurando sesión WhatsApp...');
    return startWhatsApp({ notify });
}
export function getWAStatus() {
    return {
        ready: global.waReady,
        user: global.waSock?.user || null,
        jid: global.waSock?.user?.id || null
    };
}
export { normalizePhone, clearSession };
