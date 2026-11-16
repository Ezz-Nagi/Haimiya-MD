import db from '#db';
import moment from 'moment-timezone';
import { say, isMainBot, OWNER_JID, getBotSettingsId, ownerJid } from '../../lib/haimiya.js';
import { theme } from '../../lib/system/theme.js';
const CHANNEL_JID = '120363424850969101@newsletter';
const CHANNEL_NAME = '☆ 𝐻𝒶𝒾𝓂𝒾𝓎𝒶';
const DEFAULT_BANNER = 'https://magazine.jp.square-enix.com/top/shoei/9784301008668.jpg?t=20261102120701';
const CAT_ORDER = ['info', 'ai', 'download', 'search', 'anime', 'group', 'socket', 'economy', 'gacha', 'fun', 'utils', 'sticker', 'profile', 'owner', 'developer', 'general'];
const CAT_ALIASES = { dl: 'download', descargas: 'download', grupo: 'group', grupos: 'group', group: 'group', ia: 'ai', tools: 'utils', util: 'utils', herramientas: 'utils', economia: 'economy', eco: 'economy', juegos: 'fun', game: 'fun', games: 'fun', subbots: 'socket', bots: 'socket', dev: 'developer' };
const normalize = value => String(value ?? '').replace(/^[#./!$%^&*+=~`|\\?]+/, '').trim().toLowerCase();
const cleanJid = value => String(value || '').replace(/:\d+(?=@)/, '');
const formatUptime = ms => {
    const total = Math.floor(Math.max(0, Number(ms) || 0) / 1000);
    const days = Math.floor(total / 86400);
    const hours = Math.floor(total % 86400 / 3600);
    const minutes = Math.floor(total % 3600 / 60);
    const seconds = total % 60;
    return [days && `${days}d`, hours && `${hours}h`, minutes && `${minutes}m`, `${seconds}s`].filter(Boolean).join(' ');
};
function buildCatalog() {
    const catalog = new Map();
    if (!(global.comandos instanceof Map))
        return [];
    for (const [registered, data] of global.comandos) {
        if (!data || data.hidden || registered !== data.command)
            continue;
        const command = normalize(data.command);
        const category = CAT_ALIASES[String(data.category || 'general').toLowerCase()] || String(data.category || 'general').toLowerCase();
        if (!command)
            continue;
        const aliases = [...new Set((Array.isArray(data.aliases) ? data.aliases : []).map(normalize).filter(alias => alias && alias !== command))];
        catalog.set(`${data.pluginKey || 'plugin'}:${command}`, {
            command,
            aliases,
            category,
            description: String(data.description || 'Comando disponible.'),
            usage: String(data.usage || '')
        });
    }
    return [...catalog.values()].sort((a, b) => a.command.localeCompare(b.command));
}
function resolveBanner(settings) {
    const stored = String(settings?.banner || '').trim();
    const validStored = /^https?:\/\//i.test(stored);
    if (validStored && settings.bannerCustom === true)
        return stored;
    return DEFAULT_BANNER;
}
async function sendMenu(sock, msg, text, banner, botname) {
    const mentions = [OWNER_JID, ownerJid(db.getSettings(getBotSettingsId(sock)).owner || '')].filter((jid, index, list) => jid && list.indexOf(jid) === index);
    const contextInfo = {
        mentionedJid: mentions,
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: CHANNEL_JID,
            newsletterName: CHANNEL_NAME,
            serverMessageId: 0
        }
    };
    const body = String(text || '').trim();
    let extension = '';
    try {
        extension = new URL(banner).pathname.toLowerCase();
    }
    catch { }
    if (/\.(mp4|webm|mov|gif)$/i.test(extension)) {
        return sock.sendMessage(msg.chat, { video: { url: banner }, gifPlayback: true, caption: body, contextInfo }, { quoted: msg });
    }
    try {
        await sock.sendMessage(msg.chat, { image: { url: banner }, caption: body, contextInfo }, { quoted: msg });
        return;
    }
    catch { }
    await sock.sendMessage(msg.chat, { text: body, contextInfo }, { quoted: msg });
}
export default {
    command: ['menu', 'help'],
    aliases: ['m', 'ayuda'],
    category: 'info',
    description: 'Muestra el catálogo dinámico de comandos, sus aliases y categorías.',
    desc: 'Muestra el catálogo dinámico de Haimiya-MD.',
    usage: 'menu [buscar texto|categoría|stats|categorias|comando]',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock, args, command, usedPrefix: prefix }) => {
        try {
            const botId = getBotSettingsId(sock);
            if (!botId)
                throw new Error('No se pudo identificar la sesión del bot');
            const settings = db.getSettings(botId);
            const botname = String(settings.namebot2 || settings.namebot || 'Haimiya mío');
            const banner = resolveBanner(settings);
            const now = moment.tz('America/Bogota');
            const catalog = buildCatalog();
            const arg0 = normalize(args?.[0] || '');
            const searchMode = ['buscar', 'search', 'find'].includes(arg0);
            const searchTerm = searchMode ? normalize(args.slice(1).join(' ')) : '';
            const byCategory = new Map();
            for (const item of catalog) {
                if (!byCategory.has(item.category))
                    byCategory.set(item.category, []);
                byCategory.get(item.category).push(item);
            }
            const sortCategories = values => values.sort((a, b) => {
                const left = CAT_ORDER.indexOf(a);
                const right = CAT_ORDER.indexOf(b);
                if (left < 0 && right < 0)
                    return a.localeCompare(b);
                if (left < 0)
                    return 1;
                if (right < 0)
                    return -1;
                return left - right;
            });
            const categories = sortCategories([...byCategory.keys()]);
            const category = !searchMode ? (CAT_ALIASES[arg0] || arg0) : null;
            if (['stats', 'estadisticas', 'estadística', 'estadísticas'].includes(arg0)) {
                const aliases = catalog.reduce((total, item) => total + item.aliases.length, 0);
                const plugins = new Set([...global.comandos.values()].map(item => item?.pluginKey).filter(Boolean)).size;
                return msg.reply(`╭─〔 ✦ HAIMIYA-MD STATS 〕\n│ ✦ Comandos únicos: *${catalog.length}*\n│ ✦ Aliases: *${aliases}*\n│ ✦ Nombres totales: *${catalog.length + aliases}*\n│ ✦ Categorías: *${categories.length}*\n│ ✦ Plugins: *${plugins}*\n╰───────────────`);
            }
            if (['categorias', 'categories', 'cats'].includes(arg0)) {
                return msg.reply(`╭─〔 ✦ CATEGORÍAS 〕\n${categories.map(name => `│ ✦ *${name}* › ${byCategory.get(name).length}`).join('\n')}\n╰───────────────`);
            }
            let visible = catalog;
            if (category && byCategory.has(category))
                visible = byCategory.get(category);
            if (searchMode) {
                if (!searchTerm)
                    return msg.reply(`Usa *${prefix}${command} buscar <texto>*.\nEjemplo: *${prefix}${command} buscar youtube*`);
                visible = catalog.filter(item => [item.command, ...item.aliases, item.description, item.category].join(' ').toLowerCase().includes(searchTerm));
            }
            if (!searchMode && arg0 && !byCategory.has(category)) {
                const found = catalog.find(item => item.command === arg0 || item.aliases.includes(arg0));
                if (found) {
                    const aliases = found.aliases.length ? found.aliases.map(alias => `\`${prefix}${alias}\``).join(' › ') : 'Ninguno';
                    return msg.reply(`╭─〔 ✦ HAIMIYA HELP 〕\n│ ✦ Comando :: *\`${prefix}${found.command}\`*\n│ ✦ Aliases :: ${aliases}\n│ ✦ Categoría :: *${found.category}*\n│ ✦ Descripción :: ${found.description}\n│ ✦ Uso :: *\`${prefix}${found.command}${found.usage ? ` ${found.usage}` : ''}\`*\n╰───────────────`);
                }
            }
            if (!visible.length)
                return msg.reply('《✤》 No encontré comandos con esos criterios.');
            const T = theme();
            const developer = OWNER_JID ? `@${OWNER_JID.split('@')[0]}` : 'No configurado';
            const ownerId = ownerJid(settings.owner || '');
            const owner = ownerId ? `@${ownerId.split('@')[0]}` : 'Sin configurar';
            const botType = isMainBot(sock) ? 'Principal' : String(settings.type || 'Sub');
            const users = db.getUser().length;
            const uptime = formatUptime(sock?.uptime ? Date.now() - sock.uptime : process.uptime() * 1000);
            const icon = T.icon || '✦';
            let menu = `> *${say('greet', msg.sender)}* ${msg.pushName || ''}, soy *${botname}* ${icon}\n\n`;
            menu += `${T.top || '╭────────────────────────'}\n`;
            menu += `│ ❖ *ᴅᴇᴠᴇʟᴏᴘᴇʀ ::* ${developer}\n`;
            menu += `│ ❖ *ᴏᴡɴᴇʀ ::* ${owner}\n`;
            menu += `│ ❖ *ᴛɪᴘᴏ ::* ${botType}\n`;
            menu += `│ ❖ *sɪsᴛᴇᴍᴀ ::* WhatsApp\n`;
            menu += `│ ❖ *ʜᴏʀᴀ ::* ${now.format('DD MMM YYYY, hh:mm A')}\n`;
            menu += `│ ❖ *ᴜsᴜᴀʀɪᴏs ::* ${users.toLocaleString('es-CO')}\n`;
            menu += `│ ❖ *ᴜᴘᴛɪᴍᴇ ::* ${uptime}\n`;
            menu += `${icon} *ᴄᴏᴍᴀɴᴅᴏs* 𓂃\n`;
            const grouped = visible.reduce((result, item) => {
                ;
                (result[item.category] ||= []).push(item);
                return result;
            }, {});
            for (const cat of sortCategories(Object.keys(grouped))) {
                menu += `\n╭─〔 ${T.bullet || '✦'} *${cat.toUpperCase()}* 〕\n`;
                for (const item of grouped[cat].sort((a, b) => a.command.localeCompare(b.command))) {
                    const names = [item.command, ...item.aliases].map(name => `\`${prefix}${normalize(name)}\``).join(' › ');
                    const usage = item.usage ? ` ${String(item.usage).replace(/^[_*]+|[_*]+$/g, '')}` : '';
                    menu += `│ ${T.item || '›'} ${names}${usage}\n│   ${T.sub || '·'} ${item.description}\n`;
                }
                menu += `╰${T.divider || '───────────────'}\n`;
            }
            menu += `\n> *${botname} — desarrollado por Ezz* ${icon}`;
            if (T.footer)
                menu += `\n> ${T.footer}`;
            return sendMenu(sock, msg, menu, banner, botname);
        }
        catch (error) {
            console.error('[HAIMIYA MENU]', error?.stack || error);
            return msg.reply(say('error', msg.sender));
        }
    }
};
