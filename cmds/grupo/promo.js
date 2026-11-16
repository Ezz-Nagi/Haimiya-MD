import * as promos from '../../lib/system/promos.js';
export default {
    command: ['promo'],
    aliases: [],
    category: 'group',
    desc: 'Promueve a un miembro del grupo a administrador.',
    isOwner: false,
    botAdmin: true,
    hidden: false,
    description: 'Solicita promoción del grupo (link + tu número).',
    usage: 'promo',
    isAdmin: true,
    run: async ({ msg, sock, args, text }) => {
        if (!msg.isGroup) {
            return msg.reply('Usa *#promo* dentro del grupo que quieres promocionar.');
        }
        let link = '';
        try {
            const code = await sock.groupInviteCode(msg.chat);
            if (code)
                link = 'https://chat.whatsapp.com/' + code;
        }
        catch (e) {
            return msg.reply('《✤》 No pude obtener el link. Hazme admin del grupo.');
        }
        if (!link)
            return msg.reply('《✤》 No pude obtener el link del grupo.');
        let title = 'Grupo';
        let description = '';
        let members = 0;
        try {
            const meta = await sock.groupMetadata(msg.chat);
            title = meta?.subject || title;
            description = meta?.desc || '';
            members = meta?.participants?.length || 0;
        }
        catch { }
        const phone = String(msg.sender || '').split('@')[0].split(':')[0].replace(/\D/g, '');
        const botJid = (sock?.user?.id || '').split(':')[0].replace(/\D/g, '') + '@s.whatsapp.net';
        let premium = false;
        try {
            const db = (await import('../../lib/system/database.js')).default;
            const st = db.getSettings(botJid);
            premium = st?.botprem === 1 || String(st?.type || '').toLowerCase() === 'premium';
        }
        catch { }
        const r = promos.requestPromo({
            userId: phone || String(msg.sender || ''),
            title: title.slice(0, 80),
            link,
            type: 'group',
            premium,
            phone,
            description: String(description).slice(0, 300),
            members
        });
        if (!r.ok)
            return msg.reply('❌ ' + (r.error || 'No se pudo enviar la promo'));
        if (r.auto) {
            return msg.reply(`✅ Promo *publicada* automáticamente.\n*${title}*\n${members} integrantes\n${link}`);
        }
        return msg.reply(`✅ Solicitud enviada.\n*${title}*\n${members} integrantes\n` +
            `Número registrado: ${phone}\n⏱ 24 h · espera aprobación del developer.`);
    }
};
