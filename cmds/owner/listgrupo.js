import { hasPerm } from '../../lib/system/staff.js';
import db from '#db';
import { isCreator } from '../../lib/haimiya.js';
const PAGE = 10;
const num = j => String(j || '').split('@')[0].split(':')[0];
const sleep = ms => new Promise(r => setTimeout(r, ms));
export default {
    command: ['grupos'],
    aliases: [],
    desc: 'Lista los grupos del bot (ID, miembros, si es admin, estado y enlace): #grupos [página]',
    usage: 'grupos [página]',
    isOwner: true,
    perm: 'grupos',
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'owner',
    run: async ({ msg, sock, args, isOwner }) => {
        if (!isCreator(msg.sender) && !isOwner && !hasPerm(msg.sender, 'grupos'))
            return msg.reply('❄️ No tienes acceso a este comando.');
        try {
            const groups = await sock.groupFetchAllParticipating();
            const entries = Object.entries(groups || {}).sort((a, b) => String(a[1]?.subject || '').localeCompare(String(b[1]?.subject || ''), 'es'));
            if (!entries.length)
                return msg.reply('🪻 No estoy en ningún grupo.');
            const ids = new Set([num(sock.user?.id), num(sock.user?.lid)].filter(Boolean));
            const botJid = `${num(sock.user?.id)}@s.whatsapp.net`;
            const st = (await db.getSettings(botJid)) || {};
            const banOn = !!st.banchat_on, allowed = Array.isArray(st.banchat_allowed) ? st.banchat_allowed : [];
            const isAdminIn = meta => (meta?.participants || []).some(p => (p.admin === 'admin' || p.admin === 'superadmin') && [p.id, p.lid, p.phoneNumber, p.jid].some(x => ids.has(num(x))));
            const pages = Math.max(1, Math.ceil(entries.length / PAGE));
            const page = Math.min(pages, Math.max(1, parseInt(args[0], 10) || 1));
            const slice = entries.slice((page - 1) * PAGE, page * PAGE);
            const adminCount = entries.filter(([, m]) => isAdminIn(m)).length;
            const lines = [];
            for (let i = 0; i < slice.length; i++) {
                const [jid, meta] = slice[i], n = (page - 1) * PAGE + i + 1, admin = isAdminIn(meta);
                let chat = {};
                try {
                    chat = (await db.getChat(jid)) || {};
                }
                catch { }
                let link = admin ? null : 'solo disponible si el bot es admin';
                if (admin) {
                    try {
                        const code = await sock.groupInviteCode(jid);
                        link = code ? `https://chat.whatsapp.com/${code}` : 'no disponible';
                        await sleep(250);
                    }
                    catch {
                        link = 'no disponible';
                    }
                }
                const flags = [admin ? '✅ Bot admin' : '❌ Bot no admin', banOn && !allowed.includes(jid) ? '🚫 banchat' : null, chat.bannedGrupo ? '🔇 bot apagado' : null].filter(Boolean).join(' · ');
                lines.push(`✦ *${n}. ${meta?.subject || 'Grupo sin nombre'}*\n  ╰─ ID: ${jid}\n  ╰─ Miembros: ${meta?.size ?? meta?.participants?.length ?? '?'}\n  ╰─ Estado: ${flags}\n  ╰─ Enlace: ${link}`);
            }
            return msg.reply(`👑 *Grupos* · página ${page}/${pages}\n\n${lines.join('\n\n')}\n\n> Total: *${entries.length}* · Bot admin en *${adminCount}*${pages > page ? `\n> Siguiente: *#grupos ${page + 1}*` : ''}`);
        }
        catch (error) {
            console.error('[HAIMIYA] listgrupo:', error);
            return msg.reply('⚠️ No pude obtener la lista de grupos en este momento.');
        }
    }
};
