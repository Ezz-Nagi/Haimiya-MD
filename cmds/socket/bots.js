import db from "#db";
import fs from 'fs';
import path from 'path';
import ws from 'ws';
import { fileURLToPath } from 'url';
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
export default {
    command: ['bots'],
    aliases: ['sockets'],
    desc: 'Muestra los sockets o instancias de Haimiya disponibles.',
    usage: 'bots',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'socket',
    run: async ({ msg, sock }) => {
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const from = msg.key.remoteJid;
        const groupMetadata = msg.isGroup ? await sock.groupMetadata(from).catch(() => { }) : null;
        const groupParticipants = groupMetadata?.participants?.map((p) => p.phoneNumber || p.jid || p.lid || p.id) || [];
        const mainBotJid = global?.sock?.user?.id?.split(':')[0] + '@s.whatsapp.net' || '';
        const basePath = path.join(dirname, '../../Sessions');
        const folders = { Subs: 'Subs' };
        const getBotsFromFolder = (folderName) => {
            const folderPath = path.join(basePath, folderName);
            if (!fs.existsSync(folderPath))
                return [];
            return fs
                .readdirSync(folderPath)
                .filter((dir) => {
                const credsPath = path.join(folderPath, dir, 'creds.json');
                return fs.existsSync(credsPath);
            })
                .map((id) => id.replace(/\D/g, ''));
        };
        const subs = [...new Set(getBotsFromFolder(folders.Subs))];
        const totals = { Owner: 0, Premium: 0, Sub: 0 };
        const categorizedBots = { Owner: [], Premium: [], Sub: [] };
        const mentionedJid = [];
        if (mainBotJid) {
            const mainCfg = await db.getSettings(mainBotJid);
            if (mainCfg) {
                totals.Owner = 1;
                const number = mainBotJid.split('@')[0];
                const name = mainCfg?.namebot2 || 'Bot';
                if (groupParticipants.includes(mainBotJid)) {
                    mentionedJid.push(mainBotJid);
                    categorizedBots.Owner.push(`- [Owner *${name}*] › @${number}`);
                }
            }
        }
        const results = await Promise.all(subs.map(async (num) => {
            const jid = num + '@s.whatsapp.net';
            const cfg = await db.getSettings(jid);
            const isPremium = cfg?.botprem === 1 || String(cfg?.type || '').toLowerCase() === 'premium';
            const label = isPremium ? 'Premium' : 'Sub';
            const name = cfg?.namebot2 || 'Bot';
            const inGroup = groupParticipants.includes(jid);
            return { jid, num, label, name, inGroup };
        }));
        for (const { jid, num, label, name, inGroup } of results) {
            totals[label]++;
            if (inGroup) {
                mentionedJid.push(jid);
                categorizedBots[label].push(`- [${label} *${name}*] › @${num}`);
            }
        }
        const totalBots = totals.Owner + totals.Sub + totals.Premium;
        let message = `ꕥ Números de Sockets activos *(${totalBots})*\n\n`;
        message += `ੈ❖‧₊˚ Principales › *${totals.Owner}*\n`;
        message += `ੈ✿‧₊˚ Subs › *${totals.Sub}*\n`;
        message += `ੈ✦‧₊˚ Premium › *${totals.Premium}*\n\n`;
        message += `➭ *Total de bots ›* ${totalBots}\n`;
        const lines = [
            ...categorizedBots.Owner,
            ...categorizedBots.Premium,
            ...categorizedBots.Sub
        ];
        if (lines.length) {
            message += '\n' + lines.join('\n');
        }
        await sock.sendMessage(msg.chat, { text: message, contextInfo: { mentionedJid } }, { quoted: msg });
    },
};
