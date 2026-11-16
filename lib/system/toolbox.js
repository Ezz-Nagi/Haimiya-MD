import crypto from 'crypto';
const FUNCS = { sqrt: Math.sqrt, abs: Math.abs, round: Math.round, floor: Math.floor, ceil: Math.ceil, sin: Math.sin, cos: Math.cos, tan: Math.tan, log: Math.log10, ln: Math.log };
const CONSTS = { pi: Math.PI, e: Math.E };
export function evaluate(input) {
    const src = String(input).toLowerCase().replace(/×|x(?=\s*[\d(])/g, '*').replace(/÷/g, '/').replace(/,/g, '.').replace(/\*\*/g, '^').replace(/\s+/g, '');
    if (!src || src.length > 100)
        throw new Error('Expresión vacía o demasiado larga.');
    const tokens = src.match(/\d+\.?\d*|\.\d+|[a-z]+|[-+*/%^()]/g);
    if (!tokens || tokens.join('') !== src)
        throw new Error('Hay caracteres no válidos.');
    let i = 0;
    const peek = () => tokens[i], next = () => tokens[i++];
    function primary() {
        const t = next();
        if (t === undefined)
            throw new Error('La expresión está incompleta.');
        if (/^[\d.]/.test(t))
            return parseFloat(t);
        if (t === '(') {
            const v = expr();
            if (next() !== ')')
                throw new Error('Falta cerrar un paréntesis.');
            return v;
        }
        if (t === '-')
            return -power();
        if (t === '+')
            return power();
        if (t in CONSTS)
            return CONSTS[t];
        if (t in FUNCS) {
            if (next() !== '(')
                throw new Error(`Usa ${t}(número).`);
            const v = expr();
            if (next() !== ')')
                throw new Error('Falta cerrar un paréntesis.');
            return FUNCS[t](v);
        }
        throw new Error(`No entiendo "${t}".`);
    }
    function power() {
        const b = primary();
        if (peek() === '^') {
            next();
            return Math.pow(b, power());
        }
        return b;
    }
    function term() {
        let v = power();
        while (['*', '/', '%'].includes(peek())) {
            const op = next(), r = power();
            v = op === '*' ? v * r : op === '/' ? v / r : v % r;
        }
        return v;
    }
    function expr() {
        let v = term();
        while (['+', '-'].includes(peek())) {
            const op = next(), r = term();
            v = op === '+' ? v + r : v - r;
        }
        return v;
    }
    const result = expr();
    if (i < tokens.length)
        throw new Error('Sobra algo al final de la expresión.');
    if (!Number.isFinite(result))
        throw new Error('El resultado no es un número válido (¿dividiste entre 0?).');
    return result;
}
export const formatNumber = r => (Number.isInteger(r) ? r.toLocaleString('es') : Number(r.toPrecision(12)).toString());
export const LINEAL = {
    longitud: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 },
    masa: { mg: 0.000001, g: 0.001, kg: 1, lb: 0.45359237, oz: 0.028349523, t: 1000 },
    volumen: { ml: 0.001, l: 1, gal: 3.785411784, oz_fl: 0.0295735, taza: 0.2365882 },
    velocidad: { 'km/h': 1, mph: 1.609344, 'm/s': 3.6, nudo: 1.852 },
    datos: { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4 },
    tiempo: { s: 1, min: 60, h: 3600, d: 86400, sem: 604800 }
};
const ALIAS = { pulgada: 'in', pulgadas: 'in', pie: 'ft', pies: 'ft', milla: 'mi', millas: 'mi', libra: 'lb', libras: 'lb', onza: 'oz', litro: 'l', litros: 'l', galon: 'gal', galón: 'gal', kmh: 'km/h', 'k/h': 'km/h', nudos: 'nudo', celsius: 'c', fahrenheit: 'f', kelvin: 'k', '°c': 'c', '°f': 'f', seg: 's', hora: 'h', horas: 'h', dia: 'd', día: 'd', dias: 'd', días: 'd', metro: 'm', metros: 'm', kilometro: 'km', kilómetros: 'km', kilometros: 'km', kilo: 'kg', kilos: 'kg', gramos: 'g', gramo: 'g' };
const TEMP = new Set(['c', 'f', 'k']);
const toTemp = (v, from, to) => {
    const c = from === 'c' ? v : from === 'f' ? (v - 32) * 5 / 9 : v - 273.15;
    return to === 'c' ? c : to === 'f' ? c * 9 / 5 + 32 : c + 273.15;
};
export function convert(value, a, b) {
    a = ALIAS[a] || a;
    b = ALIAS[b] || b;
    if (TEMP.has(a) && TEMP.has(b))
        return toTemp(value, a, b);
    for (const units of Object.values(LINEAL))
        if (a in units && b in units)
            return value * units[a] / units[b];
    return null;
}
export const unitsHelp = () => Object.values(LINEAL).map(u => Object.keys(u).join(' ')).join(' · ') + ' · c f k';
export function makePassword(len = 16, { symbols = true } = {}) {
    len = Math.min(Math.max(parseInt(len) || 16, 8), 64);
    const sets = ['abcdefghijkmnopqrstuvwxyz', 'ABCDEFGHJKLMNPQRSTUVWXYZ', '23456789', ...(symbols ? ['!@#$%&*?-_+='] : [])];
    const all = sets.join('');
    const pick = s => s[crypto.randomInt(s.length)];
    const chars = sets.map(pick);
    while (chars.length < len)
        chars.push(pick(all));
    for (let i = chars.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
}
export function base64(op, text) {
    const t = String(text || '');
    if (!t)
        throw new Error('Escribe el texto.');
    if (/^(enc|encode|codificar|e)$/i.test(op))
        return Buffer.from(t, 'utf8').toString('base64');
    if (/^(dec|decode|decodificar|d)$/i.test(op)) {
        if (!/^[A-Za-z0-9+/_-]+={0,2}$/.test(t.replace(/\s+/g, '')))
            throw new Error('Eso no parece base64 válido.');
        const out = Buffer.from(t.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
        if (out.includes('\uFFFD'))
            throw new Error('No se pudo decodificar como texto.');
        return out;
    }
    throw new Error('Usa enc o dec.');
}
export function parseDate(s) {
    const m = String(s || '').trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/) || null;
    let d, mo, y;
    if (m) {
        d = +m[1];
        mo = +m[2];
        y = +m[3];
    }
    else {
        const n = String(s || '').trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (!n)
            return null;
        y = +n[1];
        mo = +n[2];
        d = +n[3];
    }
    const date = new Date(y, mo - 1, d, 12);
    return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d ? date : null;
}
export function ageFrom(birth, now = new Date()) {
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();
    if (days < 0) {
        months--;
        days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }
    const totalDays = Math.floor((now - birth) / 86400000);
    const next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate(), 12);
    if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate()))
        next.setFullYear(next.getFullYear() + 1);
    const toBirthday = Math.round((next - new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12)) / 86400000);
    return { years, months, days, totalDays, toBirthday };
}
export function daysUntil(target, now = new Date()) {
    const a = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12), b = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 12);
    return Math.round((b - a) / 86400000);
}
export const ZONAS = [
    ['🇨🇺 Cuba', 'America/Havana'], ['🇲🇽 México', 'America/Mexico_City'], ['🇨🇴 Colombia', 'America/Bogota'], ['🇵🇪 Perú', 'America/Lima'],
    ['🇻🇪 Venezuela', 'America/Caracas'], ['🇦🇷 Argentina', 'America/Argentina/Buenos_Aires'], ['🇨🇱 Chile', 'America/Santiago'],
    ['🇺🇸 Nueva York', 'America/New_York'], ['🇪🇸 España', 'Europe/Madrid'], ['🌐 UTC', 'UTC']
];
const fmtZone = tz => new Intl.DateTimeFormat('es', { timeZone: tz, weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
const stripAccents = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
export function worldTimes(q = '') {
    q = String(q).trim();
    if (!q)
        return ZONAS.map(([n, tz]) => `${n} › ${fmtZone(tz)}`);
    const hit = ZONAS.filter(([n, tz]) => stripAccents(n + ' ' + tz).includes(stripAccents(q)));
    if (hit.length)
        return hit.map(([n, tz]) => `${n} › ${fmtZone(tz)}`);
    try {
        return [`🕒 ${q} › ${fmtZone(q)}`];
    }
    catch {
        return null;
    }
}
