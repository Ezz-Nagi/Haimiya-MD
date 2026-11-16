import { RIDDLES, TRIVIA, rand, norm } from './fun-data.js';
import crypto from 'crypto';
const TTL = 5 * 60 * 1000;
const store = global.__games instanceof Map ? global.__games : (global.__games = new Map());
const k = (kind, chat) => `${kind}:${chat}`;
function get(kind, chat) {
    const g = store.get(k(kind, chat));
    if (!g)
        return null;
    if (Date.now() - g.at > TTL) {
        store.delete(k(kind, chat));
        return null;
    }
    return g;
}
const put = (kind, chat, data) => { const g = { ...data, at: Date.now() }; store.set(k(kind, chat), g); return g; };
const drop = (kind, chat) => store.delete(k(kind, chat));
setInterval(() => {
    for (const [key, g] of store)
        if (Date.now() - g.at > TTL)
            store.delete(key);
}, 60_000).unref?.();
export function riddleStart(chat) {
    const r = rand(RIDDLES);
    put('riddle', chat, { r });
    return `🧩 *Acertijo*\n\n${r.q}\n\nResponde con *respuesta <tu respuesta>* (tienes 5 minutos). Para rendirte: *acertijo rendirse*.`;
}
export function riddleAnswer(chat, text) {
    const g = get('riddle', chat);
    if (!g)
        return { state: 'none', text: 'No hay un acertijo activo. Pide uno con *acertijo*.' };
    const n = norm(text).replace(/^(el|la|los|las|un|una) /, '');
    if (!n)
        return { state: 'bad', text: 'Escribe tu respuesta.' };
    if (g.r.a.some(a => (` ${n} `).includes(` ${a} `))) {
        drop('riddle', chat);
        return { state: 'win', text: `✅ ¡Correcto! La respuesta era *${g.r.a[0]}*.` };
    }
    g.tries = (g.tries || 0) + 1;
    return { state: 'wrong', text: `❌ No es esa… (intento ${g.tries}). Sigue pensando o escribe *acertijo rendirse*.` };
}
export function riddleGiveUp(chat) {
    const g = get('riddle', chat);
    if (!g)
        return 'No hay un acertijo activo.';
    drop('riddle', chat);
    return `🏳️ La respuesta era *${g.r.a[0]}*.`;
}
const L = ['A', 'B', 'C', 'D'];
export function triviaStart(chat) {
    const t = rand(TRIVIA);
    put('trivia', chat, { t });
    return `🧠 *Trivia*\n\n${t.q}\n\n${t.o.map((o, i) => `*${L[i]})* ${o}`).join('\n')}\n\nResponde con *trivia A*, *B*, *C* o *D* (5 minutos).`;
}
export function triviaAnswer(chat, letter) {
    const g = get('trivia', chat);
    if (!g)
        return { state: 'none', text: 'No hay una trivia activa. Empieza con *trivia*.' };
    const i = L.indexOf(String(letter || '').trim().toUpperCase().slice(0, 1));
    if (i < 0)
        return { state: 'bad', text: 'Responde con A, B, C o D.' };
    drop('trivia', chat);
    return i === g.t.c ? { state: 'win', text: `✅ ¡Correcto! *${L[g.t.c]}) ${g.t.o[g.t.c]}*` } : { state: 'lose', text: `❌ Era *${L[g.t.c]}) ${g.t.o[g.t.c]}*. ¡Suerte en la próxima!` };
}
export function guessStart(chat, user) {
    put('guess', `${chat}:${user}`, { n: crypto.randomInt(1, 101), left: 7 });
    return '🔢 Pensé un número del *1 al 100*. Tienes *7 intentos*.\nEscribe *adivina <número>*.';
}
export function guessTry(chat, user, value) {
    const key = `${chat}:${user}`, g = get('guess', key);
    if (!g)
        return { state: 'none', text: 'No tienes una partida. Empieza con *adivina*.' };
    const n = parseInt(value, 10);
    if (!Number.isInteger(n) || n < 1 || n > 100)
        return { state: 'bad', text: 'Escribe un número del 1 al 100.' };
    g.left--;
    g.at = Date.now();
    if (n === g.n) {
        drop('guess', key);
        return { state: 'win', text: `🎉 ¡Era *${g.n}*! Lo lograste con ${7 - g.left} intento(s).` };
    }
    if (g.left <= 0) {
        drop('guess', key);
        return { state: 'lose', text: `💀 Sin intentos. Era *${g.n}*.` };
    }
    return { state: 'wrong', text: `${n < g.n ? '⬆️ Más alto' : '⬇️ Más bajo'}. Te quedan *${g.left}* intento(s).` };
}
