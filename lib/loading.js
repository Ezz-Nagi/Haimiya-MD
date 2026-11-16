const FRAMES = [
    '╭──◇ CIRCUITO ──╮\n│ ░░░░░░░░░░ │\n╰── {ms} ms ──╯',
    '╭──◇ CIRCUITO ──╮\n│ ▓░░░░░░░░░ │\n╰── {ms} ms ──╯',
    '╭──◇ CIRCUITO ──╮\n│ ▓▓░░░░░░░░ │\n╰── {ms} ms ──╯',
    '╭──◇ CIRCUITO ──╮\n│ ▓▓▓░░░░░░░ │\n╰── {ms} ms ──╯',
    '╭──◇ CIRCUITO ──╮\n│ ▓▓▓▓░░░░░░ │\n╰── {ms} ms ──╯',
    '╭──◇ CIRCUITO ──╮\n│ ▓▓▓▓▓░░░░░ │\n╰── {ms} ms ──╯',
    '╭──◇ CIRCUITO ──╮\n│ ▓▓▓▓▓▓░░░░ │\n╰── {ms} ms ──╯',
    '╭──◇ CIRCUITO ──╮\n│ ▓▓▓▓▓▓▓░░░ │\n╰── {ms} ms ──╯',
    '╭──◇ CIRCUITO ──╮\n│ ▓▓▓▓▓▓▓▓░░ │\n╰── {ms} ms ──╯',
    '╭──◇ CIRCUITO ──╮\n│ ▓▓▓▓▓▓▓▓▓░ │\n╰── {ms} ms ──╯',
    '╭──◇ CIRCUITO ──╮\n│ ▓▓▓▓▓▓▓▓▓▓ │\n╰── {ms} ms ──╯',
    '╭──◇ CIRCUITO ──╮\n│ ▓▓▓▓▓▓▓▓▓░ │\n╰── {ms} ms ──╯',
    '╭──◇ CIRCUITO ──╮\n│ ▓▓▓▓▓▓▓▓░░ │\n╰── {ms} ms ──╯',
    '╭──◇ CIRCUITO ──╮\n│ ▓▓▓▓▓▓▓░░░ │\n╰── {ms} ms ──╯'
];
function frameText(i, ms, label) {
    const body = FRAMES[i % FRAMES.length].replace('{ms}', String(ms));
    return label ? `⚡ *${label}*\n${body}` : `⚡ *Procesando*\n${body}`;
}
export async function startLoading(sock, chat, opts = {}) {
    const { quoted, label = '', intervalMs = 700 } = opts;
    if (opts.silent || global.__apiRequest || !sock || typeof sock.sendMessage !== 'function') {
        const t0 = Date.now();
        const elapsed = () => Date.now() - t0;
        return { key: null, elapsed, async stop() { return elapsed(); }, async done() { return elapsed(); } };
    }
    const t0 = Date.now();
    let i = 0;
    let key = null;
    let stopped = false;
    let timer = null;
    const elapsed = () => Date.now() - t0;
    try {
        const sent = await sock.sendMessage(chat, { text: frameText(0, 0, label) }, quoted ? { quoted } : undefined);
        key = sent?.key || null;
    }
    catch {
        key = null;
    }
    const tick = async () => {
        if (stopped || !key)
            return;
        i++;
        try {
            await sock.sendMessage(chat, { text: frameText(i, elapsed(), label), edit: key });
        }
        catch {
        }
    };
    timer = setInterval(tick, intervalMs);
    if (timer.unref)
        timer.unref();
    return {
        key,
        elapsed,
        async stop() {
            if (stopped)
                return elapsed();
            stopped = true;
            if (timer)
                clearInterval(timer);
            if (key) {
                try {
                    await sock.sendMessage(chat, { delete: key });
                }
                catch { }
            }
            return elapsed();
        },
        async done(finalText) {
            if (stopped)
                return elapsed();
            stopped = true;
            if (timer)
                clearInterval(timer);
            const ms = elapsed();
            if (key && finalText) {
                try {
                    await sock.sendMessage(chat, { text: finalText, edit: key });
                    return ms;
                }
                catch { }
            }
            if (key) {
                try {
                    await sock.sendMessage(chat, { delete: key });
                }
                catch { }
            }
            return ms;
        }
    };
}
export async function startLoadingTG(bot, chatId, opts = {}) {
    const { label = '', intervalMs = 700 } = opts;
    const t0 = Date.now();
    let i = 0;
    let messageId = null;
    let stopped = false;
    let timer = null;
    const elapsed = () => Date.now() - t0;
    try {
        const sent = await bot.sendMessage(chatId, frameText(0, 0, label), { parse_mode: undefined });
        messageId = sent?.message_id || null;
    }
    catch {
        messageId = null;
    }
    timer = setInterval(async () => {
        if (stopped || !messageId)
            return;
        i++;
        try {
            await bot.editMessageText(frameText(i, elapsed(), label), { chat_id: chatId, message_id: messageId });
        }
        catch { }
    }, intervalMs);
    if (timer.unref)
        timer.unref();
    return {
        messageId,
        elapsed,
        async stop() {
            if (stopped)
                return elapsed();
            stopped = true;
            if (timer)
                clearInterval(timer);
            if (messageId) {
                try {
                    await bot.deleteMessage(chatId, messageId);
                }
                catch { }
            }
            return elapsed();
        },
        async done(finalText) {
            if (stopped)
                return elapsed();
            stopped = true;
            if (timer)
                clearInterval(timer);
            const ms = elapsed();
            if (messageId && finalText) {
                try {
                    await bot.editMessageText(finalText, { chat_id: chatId, message_id: messageId });
                    return ms;
                }
                catch { }
            }
            if (messageId) {
                try {
                    await bot.deleteMessage(chatId, messageId);
                }
                catch { }
            }
            return ms;
        }
    };
}
