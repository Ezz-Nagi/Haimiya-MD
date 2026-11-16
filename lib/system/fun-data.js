import crypto from 'crypto';
export const rand = arr => arr[crypto.randomInt(arr.length)];
export const hashNum = s => { const h = crypto.createHash('sha256').update(String(s)).digest(); return h.readUInt32BE(0); };
export const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();
export const JOKES = [
    '¿Qué le dice un 0 a un 8? — Bonito cinturón.',
    '¿Por qué los pájaros vuelan hacia el sur? — Porque caminando tardarían muchísimo.',
    '¿Qué hace una abeja en el gimnasio? — ¡Zum-ba!',
    '—Doctor, tengo complejo de inferioridad. —Eso no es complejo, ¡es que usted es inferior!',
    '¿Cuál es el colmo de un electricista? — Que su esposa se llame Luz y sus hijos le sigan la corriente.',
    '¿Qué le dice un jardinero a otro? — Disfrutemos mientras podamos.',
    '¿Por qué el libro de matemáticas estaba triste? — Porque tenía demasiados problemas.',
    '¿Qué le dice una iguana a su hermana gemela? — Somos iguanitas.',
    '¿Cuál es el café más peligroso del mundo? — El ex-preso.',
    '¿Qué le dice el pan a la mantequilla? — Eres tan suave que me derrito por ti.',
    'Mi contraseña es "contraseña incorrecta" y cada vez que me equivoco me lo recuerda.',
    '¿Qué le dice un semáforo a otro? — No me mires, que me pongo rojo.',
    '¿Por qué el programador se quedó sin pareja? — Porque no dejaba de hacerle "commit" sin compromiso.',
    '¿Cuál es el animal más antiguo? — La cebra, porque está en blanco y negro.',
    '—Camarero, hay una mosca en mi sopa. —Tranquilo, señor, no come mucho.',
    '¿Qué hace un pez en una biblioteca? — Nada.',
    '¿Cómo se despiden los químicos? — Ácido un placer.',
    '¿Qué le dice una calculadora a otra? — Cuenta conmigo.',
    '¿Por qué la escoba está feliz? — Porque está barriendo de emoción.',
    'Tengo tanto sueño que ya ni sueño.',
    '¿Qué le dice un gusano a otro gusano? — Voy a dar una vuelta a la manzana.',
    '¿Cuál es el colmo de un panadero? — Que su hijo sea un bollo.',
    '¿Cómo se llama el campeón de buceo japonés? — Tokofondo. ¿Y el subcampeón? — Kasitoko.',
    '¿Por qué el celular fue al médico? — Porque tenía poca batería y mucho estrés.',
    '¿Qué le dice un techo a otro techo? — Techo de menos.',
    '¿Cuál es el colmo de un gallo? — Que lo despierten al amanecer.',
    '¿Qué le dice una pared a otra? — Nos vemos en la esquina.',
    '¿Qué hace una vaca en el espacio? — Muuuuu-nave.',
    'Ayer le puse a mi gato un cascabel; hoy no sé si lo oigo o me oye él.',
    '¿Por qué los esqueletos no pelean entre ellos? — Porque no tienen agallas.'
];
export const QUOTES = [
    'Cada día es una nueva página: escribe algo que valga la pena leer.',
    'No esperes el momento perfecto; empieza y el momento se acomoda.',
    'Los errores son la prueba de que lo estás intentando.',
    'Un paso pequeño hoy vale más que un gran plan mañana.',
    'La constancia le gana al talento cuando el talento no se esfuerza.',
    'Cuida tu mente como cuidas tu teléfono: no la dejes agotarse al 1 %.',
    'Respira. Lo que hoy pesa, mañana será una historia.',
    'Si te cansas, descansa; pero no te rindas.',
    'Rodéate de quien te hace sentir en casa.',
    'Lo que haces cada día importa más que lo que haces de vez en cuando.',
    'Tu ritmo es tu ritmo: no compitas con el de otros.',
    'La suerte existe, pero siempre llega a quien ya estaba en movimiento.',
    'Aprender algo nuevo es la forma más barata de viajar.',
    'Sé amable: todos libran batallas que no se ven.',
    'Empieza donde estás, usa lo que tienes, haz lo que puedas.',
    'Los sueños no tienen fecha de caducidad, solo necesitan un plan.',
    'Hoy puedes ser un poco mejor que ayer. Con eso basta.',
    'Los días grises también hacen crecer las plantas.',
    'Habla bonito de ti, aunque nadie te escuche: tu mente sí.',
    'La disciplina es recordar lo que quieres cuando no tienes ganas.',
    'No todo se arregla en un día, pero todo se arregla un día a la vez.',
    'Ríete de tus tropiezos: ya aprendiste lo que traían.',
    'Pedir ayuda no es debilidad, es estrategia.',
    'Lo importante no es llegar primero, es no dejar de caminar.',
    'La paciencia es un superpoder que se entrena.',
    'Una buena risa vale más que mil preocupaciones.',
    'Agradece lo pequeño y lo grande se vuelve más fácil de ver.',
    'Quien siembra ánimo cosecha amigos.',
    'Hazlo con miedo si hace falta, pero hazlo.',
    'Hay noches largas, pero siempre amanece.'
];
export const FORTUNES = [
    'Una buena noticia llegará por donde menos lo esperas.',
    'Alguien piensa en ti más de lo que imaginas.',
    'Hoy es buen día para empezar eso que vienes postergando.',
    'Un pequeño gesto tuyo alegrará a alguien esta semana.',
    'La paciencia que tienes ahora será recompensada pronto.',
    'Cuidado con las prisas: lo bueno se está cocinando.',
    'Un reencuentro inesperado te sacará una sonrisa.',
    'Tu próxima idea será la buena. Anótala.',
    'Escucha más de lo que hablas hoy y descubrirás algo valioso.',
    'Una puerta se cierra, pero la ventana de al lado está abierta.',
    'El esfuerzo silencioso de hoy será aplaudido mañana.',
    'Alguien te debe un mensaje… y te va a llegar.',
    'Un viaje, cerca o lejos, mejorará tu ánimo.',
    'Lo que perdiste volverá de otra forma.',
    'Confía en tu instinto: esta vez tiene razón.',
    'Un café, un abrazo o una llamada cambiarán tu tarde.',
    'La suerte te acompaña si dejas de dudar tanto.',
    'Habrá un momento de calma justo cuando lo necesites.',
    'Compartirás una buena comida con alguien especial.',
    'Un pequeño ahorro hoy será una gran alegría luego.'
];
export const RIDDLES = [
    { q: 'Tiene ciudades pero no casas, montañas pero no árboles y agua pero no peces. ¿Qué es?', a: ['mapa'] },
    { q: 'Cuanto más le quitas, más grande se hace. ¿Qué es?', a: ['agujero', 'hoyo'] },
    { q: 'Blanca por dentro, verde por fuera. Si quieres que te lo diga, espera.', a: ['pera'] },
    { q: 'Oro parece, plata no es. ¿Qué es?', a: ['platano', 'banana', 'banano'] },
    { q: 'Vuelan sin alas y lloran sin ojos. ¿Qué son?', a: ['nubes', 'nube'] },
    { q: 'Tengo agujas pero no pincho, tengo números pero no sé contar. ¿Qué soy?', a: ['reloj'] },
    { q: 'Sube y baja, pero nunca se mueve de su sitio. ¿Qué es?', a: ['escalera', 'escaleras'] },
    { q: 'Tiene cabeza y no tiene cuerpo, tiene dientes y no come ni muerde. ¿Qué es?', a: ['ajo'] },
    { q: 'Cuanto más seca, más moja. ¿Qué es?', a: ['toalla'] },
    { q: 'Soy alta cuando joven y baja cuando vieja. ¿Qué soy?', a: ['vela'] },
    { q: 'Habla sin boca y oye sin oídos. ¿Qué es?', a: ['eco'] },
    { q: 'Si me nombras, desaparezco. ¿Qué soy?', a: ['silencio'] },
    { q: 'Tiene un ojo y no puede ver. ¿Qué es?', a: ['aguja'] },
    { q: 'Un cazador camina 1 km al sur, 1 km al este y 1 km al norte, y llega a su punto de partida. Ve un oso. ¿De qué color es?', a: ['blanco'] },
    { q: 'Se rompe cuando lo dices y no se puede tocar. ¿Qué es?', a: ['secreto', 'silencio', 'promesa'] },
    { q: 'Corre sin pies, tiene boca y no habla, tiene cama y no duerme. ¿Qué es?', a: ['rio'] },
    { q: '¿Qué pesa más: un kilo de plumas o un kilo de plomo?', a: ['igual', 'lo mismo', 'pesan lo mismo', 'ninguno'] },
    { q: 'Tengo llaves pero no abro puertas, tengo espacio pero no hay habitación. ¿Qué soy?', a: ['teclado'] },
    { q: 'Siempre viene pero nunca llega. ¿Qué es?', a: ['manana', 'el manana'] },
    { q: 'Entre más grande soy, menos se ve de mí. ¿Qué soy?', a: ['oscuridad', 'la oscuridad'] }
];
export const TRIVIA = [
    { q: '¿Cuál es la capital de Australia?', o: ['Sídney', 'Canberra', 'Melbourne', 'Perth'], c: 1 },
    { q: '¿Cuál es el planeta más grande del sistema solar?', o: ['Saturno', 'Neptuno', 'Júpiter', 'Tierra'], c: 2 },
    { q: '¿Cuántos huesos tiene un adulto humano?', o: ['186', '206', '226', '256'], c: 1 },
    { q: '¿Qué elemento químico tiene el símbolo "Au"?', o: ['Plata', 'Aluminio', 'Oro', 'Argón'], c: 2 },
    { q: '¿Quién pintó La Mona Lisa?', o: ['Miguel Ángel', 'Leonardo da Vinci', 'Rafael', 'Van Gogh'], c: 1 },
    { q: '¿Cuál es el océano más grande del mundo?', o: ['Atlántico', 'Índico', 'Ártico', 'Pacífico'], c: 3 },
    { q: '¿En qué año llegó el ser humano a la Luna?', o: ['1965', '1969', '1972', '1975'], c: 1 },
    { q: '¿Cuál es el río más caudaloso del mundo?', o: ['Nilo', 'Misisipi', 'Amazonas', 'Yangtsé'], c: 2 },
    { q: '¿Cuántos lados tiene un hexágono?', o: ['5', '6', '7', '8'], c: 1 },
    { q: '¿Cuál es el país más grande del mundo por superficie?', o: ['Canadá', 'China', 'Estados Unidos', 'Rusia'], c: 3 },
    { q: '¿Quién escribió "Don Quijote de la Mancha"?', o: ['Lope de Vega', 'Miguel de Cervantes', 'Quevedo', 'Gabriel García Márquez'], c: 1 },
    { q: '¿Qué gas necesitamos respirar para vivir?', o: ['Nitrógeno', 'Hidrógeno', 'Oxígeno', 'Helio'], c: 2 },
    { q: '¿Cuál es el animal terrestre más rápido?', o: ['León', 'Guepardo', 'Caballo', 'Antílope'], c: 1 },
    { q: '¿Cuántos colores tiene el arcoíris?', o: ['5', '6', '7', '8'], c: 2 },
    { q: '¿Cuál es la capital de Japón?', o: ['Kioto', 'Osaka', 'Tokio', 'Nagoya'], c: 2 },
    { q: 'Anime: ¿cómo se llama el protagonista de "Naruto"?', o: ['Sasuke Uchiha', 'Naruto Uzumaki', 'Kakashi Hatake', 'Itachi Uchiha'], c: 1 },
    { q: 'Anime: ¿quién es el protagonista de "Kimetsu no Yaiba" (Demon Slayer)?', o: ['Zenitsu Agatsuma', 'Inosuke Hashibira', 'Tanjiro Kamado', 'Giyu Tomioka'], c: 2 },
    { q: '¿En qué continente está Egipto?', o: ['Asia', 'África', 'Europa', 'Oceanía'], c: 1 },
    { q: '¿Cuántos jugadores de cada equipo hay en la cancha en un partido de fútbol?', o: ['9', '10', '11', '12'], c: 2 },
    { q: '¿Qué metal es líquido a temperatura ambiente?', o: ['Plomo', 'Mercurio', 'Estaño', 'Zinc'], c: 1 },
    { q: '¿Qué gas forma la mayor parte de la atmósfera terrestre?', o: ['Oxígeno', 'Dióxido de carbono', 'Nitrógeno', 'Argón'], c: 2 },
    { q: '¿Cuál es la capital de Cuba?', o: ['Santiago de Cuba', 'La Habana', 'Camagüey', 'Varadero'], c: 1 },
    { q: '¿Quién fue el primer presidente de los Estados Unidos?', o: ['Abraham Lincoln', 'Thomas Jefferson', 'George Washington', 'John Adams'], c: 2 },
    { q: '¿Cuál es el planeta más cercano al Sol?', o: ['Venus', 'Mercurio', 'Marte', 'Tierra'], c: 1 },
    { q: '¿Cuántos minutos tiene una hora y media?', o: ['80', '90', '100', '120'], c: 1 }
];
export const PPT = { piedra: '🪨', papel: '📄', tijera: '✂️' };
export function parsePPT(s) {
    const n = norm(s);
    if (/^(piedra|roca|rock|p)$/.test(n))
        return 'piedra';
    if (/^(papel|paper)$/.test(n))
        return 'papel';
    if (/^(tijera|tijeras|scissors|t)$/.test(n))
        return 'tijera';
    return null;
}
export function playPPT(user) {
    const bot = rand(Object.keys(PPT));
    const beats = { piedra: 'tijera', papel: 'piedra', tijera: 'papel' };
    const result = user === bot ? 'empate' : beats[user] === bot ? 'ganas' : 'pierdes';
    return { user, bot, result };
}
export function ship(a, b) {
    const key = [norm(a), norm(b)].sort().join('|');
    const pct = hashNum('ship:' + key) % 101;
    const msg = pct >= 90 ? '¡Almas gemelas! 💞' : pct >= 70 ? 'Hay mucha química 🔥' : pct >= 50 ? 'Con esfuerzo, ¡funciona! 😊' : pct >= 30 ? 'Mejor como amigos 🤝' : 'Ni con un conjuro… 💔';
    return { pct, msg, bar: '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10)) };
}
export const SIGNS = [
    ['capricornio', '♑', [12, 22], [1, 19]], ['acuario', '♒', [1, 20], [2, 18]], ['piscis', '♓', [2, 19], [3, 20]], ['aries', '♈', [3, 21], [4, 19]],
    ['tauro', '♉', [4, 20], [5, 20]], ['geminis', '♊', [5, 21], [6, 20]], ['cancer', '♋', [6, 21], [7, 22]], ['leo', '♌', [7, 23], [8, 22]],
    ['virgo', '♍', [8, 23], [9, 22]], ['libra', '♎', [9, 23], [10, 22]], ['escorpio', '♏', [10, 23], [11, 21]], ['sagitario', '♐', [11, 22], [12, 21]]
];
export const findSign = s => { const n = norm(s).replace('géminis', 'geminis'); return SIGNS.find(x => x[0] === n) || null; };
export const signByDate = (day, month) => SIGNS.find(([, , [m1, d1], [m2, d2]]) => (month === m1 && day >= d1) || (month === m2 && day <= d2)) || SIGNS[0];
const H_LOVE = ['El corazón está sensible: di lo que sientes con calma.', 'Una conversación pendiente se resuelve hoy.', 'Alguien cercano necesita tu atención.', 'Buen día para dejar el orgullo y dar el primer paso.', 'La armonía llega si escuchas antes de responder.'];
const H_WORK = ['Tu constancia será notada.', 'Cuidado con comprometerte a demasiado.', 'Una idea tuya puede abrir una puerta.', 'Organiza prioridades y todo fluye.', 'Pide ayuda: ahorrarás tiempo.'];
const H_HEALTH = ['Toma agua y estírate un poco.', 'Duerme temprano, lo agradecerás.', 'Camina 15 minutos: te despejará.', 'Come con calma, sin pantallas.', 'Desconecta un rato del móvil.'];
const COLORS = ['rojo', 'azul', 'verde', 'amarillo', 'morado', 'naranja', 'blanco', 'rosa', 'turquesa', 'dorado'];
export function horoscope(sign, date = new Date()) {
    const day = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const h = k => hashNum(`${sign[0]}:${day}:${k}`);
    return {
        sign: sign[0], icon: sign[1],
        love: H_LOVE[h('l') % H_LOVE.length], work: H_WORK[h('w') % H_WORK.length], health: H_HEALTH[h('h') % H_HEALTH.length],
        number: 1 + (h('n') % 99), color: COLORS[h('c') % COLORS.length]
    };
}
