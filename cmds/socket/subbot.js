import db from "#db";
import { repairCreds, saveCredsSafe, quarantine, attachWatchdog, watchdogError, reconnectDelay, handleBadMac, pruneStaleSignalKeys } from '../../lib/wa-robust.js';
import makeWASocket, { Browsers, makeCacheableSignalKeyStore, DisconnectReason, jidDecode, useMultiFileAuthState } from 'ezz-baileys';
import NodeCache from 'node-cache';
import handler from '#handler';
import events from '#events';
import qrcode from "qrcode";
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { smsg, patchGroupMetadata } from '#serialize';
import { OWNER_JID } from '../../lib/haimiya.js';
import { canLink } from '../../lib/system/capacity.js';
import { markBotActivity } from '../../lib/system/anti-hang.js';
import { useCompactAuthState } from '../../lib/wa/auth-store.js';
import { claim, isCurrent, schedule, release, withSessionLock, registerConnection, unregisterConnection } from '../../lib/wa/session-guard.js';
import { noteWaUpsert } from '../../lib/wa/telemetry.js';
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
if (!global.conns)
    global.conns = [];
const groupCache = new NodeCache({ stdTTL: 3600, checkperiod: 300 });
let reintentos = {};
let commandFlags = {};
global.SUBBOTSESSIONS = new Map();
const cleanJid = (jid = '') => jid.replace(/:\d+/, '').split('@')[0];
async function startSubBotUnlocked(msg, client, caption = '', isCode = false, phone = '', chatId = '', isCommand = false, botType = 'Sub') {
    const id = String(phone || (msg?.sender || '').split('@')[0]).split(':')[0].replace(/\D/g, '');
    const sessionFolder = `./Sessions/Subs/${id}`;
    const senderId = msg?.sender;
    repairCreds(sessionFolder);
    const { state, saveCreds } = await useCompactAuthState(sessionFolder);
    const msgStore = new Map();
    const msgLimit = 500;
    const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
    const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
    const clientes = makeWASocket({
        // Heredar la versión de WhatsApp Web incluida en Ezz Baileys.
        autoFollowNewsletterOnConnect: true,
        autoFollowNewsletterDelayMs: 90_000,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
        shouldIgnoreJid: (jid) => jid.endsWith('@broadcast'),
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        keepAliveIntervalMs: 30_000,
        msgRetryCounterCache,
        userDevicesCache,
        getMessage: async (key) => msgStore.get(key.remoteJid + ':' + key.id),
    });
    claim(sessionFolder, clientes);
    patchGroupMetadata(clientes);
    clientes.isInit = false;
    clientes.commandTriggered = isCommand;
    clientes.triggerSender = senderId;
    clientes.triggerChatId = chatId;
    clientes.triggerClient = client;
    clientes.triggerMessage = msg;
    clientes.triggerIsCode = isCode;
    clientes.sessionFolder = sessionFolder;
    clientes.ev.on('creds.update', saveCredsSafe(sessionFolder, saveCreds));
    const stopWatchdog = attachWatchdog(clientes, { name: 'SUB-BOT ' + (id || ''), log: (m) => console.log(chalk.gray('[ ✿  ]  ' + m)), restart: (reason) => {
            try {
                clientes.end(watchdogError(reason));
            }
            catch { }
        } });
    clientes.decodeJid = (jid) => {
        if (!jid)
            return jid;
        if (/:\d+@/gi.test(jid)) {
            const decode = jidDecode(jid) || {};
            return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
        }
        return jid;
    };
    let bootTime = Date.now();
    let botReady = false;
    clientes.ev.on('messages.upsert', async ({ messages = [], type }) => {
        noteWaUpsert('subbot', messages, type);
        try {
            clientes.lastMsgAt = Date.now();
            markBotActivity(clientes, { isCommand: false });
        }
        catch { }
        if (!botReady)
            return;
        if (type !== 'notify')
            return;
        for (const raw of messages) {
            if (raw?.message && raw?.key?.id) {
                const sid = raw.key.remoteJid + ':' + raw.key.id;
                msgStore.set(sid, raw.message);
                if (msgStore.size > msgLimit)
                    msgStore.delete(msgStore.keys().next().value);
            }
            try {
                if (!raw?.message || raw.key?.remoteJid === 'status@broadcast')
                    continue;
                if ((Number(raw.messageTimestamp?.low ?? raw.messageTimestamp) * 1000) < bootTime - 15_000)
                    continue;
                if (raw.message.ephemeralMessage)
                    raw.message = raw.message.ephemeralMessage.message;
                clientes.lastMsgAt = Date.now();
                try {
                    markBotActivity(clientes, { isCommand: true });
                }
                catch { }
                clientes.lastCommandAt = Date.now();
                const m = await smsg(clientes, raw);
                if (typeof handler === 'function')
                    handler(clientes, m, messages).catch((err) => console.error('[ ✿  ]  Main Sub »', err?.message || err));
            }
            catch (e) {
                try {
                    handleBadMac(e, { sessionDir: sessionFolder, jid: raw?.key?.remoteJid });
                }
                catch { }
                console.log(e);
            }
        }
    });
    try {
        await events(clientes, null);
    }
    catch (err) {
        console.log(chalk.gray(`[ EVENT ERROR  ]  → ${err}`));
    }
    clientes.ev.on('connection.update', async ({ connection, lastDisconnect, isNewLogin, qr }) => {
        if (isNewLogin)
            clientes.isInit = false;
        if (connection === 'open') {
            bootTime = Date.now();
            botReady = true;
            clientes.uptime = Date.now();
            clientes.isInit = true;
            clientes.userId = cleanJid(clientes.user?.id?.split('@')[0]);
            const botDir = clientes.userId + '@s.whatsapp.net';
            const normalizedType = botType === 'Premium' ? 'Premium' : 'Sub';
            await db.updateSettings(botDir, 'type', normalizedType);
            await db.updateSettings(botDir, 'tier', normalizedType === 'Premium' ? 'premium' : 'sub');
            await db.updateSettings(botDir, 'botprem', normalizedType === 'Premium' ? 1 : 0);
            const currentSettings = await db.getSettings(botDir);
            if (!currentSettings.owner || currentSettings.owner === 'Ezz' || currentSettings.owner === OWNER_JID) {
                await db.updateSettings(botDir, 'owner', botDir);
            }
            registerConnection(clientes);
            delete reintentos[clientes.userId || id];
            await joinChannels(clientes);
            console.log(chalk.gray(`[ ✿  ]  SUB-BOT conectado: ${clientes.userId}`));
            const sentFlagFile = path.join(clientes.sessionFolder, 'msg_sent.flag');
            const hasSentMessage = fs.existsSync(sentFlagFile);
            if (clientes.commandTriggered && !hasSentMessage && clientes.triggerClient && clientes.triggerChatId) {
                await client.sendMessage(msg.chat, { text: `✎ Has conectado un nuevo socket de tipo *${normalizedType === 'Premium' ? 'Premium' : 'Gratuito'}*.` }, { quoted: msg });
                fs.writeFileSync(sentFlagFile, '1');
                clientes.commandTriggered = false;
                if (commandFlags[clientes.triggerSender]) {
                    delete commandFlags[clientes.triggerSender];
                }
            }
        }
        if (connection === 'close') {
            botReady = false;
            unregisterConnection(clientes);
            try {
                stopWatchdog();
            }
            catch { }
            if (global.shuttingDown || clientes.__superseded || !isCurrent(sessionFolder, clientes))
                return;
            const botId = clientes.userId || id;
            const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.reason || 0;
            const intentos = reintentos[botId] || 0;
            reintentos[botId] = intentos + 1;
            const delay = reconnectDelay(intentos + 1, reason || 0);
            if (reason === 403) {
                schedule(sessionFolder, () => startSubBot(msg, client, caption, isCode, phone, chatId, isCommand, botType), Math.max(delay, 8000));
                return;
            }
            if (reason === 401) {
                if (intentos < 3) {
                    console.log(chalk.gray(`[ ✿  ]  SUB-BOT ${botId} Conexión cerrada (401) intento ${intentos}/3 → Reintentando...`));
                    schedule(sessionFolder, () => startSubBot(msg, client, caption, isCode, phone, chatId, isCommand, botType), delay);
                }
                else {
                    console.log(chalk.gray(`[ ✿  ]  SUB-BOT ${botId} Dispositivo desvinculado → sesión apartada en Sessions/Subs/_invalid.`));
                    release(sessionFolder, clientes);
                    quarantine(sessionFolder);
                    delete reintentos[botId];
                }
                return;
            }
            if (intentos === 0 || intentos % 4 === 0) {
                try {
                    pruneStaleSignalKeys(sessionFolder);
                }
                catch { }
            }
            if (reason === DisconnectReason.connectionReplaced) {
                if (clientes.__superseded || !isCurrent(sessionFolder, clientes)) {
                    console.log(chalk.gray(`[ ✿  ]  SUB-BOT ${botId}: 440 superseded → no reintenta`));
                    return;
                }
                console.log(chalk.gray(`[ ✿  ]  SUB-BOT ${botId}: otra instancia usando la sesión (440) → espera ${Math.round(Math.max(delay, 90000) / 1000)}s`));
                schedule(sessionFolder, () => startSubBot(msg, client, caption, isCode, phone, chatId, isCommand, botType), Math.max(delay, 90_000));
                return;
            }
            console.log(chalk.gray(`[ ✿  ]  SUB-BOT ${botId}: conexión cerrada (${reason || '?'}) → reintento ${intentos + 1} en ${Math.round(delay / 1000)}s`));
            schedule(sessionFolder, () => startSubBot(msg, client, caption, isCode, phone, chatId, isCommand, botType), delay);
        }
        if (qr && isCode && phone && client && chatId && commandFlags[senderId]) {
            try {
                let codeGen = await clientes.requestPairingCode(phone, "HAIMIYAS");
                codeGen = codeGen.match(/.{1,4}/g)?.join("-") || codeGen;
                const msg2 = await msg.reply(caption);
                const msgCode = await msg.reply(codeGen);
                delete commandFlags[senderId];
                setTimeout(async () => {
                    try {
                        await client.sendMessage(chatId, { delete: msg2.key });
                        await client.sendMessage(chatId, { delete: msgCode.key });
                    }
                    catch { }
                }, 60000);
            }
            catch (err) {
                console.error("[Código Error]", err);
            }
        }
        if (qr && !isCode && client && chatId && commandFlags[senderId]) {
            try {
                const msgQR = await client.sendMessage(msg.chat, { image: await qrcode.toBuffer(qr, { scale: 8 }), caption }, { quoted: msg });
                delete commandFlags[senderId];
                setTimeout(async () => {
                    try {
                        await client.sendMessage(chatId, { delete: msgQR.key });
                    }
                    catch { }
                }, 60000);
            }
            catch (err) {
                console.error("[QR Error]", err);
            }
        }
    });
    return clientes;
}
export async function startSubBot(msg, client, caption = '', isCode = false, phone = '', chatId = '', isCommand = false, botType = 'Sub') {
    const id = String(phone || (msg?.sender || '').split('@')[0]).split(':')[0].replace(/\D/g, '');
    if (!id)
        throw new Error('No se pudo determinar el ID de la sesión del subbot.');
    const dir = path.resolve(process.cwd(), 'Sessions', 'Subs', id);
    global.__subbotStartPromises ||= new Map();
    const pending = global.__subbotStartPromises.get(dir);
    if (pending)
        return pending;
    const task = withSessionLock(dir, () => startSubBotUnlocked(msg, client, caption, isCode, id, chatId, isCommand, botType));
    global.__subbotStartPromises.set(dir, task);
    const cleanup = () => {
        if (global.__subbotStartPromises?.get(dir) === task)
            global.__subbotStartPromises.delete(dir);
    };
    task.then(cleanup, cleanup);
    return task;
}
async function joinChannels(client) {
    for (const value of Object.values(global.my)) {
        if (typeof value === 'string' && value.endsWith('@newsletter')) {
            await client.newsletterFollow(value).catch(err => console.log(chalk.gray(`\n[ ✿ ] Error al seguir el canal ${value}`)));
        }
    }
}
export default {
    command: ['code', 'qr'],
    category: 'socket',
    desc: 'Vincula un subbot de WhatsApp mediante código o código QR.',
    usage: 'code <número> | qr <número>',
    aliases: [],
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    run: async ({ msg, sock: client, args, command }) => {
        let user = await db.getUser(msg.sender);
        let time = user.Subs + 120000 || '';
        if (new Date() - user.Subs < 120000) {
            return client.reply(msg.chat, `❖ Debes esperar *${msToTime(time - new Date())}* para volver a intentar vincular un socket.`, msg);
        }
        const subsPath = path.join(dirname, '../../Sessions/Subs');
        const gate = canLink({ premium: false });
        if (!gate.ok) {
            return client.reply(msg.chat, gate.reason === 'premium_limit'
                ? '✎ Se alcanzó el límite global de Premium.'
                : '✎ Se alcanzó el límite global de Sub-Bots gratuitos. Un código Premium (#codeprem) no tiene límite.', msg);
        }
        commandFlags[msg.sender] = true;
        const rtx = '`✤` Vincula tu *cuenta* usando el *codigo.*\n\n> ✥ Sigue las *instrucciones*\n\n*›* Click en los *3 puntos*\n*›* Toque *dispositivos vinculados*\n*›* Vincular *nuevo dispositivo*\n*›* Selecciona *Vincular con el número de teléfono*\n\nꕤ *`Importante`*\n> ₊·( 🜸 ) ➭ Este *Código* solo funciona en el *número que lo solicito*';
        const rtx2 = "`✤` Vincula tu *cuenta* usando *codigo qr.*\n\n> ✥ Sigue las *instrucciones*\n\n*›* Click en los *3 puntos*\n*›* Toque *dispositivos vinculados*\n*›* Vincular *nuevo dispositivo*\n*›* Escanea el código *QR.*\n\n> ₊·( 🜸 ) ➭ Recuerda que no es recomendable usar tu cuenta principal para registrar un socket.";
        const isCode = /^(code)$/.test(command);
        const isCommands = /^(code|qr)$/.test(command);
        const isCommand = isCommands;
        const caption = isCode ? rtx : rtx2;
        const phone = args[0] ? args[0].replace(/\D/g, '') : msg.sender.split('@')[0];
        await startSubBot(msg, client, caption, isCode, phone, msg.chat, isCommand);
        user.Subs = new Date() * 1;
        await db.updateUser(msg.sender, 'Subs', user.Subs);
    }
};
function msToTime(duration) {
    var milliseconds = parseInt((duration % 1000) / 100), seconds = Math.floor((duration / 1000) % 60), minutes = Math.floor((duration / (1000 * 60)) % 60), hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes > 0 ? minutes : '';
    seconds = seconds < 10 && minutes > 0 ? '0' + seconds : seconds;
    if (minutes) {
        return `${minutes} minuto${minutes > 1 ? 's' : ''}, ${seconds} segundo${seconds > 1 ? 's' : ''}`;
    }
    else {
        return `${seconds} segundo${seconds > 1 ? 's' : ''}`;
    }
}
