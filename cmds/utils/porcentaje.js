export default {
    command: ['porcentaje'],
    aliases: ['porc', 'percent'],
    category: 'utils',
    desc: 'Calcula un porcentaje o qué porcentaje representa una cantidad.',
    usage: 'porcentaje 15 de 250 | porcentaje 30 es 150',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, args, usedPrefix, command }) => {
        const values = args.map(value => String(value).replace(',', '.'));
        if (values.length < 3 || !Number.isFinite(Number(values[0])) || !Number.isFinite(Number(values[2])))
            return msg.reply(`📊 *Porcentajes*\n\n• ${usedPrefix}${command} 15 de 250 → calcula el 15% de 250.\n• ${usedPrefix}${command} 30 es 150 → calcula qué porcentaje es 30 de 150.`);
        const a = Number(values[0]);
        const b = Number(values[2]);
        const mode = String(values[1]).toLowerCase();
        if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0)
            return msg.reply('⚠️ Escribe cantidades válidas y evita dividir entre cero.');
        const result = ['es', 'de', 'of', '%'].includes(mode) ? (mode === 'es' ? a / b * 100 : a / 100 * b) : null;
        if (result === null || !Number.isFinite(result))
            return msg.reply(`⚠️ Formato no reconocido. Ejemplo: *${usedPrefix}${command} 15 de 250*`);
        const text = mode === 'es' ? `${a} es el ${Number(result.toFixed(6))}% de ${b}.` : `El ${a}% de ${b} es ${Number(result.toFixed(6))}.`;
        return msg.reply(`📊 *Resultado*\n\n${text}`);
    }
};
