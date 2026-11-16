import { resetStaff, normalizeJid } from "../../lib/system/staff.js";
import { OWNER_JID } from '../../lib/haimiya.js';
const DEVELOPER = OWNER_JID;
export default {
    command: ["staffreset"],
    aliases: ['resetstaff'],
    desc: 'Restablece el Staff global de Haimiya (solo developer).',
    usage: 'staffreset | resetstaff',
    isOwner: true,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'developer',
    run: async ({ msg }) => {
        if (normalizeJid(msg?.sender) !== DEVELOPER) {
            return msg.reply("《✧》 Acceso denegado.");
        }
        const staff = resetStaff();
        return msg.reply(`《✦》 Staff restablecido correctamente.\n\nMiembros actuales: *${staff.length}*\n\nEl Developer principal fue restaurado automáticamente.`);
    }
};
