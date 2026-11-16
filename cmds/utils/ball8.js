const respuestas = [
    'Sí.',
    'Obvio.',
    'Tal vez.',
    'Probablemente.',
    'Nunca.',
    'Siempre.',
    'Tal vez no.',
    'Tal vez sí.'
];
export default {
    command: ['ball8'],
    aliases: ['8ball', 'bola8', 'magic8'],
    desc: 'Responde preguntas con el sistema de bola 8.',
    usage: 'ball8 <pregunta>',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    category: 'utils',
    run: async ({ msg, sock }) => {
        const respuesta = respuestas[Math.floor(Math.random() * respuestas.length)];
        const mencionar = msg.sender;
        const numero = msg.sender.split('@')[0];
        const textoRespuesta = `🎱 *Bola Mágica*\n\n> @${numero}, la bola dice:\n> _${respuesta}_`;
        await sock.sendMessage(msg.chat, {
            text: textoRespuesta,
            mentions: [mencionar]
        });
    },
};
