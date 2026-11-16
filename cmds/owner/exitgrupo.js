import { OWNER_JID } from '../../lib/haimiya.js';
import { hasPerm } from "../../lib/system/staff.js";
import { normalizeJid } from "../../lib/system/globalban.js";
const DEVELOPER = OWNER_JID;
function groupId(id) {
    const v = String(id || "").trim();
    if (!v)
        return null;
    if (v.endsWith("@g.us"))
        return v;
    const clean = v.replace(/[^0-9-]/g, "");
    return clean ? `${clean}@g.us` : null;
}
export default {
    command: ["exitgrupo"],
    aliases: [],
    desc: 'Hace que el bot abandone uno o varios grupos indicados.',
    usage: 'exitgrupo <id,id,...>',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'owner',
    run: async ({ msg, sock, args }) => {
        if (normalizeJid(msg.sender) !== DEVELOPER && !hasPerm(msg.sender, "grupos"))
            return sock.reply(msg.chat, "《✧》 Acceso denegado.", msg);
        const ids = [...new Set((args || []).join(" ").split(",").map(groupId).filter(Boolean))];
        if (!ids.length)
            return sock.reply(msg.chat, "《✧》 Usa: #exitgrupo ID,ID,ID", msg);
        const ok = [], fail = [];
        for (const id of ids) {
            try {
                await sock.groupLeave(id);
                ok.push(id);
                await new Promise(r => setTimeout(r, 500));
            }
            catch (e) {
                console.error(`[HAIMIYA EXITGRUPO] ${id}`, e);
                fail.push(id);
            }
        }
        return sock.reply(msg.chat, [
            "╭━━━〔 ✦ HAIMIYA ✦ 〕━━━╮",
            "",
            `│ ✓ Abandonados: ${ok.length}`,
            ...ok.map(x => `│   • ${x}`),
            "",
            `│ ⚠ Errores: ${fail.length}`,
            ...fail.map(x => `│   • ${x}`),
            "",
            "╰━━━━━━━━━━━━━━━━━━━━━━╯"
        ].join("\n"), msg);
    }
};
