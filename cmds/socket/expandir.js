import db from '#db';
export default {
    command: ['expandir'],
    aliases: [],
    desc: 'Canjea o amplía capacidad mediante un código de expansión.',
    usage: 'expandir <código>',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'socket',
    run: async ({ msg, args, usedPrefix: prefix, command }) => {
        const code = String(args[0] || '').trim().toUpperCase();
        if (!code)
            return msg.reply(`✿ Uso: *${prefix}${command} <código>*`);
        const entry = db.getExpansionCode(code);
        if (!entry)
            return msg.reply('💢 Ese código de expansión no existe.');
        if (entry.uses >= entry.maxUses)
            return msg.reply('😑 Ese código de expansión ya agotó todos sus usos.');
        const result = db.redeemExpansionCode(code, msg.sender);
        if (!result.ok)
            return msg.reply('💢 No fue posible canjear el código de expansión.');
        try {
            const capacity = db.addCapacity(result.entry.expansion);
            return msg.reply(`✤ *Capacidad ampliada correctamente.*\n\n❖ Sub: *+${result.entry.expansion.sub}* → *${capacity.freeSubBots}*\n❖ Premium: *+${result.entry.expansion.premium}* → *${Number.isFinite(capacity.premiumBots) ? capacity.premiumBots : '♾️'}*\n❖ Principal: *+${result.entry.expansion.principal}* → *${capacity.principalBots}*\n❖ Usos restantes: *${result.entry.maxUses - result.entry.uses}*`);
        }
        catch (error) {
            db.refundExpansionCode(code, msg.sender);
            console.error('[Expansion] Error aplicando capacidad:', error);
            return msg.reply('💢 No pude aplicar la expansión. El uso del código fue restaurado.');
        }
    }
};
