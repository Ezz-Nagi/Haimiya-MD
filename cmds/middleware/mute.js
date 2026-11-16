import db from "#db";
import { isCreator } from '../../lib/haimiya.js';
export default {
    before: async ({ msg, sock, participants, isAdmins }) => {
        if (!msg?.isGroup || !msg?.sender)
            return false;
        const chat = await db.getChat(msg.chat);
        const muted = chat?.mutedUsers || [];
        if (!muted.includes(msg.sender))
            return false;
        if (isAdmins || isCreator(msg.sender))
            return false;
        const botBase = String(sock.user?.id || '').split(':')[0];
        const senderBase = String(msg.sender).split('@')[0];
        if (botBase && botBase === senderBase)
            return false;
        await sock.sendMessage(msg.chat, { delete: msg.key }).catch(() => { });
        return true;
    }
};
