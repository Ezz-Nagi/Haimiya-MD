const NUM = (jid = '') => String(jid).split('@')[0].split(':')[0].replace(/\D/g, '');
function pendingList(list) {
    return (list || []).map(x => {
        if (!x)
            return null;
        if (typeof x === 'string')
            return x;
        return x.jid || x.id || x.lid ||
            (x.phone_number ? `${NUM(x.phone_number)}@s.whatsapp.net` : null) ||
            (x.phoneNumber ? `${NUM(x.phoneNumber)}@s.whatsapp.net` : null);
    }).filter(Boolean);
}
async function applyAction(sock, group, targets, action) {
    const list = [...new Set(targets.filter(Boolean))];
    if (!list.length)
        return { ok: false, done: [] };
    try {
        await sock.groupRequestParticipantsUpdate(group, list, action);
        return { ok: true, done: list };
    }
    catch {
        const done = [];
        for (const jid of list) {
            try {
                await sock.groupRequestParticipantsUpdate(group, [jid], action);
                done.push(jid);
            }
            catch {
                const n = NUM(jid);
                for (const alt of [`${n}@s.whatsapp.net`, `${n}@lid`]) {
                    try {
                        await sock.groupRequestParticipantsUpdate(group, [alt], action);
                        done.push(alt);
                        break;
                    }
                    catch { }
                }
            }
        }
        return { ok: done.length > 0, done };
    }
}
export default {
    command: ['denegar'],
    aliases: ['rechazarsolicitudes'],
    category: 'group',
    hidden: false,
    desc: 'Rechaza solicitudes de ingreso pendientes (cualquier admin).',
    usage: 'denegar [all|@usuario|número]',
    isAdmin: true,
    botAdmin: true,
    isOwner: false,
    run: async ({ msg, sock, text, args }) => {
        if (!msg.isGroup)
            return msg.reply('《✤》 Solo en grupos.');
        const raw = await sock.groupRequestParticipantsList(msg.chat).catch(() => []);
        const all = pendingList(raw);
        if (!all.length)
            return msg.reply('《✤》 No hay solicitudes pendientes.');
        const wanted = String(text || args.join(' ') || '').trim().toLowerCase();
        let targets = all;
        if (wanted && wanted !== 'all' && wanted !== 'todos') {
            const num = NUM(wanted) || (msg.mentionedJid?.[0] ? NUM(msg.mentionedJid[0]) : '');
            targets = all.filter(j => NUM(j) === num);
        }
        else if ((!wanted || wanted === 'all') && msg.mentionedJid?.length) {
            targets = all.filter(j => msg.mentionedJid.some(m => NUM(m) === NUM(j)));
        }
        if (!targets.length)
            return msg.reply('《✤》 No encontré esa solicitud pendiente.');
        const { ok, done } = await applyAction(sock, msg.chat, targets, 'reject');
        if (!ok)
            return msg.reply('《✤》 No pude denegar. El bot debe ser admin.');
        return msg.reply(`✎ Denegada(s) *${done.length}* solicitud(es).`);
    }
};
