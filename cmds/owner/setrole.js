import { setStaffRole, ROLE_PRESETS } from '../../lib/system/staff.js';
import { isCreator } from '../../lib/haimiya.js';
import { getTarget, restArgs, tag } from '../../lib/system/targets.js';
export default {
    command: ['setrole'],
    aliases: ['setcargo'],
    desc: 'Cambia el cargo de un miembro del staff. Los cargos predefinidos traen permisos especiales.',
    usage: 'setrole @usuario <cargo>',
    isOwner: true,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'developer',
    run: async ({ msg, sock, args, usedPrefix }) => {
        if (!isCreator(msg.sender))
            return msg.reply('《✧》 Acceso denegado.');
        const target = getTarget(msg, args);
        const role = restArgs(args);
        if (!target || !role) {
            return msg.reply(`《✧》 Uso: *${usedPrefix}setrole @usuario <cargo>*\n\nCargos con permisos: ${Object.keys(ROLE_PRESETS).join(', ')}\n(Cualquier otro texto se usa como título sin permisos extra.)\nVer permisos: *${usedPrefix}perms*`);
        }
        const r = setStaffRole(target, role);
        if (!r.success)
            return msg.reply(`《✧》 ${r.error}${/no pertenece/.test(r.error) ? `\nPrimero agrégalo con *${usedPrefix}addstaff @usuario <cargo>*.` : ''}`);
        return sock.sendMessage(msg.chat, { text: `《✦》 Cargo actualizado para ${tag(target)}.\n\nNuevo cargo: *${r.member.role}*\nPermisos: *${(r.member.perms || []).join(', ') || 'ninguno'}*`, mentions: [target] }, { quoted: msg });
    }
};
