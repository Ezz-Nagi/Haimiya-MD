export default {
    command: ['getid'],
    aliases: [],
    desc: 'Obtiene el identificador del chat o usuario indicado.',
    usage: 'getid',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'owner',
    isCreator: true,
    run: async ({ msg, sock, args }) => {
        const link = args.join(' ').trim();
        if (!link)
            return msg.reply('✖️ Ingresa el enlace del canal.');
        try {
            const code = link.match(/channel\/([0-9A-Za-z]+)/)?.[1];
            if (!code)
                return msg.reply('✖️ Enlace inválido.');
            const metadata = await sock.newsletterMetadata('invite', code);
            if (!metadata?.id)
                return msg.reply('❌ No se pudo obtener el ID.');
            return msg.reply(`✅ *ID del canal:*\n${metadata.id}\n\n*Nombre:* ${metadata.name || 'Desconocido'}`);
        }
        catch (e) {
            return msg.reply(`❌ Error: ${e?.message || e}`);
        }
    }
};
