import { normalizeJid, resolveParticipantJid, resolveJidSync, deleteCachedMeta, getCachedMeta, setCachedMeta } from '#serialize';
import db from "#db";
import chalk from 'chalk';
import moment from 'moment-timezone';
import { isAllowedForSubbotAsync } from '../lib/banchat.js';
const botPhoneOf = sock => String(sock?.user?.id || '').split(':')[0].split('@')[0];
function getGroupAdmins(participants) {
    return (participants ?? []).filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.id).filter(Boolean);
}
function resolveEventParticipant(p, sock) {
    if (typeof p === 'string')
        return resolveJidSync(p, sock) || p;
    return resolveParticipantJid(p, sock) || normalizeJid(p.id || p.phoneNumber || p.jid || p.lid || '') || '';
}
export default async (sock, msg) => {
    sock.ev.on('group.join-request', async (request) => {
        try {
            if (!request?.id || !request?.participant)
                return;
            if (!(await isAllowedForSubbotAsync(botPhoneOf(sock), request.id)))
                return;
            const botId = (sock.user?.id || '').split(':')[0] + '@s.whatsapp.net';
            const chat = await db.getChat(request.id);
            const botSettings = await db.getSettings(botId);
            if (chat?.joinRequestNotify === 0)
                return;
            const metadata = await sock.groupMetadata(request.id).catch(() => null);
            if (!metadata)
                return;
            const admins = (metadata.participants || []).filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            const botBase = botId.split('@')[0];
            const botIsAdmin = admins.some(p => [p.id, p.lid, p.phoneNumber].filter(Boolean).some(v => String(v).split('@')[0] === botBase));
            if (!botIsAdmin)
                return;
            if (request.action === 'revoked' || request.action === 'rejected')
                return;
            const participant = request.participantPn || request.participant;
            const text = `ꫝꪖꪊꪑỉꪗꪖ

              *Solicitud de nuevo user*

                               @${participant.split('@')[0]}

> Elige una acción para esta solicitud.`;
            await sock.sendMessage(request.id, {
                text: `${text}

Usa *#solicitudes* para revisar la lista, *#aprobar @usuario* para aceptar o *#denegar @usuario* para rechazar.`,
                mentions: [participant]
            });
        }
        catch (err) {
            console.log(chalk.gray(`[ JOIN REQUEST ERROR ] → ${err?.message || err}`));
        }
    });
    sock.ev.on('group-participants.update', async (anu) => {
        try {
            if (!(await isAllowedForSubbotAsync(botPhoneOf(sock), anu.id))) {
                deleteCachedMeta(anu.id);
                return;
            }
            if (['add', 'remove', 'leave', 'promote', 'demote'].includes(anu.action)) {
                deleteCachedMeta(anu.id);
            }
            const metadata = await (async () => {
                const cached = getCachedMeta(anu.id);
                if (cached)
                    return cached;
                for (let i = 0; i < 3; i++) {
                    const m = await sock.groupMetadata(anu.id).catch(() => null);
                    if (m) {
                        setCachedMeta(anu.id, m);
                        return m;
                    }
                    await new Promise(r => setTimeout(r, 1500));
                }
                return null;
            })();
            const groupAdmins = metadata ? getGroupAdmins(metadata.participants) : [];
            const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const chat = await db.getChat(anu.id);
            const botSettings = await db.getSettings(botId);
            const primaryBotId = chat?.primaryBot;
            const isSelf = (botSettings?.self ?? 0) || (chat?.isMute ?? false);
            if (isSelf)
                return;
            const now = new Date();
            const colombianTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
            const tiempo = colombianTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/,/g, '');
            const tiempo2 = moment.tz('America/Bogota').format('hh:mm A');
            const memberCount = metadata?.participants?.length || 0;
            for (const p of anu.participants) {
                const jid = resolveEventParticipant(p, sock);
                if (!jid)
                    continue;
                const phone = jid.split('@')[0];
                const userData = await db.getUser(jid);
                const name = userData?.name || phone;
                let avatar;
                try {
                    avatar = await sock.profilePictureUrl(jid, 'image');
                }
                catch {
                    avatar = null;
                }
                if (!avatar) {
                    const fg = botSettings?.fotoglobal || global.fotoglobal || '';
                    avatar = (fg && /^https?:\/\//i.test(fg))
                        ? fg
                        : 'https://i.supaimg.com/7cd8da25-b960-4335-a426-886ab502c855/e0ddf249-08d2-4ef1-b074-fa273fd4482f.jpg';
                }
                const contextBase = {
                    mentionedJid: [jid].filter(Boolean),
                    isForwarded: false
                };
                if (anu.action === 'add') {
                    try {
                        const chatFlags = chat || {};
                        if (Number(chatFlags.antibots) === 1) {
                            const pn = String(anu.participants?.[0] || jid);
                        }
                        if (Number(chatFlags.antifake) === 1) {
                            const { isFakeNumber } = await import('./grupo/antifake.js');
                            if (isFakeNumber(jid)) {
                                await sock.groupParticipantsUpdate(anu.id, [jid], 'remove');
                                await sock.sendMessage(anu.id, { text: '🚫 Número fake expulsado.' });
                                continue;
                            }
                        }
                    }
                    catch (e) {
                        console.error('[antibots/antifake join]', e?.message || e);
                    }
                }
                if (anu.action === 'add' && (chat?.welcome || botSettings?.welcome) && (!primaryBotId || primaryBotId === botId)) {
                    if (!metadata)
                        continue;
                    let caption;
                    if ((chat.welcomeMessage || botSettings?.welcomeMessage || '') && (chat.welcomeMessage || botSettings?.welcomeMessage || '').trim() !== '') {
                        caption = (chat.welcomeMessage || botSettings?.welcomeMessage || '')
                            .replace(/@user/g, `@${phone}`)
                            .replace(/@group/g, metadata.subject || '')
                            .replace(/@desc/g, metadata.desc || 'Sin descripción')
                            .replace(/@members/g, memberCount)
                            .replace(/@time/g, `${tiempo} ${tiempo2}`);
                    }
                    else {
                        caption = `ത        ׂ𖹭     ׅ    ꒰͡     𝖭 ⋃ Σ 𝖵 𝖮     
𑄹𑄹  »   𝙐 𝙎 𝙀 𝙍!!*    ✬✫

⪩⪩   ֹ  \`𝖡𝗂𝖾ɳ𝗏𝖾𝗇𝗂𝖽@ 𝖺\`
                 \`${metadata.subject || ''}\`  ꒱꒱ㅤㅤㅤ

*ֹ  ᦕ   ׄ                      _@${phone}_*

         ׅ     ⑅ ׄ     .˙ Disfruta tu estadía!ֹ

な⃟   ۟  ─ _Ahora somos *${memberCount}* miembros!_

> Puedes usar \`/help\` para ver la lista de comandos.
> ✐ 𝐂𝐚𝐧𝐚𝐥 » ${global.my?.chUrl || 'https://whatsapp.com/channel/0029VbCp0lj2UPBDo1HDzq3Z'}`;
                    }
                    try {
                        await sock.sendMessage(anu.id, { image: { url: avatar }, caption: caption.trim(), contextInfo: contextBase });
                    }
                    catch {
                        await sock.sendMessage(anu.id, { text: caption.trim(), contextInfo: contextBase });
                    }
                }
                if ((anu.action === 'remove' || anu.action === 'leave') && (chat?.goodbye || botSettings?.goodbye) && (!primaryBotId || primaryBotId === botId)) {
                    if (!metadata)
                        continue;
                    let caption;
                    if ((chat.byeMessage || botSettings?.byeMessage || '') && (chat.byeMessage || botSettings?.byeMessage || '').trim() !== '') {
                        caption = (chat.byeMessage || botSettings?.byeMessage || '')
                            .replace(/@user/g, `@${phone}`)
                            .replace(/@group/g, metadata.subject || '')
                            .replace(/@desc/g, metadata.desc || 'Sin descripción')
                            .replace(/@members/g, memberCount)
                            .replace(/@time/g, `${tiempo} ${tiempo2}`);
                    }
                    else {
                        caption = `ത        ׂ𖹭     ׅ    ꒰͡     A ᗞＩO S     
𑄹𑄹  »   𝙐 𝙎 𝙀 𝙍!!*    ✬✫

⪩⪩   ֹ  \`𝙷𝚊𝚜𝚝𝚊 𝚕𝚞𝚎𝚐𝚘 𝚍𝚎\`
                 \`${metadata.subject || ''}\`  ꒱꒱ㅤㅤㅤ

*ֹ  ᦕ   ׄ                      _@${phone}_*

         ׅ     ⑅ ׄ     .˙ Espero vuelvas Pronto!ֹ

な⃟   ۟  ─ _Ahora somos *${memberCount}* miembros!_

> Puedes usar \`/help\` para ver la lista de comandos.
> ✐ 𝐋𝐢𝐧𝐤 »  ${global.my?.chUrl || 'https://whatsapp.com/channel/0029VbCp0lj2UPBDo1HDzq3Z'}`;
                    }
                    try {
                        await sock.sendMessage(anu.id, { image: { url: avatar }, caption: caption.trim(), contextInfo: contextBase });
                    }
                    catch {
                        await sock.sendMessage(anu.id, { text: caption.trim(), contextInfo: contextBase });
                    }
                }
                if (anu.action === 'remove' || anu.action === 'leave') {
                    const user = chat?.users?.[jid];
                    if (user && typeof user.afk === 'number' && user.afk > -1) {
                        if (chat && chat.users && chat.users[jid]) {
                            chat.users[jid].afk = -1;
                            chat.users[jid].afkReason = '';
                        }
                    }
                }
                if (anu.action === 'promote' && chat?.alerts && (!primaryBotId || primaryBotId === botId)) {
                    const authorJid = normalizeJid(anu.author) || anu.author;
                    await sock.sendMessage(anu.id, {
                        text: `「✎」 *@${phone}* ha sido promovido a Administrador por *@${authorJid.split('@')[0]}.*`,
                        mentions: [jid, authorJid, ...groupAdmins]
                    });
                }
                if (anu.action === 'demote' && chat?.alerts && (!primaryBotId || primaryBotId === botId)) {
                    const authorJid = normalizeJid(anu.author) || anu.author;
                    await sock.sendMessage(anu.id, {
                        text: `「✎」 *@${phone}* ha sido degradado de Administrador por *@${authorJid.split('@')[0]}.*`,
                        mentions: [jid, authorJid, ...groupAdmins]
                    });
                }
            }
        }
        catch (err) {
            console.log(chalk.gray(`[ EVENT ERROR ] → ${err}`));
        }
    });
};
