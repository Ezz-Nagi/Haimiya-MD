import db from '#db';
import { startSubBot } from './subbot.js';
import { canLink } from '../../lib/system/capacity.js';
export default {
    command: ['codeprem'],
    aliases: [],
    desc: 'Genera o procesa un código de vinculación para un subbot premium.',
    usage: 'codeprem <código>',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'socket',
    run: async ({ msg, sock, args, usedPrefix: prefix, command }) => {
        const code = String(args[0] || '').trim().toUpperCase();
        if (!code)
            return msg.reply(`✿ Uso: *${prefix}${command} <código>*`);
        const entry = db.getPremiumCode(code);
        if (!entry)
            return msg.reply('💢 Ese código Premium no existe.');
        if (entry.uses >= entry.maxUses)
            return msg.reply('😑 Ese código Premium ya agotó todos sus usos.');
        const phone = String(msg.sender || '').split('@')[0].replace(/\D/g, '');
        if (!phone)
            return msg.reply('💢 No pude identificar el número que vinculará el Premium.');
        const mainPhone = String(sock?.user?.id || '').split(':')[0].split('@')[0].replace(/\D/g, '');
        if (phone === mainPhone)
            return msg.reply('😑 El Principal no puede registrarse como Premium porque ya es la instancia principal.');
        const existing = await db.getSettings(`${phone}@s.whatsapp.net`);
        if (existing?.botprem === 1)
            return msg.reply('🙄 Esta cuenta ya está registrada como Premium.');
        const sessionPath = `./Sessions/Subs/${phone}`;
        const fsCheck = await import('node:fs');
        if (fsCheck.existsSync(`${sessionPath}/creds.json`)) {
            return msg.reply('🙄 Esta cuenta ya tiene una sesión de Sub-Bot activa. Cierra esa sesión antes de vincularla como Premium.');
        }
        const gate = canLink({ premium: true });
        if (!gate.ok)
            return msg.reply('✎ Se alcanzó el límite global de Premium.');
        const result = db.redeemPremiumCode(code, msg.sender);
        if (!result.ok)
            return msg.reply('💢 No fue posible canjear el código Premium.');
        try {
            await startSubBot(msg, sock, '✤ Vinculación Premium iniciada.', true, phone, msg.chat, true, 'Premium');
            await db.updateSettings(`${phone}@s.whatsapp.net`, 'type', 'Premium');
            await db.updateSettings(`${phone}@s.whatsapp.net`, 'tier', 'premium');
            await db.updateSettings(`${phone}@s.whatsapp.net`, 'botprem', 1);
            await db.updateSettings(`${phone}@s.whatsapp.net`, 'botmod', 0);
            return msg.reply(`✤ *Premium vinculado correctamente.*\n> Código: *${code}*\n> Usos restantes: *${result.entry.maxUses - result.entry.uses}*`);
        }
        catch (error) {
            db.refundPremiumCode(code, msg.sender);
            console.error('[Premium] Error vinculando:', error);
            return msg.reply('💢 No pude iniciar la vinculación Premium. El uso del código fue restaurado.');
        }
    }
};
