export default {
    command: ['base64'],
    aliases: ['b64'],
    category: 'utils',
    desc: 'Codifica texto en Base64 o lo vuelve a convertir a texto.',
    usage: 'base64 hola mundo | base64 decodificar aG9sYSBtdW5kbw==',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, args, usedPrefix, command }) => {
        const mode = String(args[0] || '').toLowerCase();
        const decode = ['decodificar', 'decode', 'd'].includes(mode);
        const input = (decode ? args.slice(1) : args).join(' ').trim();
        if (!input) return msg.reply(`🔐 *Base64*\n\n• ${usedPrefix}${command} texto para codificar\n• ${usedPrefix}${command} decodificar aG9sYSBtdW5kbw==`);
        if (input.length > 3000) return msg.reply('⚠️ El texto es demasiado largo (máximo 3000 caracteres).');
        try {
            if (decode) {
                if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input)) throw new Error('Cadena Base64 no válida.');
                const output = Buffer.from(input, 'base64').toString('utf8');
                if (!output || output.length > 3500) throw new Error('El resultado está vacío o es demasiado largo.');
                return msg.reply(`🔓 *Texto decodificado*\n\n${output}`);
            }
            return msg.reply(`🔐 *Base64*\n\n${Buffer.from(input, 'utf8').toString('base64')}`);
        } catch (error) {
            return msg.reply(`⚠️ ${error.message || 'No pude procesar el texto.'}`);
        }
    }
};
