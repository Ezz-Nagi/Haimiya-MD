import db from '#db';
import { startSubBot } from './subbot.js';
export default {
    command: ['codeprincipal'],
    aliases: [],
    desc: 'Configura o procesa el código de vinculación del bot principal.',
    usage: 'codeprincipal <código>',
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
        const entry = db.getPrincipalCode(code);
        if (!entry)
            return msg.reply('💢 Ese código Principal no existe.');
        if (entry.uses >= entry.maxUses)
            return msg.reply('😑 Ese código Principal ya agotó todos sus usos.');
        const phone = String(msg.sender || '').split('@')[0].replace(/\D/g, '');
        if (!phone)
            return msg.reply('💢 No pude identificar el número que vinculará el Principal.');
        const mainPhone = String(sock?.user?.id || '').split(':')[0].split('@')[0].replace(/\D/g, '');
        if (phone === mainPhone)
            return msg.reply('😑 Esa cuenta ya es el Principal principal.');
        const existing = await db.getSettings(`${phone}@s.whatsapp.net`);
        if (String(existing?.type || '').toLowerCase() === 'principal' || existing?.tier === 'owner') {
            return msg.reply('🙄 Esta cuenta ya está registrada como Principal.');
        }
        const capacity = db.getCapacity();
        const principalPath = './Sessions/Principals';
        const fs = await import('node:fs');
        const path = await import('node:path');
        const count = fs.existsSync(principalPath)
            ? fs.readdirSync(principalPath).filter(dir => fs.existsSync(path.join(principalPath, dir, 'creds.json'))).length
            : 0;
        if (count >= Math.max(0, Number(capacity.principalBots) - 1)) {
            return msg.reply(`✎ Se alcanzó el límite global de Principales adicionales: *${Math.max(0, Number(capacity.principalBots) - 1)}*.`);
        }
        const sessionPath = `${principalPath}/${phone}`;
        if (fs.existsSync(`${sessionPath}/creds.json`)) {
            return msg.reply('🙄 Esta cuenta ya tiene una sesión de Principal activa.');
        }
        const result = db.redeemPrincipalCode(code, msg.sender);
        if (!result.ok)
            return msg.reply('💢 No fue posible canjear el código Principal.');
        try {
            await startSubBot(msg, sock, '✤ Vinculación Principal iniciada.', true, phone, msg.chat, true, 'Principal');
            await db.updateSettings(`${phone}@s.whatsapp.net`, 'type', 'Principal');
            await db.updateSettings(`${phone}@s.whatsapp.net`, 'tier', 'owner');
            await db.updateSettings(`${phone}@s.whatsapp.net`, 'botprem', 0);
            await db.updateSettings(`${phone}@s.whatsapp.net`, 'botmod', 0);
            return msg.reply(`✤ *Principal vinculado correctamente.*\n> Código: *${code}*\n> Usos restantes: *${result.entry.maxUses - result.entry.uses}*`);
        }
        catch (error) {
            db.refundPrincipalCode(code, msg.sender);
            console.error('[Principal] Error vinculando:', error);
            return msg.reply('💢 No pude iniciar la vinculación Principal. El uso del código fue restaurado.');
        }
    }
};
