export function getTarget(msg, args = []) {
    const mentioned = msg?.mentionedJid || msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentioned.length)
        return String(mentioned[0]).replace(/:\d+(?=@)/, '');
    if (msg?.quoted?.sender)
        return String(msg.quoted.sender).replace(/:\d+(?=@)/, '');
    const num = args.map(a => String(a).replace(/\D/g, '')).find(n => n.length >= 7 && n.length <= 15);
    return num ? `${num}@s.whatsapp.net` : null;
}
export function restArgs(args = []) {
    return args.filter(a => !String(a).startsWith('@') && !/^\+?\d[\d\s-]{6,}$/.test(String(a))).join(' ').trim();
}
export const tag = jid => '@' + String(jid || '').split('@')[0];
