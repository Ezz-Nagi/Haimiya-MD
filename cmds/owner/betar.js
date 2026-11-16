import { hasPerm } from "../../lib/system/staff.js";
import { addGlobalBan, normalizeJid } from "../../lib/system/globalban.js";
import { OWNER_JID } from '../../lib/haimiya.js';
const DEVELOPER = OWNER_JID;
function getTarget(msg, args = []) {
    const mentioned = msg?.mentionedJid || msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentioned.length)
        return normalizeJid(mentioned[0]);
    const number = args.find(x => /^\d{7,15}$/.test(String(x).replace(/\D/g, "")));
    return number ? normalizeJid(number) : null;
}
export default {
    command: ["betar"],
    aliases: [],
    desc: 'Bloquea a un usuario para impedirle usar el bot.',
    usage: 'betar @usuario',
    isOwner: false,
    perm: 'moderacion',
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'owner',
    run: async ({ msg, sock, args }) => {
        if (normalizeJid(msg.sender) !== DEVELOPER && !hasPerm(msg.sender, "moderacion"))
            return sock.reply(msg.chat, "《✧》 Acceso denegado.", msg);
        const target = getTarget(msg, args);
        if (!target)
            return sock.reply(msg.chat, "《✧》 Menciona al usuario: #betar @usuario", msg);
        if (target === DEVELOPER)
            return sock.reply(msg.chat, "《✧》 El developer no puede ser bloqueado.", msg);
        const result = addGlobalBan(target, { name: msg.pushName, bannedBy: DEVELOPER });
        if (!result.success)
            return sock.reply(msg.chat, result.reason === "already_banned" ? "《✧》 Ese usuario ya está bloqueado globalmente." : "《✧》 Usuario inválido.", msg);
        return sock.reply(msg.chat, `╭━━━〔 🔒 HAIMIYA GLOBAL BAN 〕━━━╮\n│\n│ ✦ Usuario bloqueado\n│   @${target.split("@")[0]}\n│\n│ 🚫 Bloqueado en todos los bots.\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`, msg);
    }
};
