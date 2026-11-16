import { OWNER_JID } from '../../lib/haimiya.js';
import db from "#db";
export default {
    command: ['del'],
    aliases: [],
    desc: 'Elimina o gestiona elementos del grupo según la acción solicitada.',
    usage: 'del',
    isOwner: false,
    customPrefix: null,
    hidden: false,
    category: 'group',
    isAdmin: true,
    botAdmin: true,
    group: true,
    run: async ({ msg, sock }) => {
        try {
            const groupInfo = await sock.groupMetadata(msg.chat);
            const participants = groupInfo.participants;
            const botId = sock.decodeJid(sock.user.id);
            const isUserAdmin = participants.some(p => p.id === msg.sender && (p.admin === 'admin' || p.admin === 'superadmin'));
            const isOwner = msg.sender === OWNER_JID;
            const isBotAdmin = participants.some(p => p.id === botId && (p.admin === 'admin' || p.admin === 'superadmin'));
            if (!isBotAdmin) {
                await msg.react('❌');
                return sock.reply(msg.chat, '> 🙄 No tengo admin, baka.', msg);
            }
            if (!isUserAdmin && !isOwner) {
                return await msg.react('❌');
            }
            if (msg.quoted) {
                const key = msg.quoted.key || {
                    remoteJid: msg.chat,
                    fromMe: msg.quoted.fromMe,
                    id: msg.quoted.id,
                    participant: msg.quoted.sender || msg.quoted.author
                };
                await sock.sendMessage(msg.chat, { delete: key });
                await msg.react('✅');
                const text = msg.text || "";
                const count = parseInt(text);
                if (!isNaN(count) && count > 1) {
                    const limit = Math.min(count - 1, 20);
                    const messages = sock.store?.messages[msg.chat]?.array || [];
                    const userMessages = messages
                        .filter(v => (v.key.participant || v.key.remoteJid) === msg.quoted.sender)
                        .slice(-limit);
                    for (const msgToDelete of userMessages.reverse()) {
                        await sock.sendMessage(msg.chat, { delete: msgToDelete.key }).catch(() => null);
                    }
                }
                return;
            }
            const text = msg.text || "";
            const count = parseInt(text);
            if (!isNaN(count) && count > 0) {
                const limit = Math.min(count, 20);
                const messages = sock.store?.messages[msg.chat]?.array || [];
                if (!messages || messages.length === 0) {
                    await msg.react('❌');
                    return;
                }
                const toDelete = messages.slice(-limit);
                for (const msgToDelete of toDelete.reverse()) {
                    if (msgToDelete.key) {
                        await sock.sendMessage(msg.chat, { delete: msgToDelete.key }).catch(() => null);
                    }
                }
                await msg.react('✅');
                return;
            }
            await msg.react('❌');
        }
        catch (e) {
            await msg.react('❌').catch(() => null);
        }
    }
};
