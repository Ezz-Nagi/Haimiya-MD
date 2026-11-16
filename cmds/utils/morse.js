const CODE = {
    a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---',
    k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-',
    u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..',
    0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
    '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', ':': '---...', ';': '-.-.-.', '-': '-....-', '/': '-..-.', '@': '.--.-.'
};
const REVERSE = Object.fromEntries(Object.entries(CODE).map(([key, value]) => [value, key]));
const normalize = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ñ/g, 'n');
export default {
    command: ['morse'],
    aliases: ['mors'],
    category: 'utils',
    desc: 'Convierte texto a código Morse o decodifica secuencias Morse.',
    usage: 'morse hola mundo | morse decodificar .... --- .-.. .- / -- ..- -. -.. ---',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, args, usedPrefix, command }) => {
        const mode = String(args[0] || '').toLowerCase();
        const decode = ['decodificar', 'decode', 'd'].includes(mode);
        const input = (decode ? args.slice(1) : args).join(' ').trim();
        if (!input) return msg.reply(`📡 *Código Morse*\n\n• ${usedPrefix}${command} hola mundo\n• ${usedPrefix}${command} decodificar .... --- .-.. .- / -- ..- -. -.. ---\n\nSepara letras con espacios y palabras con /.`);
        let output;
        if (decode) {
            const words = input.trim().split(/\s*\/\s*/);
            output = words.map(word => word.trim().split(/\s+/).filter(Boolean).map(code => REVERSE[code] || '�').join('')).join(' ');
        } else {
            output = normalize(input).split('').map(char => char === ' ' ? '/' : (CODE[char] || '')).filter(Boolean).join(' ').replace(/\s*\/\s*/g, ' / ');
        }
        if (!output || output.length > 3500) return msg.reply('⚠️ No hay caracteres compatibles o el resultado es demasiado largo.');
        return msg.reply(`📡 *${decode ? 'Texto decodificado' : 'Código Morse'}*\n\n${output}`);
    }
};
