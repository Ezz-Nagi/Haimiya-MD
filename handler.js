import db from "#db";
import ws from 'ws';
import moment from 'moment';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import gradient from 'gradient-string';
import { getCachedMeta, setCachedMeta } from '#serialize';
import { isCreator, isMainBot, say, OWNER_JID, ownerJid, getBotSettingsId, phoneOf } from './lib/haimiya.js';
import { getStickerKey } from './lib/sticker-key.js';
import { isGloballyBanned, normalizeJid } from './lib/system/globalban.js';
import { isAllowedForSubbotAsync } from './lib/banchat.js';
import { resolvePrefixes } from './lib/prefix.js';
import * as limits from './lib/system/limits.js';
import { getChatiaSession, replyChatia } from './cmds/ai/chatia.js';
import { isAusenciaActive, handleAusenciaMessage, ensureAusenciaState } from './cmds/ai/ausencia.js';
import { touchWa } from './lib/system/healthcheck.js';
import { checkFlood } from './lib/system/antiflood.js';
import { hasPerm, isStaff } from './lib/system/staff.js';
import { isMaintenance, maintenanceMessage, isBlocked } from './lib/system/runtime.js';
import { noteWaHandler, noteWaRead } from './lib/wa/telemetry.js';
import { shouldShedLoad, noteError, startLagMonitor } from './lib/system/resilience.js';
import { beginTask, isDraining } from './lib/system/lifecycle.js';
import { commandMaintenance, noteCommandFailure, noteCommandSuccess } from './lib/system/command-health.js';
startLagMonitor();
const prefixRegexCache = new Map();
const customPrefixCache = new WeakMap();
let statsDayCache = '';
let statsDayIndex = -1;
function getStatsDay() {
    const dayIndex = Math.floor((Date.now() - 5 * 60 * 60_000) / 86_400_000);
    if (dayIndex !== statsDayIndex) {
        statsDayIndex = dayIndex;
        statsDayCache = new Date(dayIndex * 86_400_000).toISOString().slice(0, 10);
    }
    return statsDayCache;
}
async function markCommandSeen(sock, msg) {
    if (msg?.fromMe || !msg?.key?.id || !msg?.key?.remoteJid || typeof sock?.readMessages !== 'function')
        return false;
    try {
        await sock.readMessages([msg.key]);
        noteWaRead(true);
        return true;
    }
    catch (err) {
        noteWaRead(false);
        console.warn('[WA read-receipt] No se pudo marcar como leído:', err?.message || err);
        return false;
    }
}
async function processMessage(sock, msg) {
    noteWaHandler();
    try {
        try {
            touchWa();
        }
        catch { }
        if (!shouldShedLoad()) {
            const _from = msg.key.remoteJid;
            const _txt = String(msg.body || msg.text || msg.responseId || '').slice(0, 80);
            console.log(`[wa-in] ${_from} | ${msg.mtype || msg.type || 'msg'} | ${_txt}`);
        }
    }
    catch { }
    global.owner = Array.isArray(global.owner) ? global.owner : [];
    global.mods = Array.isArray(global.mods) ? global.mods : [];
    global.comandos = global.comandos instanceof Map ? global.comandos : new Map();
    if (msg.fromMe && !msg.key.participant && msg.isBot)
        return;
    let sender = msg.sender;
    let body = msg.body || '';
    const from = msg.key.remoteJid;
    const botJid = getBotSettingsId(sock);
    const chatData = (await db.getChat(msg.chat)) || {};
    const settings = (await db.getSettings(botJid)) || {};
    {
        const subPhone = botJid.split('@')[0].split(':')[0];
        const chatJid = from;
        const allowed = await isAllowedForSubbotAsync(subPhone, chatJid);
        if (!allowed) {
            const ownerId = ownerJid(settings.owner || '');
            const isBanchatCmd = /^\S{0,8}[#\/.!+\-]\s*banchat\b/i.test(String(msg.text || body || '').trim());
            if (!(isBanchatCmd && (isCreator(sender) || phoneOf(sender) === phoneOf(ownerId))))
                return;
        }
    }
    const _jid = String(from || '');
    const _isBroadcast = _jid.endsWith('@newsletter') || _jid === 'status@broadcast';
    let groupMetadata = null;
    let groupName = '';
    if (msg.isGroup) {
        groupMetadata = getCachedMeta(msg.chat);
        if (!groupMetadata) {
            groupMetadata = await sock.groupMetadata(msg.chat).catch(() => null);
            if (groupMetadata)
                setCachedMeta(msg.chat, groupMetadata);
        }
        groupName = groupMetadata?.subject || '';
    }
    const participants = groupMetadata?.participants || [];
    if (msg.isGroup && String(msg.sender || '').endsWith('@lid')) {
        const senderLid = String(msg.sender).split('@')[0];
        const match = participants.find(p => {
            const lids = [p?.lid, p?.id, p?.jid].filter(Boolean).map(v => String(v).split('@')[0]);
            return lids.includes(senderLid) && p?.phoneNumber;
        });
        if (match?.phoneNumber)
            msg.sender = String(match.phoneNumber).includes('@')
                ? String(match.phoneNumber)
                : `${String(match.phoneNumber).replace(/\D/g, '')}@s.whatsapp.net`;
    }
    sender = msg.sender || sender || '';
    const normalizedSuspension = db.getSuspension(botJid, sender);
    if (normalizedSuspension && !isCreator(sender) && phoneOf(ownerJid(settings.owner || '')) !== phoneOf(sender)) {
        global.__suspensionNotice ||= new Map();
        const noticeKey = `${botJid}:${sender}`;
        const lastNotice = global.__suspensionNotice.get(noticeKey) || 0;
        if (Date.now() - lastNotice > 60_000) {
            global.__suspensionNotice.set(noticeKey, Date.now());
            const remaining = Math.max(1, Math.ceil((normalizedSuspension.until - Date.now()) / 60_000));
            await msg.reply(`⛔ Tu acceso a Haimiya está suspendido temporalmente.
Tiempo restante aproximado: ${remaining} min.
Motivo: ${normalizedSuspension.reason || 'Incumplimiento de las normas de uso.'}`).catch(() => { });
        }
        return;
    }
    const configuredOwner = ownerJid(settings.owner || '');
    const isConfiguredOwner = Boolean(configuredOwner && phoneOf(sender) === phoneOf(configuredOwner));
    const isOwner = isCreator(sender) || isConfiguredOwner;
    const isROwner = isOwner || sender === botJid;
    try {
        if (!_isBroadcast && !msg.isGroup && !String(msg.chat || '').endsWith('@g.us') && !msg.fromMe) {
            const on = await ensureAusenciaState(botJid);
            if (on || isAusenciaActive(botJid)) {
                const handled = await handleAusenciaMessage({ sock, msg, text: body, botJid });
                if (handled)
                    return;
            }
        }
    }
    catch (e) {
        console.error('[ausencia-route]', e?.message || e);
    }
    try {
        if (!_isBroadcast && !msg.fromMe && body && !/^\s*[#./!]\s*\S/.test(body)) {
            const sess = getChatiaSession(botJid, msg.chat, msg.sender);
            if (sess) {
                await replyChatia({ sock, msg, text: body, botJid });
                return;
            }
        }
    }
    catch (e) {
        console.error('[chatia-route]', e?.message || e);
    }
    const DEVELOPER_JID = OWNER_JID;
    const normalizedSender = normalizeJid(sender);
    if (normalizedSender &&
        isGloballyBanned(normalizedSender) &&
        normalizedSender !== DEVELOPER_JID &&
        !isCreator(sender)) {
        return;
    }
    const adminSet = new Set(participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').flatMap(p => [p.id?.split('@')[0], p.lid?.split('@')[0], p.phoneNumber?.split('@')[0]].filter(Boolean)));
    const senderBase = sender.split('@')[0];
    const botBase = botJid.split('@')[0];
    const isBotAdmins = msg.isGroup ? adminSet.has(botBase) : false;
    const isCreatorUser = isCreator(sender);
    const isAdmins = msg.isGroup ? (adminSet.has(senderBase) || isCreatorUser) : isCreatorUser;
    Promise.allSettled((global.cmdsExecute ?? []).filter(p => p.type === 'all').map(p => Promise.resolve().then(() => p.fn({ msg, sock, groupMetadata, participants, isAdmins, isBotAdmins, isOwner, isCreator: isCreatorUser, __dirname: p.dirname })).catch(e => console.error(chalk.gray(`[ ✿ ] Error all-plugin ${p.key}: ${e?.message || e}`)))));
    const tf = await db.getChatUser(msg.chat, msg.sender);
    const to = new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
    if (!tf.stats)
        tf.stats = {};
    if (!tf.stats[to])
        tf.stats[to] = { msgs: 0, cmds: 0 };
    tf.stats[to].msgs++;
    await db.updateChatUser(msg.chat, msg.sender, 'stats', tf.stats);
    const rawBotname = String(settings.namebot2 || 'Haimiya mío');
    const tipo = String(settings.type || 'Sub');
    const cleanBotname = rawBotname.replace(/[^a-zA-Z0-9\s]/g, '');
    const namebot = cleanBotname || 'Haimiya';
    const firstWord = namebot.trim().split(/\s+/)[0] || 'Haimiya';
    const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const strRegex = escapeRegex;
    const shortForms = [namebot, namebot.charAt(0), firstWord, tipo.split(/\s+/)[0], firstWord.slice(0, 2), firstWord.slice(0, 3)]
        .filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
    const prefCfg = resolvePrefixes(settings.prefijo);
    const prefixKey = `${namebot}|${tipo}|${prefCfg.noPrefix}|${prefCfg.list.join('\u0001')}`;
    let prefix = prefixRegexCache.get(prefixKey);
    if (!prefix) {
        prefix = prefCfg.noPrefix ? /^(?:)/i : new RegExp('^(?:' + shortForms.map(escapeRegex).join('|') + ')?(?:' + prefCfg.list.map(escapeRegex).join('|') + ')', 'i');
        if (prefixRegexCache.size > 256)
            prefixRegexCache.clear();
        prefixRegexCache.set(prefixKey, prefix);
    }
    if (msg.type === 'stickerMessage' && msg.isGroup) {
        const stickerHash = await getStickerKey(msg);
        const stickerCommand = stickerHash ? chatData?.stickerCmds?.[stickerHash] : null;
        if (stickerCommand) {
            const pfx = prefCfg.noPrefix ? '' : prefCfg.list[0];
            msg.text = `${pfx}${stickerCommand}`;
            msg.body = msg.text;
            msg.usedPrefix = pfx;
            msg.command = stickerCommand;
            msg.args = [];
        }
    }
    let customCmd = null;
    let pluginPrefix = prefix;
    for (const data of global.customCommands || []) {
        const cp = data.customPrefix;
        let patterns = customPrefixCache.get(data);
        if (!patterns) {
            patterns = (Array.isArray(cp) ? cp : [cp]).filter(Boolean).map(value => value instanceof RegExp ? value : new RegExp(strRegex(value)));
            customPrefixCache.set(data, patterns);
        }
        const found = patterns.map(regex => { regex.lastIndex = 0; return [regex.exec(msg.text), regex]; }).find(item => item[0]);
        if (found) {
            customCmd = data.command;
            pluginPrefix = found[1];
            break;
        }
    }
    let matchs = pluginPrefix instanceof RegExp ? [[pluginPrefix.exec(msg.text), pluginPrefix]] : Array.isArray(pluginPrefix) ? pluginPrefix.map(p => {
        let regex = p instanceof RegExp ? p : new RegExp(strRegex(p));
        return [regex.exec(msg.text), regex];
    }) : typeof pluginPrefix === 'string' ? [[new RegExp(strRegex(pluginPrefix)).exec(msg.text), new RegExp(strRegex(pluginPrefix))]] : [[null, null]];
    let match = matchs.find(p => p[0]) || null;
    if (match)
        void markCommandSeen(sock, msg);
    for (const p of (global.cmdsExecute ?? [])) {
        if (p.type !== 'before')
            continue;
        try {
            if (await p.fn({ msg, sock, match, groupMetadata, participants, isAdmins, isBotAdmins, isOwner, isCreator: isCreatorUser, __dirname: p.dirname }))
                return;
        }
        catch (e) {
            console.error(chalk.gray(`[ ✿ ] Error before-plugin ${p.key}: ${e.message}`));
        }
    }
    if (!match) {
        try {
            const bodyText = String(msg.text || msg.body || '').trim();
            if (bodyText && !msg.fromMe && !/^[.#!\/+\-]\S/.test(bodyText)) {
                const { getChatiaSession, replyChatia } = await import('./cmds/ai/chatia.js');
                const sess = getChatiaSession(botJid, msg.chat, sender);
                if (sess) {
                    await sock.readMessages([msg.key]).catch(() => { });
                    await replyChatia({ sock, msg, text: bodyText, botJid });
                }
            }
        }
        catch (e) {
            console.error(chalk.gray(`[ ✿ ] ChatIA: ${e?.message || e}`));
        }
        return;
    }
    let usedPrefix = match[0] || '';
    let args = msg.text.slice(usedPrefix.length).trim().split(" ");
    let command = customCmd ?? (args.shift() || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let text = args.join(' ');
    if (!command)
        return;
    const publicSocketCommand = /^(code|qr)$/i.test(command);
    if (!msg.isGroup && Number(settings.antiPrivate || 0) === 1 && !isCreatorUser && !isConfiguredOwner && !publicSocketCommand)
        return;
    const pushname = msg.pushName || 'Sin nombre';
    const consolePrimary = chatData.primaryBot;
    if (msg.message || !consolePrimary || consolePrimary === botJid) {
        console.log(`
𝄢 · • —— ᐁ ✤ ᐁ —— • · · • —— ᐁ ✤ ᐁ —— •✧
❚ ▸ ${chalk.cyan('𝐁𝐎𝐓 ❱❱')} ${chalk.bgMagenta(chalk.white.italic(sock.user.name))}
❚ ▸ ${chalk.cyan('𝐇𝐎𝐑𝐀𝐑𝐈𝐎 ❱❱')} ${chalk.black.bgWhite(moment().format('DD/MM/YY HH:mm:ss'))}
❚ ${chalk.magentaBright('°o.OO.o°°o.OO.o°°o.OO.o°')}
❚ ▸ ${chalk.green('𝐔𝐒𝐔𝐀𝐑𝐈𝐎 ❱❱')} ${chalk.white(pushname)} / ${chalk.bgMagentaBright.bold(msg.isGroup ? 'Grupo' : 'Chat Private')}
❚ ▸ ${chalk.green('𝐂𝐎𝐌𝐀𝐍𝐃𝐎 ❱❱')} ${chalk.magentaBright(command ? command : 'No Command')}
❚ ${chalk.magentaBright('°o.OO.o°°o.OO.o°°o.OO.o°')}
❚ ▸ ${chalk.redBright('𝐓𝐈𝐏𝐎 ❱❱')} ${chalk.greenBright.bold('[Bot Log]')}
𝄢 · • —— ᐁ ✤ ᐁ —— • · · • —— ᐁ ✤ ᐁ —— •✧`.trim());
    }
    const hasPrefix = prefCfg.noPrefix ? true : prefCfg.list.some(p => msg.text?.startsWith(p));
    const botprimaryId = chatData?.primaryBot;
    const isSetPrimaryCommand = command === 'setprimary';
    if (botprimaryId && botprimaryId !== botJid && !isSetPrimaryCommand) {
        if (hasPrefix) {
            const groupJids = participants.map(p => p.id);
            const sessionDirs = ['./Sessions/Subs'];
            function getAllSessionBots() {
                const bots = [];
                for (const dir of sessionDirs) {
                    try {
                        for (const sub of fs.readdirSync(path.resolve(dir))) {
                            if (fs.existsSync(path.resolve(dir, sub, 'creds.json')))
                                bots.push(sub + '@s.whatsapp.net');
                        }
                    }
                    catch { }
                }
                try {
                    if (fs.existsSync(path.resolve('./Sessions/Owner/creds.json'))) {
                        const ownerId = global.sock?.user?.id?.split(':')[0] + '@s.whatsapp.net';
                        if (ownerId)
                            bots.push(ownerId);
                    }
                }
                catch { }
                return bots;
            }
            const sessionBots = getAllSessionBots();
            const primaryInGroup = groupJids.includes(botprimaryId);
            const isPrimarySelf = botprimaryId === botJid;
            const primaryInSessions = sessionBots.includes(botprimaryId);
            if (!primaryInSessions || !primaryInGroup)
                return;
            if ((primaryInSessions && primaryInGroup) || isPrimarySelf)
                return;
        }
    }
    const isVotOwn = [
        sock.user.id.split(':')[0] + '@s.whatsapp.net',
        ...global.owner.map(num => num + '@s.whatsapp.net')
    ].includes(sender);
    if (settings.self) {
        const owner = settings.owner;
        if (sender !== owner &&
            !isVotOwn &&
            !isCreatorUser &&
            !global.mods.map(num => num + '@s.whatsapp.net').includes(sender))
            return;
    }
    if (chatData?.bannedGrupo && !['#bot on', '/bot on', '.bot on', '!bot on', '-bot on', '+bot on', 'bot on'].includes(body.toLowerCase()) &&
        !isCreatorUser && !global.owner.map(num => num + '@s.whatsapp.net').includes(msg.sender))
        return;
    if (chatData.adminonly && !isAdmins && !isCreator(sender))
        return;
    if ((msg.fromMe && msg.id.startsWith("3EB0")) || (msg.id.startsWith("BAE5") && msg.id.length === 16) || (msg.id.startsWith("B24E") && msg.id.length === 20))
        return;
    const user = await db.getChatUser(msg.chat, msg.sender);
    const today = getStatsDay();
    if (!user.stats)
        user.stats = {};
    if (!user.stats[today])
        user.stats[today] = { msgs: 0, cmds: 0 };
    const cmdData = global.comandos.get(command);
    try {
        const fl = checkFlood({ user: sender, chat: msg.chat, bot: sock.userId || sock.user?.id || 'bot', command }, { heavy: cmdData?.category === 'ai' || cmdData?.category === 'dl' });
        if (!fl.ok)
            return msg.reply('⏳ Vas muy rápido. Espera un momento.');
    }
    catch { }
    if (shouldShedLoad() && !isCreator(sender) && !isStaff(sender)) {
        const light = new Set(['ping', 'menu', 'help', 'allmenu', 'm', 'ayuda', 'status', 'estado']);
        if (!light.has(command))
            return msg.reply('⚡ El bot está saturado. Prueba en unos segundos.');
    }
    if (!cmdData) {
        if (prefCfg.noPrefix)
            return;
        if (!/^(?=.*\p{L})[\p{L}\p{N}_]{1,32}$/u.test(command))
            return;
        return msg.reply(`¤ El comando *${command}* no existe.\n✎ Usa *${usedPrefix}help* para ver la lista de comandos disponibles.`);
    }
    const principalSocketPublic = new Set(['bots', 'sockets', 'code', 'qr', 'codeprem']);
    if (cmdData.category === 'socket' && isMainBot(sock) && !isOwner && !principalSocketPublic.has(command)) {
        return msg.reply(`¤ El comando *${command}* no existe.`);
    }
    if (!isCreatorUser && !isStaff(sender) && !isConfiguredOwner) {
        if (isMaintenance())
            return msg.reply(`🛠️ ${maintenanceMessage() || 'El bot está en mantenimiento. Vuelve en un rato.'}`);
        if (isBlocked(cmdData.command))
            return msg.reply(`🔒 El comando *${cmdData.command}* está desactivado temporalmente.`);
    }
    const pausedCommand = commandMaintenance(botJid, cmdData.command);
    if (pausedCommand && !isCreatorUser && !isConfiguredOwner && !isStaff(sender)) {
        return msg.reply(`🛠️ *${cmdData.command} está en mantenimiento.*
${pausedCommand.reason || 'Estamos revisando el servicio.'}`);
    }
    const comando = msg.text.slice(usedPrefix.length);
    if ((cmdData.category === 'developer' || cmdData.isCreator) && !isCreatorUser) {
        return msg.reply(`¤ El comando *${command}* no existe.\n✎ Usa *${usedPrefix}help* para ver la lista de comandos disponibles.`);
    }
    if (cmdData.isOwner && !isCreatorUser && !isConfiguredOwner && !(cmdData.perm && hasPerm(sender, cmdData.perm))) {
        return msg.reply(`¤ El comando *${command}* no existe.\n✎ Usa *${usedPrefix}help* para ver la lista de comandos disponibles.`);
    }
    if (cmdData.isAdmin && !isAdmins && !isCreator(sender))
        return sock.reply(msg.chat, mess.admin, msg);
    if (cmdData.botAdmin && !isBotAdmins && !isCreatorUser)
        return sock.reply(msg.chat, mess.botAdmin, msg);
    let quotaKey = null;
    if (!isCreatorUser) {
        const gate = limits.check({ command: cmdData.command, settings, isMain: isMainBot(sock) });
        if (!gate.ok && gate.reason === 'premium_only') {
            return msg.reply(`🔒 *${cmdData.command}* no está disponible en subbots gratuitos.\n\n› Es un comando *Premium* (o del bot principal).\n› Contacta al developer desde WhatsApp para consultar los planes.`);
        }
        if (!gate.ok && gate.reason === 'quota') {
            return msg.reply(`⏳ Este subbot alcanzó su límite diario de descargas *(${gate.used}/${gate.limit})*.\n\n› Se reinicia a las 00:00 UTC.\n› Los subbots Premium no tienen límite. Contacta al developer por WhatsApp para más información.`);
        }
        quotaKey = gate.key || null;
    }
    let commandFailed = false;
    try {
        await sock.sendPresenceUpdate('composing', msg.chat);
        const user2 = await db.getUser(msg.sender);
        user2.usedcommands = (user2.usedcommands || 0) + 1;
        settings.commandsejecut = (settings.commandsejecut || 0) + 1;
        user.usedTime = new Date();
        user2.exp = (user2.exp || 0) + Math.floor(Math.random() * 100);
        user2.name = msg.pushName;
        user.stats[today].cmds++;
        db.recordCommandUsage({
            chatUser: user, user: user2, settings,
            usedTime: user.usedTime, exp: user2.exp, name: user2.name,
            usedcommands: user2.usedcommands, commandsejecut: settings.commandsejecut,
            stats: user.stats
        });
        const releaseTask = beginTask();
        if (!releaseTask)
            return msg.reply('♻️ Haimiya está cerrando tareas para reiniciarse. Inténtalo en unos segundos.');
        const action = Promise.resolve().then(async () => {
            const originalReply = msg.reply;
            if (typeof originalReply === 'function') {
                msg.reply = async (...replyArgs) => {
                    const first = replyArgs[0];
                    const responseText = String(typeof first === 'string' ? first : first?.text || '');
                    const failed = /(?:error (?:al|en|de)|fall[oó]|no se pudo (?:descargar|procesar|obtener|conectar|consultar)|no pude (?:descargar|procesar|obtener|conectar)|timeout|tiempo de espera)/i.test(responseText);
                    const validation = /(?:permiso|acceso denegado|uso:|ejemplo:|menciona|ingresa|faltan|debes|no encontr[eé] resultados|no tienes)/i.test(responseText);
                    if (failed && !validation) {
                        commandFailed = true;
                        await noteCommandFailure({ sock, command: cmdData.command, botId, settings, error: { message: responseText.slice(0, 180) } }).catch(() => { });
                    }
                    return originalReply.apply(msg, replyArgs);
                };
            }
            try {
                return await cmdData.run({
                    msg, sock, args, command, usedPrefix, text, groupMetadata, participants, isAdmins, isBotAdmins, isOwner,
                    isCreator: isCreatorUser,
                    __dirname: global.plugins[cmdData.pluginKey]?.dirname
                });
            }
            finally {
                if (typeof originalReply === 'function')
                    msg.reply = originalReply;
            }
        });
        const trackedAction = action.finally(releaseTask);
        let timer;
        const cmdTimeout = shouldShedLoad() ? 20_000 : 45_000;
        try {
            await Promise.race([trackedAction, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('COMMAND_TIMEOUT')), cmdTimeout); })]);
            if (!commandFailed)
                noteCommandSuccess({ command: cmdData.command, botId });
            if (quotaKey)
                await limits.consume(db, botJid, quotaKey, settings).catch(() => { });
        }
        finally {
            clearTimeout(timer);
            try {
                await sock.sendPresenceUpdate('paused', msg.chat);
            }
            catch { }
        }
    }
    catch (error) {
        try {
            noteError();
        }
        catch { }
        const isTimeout = String(error?.message || error) === 'COMMAND_TIMEOUT';
        if (isTimeout) {
            if (!commandFailed)
                await noteCommandFailure({ sock, command: cmdData.command, botId, settings, error }).catch(() => { });
            return msg.reply('⏳ Tardó demasiado. Intenta de nuevo.').catch(() => { });
        }
        console.error(`[ ✿ ] Error en comando "${command}":`, error?.message || error);
        if (!commandFailed)
            await noteCommandFailure({ sock, command: cmdData.command, botId, settings, error }).catch(() => { });
        return msg.reply(say('error', sender)).catch(() => { });
    }
}
export default async function handler(sock, msg) {
    if (!msg?.key?.remoteJid || isDraining())
        return;
    const release = beginTask();
    if (!release)
        return;
    try {
        return await processMessage(sock, msg);
    }
    finally {
        release();
    }
}
