const ART = [
    { title: 'Portada del volumen 1', url: 'https://magazine.jp.square-enix.com/top/shoei/9784301003137.jpg?t=20260203132837', source: 'https://magazine.jp.square-enix.com/top/comics/detail/9784301003137/' },
    { title: 'Portada del volumen 2', url: 'https://magazine.jp.square-enix.com/top/shoei/9784301005087.jpg?t=20260501114105', source: 'https://magazine.jp.square-enix.com/top/comics/detail/9784301005087/' },
    { title: 'Portada del volumen 3', url: 'https://magazine.jp.square-enix.com/top/shoei/9784301006923.jpg?t=20260804144005', source: 'https://magazine.jp.square-enix.com/top/comics/detail/9784301006923/' },
    { title: 'Portada del volumen 4', url: 'https://magazine.jp.square-enix.com/top/shoei/9784301008668.jpg?t=20261102120701', source: 'https://magazine.jp.square-enix.com/top/comics/detail/9784301008668/' }
];
export default {
    command: ['haimiya', 'mio'],
    aliases: ['miohaimiya', 'haimiyamio'],
    category: 'anime',
    desc: 'Envía una ilustración de Mio Haimiya. Puedes elegir una portada concreta.',
    usage: 'haimiya [1-4]',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock, args }) => {
        const raw = args[0];
        const selected = raw === undefined ? ART[Math.floor(Math.random() * ART.length)] : ART[Number(raw) - 1];
        if (!selected) return msg.reply('🖤 Elige una portada del 1 al 4. Ejemplo: *#haimiya 4*');
        const caption = `🖤 *Mio Haimiya*\n${selected.title}\n\nIlustración de Sumu Kamiyama · © Square Enix\nFuente oficial: ${selected.source}`;
        try {
            return await sock.sendMessage(msg.chat, { image: { url: selected.url }, caption }, { quoted: msg });
        } catch (error) {
            console.error('[HAIMIYA IMAGE]', error?.message || error);
            return msg.reply(`No pude cargar la imagen desde WhatsApp. Puedes verla en la fuente oficial:\n${selected.source}`);
        }
    }
};
