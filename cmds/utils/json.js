export default {
    command: ['json'],
    aliases: ['jsonfmt', 'prettyjson'],
    category: 'utils',
    desc: 'Valida y formatea JSON para que sea más fácil de leer.',
    usage: 'json {"nombre":"Haimiya","activo":true} | json compacto <json>',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, args, usedPrefix, command }) => {
        const compact = String(args[0] || '').toLowerCase() === 'compacto';
        const input = (compact ? args.slice(1) : args).join(' ').trim();
        if (!input) return msg.reply(`🧾 *JSON Formatter*\n\nUso: *${usedPrefix}${command} {"nombre":"Haimiya"}*\nCompactar: *${usedPrefix}${command} compacto {"nombre":"Haimiya"}*`);
        if (input.length > 7000) return msg.reply('⚠️ El JSON supera el límite de 7000 caracteres.');
        try {
            const parsed = JSON.parse(input);
            const output = JSON.stringify(parsed, null, compact ? 0 : 2);
            if (output.length > 3500) return msg.reply('⚠️ El JSON es válido, pero el resultado es demasiado largo para enviarlo en un mensaje.');
            return msg.reply(`🧾 *JSON válido*\n\n\`\`\`json\n${output}\n\`\`\``);
        } catch (error) {
            return msg.reply(`❌ *JSON inválido*\n\n${String(error.message || 'Error de sintaxis').slice(0, 300)}`);
        }
    }
};
