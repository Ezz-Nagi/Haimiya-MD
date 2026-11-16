import db from '#db';
import os from 'node:os';
import fs from 'node:fs';
import { say, isMainBot, getBotSettingsId, ownerJid, OWNER_NUMBER, formatUptime } from '../../lib/haimiya.js';
import { panel, field } from '../../lib/system/ui.js';

const packageInfo = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

export default {
    command: ['infobot'],
    aliases: ['infosocket', 'info'],
    category: 'info',
    desc: 'Muestra la información del socket y de la versión actual del bot.',
    usage: 'infobot',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock }) => {
        try {
            const botId = getBotSettingsId(sock);
            const settings = db.getSettings(botId);
            const owner = ownerJid(settings.owner || '');
            const ownerNumber = owner ? owner.split('@')[0] : 'Sin configurar';
            const developerNumber = OWNER_NUMBER || 'Sin configurar';
            const botName = settings.namebot || 'Haimiya mío';
            const shortName = settings.namebot2 || 'Haimiya mío';
            const prefix = Array.isArray(settings.prefijo) ? settings.prefijo.join(' ') : String(settings.prefijo || '#');
            const banner = settings.bannerCustom === true && /^https?:\/\//i.test(String(settings.banner || '')) ? settings.banner : 'https://magazine.jp.square-enix.com/top/shoei/9784301008668.jpg?t=20261102120701';
            const message = panel('Información del bot', [
                field('Nombre', botName),
                field('Alias', shortName),
                field('Versión', `v${packageInfo.version}`),
                field('Tipo de socket', isMainBot(sock) ? 'Principal' : (settings.type || 'Subbot')),
                field('Owner del socket', ownerNumber),
                field('Developer', developerNumber),
                field('Prefijos', prefix),
                field('Comandos ejecutados', Number(settings.commandsejecut || 0).toLocaleString()),
                field('Tiempo activo', formatUptime(process.uptime() * 1000)),
                field('Sistema', `${os.type()} · ${os.arch()}`),
                field('Node.js', process.version),
            ], { icon: '◈', footer: 'Haimiya-MD · Información del socket' });
            const contextInfo = { mentionedJid: owner ? [owner] : [], isForwarded: false };
            if (/\.(mp4|webm|mov|gif)$/i.test(banner.split('?')[0])) {
                return sock.sendMessage(msg.chat, { video: { url: banner }, caption: message, contextInfo }, { quoted: msg });
            }
            return sock.sendMessage(msg.chat, { image: { url: banner }, caption: message, contextInfo }, { quoted: msg }).catch(() => sock.sendMessage(msg.chat, { text: message, contextInfo }, { quoted: msg }));
        } catch (e) {
            console.error('[INFOBOT]', e?.message || e);
            return msg.reply(say('error', msg.sender));
        }
    }
};
