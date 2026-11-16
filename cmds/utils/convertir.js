import { convert, unitsHelp } from '../../lib/system/toolbox.js';
export { convert };
export default {
    command: ['convertir'],
    aliases: ['convert', 'conv'],
    desc: 'Convierte unidades: longitud, masa, temperatura, volumen, velocidad, datos y tiempo.',
    usage: 'convertir 10 km mi',
    category: 'utils',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, args, usedPrefix, command }) => {
        const [rawV, rawA, rawB] = [args[0], String(args[1] || '').toLowerCase(), String(args[2] || '').toLowerCase()];
        const value = parseFloat(String(rawV || '').replace(',', '.'));
        if (!Number.isFinite(value) || !rawA || !rawB) {
            return msg.reply(`《✧》 Uso: *${usedPrefix}${command} <número> <de> <a>*\nEjemplos:\n› ${usedPrefix}${command} 10 km mi\n› ${usedPrefix}${command} 70 kg lb\n› ${usedPrefix}${command} 30 c f\n\nUnidades: ${unitsHelp()}`);
        }
        const r = convert(value, rawA, rawB);
        if (r === null)
            return msg.reply('《✧》 No puedo convertir entre esas unidades (deben ser del mismo tipo).');
        return msg.reply(`🔄 *${value} ${rawA}* = *${Number(r.toPrecision(8)).toLocaleString('es', { maximumFractionDigits: 6 })} ${rawB}*`);
    }
};
