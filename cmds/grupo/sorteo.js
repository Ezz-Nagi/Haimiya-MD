export default {
    command: ['sorteo'],
    aliases: ['rifa', 'ganador', 'raffle'],
    desc: 'Sortea entre los miembros del grupo (sin contar al bot). Puedes indicar cuántos ganadores.',
    usage: 'sorteo [ganadores] [premio]',
    category: 'group',
    isOwner: false,
    isAdmin: true,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock, args }) => {
        if (!msg.isGroup)
            return msg.reply('《✧》 Este comando solo funciona en grupos.');
        const meta = await sock.groupMetadata(msg.chat).catch(() => null);
        const bot = String(sock.user?.id || '').split(':')[0].split('@')[0];
        const pool = [...new Set((meta?.participants || []).map(p => sock.decodeJid(p.jid || p.id || p.phoneNumber || p.lid)).filter(j => j && j.split('@')[0] !== bot))];
        if (pool.length < 1)
            return msg.reply('《✧》 No encontré miembros para el sorteo.');
        let n = 1;
        if (/^\d{1,2}$/.test(args[0] || ''))
            n = Math.min(parseInt(args.shift()), 10, pool.length) || 1;
        const premio = args.join(' ').trim();
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        const winners = pool.slice(0, n);
        return sock.sendMessage(msg.chat, { text: `🎉 *¡Sorteo!*${premio ? `\n🎁 Premio: *${premio}*` : ''}\n\n${winners.length > 1 ? 'Ganadores' : 'Ganador'}:\n${winners.map((w, i) => `${i + 1}. @${w.split('@')[0]}`).join('\n')}`, mentions: winners }, { quoted: msg });
    }
};
