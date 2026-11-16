import { PERMS, ROLE_PRESETS, getPerms, getStaffMember, isStaff } from '../../lib/system/staff.js';
import { isCreator } from '../../lib/haimiya.js';
import { getTarget, tag } from '../../lib/system/targets.js';
export default {
    command: ['perms'],
    aliases: ['roles', 'permisos'],
    desc: 'Muestra los cargos del staff, sus permisos y los de un miembro.',
    usage: 'perms [@usuario]',
    category: 'owner',
    isAdmin: false,
    botAdmin: false,
    hidden: false,
    isOwner: false,
    run: async ({ msg, sock, args, usedPrefix }) => {
        if (!isCreator(msg.sender) && !isStaff(msg.sender))
            return msg.reply('《✧》 Solo el staff puede ver esto.');
        const target = getTarget(msg, args);
        if (target) {
            const m = getStaffMember(target);
            const perms = getPerms(target);
            return sock.sendMessage(msg.chat, { text: m || perms.length ? `《✦》 ${tag(target)}\nCargo: *${m?.role || 'Developer'}*\nPermisos: *${perms.join(', ') || 'ninguno'}*` : `《✧》 ${tag(target)} no pertenece al staff.`, mentions: [target] }, { quoted: msg });
        }
        const permLines = Object.entries(PERMS).map(([k, v]) => `✦ *${k}* — ${v}`).join('\n');
        const roleLines = Object.entries(ROLE_PRESETS).map(([k, v]) => `✿ *${k}* › ${v.join(', ')}`).join('\n');
        return msg.reply(`╭─〔 ✦ PERMISOS DEL STAFF 〕\n${permLines}\n\n╭─〔 ✿ CARGOS 〕\n${roleLines}\n\n› Asignar cargo: *${usedPrefix}setrole @usuario <cargo>*\n› Dar permiso suelto: *${usedPrefix}setperm @usuario <permiso>*\n› Quitar: *${usedPrefix}delperm @usuario <permiso|todos>*`);
    }
};
