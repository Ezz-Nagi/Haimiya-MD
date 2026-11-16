const FUNCTIONS = {
    abs: Math.abs,
    ceil: Math.ceil,
    floor: Math.floor,
    round: Math.round,
    sqrt: Math.sqrt,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    log: Math.log10,
    ln: Math.log,
    exp: Math.exp,
    min: Math.min,
    max: Math.max
};

function tokenize(input) {
    const tokens = [];
    let i = 0;
    while (i < input.length) {
        if (/\s/.test(input[i])) { i++; continue; }
        const rest = input.slice(i);
        const number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
        if (number) { tokens.push({ type: 'number', value: Number(number[0]) }); i += number[0].length; continue; }
        const word = rest.match(/^[a-zA-Zπ]+/);
        if (word) { tokens.push({ type: 'word', value: word[0].toLowerCase() }); i += word[0].length; continue; }
        const op = input[i];
        if ('+-*/%^(),'.includes(op)) { tokens.push({ type: op, value: op }); i++; continue; }
        throw new Error(`Carácter no permitido: ${op}`);
    }
    if (!tokens.length || tokens.length > 120) throw new Error('La operación está vacía o es demasiado larga.');
    return tokens;
}

export function evaluate(input) {
    const tokens = tokenize(input);
    let pos = 0;
    const peek = () => tokens[pos];
    const take = type => {
        const token = tokens[pos];
        if (!token || token.type !== type) throw new Error(`Se esperaba "${type}".`);
        pos++;
        return token;
    };
    const expression = () => {
        let value = term();
        while (peek()?.type === '+' || peek()?.type === '-') {
            const op = tokens[pos++].type;
            const right = term();
            value = op === '+' ? value + right : value - right;
        }
        return value;
    };
    const term = () => {
        let value = unary();
        while (['*', '/', '%'].includes(peek()?.type)) {
            const op = tokens[pos++].type;
            const right = unary();
            if ((op === '/' || op === '%') && right === 0) throw new Error('No se puede dividir entre cero.');
            value = op === '*' ? value * right : op === '/' ? value / right : value % right;
        }
        return value;
    };
    const unary = () => {
        if (peek()?.type === '+') { pos++; return unary(); }
        if (peek()?.type === '-') { pos++; return -unary(); }
        return power();
    };
    const power = () => {
        const left = primary();
        if (peek()?.type === '^') { pos++; return left ** unary(); }
        return left;
    };
    const primary = () => {
        const token = peek();
        if (!token) throw new Error('La expresión está incompleta.');
        if (token.type === 'number') { pos++; return token.value; }
        if (token.type === '(') {
            pos++;
            const value = expression();
            take(')');
            return value;
        }
        if (token.type === 'word') {
            pos++;
            if (token.value === 'pi' || token.value === 'π') return Math.PI;
            if (token.value === 'e') return Math.E;
            const fn = FUNCTIONS[token.value];
            if (!fn) throw new Error(`Función o constante desconocida: ${token.value}`);
            take('(');
            const args = [expression()];
            while (peek()?.type === ',') { pos++; args.push(expression()); }
            take(')');
            if (['min', 'max'].includes(token.value) ? args.length < 2 : args.length !== 1)
                throw new Error(`Cantidad de argumentos incorrecta para ${token.value}().`);
            return fn(...args);
        }
        throw new Error('La expresión contiene un elemento inesperado.');
    };
    const result = expression();
    if (pos !== tokens.length) throw new Error('Hay texto sobrante al final de la operación.');
    if (!Number.isFinite(result)) throw new Error('El resultado no es un número finito.');
    return result;
}

export default {
    command: ['calcular'],
    aliases: ['calc'],
    category: 'utils',
    desc: 'Resuelve operaciones matemáticas sin ejecutar código externo.',
    usage: 'calcular (25 * 4) / 2 | calcular sqrt(81) + 5^2',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, args, usedPrefix, command }) => {
        const input = args.join(' ').trim();
        if (!input) return msg.reply(`🧮 *Calculadora Haimiya*\n\nUso: *${usedPrefix}${command} (25 * 4) / 2*\nFunciones: sqrt, abs, round, floor, ceil, sin, cos, tan, log, ln, min, max.\nConstantes: pi, e. Usa ^ para potencias.`);
        try {
            const result = evaluate(input);
            const formatted = Number(result.toPrecision(12)).toLocaleString('es-ES', { maximumFractionDigits: 10 });
            return msg.reply(`🧮 *Resultado*\n\n\`${input}\`\n= *${formatted}*`);
        } catch (error) {
            return msg.reply(`⚠️ No pude resolver la operación.\n${String(error.message || 'Revisa la expresión.')}`);
        }
    }
};
